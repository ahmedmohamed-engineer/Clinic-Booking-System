import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

let tmpDir: string;
let server: Server;
let baseUrl: string;

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "powered-by-test-"));
  process.env.UPLOAD_DIR = tmpDir;
  process.env.CORS_ORIGINS = "http://trusted.example";
  process.env.NODE_ENV = "test";

  const { default: app } = await import("./app.js");

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server?.close();
  delete process.env.CORS_ORIGINS;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// N4: Express must not advertise itself — the header is free
// framework/version fingerprinting for attackers.
test("responses do not expose X-Powered-By", async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get("x-powered-by"),
    null,
    "no framework fingerprint on responses",
  );
});
