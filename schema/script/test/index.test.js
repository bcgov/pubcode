import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
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
