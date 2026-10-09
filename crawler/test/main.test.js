import { test } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import {
  getYamlFromRepo,
  isRecentlyUpdated,
  processYamlFromHttpResponse,
  reposFromEdges,
} from "../src/main.js";

const repoWithDetails = {
  name: "nr-example",
  defaultBranch: "main",
  stars: 3,
  lastUpdated: "2026-10-07T21:18:30Z",
  license: "Apache License 2.0",
  watchers: 5,
  topics: ["nrs"],
};

test("processYamlFromHttpResponse adds repo details and GitHub info", () => {
  const yaml = [
    "product_information:",
    "  product_name: Example",
    "  ministry:",
    "    - Forests",
    "version: 1",
  ].join("\n");

  const result = processYamlFromHttpResponse({ data: yaml }, repoWithDetails);

  assert.equal(result.repo_name, "nr-example");
  assert.deepEqual(result.product_information, {
    product_name: "Example",
    ministry: ["Forests"],
  });
  assert.equal(result.version, 1);
  assert.deepEqual(result.github_info, {
    last_updated: "2026-10-07",
    license: "Apache License 2.0",
    watchers: 5,
    stars: 3,
    default_branch: "main",
    topics: ["nrs"],
  });
});

test("processYamlFromHttpResponse maps the legacy bcgov_pubcode_version field to version", () => {
  const result = processYamlFromHttpResponse(
    { data: "bcgov_pubcode_version: 2\n" },
    repoWithDetails
  );

  assert.equal(result.version, 2);
  assert.equal("bcgov_pubcode_version" in result, false);
});

test("reposFromEdges skips archived repos and repos without a default branch", () => {
  const node = (name, overrides = {}) => ({
    node: {
      name,
      isArchived: false,
      defaultBranchRef: { name: "main" },
      stargazers: { totalCount: 1 },
      watchers: { totalCount: 2 },
      licenseInfo: { name: "MIT License" },
      pushedAt: "2026-10-01T00:00:00Z",
      repositoryTopics: { nodes: [{ topic: { name: "a" } }, { topic: { name: "b" } }] },
      ...overrides,
    },
    cursor: `cursor-${name}`,
  });

  const repos = reposFromEdges([
    node("active"),
    node("archived", { isArchived: true }),
    node("empty", { defaultBranchRef: null }),
  ]);

  assert.deepEqual(repos, [
    {
      name: "active",
      defaultBranch: "main",
      stars: 1,
      lastUpdated: "2026-10-01T00:00:00Z",
      license: "MIT License",
      watchers: 2,
      topics: ["a", "b"],
    },
  ]);
});

test("reposFromEdges skips the null nodes GitHub returns for unreadable repositories", () => {
  const readable = {
    node: {
      name: "readable",
      isArchived: false,
      defaultBranchRef: { name: "main" },
      pushedAt: "2026-10-01T00:00:00Z",
      repositoryTopics: { nodes: [] },
    },
    cursor: "c1",
  };

  const repos = reposFromEdges([{ node: null, cursor: "c0" }, readable, { node: null, cursor: "c2" }]);

  assert.deepEqual(repos.map((repo) => repo.name), ["readable"]);
});

test("isRecentlyUpdated accepts pushes within the last day only", () => {
  const now = new Date("2026-10-08T12:00:00Z");

  assert.equal(isRecentlyUpdated("2026-10-08T00:00:00Z", now), true);
  assert.equal(isRecentlyUpdated("2026-10-07T12:00:00Z", now), true);
  assert.equal(isRecentlyUpdated("2026-10-07T11:59:59Z", now), false);
});

test("getYamlFromRepo falls back to bcgovpubcode.yaml when the .yml file is missing", async (t) => {
  const requested = [];
  t.mock.method(axios, "get", async (url) => {
    requested.push(url);
    if (url.endsWith(".yml")) {
      const error = new Error("Not Found");
      error.response = { status: 404 };
      throw error;
    }
    return { data: "version: 1\n" };
  });

  const response = await getYamlFromRepo("nr-example", "main");

  assert.equal(response.data, "version: 1\n");
  assert.deepEqual(requested, [
    "https://raw.githubusercontent.com/bcgov/nr-example/main/bcgovpubcode.yml",
    "https://raw.githubusercontent.com/bcgov/nr-example/main/bcgovpubcode.yaml",
  ]);
});
