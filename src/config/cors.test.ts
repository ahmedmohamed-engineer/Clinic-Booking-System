import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAllowedOrigins } from "./cors.js";

test("trusted configured origin is allowed", () => {
  assert.deepEqual(
    resolveAllowedOrigins("production", "https://app.medicare.example"),
    ["https://app.medicare.example"],
  );
});

test("multiple trusted origins (comma-separated) are allowed and trimmed", () => {
  assert.deepEqual(
    resolveAllowedOrigins("development", " https://one.example, https://two.example ,"),
    ["https://one.example", "https://two.example"],
  );
});

test("production with missing CORS_ORIGINS fails safe", () => {
  assert.throws(
    () => resolveAllowedOrigins("production", undefined),
    /CORS_ORIGINS is required in production/,
  );
  assert.throws(
    () => resolveAllowedOrigins("production", " "),
    /CORS_ORIGINS is required in production/,
  );
  assert.throws(
    () => resolveAllowedOrigins("production", ""),
    /CORS_ORIGINS is required in production/,
  );
});

test("production with invalid CORS_ORIGINS fails safe", () => {
  assert.throws(
    () => resolveAllowedOrigins("production", "not-a-url"),
    /invalid http\(s\) origins/,
  );
  assert.throws(
    () => resolveAllowedOrigins("production", "https://ok.example, javascript:alert(1)"),
    /invalid http\(s\) origins/,
  );
});

test("development without CORS_ORIGINS keeps the local dev fallback", () => {
  assert.deepEqual(resolveAllowedOrigins("development", undefined), [
    "http://localhost:3000",
  ]);
});

test("test environment without CORS_ORIGINS keeps the local dev fallback", () => {
  assert.deepEqual(resolveAllowedOrigins("test", undefined), [
    "http://localhost:3000",
  ]);
});