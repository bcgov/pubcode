import axios from "axios";
import * as dotenv from "dotenv";
import * as jsYaml from "js-yaml";
import { pathToFileURL } from "node:url";

dotenv.config();
const token = process.env.GIT_TOKEN;
const repoWithDetailsArray = [];

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const REPO_NAMES = process.env.REPO_NAMES; //comma separated list of repo names within bcgov org
const BASE_DELAY = process.env.BASE_DELAY ? parseInt(process.env.BASE_DELAY, 10) : 60000; // 1 minute base delay
const MAX_DELAY =  process.env.MAX_DELAY ? parseInt(process.env.MAX_DELAY, 10) : 600000; // 10 minutes maximum delay
// Fail a stuck request instead of waiting forever; the API route also cuts requests off at 30 seconds.
axios.defaults.timeout = 30000;
const JITTER_FACTOR = Math.random() * 0.3; // Random jitter between 0-30%
/**
 * Fetches the bcgovpubcode yaml for the specified repo and branch
 * @param repoName
 * @param branchName
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export async function getYamlFromRepo(repoName, branchName) {
  let yamlResponse;
  try {
    yamlResponse = await axios.get(
      `https://raw.githubusercontent.com/bcgov/${repoName}/${branchName}/bcgovpubcode.yml`
    );
  } catch (e) {
    if (e.response?.status === 404) {
      yamlResponse = await axios.get(
        `https://raw.githubusercontent.com/bcgov/${repoName}/${branchName}/bcgovpubcode.yaml`
      );
    }
  }
  return yamlResponse;
}

/**
 *  convert yaml response to a JSON object and add additional GitHub attributes
 * @param yamlResponse
 * @param repoWithDetails
 * @returns {JSON object of yaml with additional github attributes}
 */

export function processYamlFromHttpResponse(yamlResponse, repoWithDetails) {
  const yaml = yamlResponse.data;
  const yamlJson = jsYaml.load(yaml);
  yamlJson.repo_name = repoWithDetails.name;
  yamlJson.github_info = {
    last_updated: repoWithDetails.lastUpdated?.substring(0, 10),
    license: repoWithDetails.license,
    watchers: repoWithDetails.watchers,
    stars: repoWithDetails.stars,
    default_branch: repoWithDetails.defaultBranch,
    topics: repoWithDetails.topics,
  };
  if (yamlJson.bcgov_pubcode_version) {
    //backwards compatibility
    yamlJson.version = yamlJson.bcgov_pubcode_version;
    delete yamlJson.bcgov_pubcode_version;
  }

  return yamlJson;
}

const DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

/**
 * Whether a repo was pushed to within the last day
 * @param lastUpdated ISO timestamp of the last push
 * @param now current time
 * @returns {boolean}
 */
export function isRecentlyUpdated(lastUpdated, now = new Date()) {
  return now.getTime() - new Date(lastUpdated).getTime() <= DAY_IN_MILLIS;
}

/**
 * Map GraphQL repository edges to repo details, skipping archived repos and repos without a default branch
 * @param edges
 * @returns {*[]}
 */
export function reposFromEdges(edges) {
  const repos = [];
  for (const edge of edges) {
    if (!edge.node) {
      continue; // GitHub returns a null node, with an error, for a repository it cannot return
    }
    if (edge.node.defaultBranchRef?.name && !edge.node.isArchived) {
      repos.push({
        name: edge.node.name,
        defaultBranch: edge.node.defaultBranchRef.name,
        stars: edge.node.stargazers?.totalCount,
        lastUpdated: edge.node.pushedAt,
        license: edge.node.licenseInfo?.name,
        watchers: edge.node.watchers?.totalCount,
        topics: edge.node.repositoryTopics.nodes.map(
          (node) => node.topic.name
        ),
      });
    } else {
      console.warn(
        `skipping ${edge.node.name} as it does not have default branch or is archived., Default branch: '${edge.node.defaultBranchRef?.name}', isArchived: '${edge.node.isArchived}'`
      );
    }
  }
  return repos;
}

/**
 * Fetches all the bcgovpubcode yaml files from the specified repos and converts them to JSON
 * @param compareLastUpdateDate
 * @returns {Promise<*[]>}
 */
async function getAllPubCodeYamlsAsJSON(compareLastUpdateDate) {
  const yamlArray = [];
  for (const repoWithDetails of repoWithDetailsArray) {
    //if  date comparison is enabled for this workflow and last_updated is not within last 1 day skip
    if (compareLastUpdateDate) {
      if (!isRecentlyUpdated(repoWithDetails.lastUpdated)) {
        console.debug(
          `Skipping ${repoWithDetails.name} repo as last updated date is more than 1 day.`
        );
        continue;
      }
    }

    try {
      let yamlResponse;
      yamlResponse = await getYamlFromRepo(
        repoWithDetails.name,
        repoWithDetails.defaultBranch
      );
      const yamlJson = processYamlFromHttpResponse(
        yamlResponse,
        repoWithDetails
      );
      console.info(`found yaml file for ${repoWithDetails.name} repo.`);
      yamlArray.push(yamlJson);
    } catch (e) {
      console.debug(
        `Error while fetching yaml file for ${repoWithDetails.name} repo. Error: ${e.message}`
      );
    }
  }
  return yamlArray;
}

/**
 * upload all the JSON to api
 * @param yamlArrayAsJson
 * @returns {Promise<void>}
 */
async function bulkLoadPubCodes(yamlArrayAsJson) {
  if (yamlArrayAsJson.length > 0) {
    console.debug(
      `Found ${yamlArrayAsJson.length} yaml files to load into database.`
    );
    //send to backend api bulk load endpoint
    try {
      await axios.post(`${API_URL}/api/pub-code/bulk-load`, yamlArrayAsJson, {
        headers: {
          "X-API-KEY": API_KEY,
        },
      });
      console.debug(
        `Successfully loaded ${yamlArrayAsJson.length} yaml files into database.`
      );
    } catch (e) {
      console.error(e.response?.status);
      console.error(e.response?.config?.url);
      process.exit(1);
    }
  } else {
    console.debug(
      `No yaml files found at the root of repositories under bcgov.`
    );
  }
}

/**
 * Compact description of a GraphQL response for error messages.
 * Never stringifies only `errors`, which may be missing.
 * @param responseData
 * @param extras extra fields such as HTTP status or error code
 * @returns {string}
 */
export function describeGraphQlResponse(responseData, extras = {}) {
  const organization = responseData?.data === undefined
    ? undefined
    : responseData?.data?.organization;
  const repositories = organization?.repositories;
  let dataSummary;
  if (responseData?.data === undefined) {
    dataSummary = "missing";
  } else if (responseData.data === null) {
    dataSummary = null;
  } else if (organization === undefined) {
    dataSummary = { organization: "missing" };
  } else if (organization === null) {
    dataSummary = { organization: null };
  } else if (repositories === undefined) {
    dataSummary = { organization: { repositories: "missing" } };
  } else if (repositories === null) {
    dataSummary = { organization: { repositories: null } };
  } else {
    dataSummary = {
      organization: {
        repositories: {
          edges: Array.isArray(repositories.edges)
            ? `${repositories.edges.length} edges`
            : repositories.edges ?? "missing",
          pageInfo: repositories.pageInfo ?? "missing",
        },
      },
    };
  }
  return JSON.stringify({
    status: extras.status ?? null,
    code: extras.code ?? null,
    message: responseData?.message ?? extras.message ?? null,
    errors: responseData?.errors ?? null,
    data: dataSummary,
  });
}

const TRANSIENT_CODES = new Set([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ECONNRESET",
  "EPIPE",
  "EAI_AGAIN",
  "ENETUNREACH",
  "ECONNREFUSED",
]);
const RATE_LIMIT_RE = /rate limit|secondary rate/i;
const TRANSIENT_GRAPHQL_RE =
  /RATE_LIMIT|TIMEOUT|SERVICE_UNAVAILABLE|502|503|504|something went wrong while executing your query|timed? out/i;
const PERMANENT_GRAPHQL_TYPES = new Set([
  "FORBIDDEN",
  "INSUFFICIENT_SCOPES",
  "UNAUTHORIZED",
  "NOT_FOUND",
]);
const PERMANENT_GRAPHQL_RE =
  /resource not accessible|insufficient.?scope|bad credentials|requires authentication|not found/i;

/**
 * Whether a GitHub HTTP or GraphQL failure is a rate limit.
 * @param failure
 * @returns {boolean}
 */
export function isRateLimitFailure(failure = {}) {
  if (failure.status === 429) {
    return true;
  }
  const text = `${failure.message ?? ""} ${failure.responseData?.message ?? ""} ${JSON.stringify(failure.responseData?.errors ?? [])}`;
  return RATE_LIMIT_RE.test(text);
}

/**
 * Whether a GitHub HTTP or GraphQL failure should be retried.
 * Unusable 200 pages with no errors are treated as transient.
 * Permanent auth, scope, and not-found failures are not retried.
 * @param failure
 * @returns {boolean}
 */
export function isTransientGitHubFailure(failure = {}) {
  const { status, code, message = "", responseData } = failure;
  if (TRANSIENT_CODES.has(code)) {
    return true;
  }
  if (status === 429 || status >= 500) {
    return true;
  }
  if (isRateLimitFailure(failure)) {
    return true;
  }
  const errors = responseData?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const allPermanent = errors.every(
      (err) =>
        PERMANENT_GRAPHQL_TYPES.has(err.type) ||
        PERMANENT_GRAPHQL_RE.test(err.message ?? "")
    );
    if (allPermanent) {
      return false;
    }
    return errors.some((err) =>
      TRANSIENT_GRAPHQL_RE.test(`${err.type ?? ""} ${err.message ?? ""}`)
    );
  }
  if (status && status !== 200 && status < 500) {
    return false;
  }
  // HTTP 200, empty bodies, and other unusable repository pages with no errors
  if (status === 200 || responseData !== undefined) {
    return !isUsableRepositoriesConnection(responseData);
  }
  return false;
}

/**
 * Backoff delay for a retry attempt. Rate limits keep the existing long backoff.
 * Other transients use a short backoff starting at one second.
 * @param retries 1-based attempt number
 * @param failure
 * @returns {number}
 */
export function retryDelayMs(retries, failure = {}) {
  if (isRateLimitFailure(failure)) {
    const exponentialPart = BASE_DELAY * (2 ** retries);
    const jitterAmount = exponentialPart * Math.random() * 0.3;
    return Math.min(exponentialPart + jitterAmount, MAX_DELAY);
  }
  const exponentialPart = 1000 * (2 ** (retries - 1));
  const jitterAmount = exponentialPart * Math.random() * 0.3;
  return Math.min(exponentialPart + jitterAmount, 30000);
}

async function defaultSleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function failureFromAxiosError(error) {
  return {
    status: error.response?.status,
    code: error.code,
    message: error.message,
    responseData: error.response?.data,
  };
}

/**
 * Retry a GitHub operation on transient failures, then throw the last error.
 * @param operation
 * @param options
 * @returns {Promise<*>}
 */
export async function withGitHubRetries(
  operation,
  { sleep = defaultSleep, maxRetries = 5 } = {}
) {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      const failure = error.githubFailure ?? failureFromAxiosError(error);
      retries++;
      if (retries >= maxRetries || !isTransientGitHubFailure(failure)) {
        throw error;
      }
      const delay = retryDelayMs(retries, failure);
      const unusablePage =
        failure.status === 200 ||
        (!failure.status && failure.responseData && !failure.code);
      const label = unusablePage
        ? "an unusable page"
        : (failure.status ?? failure.code ?? "an unusable page");
      console.log(
        `GitHub GraphQL answered ${label}. Retrying in ${Math.round(delay / 1000)} seconds... (Attempt ${retries}/${maxRetries})`
      );
      await sleep(delay);
    }
  }
}

/**
 * Send one GraphQL query to the GitHub API.
 * @param query
 * @param options
 * @returns {Promise<{data: *, status: number}>}
 */
export async function requestGraphQl(
  query,
  { request = axios, token: authToken = token } = {}
) {
  const response = await request({
    method: "post",
    url: "https://api.github.com/graphql",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    data: {
      query,
    },
  });
  return { data: response.data, status: response.status };
}

/**
 * Sends a GraphQL query to the GitHub API and retries transient failures.
 *
 * @async
 * @function getGraphQlResponseOnQuery
 * @param {string} query - The GraphQL query to send to the GitHub API
 * @param {object} [options]
 * @returns {Promise<Object>} The response data from the GraphQL API
 * @throws {Error} Throws an error if all retry attempts fail or if a non-transient error occurs
 *
 * Retries HTTP 5xx, 429, rate limits, and timeouts (up to 5 attempts) with backoff.
 * https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#about-secondary-rate-limits
 */
export async function getGraphQlResponseOnQuery(query, options = {}) {
  const result = await withGitHubRetries(
    () => requestGraphQl(query, options),
    options
  );
  return result.data;
}

/**
 * Build the organization repositories GraphQL query for one page.
 * @param cursor
 * @returns {string}
 */
export function organizationRepositoriesQuery(cursor = "") {
  const after = cursor ? `,after:"${cursor}"` : "";
  return `query {
            organization(login: "bcgov") {
              repositories(first:100${after}){
              pageInfo {
                hasNextPage
                endCursor
              }
              edges{
                node{
                url,
                name,
                isArchived,
                repositoryTopics(first:20) {
                  nodes {
                  topic {
                    name
                  }
                  }
                },
                defaultBranchRef{
                  name
                },
                stargazers {
                  totalCount
                },
                watchers {
                  totalCount
                },
                licenseInfo {
                  name
                },
                updatedAt,
                pushedAt
                }
                cursor
              }
              }
            }
            }`;
}

/**
 * Whether a GraphQL body is a usable organization repositories page.
 * Matches the checks in repositoriesConnectionFromResponse.
 * @param responseData
 * @returns {boolean}
 */
export function isUsableRepositoriesConnection(responseData) {
  const connection = responseData?.data?.organization?.repositories;
  const edges = connection?.edges;
  const pageInfo = connection?.pageInfo;
  if (!Array.isArray(edges) || typeof pageInfo?.hasNextPage !== "boolean") {
    return false;
  }
  return !(pageInfo.hasNextPage && !pageInfo.endCursor);
}

/**
 * Read a repositories connection from a GraphQL response, or throw a loud error.
 * @param responseData
 * @param extras
 * @returns {{edges: Array, hasNextPage: boolean, endCursor: string, errors: *}}
 */
export function repositoriesConnectionFromResponse(responseData, extras = {}) {
  const connection = responseData?.data?.organization?.repositories;
  const edges = connection?.edges;
  const pageInfo = connection?.pageInfo;
  if (!isUsableRepositoriesConnection(responseData)) {
    const error = new Error(
      `GitHub GraphQL returned no repositories: ${describeGraphQlResponse(responseData, extras)}`
    );
    error.githubFailure = {
      status: extras.status,
      code: extras.code,
      message: error.message,
      responseData,
    };
    throw error;
  }
  return {
    edges,
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor ?? "",
    errors: responseData.errors,
  };
}

/**
 * Fetch one page of bcgov repositories, retrying transient and unusable pages.
 * @param cursor
 * @param options
 * @returns {Promise<{edges: Array, hasNextPage: boolean, endCursor: string, errors: *}>}
 */
export async function fetchOrganizationRepositoriesPage(cursor = "", options = {}) {
  const query = organizationRepositoriesQuery(cursor);
  return withGitHubRetries(async () => {
    const { data, status } = await requestGraphQl(query, options);
    return repositoriesConnectionFromResponse(data, { status });
  }, options);
}

/**
 *  start crawling.
 * @returns {Promise<void>}
 */
const performCrawling = async () => {
  let moreRecords = true;
  let cursor = "";
  do {
    const { edges, hasNextPage, endCursor, errors } =
      await fetchOrganizationRepositoriesPage(cursor);
    const unreadable = edges.filter((edge) => !edge.node).length;
    if (unreadable > 0) {
      console.warn(`Skipping ${unreadable} repositories GitHub returned as null: ${errors?.[0]?.message}`);
    }
    repoWithDetailsArray.push(...reposFromEdges(edges));
    if (endCursor) {
      cursor = endCursor;
    }
    moreRecords = hasNextPage;
    console.info("iteration completed, cursor at ", cursor);
  } while (moreRecords);
  if (repoWithDetailsArray.length === 0) {
    throw new Error("No readable repositories found under bcgov; check that GIT_TOKEN can read them");
  }
  const yamlAsJsons = await getAllPubCodeYamlsAsJSON(true);
  await bulkLoadPubCodes(yamlAsJsons);
};

async function main() {
  if (!token || !API_KEY || !API_URL) {
    console.error("Please provide GIT_TOKEN, API_KEY and API_URL in .env file");
    process.exit(1);
  } else {
    console.info("Starting crawling... and API_URL is ", API_URL);
  }
  if (REPO_NAMES?.length > 0) {
    const repoNames = REPO_NAMES.split(",");
    for (const repoName of repoNames) {
      try {
        const query = `query {
                       repository(owner: "bcgov", name: "${repoName}") {
                                name,
                                description,
                                defaultBranchRef{
                                  name
                                },
                                repositoryTopics(first:20) {
                                  nodes {
                                    topic {
                                      name
                                    }
                                  }
                                },
                                updatedAt,
                                pushedAt,
                                stargazers {
                                  totalCount
                                },
                                watchers {
                                  totalCount
                                },
                                licenseInfo {
                                  name
                                },
                       }
                      }`;
        const responseData = await getGraphQlResponseOnQuery(query);
        const repo = responseData.data?.repository;
        repoWithDetailsArray.push({
          name: repo?.name,
          defaultBranch: repo?.defaultBranchRef?.name,
          stars: repo?.stargazers?.totalCount,
          lastUpdated: repo?.pushedAt,
          license: repo?.licenseInfo?.name,
          watchers: repo?.watchers?.totalCount,
          topics: repo?.repositoryTopics?.nodes.map((node) => node.topic.name),
        });
      } catch (e) {
        console.error(
          `Error while fetching yaml file for ${repoName} repo. Error: ${e.message}`
        );
      }
    }
    const yamlAsJsons = await getAllPubCodeYamlsAsJSON(false);
    await bulkLoadPubCodes(yamlAsJsons);
  } else {
    await performCrawling();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
