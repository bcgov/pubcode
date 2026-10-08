import test from "node:test";
import assert from "node:assert/strict";
import { findRemovedRepos, markSoftDeleted } from "./index.js";

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

test("findRemovedRepos returns only repos whose pubcode file is gone", async () => {
  const items = [
    { repo_name: "kept", default_branch: "main" },
    { repo_name: "removed", default_branch: "master" },
    { repo_name: "github-down", default_branch: "main" },
  ];
  const calls = [];
  const getYaml = async (repo, branch) => {
    calls.push(`${repo}@${branch}`);
    if (repo === "removed") throw httpError(404);
    if (repo === "github-down") throw httpError(503);
    return { data: "version: 1" };
  };
  assert.deepEqual(await findRemovedRepos(items, getYaml), ["removed"]);
  assert.deepEqual(calls, ["kept@main", "removed@master", "github-down@main"]);
});

test("markSoftDeleted deletes every removed repo", async () => {
  const deleted = [];
  await markSoftDeleted(["a", "b"], async (repo) => deleted.push(repo));
  assert.deepEqual(deleted, ["a", "b"]);
});

test("markSoftDeleted does nothing when no repos were removed", async () => {
  await markSoftDeleted([], async () => assert.fail("should not delete"));
});

test("markSoftDeleted tries every repo, then fails if any delete failed", async () => {
  const attempted = [];
  await assert.rejects(
    markSoftDeleted(["a", "b", "c"], async (repo) => {
      attempted.push(repo);
      if (repo === "b") throw httpError(401);
    }),
    /Failed to soft delete 1 of 3 repos: b/
  );
  assert.deepEqual(attempted, ["a", "b", "c"]);
});
