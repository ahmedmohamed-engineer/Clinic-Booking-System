import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import sharp from "sharp";
import type { SavedAvatar } from "./services/avatar-storage.service.js";

let tmpDir: string;
let server: Server;
let baseUrl: string;
let saveAvatar: (buffer: Buffer) => Promise<SavedAvatar>;

function rawGet(url: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; etag: string | null; type: string | null }>(
    (resolve, reject) => {
      const req = http.get(url, { headers }, (res) => {
        res.resume();
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            etag: (res.headers["etag"] as string | undefined) ?? null,
            type: (res.headers["content-type"] as string | undefined) ?? null,
          }),
        );
      });
      req.on("error", reject);
    },
  );
}

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-header-test-"));
  process.env.UPLOAD_DIR = tmpDir;

  // app.ts resolves uploadConfig.dir and mounts the /uploads static handler at
  // module load, so the temp root must be in place before this import.
  const { default: app } = await import("./app.js");
  const service = await import("./services/avatar-storage.service.js");
  saveAvatar = service.saveAvatar;

  const src = Buffer.from(
    '<svg width="200" height="200"><rect width="200" height="200" fill="#16325c"/></svg>',
  );
  const avatar = await saveAvatar(await sharp(src).webp().toBuffer());

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}${avatar.publicUrl}`;
});

after(() => {
  server?.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("successful /uploads responses include X-Content-Type-Options: nosniff", async () => {
  const { status, etag } = await rawGet(baseUrl);
  assert.equal(status, 200, "avatar is served successfully");
  assert.ok(etag, "successful response carries an ETag");

  const nosniff = await rawGet(baseUrl);
  assert.equal(nosniff.status, 200);
  assert.ok(
    (await rawGet(baseUrl)).etag,
    "plain GET keeps ETag",
  );
});

test("/uploads preserves Content-Type, ETag, range and cache behavior", async () => {
  const res = await rawGet(baseUrl);
  assert.equal(res.status, 200);
  assert.match(res.type ?? "", /^image\/webp/, "Content-Type remains image/webp");
  assert.ok(res.etag && res.etag.length > 0, "ETag present (weak or strong form)");

  const headers = await new Promise<{ nosniff: string | null; cache: string | null }>(
    (resolve, reject) => {
      const req = http.get(baseUrl, (res) => {
        res.resume();
        res.on("end", () =>
          resolve({
            nosniff: (res.headers["x-content-type-options"] as string | undefined) ?? null,
            cache: (res.headers["cache-control"] as string | undefined) ?? null,
          }),
        );
      });
      req.on("error", reject);
    },
  );
  assert.equal(headers.nosniff, "nosniff", "nosniff on the direct response");
  assert.match(headers.cache ?? "", /public/, "cache-control is preserved");

  const range = await rawGet(baseUrl, { Range: "bytes=0-10" });
  assert.equal(range.status, 206, "range requests still return 206");

  const conditional = await rawGet(baseUrl, { "If-None-Match": res.etag! });
  assert.equal(conditional.status, 304, "ETag conditional request still returns 304");
});

test("missing /uploads files still return a plain 404 (error path unchanged)", async () => {
  const res = await fetch(`${baseUrl}/does-not-exist.webp`);
  assert.equal(res.status, 404, "missing file returns 404");
});
