"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");

process.env.LOG_LEVEL = "error";
// The email service refuses to load without configuration; nothing is sent here.
process.env.CHES_TOKEN_URL = "http://localhost/token";
process.env.CHES_CLIENT_ID = "test";
process.env.CHES_CLIENT_SECRET = "test";
process.env.CHES_API_URL = "http://localhost/ches";

const pubcodeEntity = require("../src/entities/pub-code-entity");
const { softDeleteRepo } = require("../src/services/pub-code-service");

function fakeResponse() {
  const res = { statusCode: undefined, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

test("soft delete answers 500 when the database fails", async (t) => {
  t.mock.method(pubcodeEntity, "findOne", () => ({
    exec: () => Promise.reject(new Error("database unavailable")),
  }));
  const res = fakeResponse();

  await softDeleteRepo({ params: { repo_name: "some-repo" } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: "Internal server error" });
});
