import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import axios from "axios";
import {
  getMinistriesHtml,
  loadSchema,
  ministryNamesFromHtml,
  ministryNamesFromSchema,
  updateMinistryNames,
} from "../index.js";

const schemaWith = (names) => ({
  definitions: {
    product_information: {
      properties: { ministry: { items: { enum: names } } },
    },
  },
});

test("the published schema lists ministry names", async () => {
  const schema = JSON.parse(
    await readFile(new URL("../../bcgovpubcode.json", import.meta.url), "utf8")
  );

  const names = ministryNamesFromSchema(schema);

  assert.ok(Array.isArray(names) && names.length > 0);
  assert.ok(names.every((name) => typeof name === "string" && name.trim() === name));
});

test("ministryNamesFromHtml reads list items under #body and normalizes non-breaking spaces", () => {
  const html = `
    <nav><ul><li>Navigation link</li></ul></nav>
    <div id="body">
      <ul>
        <li>Agriculture and Food</li>
        <li>Forests\u00a0and Range</li>
      </ul>
    </div>`;

  assert.deepEqual(ministryNamesFromHtml(html), [
    "Agriculture and Food",
    "Forests and Range",
  ]);
});

test("updateMinistryNames leaves a matching schema unchanged", () => {
  const schema = schemaWith(["Agriculture and Food", "Forests"]);

  assert.equal(updateMinistryNames(schema, ["Agriculture and Food", "Forests"]), false);
  assert.deepEqual(ministryNamesFromSchema(schema), ["Agriculture and Food", "Forests"]);
});

test("updateMinistryNames replaces the enum when the web list differs", (t) => {
  t.mock.method(console, "error", () => {});
  const schema = schemaWith(["Agriculture and Food", "Forests"]);

  assert.equal(updateMinistryNames(schema, ["Agriculture and Food", "Water, Land and Resource Stewardship"]), true);
  assert.deepEqual(ministryNamesFromSchema(schema), [
    "Agriculture and Food",
    "Water, Land and Resource Stewardship",
  ]);
});

test("loadSchema reads the schema from disk", async () => {
  const schema = await loadSchema();
  const names = ministryNamesFromSchema(schema);
  assert.ok(Array.isArray(names) && names.length > 0);
});

test("getMinistriesHtml returns html on successful request", async (t) => {
  t.mock.method(axios, "get", async (url, options) => {
    assert.equal(options.headers["User-Agent"], "Mozilla/5.0 (compatible; pubcode-schema-validator/1.0)");
    return { data: "<html><body>ok</body></html>" };
  });

  const html = await getMinistriesHtml("https://example.com/test", 1, 10);
  assert.equal(html, "<html><body>ok</body></html>");
});

test("getMinistriesHtml retries on failure and returns html when retry succeeds", async (t) => {
  t.mock.method(console, "warn", () => {});
  let attempts = 0;
  t.mock.method(axios, "get", async () => {
    attempts++;
    if (attempts === 1) {
      const err = new Error("socket hang up");
      err.code = "ECONNRESET";
      throw err;
    }
    return { data: "<html><body>retry-success</body></html>" };
  });

  const html = await getMinistriesHtml("https://example.com/test", 3, 5);
  assert.equal(html, "<html><body>retry-success</body></html>");
  assert.equal(attempts, 2);
});

test("getMinistriesHtml throws after exhausting all retries", async (t) => {
  t.mock.method(console, "warn", () => {});
  let attempts = 0;
  t.mock.method(axios, "get", async () => {
    attempts++;
    const err = new Error("socket hang up");
    err.code = "ECONNRESET";
    throw err;
  });

  await assert.rejects(
    () => getMinistriesHtml("https://example.com/test", 3, 5),
    { message: "socket hang up", code: "ECONNRESET" }
  );
  assert.equal(attempts, 3);
});
