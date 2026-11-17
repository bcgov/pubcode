import { test } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import {
  getYamlFromRepo,
  isRecentlyUpdated,
  processYamlFromHttpResponse,
  reposFromEdges,
  describeGraphQlResponse,
  isRateLimitFailure,
  isTransientGitHubFailure,
  repositoriesConnectionFromResponse,
  getGraphQlResponseOnQuery,
  fetchOrganizationRepositoriesPage,
  organizationRepositoriesQuery,
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


const usablePage = {
  data: {
    organization: {
      repositories: {
        pageInfo: { hasNextPage: true, endCursor: "cursor-2" },
        edges: [
          { node: { name: "readable", isArchived: false, defaultBranchRef: { name: "main" } }, cursor: "cursor-2" },
        ],
      },
    },
  },
};

test("describeGraphQlResponse includes GraphQL errors when they are present", () => {
  const description = describeGraphQlResponse(
    {
      data: { organization: { repositories: null } },
      errors: [{ type: "TIMEOUT", message: "Something went wrong while executing your query." }],
    },
    { status: 200 }
  );

  assert.match(description, /TIMEOUT/);
  assert.match(description, /Something went wrong while executing your query/);
  assert.match(description, /"status":200/);
  assert.match(description, /"repositories":null/);
});

test("describeGraphQlResponse does not report errors as undefined when they are missing", () => {
  const description = describeGraphQlResponse(
    { data: { organization: { repositories: {} } } },
    { status: 200 }
  );

  assert.equal(description.includes("undefined"), false);
  assert.match(description, /"errors":null/);
  assert.match(description, /"edges":"missing"/);
  assert.match(description, /"pageInfo":"missing"/);
});

test("isTransientGitHubFailure retries 5xx, 429, rate limits, timeouts, and empty pages", () => {
  assert.equal(isTransientGitHubFailure({ status: 502 }), true);
  assert.equal(isTransientGitHubFailure({ status: 429 }), true);
  assert.equal(
    isTransientGitHubFailure({
      status: 403,
      message: "API rate limit exceeded",
      responseData: { message: "API rate limit exceeded" },
    }),
    true
  );
  assert.equal(isTransientGitHubFailure({ code: "ECONNABORTED", message: "timeout of 30000ms exceeded" }), true);
  assert.equal(
    isTransientGitHubFailure({
      status: 200,
      responseData: {
        errors: [{ type: "TIMEOUT", message: "Something went wrong while executing your query." }],
      },
    }),
    true
  );
  assert.equal(
    isTransientGitHubFailure({
      status: 200,
      responseData: { data: { organization: { repositories: {} } } },
    }),
    true
  );
  assert.equal(isRateLimitFailure({ status: 429 }), true);
});

test("isTransientGitHubFailure does not retry permanent auth or permission failures", () => {
  assert.equal(isTransientGitHubFailure({ status: 401, responseData: { message: "Requires authentication" } }), false);
  assert.equal(isTransientGitHubFailure({ status: 403, responseData: { message: "Resource not accessible by integration" } }), false);
  assert.equal(
    isTransientGitHubFailure({
      status: 200,
      responseData: {
        data: { organization: { repositories: null } },
        errors: [{ type: "FORBIDDEN", message: "Resource not accessible by integration" }],
      },
    }),
    false
  );
});

test("repositoriesConnectionFromResponse returns edges and pageInfo for a usable page", () => {
  const page = repositoriesConnectionFromResponse(usablePage, { status: 200 });

  assert.equal(page.hasNextPage, true);
  assert.equal(page.endCursor, "cursor-2");
  assert.equal(page.edges.length, 1);
  assert.equal(page.edges[0].node.name, "readable");
});

test("repositoriesConnectionFromResponse fails loudly when edges and errors are missing", () => {
  const responseData = { data: { organization: { repositories: {} } } };

  try {
    repositoriesConnectionFromResponse(responseData, { status: 200 });
    assert.fail("expected an error");
  } catch (error) {
    assert.match(error.message, /GitHub GraphQL returned no repositories:/);
    assert.equal(error.message.includes("undefined"), false);
    assert.match(error.message, /"errors":null/);
    assert.match(error.message, /"edges":"missing"/);
    assert.match(error.message, /"status":200/);
    assert.equal(error.githubFailure.responseData, responseData);
  }
});

test("repositoriesConnectionFromResponse includes GraphQL errors in the thrown message", () => {
  const responseData = {
    data: { organization: { repositories: null } },
    errors: [{ type: "TIMEOUT", message: "Something went wrong while executing your query." }],
  };

  try {
    repositoriesConnectionFromResponse(responseData, { status: 200 });
    assert.fail("expected an error");
  } catch (error) {
    assert.match(error.message, /TIMEOUT/);
    assert.match(error.message, /Something went wrong while executing your query/);
  }
});

test("getGraphQlResponseOnQuery retries HTTP 502 then returns the successful body", async (t) => {
  const sleeps = [];
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error("Bad gateway");
      error.response = { status: 502, data: { message: "Bad gateway" } };
      throw error;
    }
    return { status: 200, data: { data: { ok: true } } };
  };

  const data = await getGraphQlResponseOnQuery("query { ok }", {
    request,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    token: "test-token",
  });

  assert.deepEqual(data, { data: { ok: true } });
  assert.equal(attempts, 2);
  assert.equal(sleeps.length, 1);
  assert.ok(sleeps[0] >= 1000);
  assert.ok(sleeps[0] < 30000);
});

test("getGraphQlResponseOnQuery retries timeouts and HTTP 429", async () => {
  const seen = [];
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error("timeout of 30000ms exceeded");
      error.code = "ECONNABORTED";
      throw error;
    }
    if (attempts === 2) {
      const error = new Error("Too Many Requests");
      error.response = { status: 429, data: { message: "Too Many Requests" } };
      throw error;
    }
    return { status: 200, data: { data: { ok: true } } };
  };

  const data = await getGraphQlResponseOnQuery("query { ok }", {
    request,
    sleep: async (ms) => {
      seen.push(ms);
    },
    token: "test-token",
  });

  assert.deepEqual(data, { data: { ok: true } });
  assert.equal(attempts, 3);
  assert.equal(seen.length, 2);
});

test("getGraphQlResponseOnQuery does not retry HTTP 401", async () => {
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    const error = new Error("Unauthorized");
    error.response = { status: 401, data: { message: "Requires authentication" } };
    throw error;
  };

  await assert.rejects(
    () =>
      getGraphQlResponseOnQuery("query { ok }", {
        request,
        sleep: async () => {
          throw new Error("should not sleep");
        },
        token: "test-token",
      }),
    /Unauthorized/
  );
  assert.equal(attempts, 1);
});

test("fetchOrganizationRepositoriesPage retries an empty 200 page then returns a usable page", async () => {
  let attempts = 0;
  const request = async ({ data }) => {
    attempts += 1;
    assert.match(data.query, /pageInfo/);
    assert.match(data.query, /after:"cursor-18"/);
    if (attempts === 1) {
      return { status: 200, data: { data: { organization: { repositories: {} } } } };
    }
    return { status: 200, data: usablePage };
  };

  const page = await fetchOrganizationRepositoriesPage("cursor-18", {
    request,
    sleep: async () => {},
    token: "test-token",
  });

  assert.equal(attempts, 2);
  assert.equal(page.hasNextPage, true);
  assert.equal(page.endCursor, "cursor-2");
  assert.equal(page.edges[0].node.name, "readable");
});

test("fetchOrganizationRepositoriesPage exhausts retries and throws the response summary", async () => {
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    return { status: 200, data: { data: { organization: { repositories: {} } } } };
  };

  await assert.rejects(
    () =>
      fetchOrganizationRepositoriesPage("", {
        request,
        sleep: async () => {},
        token: "test-token",
        maxRetries: 3,
      }),
    (error) => {
      assert.match(error.message, /GitHub GraphQL returned no repositories:/);
      assert.equal(error.message.includes("undefined"), false);
      assert.match(error.message, /"errors":null/);
      assert.match(error.message, /"edges":"missing"/);
      return true;
    }
  );
  assert.equal(attempts, 3);
});

test("organizationRepositoriesQuery includes pageInfo and the after cursor", () => {
  const query = organizationRepositoriesQuery("Y3Vyc29yOnYyOpHOLGKMpA==");
  assert.match(query, /pageInfo/);
  assert.match(query, /hasNextPage/);
  assert.match(query, /endCursor/);
  assert.match(query, /after:"Y3Vyc29yOnYyOpHOLGKMpA=="/);
});

test("isTransientGitHubFailure retries HTTP 200 pages the validator also rejects", () => {
  const edgesOnly = {
    data: {
      organization: {
        repositories: {
          edges: [{ node: { name: "readable" }, cursor: "c1" }],
        },
      },
    },
  };
  const missingEndCursor = {
    data: {
      organization: {
        repositories: {
          pageInfo: { hasNextPage: true, endCursor: null },
          edges: [{ node: { name: "readable" }, cursor: "c1" }],
        },
      },
    },
  };

  assert.equal(isTransientGitHubFailure({ status: 200, responseData: edgesOnly }), true);
  assert.equal(isTransientGitHubFailure({ status: 200, responseData: missingEndCursor }), true);
  assert.equal(isTransientGitHubFailure({ status: 200, responseData: null }), true);
  assert.equal(isTransientGitHubFailure({ status: 200, responseData: "" }), true);
});

test("fetchOrganizationRepositoriesPage retries a missing pageInfo page then returns a usable page", async () => {
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    if (attempts === 1) {
      return {
        status: 200,
        data: {
          data: {
            organization: {
              repositories: {
                edges: [{ node: { name: "partial" }, cursor: "c1" }],
              },
            },
          },
        },
      };
    }
    return { status: 200, data: usablePage };
  };

  const page = await fetchOrganizationRepositoriesPage("", {
    request,
    sleep: async () => {},
    token: "test-token",
  });

  assert.equal(attempts, 2);
  assert.equal(page.endCursor, "cursor-2");
  assert.equal(page.edges[0].node.name, "readable");
});

test("fetchOrganizationRepositoriesPage retries an empty HTTP 200 body then returns a usable page", async () => {
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    if (attempts === 1) {
      return { status: 200, data: null };
    }
    return { status: 200, data: usablePage };
  };

  const page = await fetchOrganizationRepositoriesPage("", {
    request,
    sleep: async () => {},
    token: "test-token",
  });

  assert.equal(attempts, 2);
  assert.equal(page.hasNextPage, true);
  assert.equal(page.edges[0].node.name, "readable");
});
