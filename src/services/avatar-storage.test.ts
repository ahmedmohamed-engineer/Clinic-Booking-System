import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import type { SavedAvatar } from "./avatar-storage.service.js";

let tmpDir: string;
let avatarsDir: string;
// The service reads uploadConfig.dir at module load, so the temp upload root
// must be in place before the dynamic import below evaluates.
let saveAvatar: (buffer: Buffer) => Promise<SavedAvatar>;
let AppErrorCtor: typeof import("../shared/errors/app-error.js").AppError;

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-storage-test-"));
  avatarsDir = path.join(tmpDir, "avatars");
  process.env.UPLOAD_DIR = tmpDir;
  const service = await import("./avatar-storage.service.js");
  const errors = await import("../shared/errors/app-error.js");
  saveAvatar = service.saveAvatar;
  AppErrorCtor = errors.AppError;
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Minimal valid raster fixtures produced by sharp itself. */
async function validFixtures(): Promise<Record<string, Buffer>> {
  const src = Buffer.from(
    '<svg width="200" height="200"><rect width="200" height="200" fill="#16325c"/></svg>',
  );
  return {
    jpeg: await sharp(src).jpeg().toBuffer(),
    png: await sharp(src).png().toBuffer(),
    webp: await sharp(src).webp().toBuffer(),
  };
}

function avatarsBeforeRun(): string[] {
  if (!fs.existsSync(avatarsDir)) return [];
  return fs.readdirSync(avatarsDir);
}

test("valid JPEG/PNG/WebP uploads are stored as a re-encoded WebP file", async () => {
  const fixtures = await validFixtures();
  const beforeFiles = avatarsBeforeRun();

  for (const buffer of Object.values(fixtures)) {
    const saved = await saveAvatar(buffer);
    assert.match(saved.publicUrl, /^\/uploads\/avatars\/[0-9a-f-]{36}\.webp$/);
    const storedPath = path.join(tmpDir, saved.publicUrl.replace(/^\/uploads\//, ""));
    assert.ok(fs.existsSync(storedPath), "stored file exists on disk");

    const metadata = await sharp(storedPath).metadata();
    assert.equal(metadata.format, "webp", "stored file is WebP");
    assert.equal(metadata.width, 400, "resized to avatar width");
    assert.equal(metadata.height, 400, "resized to avatar height");
  }

  const delta = avatarsBeforeRun().length - beforeFiles.length;
  assert.equal(delta, 3, "exactly one stored avatar per valid upload");
});

test("corrupted image bytes (valid MIME, invalid image) are rejected with a controlled 4xx and never stored", async () => {
  const invalidPayloads: Array<{ name: string; bytes: Buffer }> = [
    { name: "html-as-png", bytes: Buffer.from("<html><script>alert(1)</script></html>") },
    { name: "svg-as-png", bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') },
    { name: "plain-text-as-jpeg", bytes: Buffer.from("plain text not an image") },
    { name: "truncated-png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
    { name: "random-bytes", bytes: Buffer.from("not an image at all — random garbage") },
  ];

  for (const { name, bytes } of invalidPayloads) {
    const beforeFiles = avatarsBeforeRun();
    await assert.rejects(Promise.resolve(saveAvatar(bytes)), (err: unknown) => {
      assert.ok(err instanceof AppErrorCtor, `${name}: rejects with AppError`);
      assert.equal(err.statusCode, 400, `${name}: status is BAD_REQUEST`);
      assert.ok(err.isOperational, `${name}: operational (not a 500)`);
      return true;
    });
    assert.equal(avatarsBeforeRun().length, beforeFiles.length, `${name}: no file persisted`);
  }
});