"use strict";
// Integration tests: the API against a real MongoDB given by MONGO_URI.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is required, e.g. mongodb://localhost:27017/pubcode-test");
}
process.env.API_KEY = "test-api-key";
process.env.LOG_LEVEL = "error";
// The email service refuses to load without configuration; no email is sent while EMAIL_RECIPIENTS is unset.
process.env.CHES_TOKEN_URL = "http://localhost/token";
process.env.CHES_CLIENT_ID = "test";
process.env.CHES_CLIENT_SECRET = "test";
process.env.CHES_API_URL = "http://localhost/ches";
delete process.env.EMAIL_RECIPIENTS;

const mongoose = require("mongoose");
const app = require("../src/app");
const pubcodeEntity = require("../src/entities/pub-code-entity");
const cacheService = require("../src/services/cache-service");

let server;
let baseUrl;

const pubcode = (repoName, overrides = {}) => ({
  repo_name: repoName,
  version: 1,
  product_information: { product_name: `Product ${repoName}`, ministry: ["Forests"] },
  data_management_roles: { product_owner: "Owner" },
  product_technology_information: { backend_language: ["JavaScript"] },
  github_info: { default_branch: "main", stars: 1 },
  ...overrides,
});

function request(method, path, { body, apiKey } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// bulk-load answers before it has written to the database, so wait for the write.
async function waitFor(condition, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the database");
}

before(async () => {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await pubcodeEntity.deleteMany({});
});

test("bulk-load and delete reject requests without the API key", async () => {
  assert.equal((await request("POST", "/api/pub-code/bulk-load", { body: [pubcode("a")] })).status, 401);
  assert.equal((await request("POST", "/api/pub-code/bulk-load", { body: [pubcode("a")], apiKey: "wrong" })).status, 401);
  assert.equal((await request("DELETE", "/api/pub-code/a")).status, 401);
  assert.equal(await pubcodeEntity.countDocuments(), 0);
});

test("bulk-load rejects a body that is not a non-empty array", async () => {
  for (const body of [[], { repo_name: "a" }]) {
    const response = await request("POST", "/api/pub-code/bulk-load", { body, apiKey: "test-api-key" });
    assert.equal(response.status, 400);
  }
});

test("bulk-load stores valid entries, skips invalid ones, and the list flattens them", async () => {
  const invalid = pubcode("invalid");
  delete invalid.product_information;

  const response = await request("POST", "/api/pub-code/bulk-load", {
    body: [pubcode("repo-a"), invalid],
    apiKey: "test-api-key",
  });
  assert.equal(response.status, 200);
  await waitFor(async () => (await pubcodeEntity.countDocuments({ repo_name: "repo-a" })) === 1);
  assert.equal(await pubcodeEntity.countDocuments({ repo_name: "invalid" }), 0);

  await cacheService.loadAllPubCodes();
  const list = await (await request("GET", "/api/pub-code")).json();
  assert.deepEqual(list, [
    {
      repo_name: "repo-a",
      product_name: "Product repo-a",
      ministry: ["Forests"],
      backend_language: ["JavaScript"],
      product_owner: "Owner",
      default_branch: "main",
      stars: 1,
    },
  ]);
});

test("bulk-load replaces an existing entry instead of duplicating it", async () => {
  await pubcodeEntity.create(pubcode("repo-a"));

  await request("POST", "/api/pub-code/bulk-load", {
    body: [pubcode("repo-a", { product_information: { product_name: "Renamed" } })],
    apiKey: "test-api-key",
  });

  await waitFor(async () => (await pubcodeEntity.findOne({ repo_name: "repo-a" }))?.product_information?.product_name === "Renamed");
  assert.equal(await pubcodeEntity.countDocuments({ repo_name: "repo-a" }), 1);
});

test("delete soft-deletes an entry, hides it from the list, and a later bulk-load restores it", async () => {
  await pubcodeEntity.create([pubcode("repo-a"), pubcode("repo-b")]);

  assert.equal((await request("DELETE", "/api/pub-code/missing", { apiKey: "test-api-key" })).status, 404);
  assert.equal((await request("DELETE", "/api/pub-code/repo-a", { apiKey: "test-api-key" })).status, 200);
  assert.equal((await pubcodeEntity.findOne({ repo_name: "repo-a" })).is_deleted, true);

  await cacheService.loadAllPubCodes();
  const visible = (await (await request("GET", "/api/pub-code")).json()).map((entry) => entry.repo_name);
  assert.deepEqual(visible, ["repo-b"]);

  await request("POST", "/api/pub-code/bulk-load", { body: [pubcode("repo-a")], apiKey: "test-api-key" });
  await waitFor(async () => (await pubcodeEntity.findOne({ repo_name: "repo-a" }))?.is_deleted === false);
});
