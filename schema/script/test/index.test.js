import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import axios from "axios";
import {
  assertConsistentMinistryLists,
  getMinistriesHtml,
  loadSchema,
  ministryNameFromCabinetTitle,
  ministryNamesFromCabinetHtml,
  ministryNamesFromHtml,
  ministryNamesFromSchema,
  normalizeTypography,
  updateMinistryNames,
} from "../index.js";

const schemaWith = (names) => ({
  definitions: {
    product_information: {
      properties: { ministry: { items: { enum: names } } },
    },
  },
});

const ministriesPageHtml = `
  <nav id="cmf-ui-page-navigation">
    <ul>
      <li><a href="/gov/content/governments/organizational-structure/ministries-organizations/ministries/agriculture">Agriculture</a></li>
      <li><a href="/gov/content/governments/organizational-structure/ministries-organizations/ministries/forests">Forests</a></li>
    </ul>
  </nav>
  <div id="body">
    <ul>
      <li><a href="/gov/content/governments/organizational-structure/ministries-organizations/ministries/agriculture"><span>Agriculture</span></a></li>
      <li><a href="/gov/content/governments/organizational-structure/ministries-organizations/ministries/citizens-services">Citizens&rsquo; Services and Technology</a></li>
      <li><a href="/gov/content/governments/organizational-structure/ministries-organizations/ministries/economic-development-and-tourism">Economic Development and Tourism</a></li>
      <li><a href="/gov/content/governments/organizational-structure/ministries-organizations/ministries/forests">Forests\u00a0and Range</a></li>
      <li><a href="/gov/content?id=A08D0E857E0A45C9B023D3A35B5E1A03">Tourism, Arts, Culture and Sport</a></li>
    </ul>
  </div>`;

test("the published schema lists ministry names", async () => {
  const schema = JSON.parse(
    await readFile(new URL("../../bcgovpubcode.json", import.meta.url), "utf8")
  );

  const names = ministryNamesFromSchema(schema);

  assert.ok(Array.isArray(names) && names.length > 0);
  assert.ok(names.every((name) => typeof name === "string" && name.trim() === name));
});

test("normalizeTypography converts typographic quotes and non-breaking spaces to plain ASCII", () => {
  assert.equal(
    normalizeTypography("Citizens\u2019 Services and Technology"),
    "Citizens' Services and Technology"
  );
  assert.equal(
    normalizeTypography("\u201CForests\u201D and\u00a0Range"),
    "\"Forests\" and Range"
  );
  assert.equal(normalizeTypography("  Agriculture  "), "Agriculture");
});

test("ministryNamesFromHtml reads official ministry-page links under #body and normalizes typography", () => {
  assert.deepEqual(ministryNamesFromHtml(ministriesPageHtml), [
    "Agriculture",
    "Citizens' Services and Technology",
    "Economic Development and Tourism",
    "Forests and Range",
  ]);
});

test("ministryNamesFromHtml ignores leftover list items that are not official ministry pages", () => {
  const names = ministryNamesFromHtml(ministriesPageHtml);
  assert.equal(names.includes("Tourism, Arts, Culture and Sport"), false);
});

test("ministryNameFromCabinetTitle keeps ministries and drops premier, ministers of state, and parliamentary secretaries", () => {
  assert.equal(ministryNameFromCabinetTitle("The Premier"), undefined);
  assert.equal(ministryNameFromCabinetTitle("Minister of State for Housing"), undefined);
  assert.equal(ministryNameFromCabinetTitle("Parliamentary Secretary for Tourism"), undefined);
  assert.equal(ministryNameFromCabinetTitle("Attorney General"), "Attorney General");
  assert.equal(ministryNameFromCabinetTitle("Minister of Agriculture"), "Agriculture");
  assert.equal(
    ministryNameFromCabinetTitle("Minister of Citizens\u2019 Services and Technology"),
    "Citizens' Services and Technology"
  );
  assert.equal(
    ministryNameFromCabinetTitle("Minister of Social Development and Deputy Premier"),
    "Social Development"
  );
});

test("ministryNamesFromCabinetHtml reads ministry portfolios from #body headings", () => {
  const html = `
    <div id="body">
      <h2>Executive Council</h2>
      <h4>The Premier</h4>
      <h4>Minister of Agriculture</h4>
      <h4>Attorney General</h4>
      <h4>Minister of State for Red Tape Reduction</h4>
      <h4>Minister of Citizens&rsquo; Services and Technology</h4>
      <h4>Minister of Social Development and Deputy Premier</h4>
      <h4>Parliamentary Secretary for Tourism</h4>
    </div>`;

  assert.deepEqual(ministryNamesFromCabinetHtml(html), [
    "Agriculture",
    "Attorney General",
    "Citizens' Services and Technology",
    "Social Development",
  ]);
});

test("assertConsistentMinistryLists accepts matching lists even when order differs", () => {
  assert.doesNotThrow(() =>
    assertConsistentMinistryLists(
      ["Agriculture", "Forests"],
      ["Forests", "Agriculture"]
    )
  );
});

test("assertConsistentMinistryLists fails when a stale name is only on one page", (t) => {
  t.mock.method(console, "error", () => {});

  assert.throws(
    () =>
      assertConsistentMinistryLists(
        ["Agriculture", "Economic Development and Tourism", "Tourism, Arts, Culture and Sport"],
        ["Agriculture", "Economic Development and Tourism"]
      ),
    {
      message: /Ministry list validation failed:.*Tourism, Arts, Culture and Sport/,
    }
  );
});

test("assertConsistentMinistryLists fails on an empty or duplicate list", (t) => {
  t.mock.method(console, "error", () => {});

  assert.throws(
    () => assertConsistentMinistryLists([], ["Agriculture"]),
    { message: /ministries page list is empty/ }
  );
  assert.throws(
    () => assertConsistentMinistryLists(["Agriculture", "Agriculture"], ["Agriculture"]),
    { message: /duplicate name/ }
  );
});

test("updateMinistryNames leaves a matching schema unchanged", () => {
  const schema = schemaWith(["Agriculture and Food", "Forests"]);

  assert.equal(updateMinistryNames(schema, ["Agriculture and Food", "Forests"]), false);
  assert.deepEqual(ministryNamesFromSchema(schema), ["Agriculture and Food", "Forests"]);
});

test("updateMinistryNames replaces the enum when the web list differs", (t) => {
  t.mock.method(console, "error", () => {});
  const schema = schemaWith(["Agriculture and Food", "Forests"]);

  assert.equal(updateMinistryNames(schema, ["Agriculture", "Water, Land and Natural Resource Operations"]), true);
  assert.deepEqual(ministryNamesFromSchema(schema), [
    "Agriculture",
    "Water, Land and Natural Resource Operations",
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
