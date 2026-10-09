"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");

process.env.LOG_LEVEL = "error";
// The email service refuses to load without configuration; nothing is sent while EMAIL_RECIPIENTS is unset.
process.env.CHES_TOKEN_URL = "http://localhost/token";
process.env.CHES_CLIENT_ID = "test";
process.env.CHES_CLIENT_SECRET = "test";
process.env.CHES_API_URL = "http://localhost/ches";
delete process.env.EMAIL_RECIPIENTS;

const pubcodeEntity = require("../src/entities/pub-code-entity");
const { bulkLoad } = require("../src/services/pub-code-service");

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

const validPubcode = {
  repo_name: "some-repo",
  version: 1,
  product_information: { product_name: "Some product" },
  data_management_roles: { product_owner: "Owner" },
  product_technology_information: { backend_language: ["JavaScript"] },
};

test("bulk load answers 500 when saving fails", async (t) => {
  t.mock.method(pubcodeEntity, "findOneAndReplace", () => ({
    exec: () => Promise.reject(new Error("database unavailable")),
  }));
  const res = fakeResponse();

  await bulkLoad({ body: [validPubcode] }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: "Internal server error" });
});

test("bulk load answers 200 only after saving", async (t) => {
  let saved = false;
  t.mock.method(pubcodeEntity, "findOneAndReplace", () => ({
    exec: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      saved = true;
      return { _id: "existing" };
    },
  }));
  const res = fakeResponse();
  let savedWhenAnswered;
  res.json = () => {
    savedWhenAnswered = saved;
    return res;
  };

  await bulkLoad({ body: [validPubcode] }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(savedWhenAnswered, true);
});
