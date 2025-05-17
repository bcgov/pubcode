import axios from "axios";
import * as dotenv from "dotenv";
import jsYaml from "js-yaml";

dotenv.config();
const token = process.env.GIT_TOKEN;
const repoWithDetailsArray = [];

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
const REPO_NAMES = process.env.REPO_NAMES; //comma separated list of repo names within bcgov org

/**
 * Fetches the bcgovpubcode yaml for the specified repo and branch
 * @param repoName
 * @param branchName
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
async function getYamlFromRepo(repoName, branchName) {
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

function processYamlFromHttpResponse(yamlResponse, repoWithDetails) {
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
 * Fetches all the bcgovpubcode yaml files from the specified repos and converts them to JSON
 * @param compareLastUpdateDate
 * @returns {Promise<*[]>}
 */
async function getAllPubCodeYamlsAsJSON(compareLastUpdateDate) {
  const yamlArray = [];
  for (const repoWithDetails of repoWithDetailsArray) {
    //if  date comparison is enabled for this workflow and last_updated is not within last 1 day skip
    if (compareLastUpdateDate) {
      const currentDate = new Date();
      const lastUpdatedDate = new Date(repoWithDetails.lastUpdated);
      if (currentDate.getTime() - lastUpdatedDate.getTime() > DAY_IN_MILLIS) {
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
 * execute graphql query and return the response.
 * @param query
 * @returns {Promise<*|{}|number[]>}
 */
/**
 * Sends a GraphQL query to the GitHub API and handles rate limiting with exponential backoff.
 * 
 * @async
 * @function getGraphQlResponseOnQuery
 * @param {string} query - The GraphQL query to send to the GitHub API
 * @returns {Promise<Object>} The response data from the GraphQL API
 * @throws {Error} Throws an error if all retry attempts fail or if a non-rate-limit error occurs
 * 
 * @description
 * This function sends a GraphQL query to GitHub's API and implements:
 * - Authentication using a token
 * - Automatic retry for rate limit errors (up to 5 attempts)
 * - Exponential backoff with jitter to respect rate limits
 * - Detailed logging of retry attempts
 * https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#about-secondary-rate-limits
 * Retry delays increase exponentially, with random jitter added:
 */
async function getGraphQlResponseOnQuery(query) {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios({
        method: "post",
        url: "https://api.github.com/graphql",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        data: {
          query,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes("rate limit")) {
        retries++;
        if (retries >= maxRetries) throw error;
        
        // Exponential backoff with jitter
        const baseDelay = 60000; // 1 minute base delay
        const maxDelay = 600000; // 10 minutes maximum delay
        const jitterFactor = Math.random() * 0.3; // Random jitter between 0-30%

        // Calculate delay with exponential backoff and jitter
        const exponentialPart = baseDelay * (2 ** retries);
        const jitterAmount = exponentialPart * jitterFactor;
        const delay = Math.min(exponentialPart + jitterAmount, maxDelay);
        // Example delay values (in milliseconds) per retry:
        // Retry 1: ~60000ms (1 min) + up to 18000ms jitter = ~78s
        // Retry 2: ~120000ms (2 min) + up to 36000ms jitter = ~156s
        // Retry 3: ~240000ms (4 min) + up to 72000ms jitter = ~312s
        // Retry 4: ~480000ms (8 min) + up to 144000ms jitter = ~624s
        // Retry 5: ~600000ms (10 min, capped) + up to 180000ms jitter = max 10min
        console.log(`Rate limit hit. Retrying in ${Math.round(delay/1000)} seconds... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

/**
 *  start crawling.
 * @returns {Promise<void>}
 */
const performCrawling = async () => {
  let moreRecords = true;
  let cursor = "";
  do {
    let after = "";
    if (cursor) {
      after = `,after:"${cursor}"`;
    }
    const query = `query {
            organization(login: "bcgov") {
              repositories(first:100${after}){
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
    try {
      const responseData = await getGraphQlResponseOnQuery(query);
      if (responseData.data?.organization?.repositories?.edges?.length > 0) {
        for (const edge of responseData.data.organization.repositories.edges) {
          if (edge.node?.defaultBranchRef?.name && !edge.node.isArchived) {
            repoWithDetailsArray.push({
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
          cursor = edge.cursor; // keep overriding, the last cursor will be used
        }
        if (responseData.data.organization.repositories.edges?.length < 100) {
          moreRecords = false;
        }
      } else {
        moreRecords = false;
      }
      console.info("iteration completed, cursor at ", cursor);
    } catch (e) {
      console.error(e);
    }
  } while (moreRecords);
  const yamlAsJsons = await getAllPubCodeYamlsAsJSON(true);
  await bulkLoadPubCodes(yamlAsJsons);
};

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
