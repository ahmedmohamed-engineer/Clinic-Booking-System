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

const TRUSTED = "http://trusted.example";
const UNTRUSTED = "http://evil.example";

function getWithOrigin(origin: string, pathname = "/health") {
  return new Promise<{ status: number; allowOrigin: string | null }>(
    (resolve, reject) => {
      fetch(`${baseUrl}${pathname}`, { headers: { Origin: origin } })
        .then(async (res) => {
          resolve({
            status: res.status,
            allowOrigin: res.headers.get("access-control-allow-origin"),
          });
        })
        .catch(reject);
    },
  );
}

function preflight(origin: string, method = "POST") {
  return new Promise<{ allowOrigin: string | null }>(
    (resolve, reject) => {
      fetch(`${baseUrl}/api/v1/appointments`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": method,
          "Access-Control-Request-Headers": "authorization, content-type",
        },
      })
        .then((res) =>
          resolve({
            allowOrigin: res.headers.get("access-control-allow-origin"),
          }),
        )
        .catch(reject);
    },
  );
}

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cors-header-test-"));
  process.env.UPLOAD_DIR = tmpDir;
  process.env.CORS_ORIGINS = TRUSTED;
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

test("trusted configured origin gets Access-Control-Allow-Origin", async () => {
  const res = await getWithOrigin(TRUSTED);
  assert.equal(res.status, 200);
  assert.equal(res.allowOrigin, TRUSTED, "trusted origin is echoed back");
});

test("untrusted origin is blocked (no Access-Control-Allow-Origin)", async () => {
  const res = await getWithOrigin(UNTRUSTED);
  assert.equal(res.status, 200, "response succeeds for curl-like callers");
  assert.equal(res.allowOrigin, null, "no ACAO header -> browser blocks cross-origin read");
});

test("preflight for trusted origin allows the request", async () => {
  const res = await preflight(TRUSTED);
  assert.equal(res.allowOrigin, TRUSTED);
});

test("preflight for untrusted origin is rejected (no ACAO)", async () => {
  const res = await preflight(UNTRUSTED);
  assert.equal(res.allowOrigin, null);
});