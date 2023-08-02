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
    yamlResponse = await axios.get(`https://raw.githubusercontent.com/bcgov/${repoName}/${branchName}/bcgovpubcode.yml`);
  } catch (e) {
    if (e.response?.status === 404) {
      yamlResponse = await axios.get(`https://raw.githubusercontent.com/bcgov/${repoName}/${branchName}/bcgovpubcode.yaml`);
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
  const githubInfo = {
    last_updated: repoWithDetails.lastUpdated?.substring(0, 10),
    license: repoWithDetails.license,
    watchers: repoWithDetails.watchers,
    stars: repoWithDetails.stars
  };
  yamlJson.github_info = githubInfo;
  if (yamlJson.bcgov_pubcode_version) { //backwards compatibility
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
    //if  date comparison is enabled for this workflow and last_updated is not within last 4 days skip
    if (compareLastUpdateDate) {
      const currentDate = new Date();
      const lastUpdatedDate = new Date(repoWithDetails.lastUpdated);
      if ((currentDate.getTime() - lastUpdatedDate.getTime()) > (4 * DAY_IN_MILLIS)) {
        console.debug(`Skipping ${repoWithDetails.name} repo as last updated date is more than 4 days.`);
        continue;
      }
    }

    try {
      let yamlResponse;
      yamlResponse = await getYamlFromRepo(repoWithDetails.name, repoWithDetails.defaultBranch);
      const yamlJson = processYamlFromHttpResponse(yamlResponse, repoWithDetails);
      console.info(`found yaml file for ${repoWithDetails.name} repo.`);
      yamlArray.push(yamlJson);
    } catch (e) {
      console.debug(`Error while fetching yaml file for ${repoWithDetails.name} repo. Error: ${e.message}`);
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
    console.debug(`Found ${yamlArrayAsJson.length} yaml files to load into database.`);
    //send to backend api bulk load endpoint
    try {
      await axios.post(`${API_URL}/api/pub-code/bulk-load`, yamlArrayAsJson, {
        headers: {
          "X-API-KEY": API_KEY
        }
      });
      console.debug(`Successfully loaded ${yamlArrayAsJson.length} yaml files into database.`);
    } catch (e) {
      console.error(e.response?.status);
      console.error(e.response?.config?.url);
    }
  } else {
    console.debug(`No yaml files found at the root of repositories under bcgov.`);
  }
}

/**
 * execute graphql query and return the response.
 * @param query
 * @returns {Promise<*|{}|number[]>}
 */
async function getGraphQlResponseOnQuery(query) {
  const response = await axios({
    method: "post",
    url: "https://api.github.com/graphql",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    data: {
      query
    }
  });
  return response.data;
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
                            updatedAt
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
            repoWithDetailsArray.push(
              {
                name: edge.node.name,
                defaultBranch: edge.node.defaultBranchRef.name,
                stars: edge.node.stargazers?.totalCount,
                lastUpdated: edge.node.updatedAt,
                license: edge.node.licenseInfo?.name,
                watchers: edge.node.watchers?.totalCount
              });
          } else {
            console.warn(`skipping ${edge.node.name} as it does not have default branch or is archived., Default branch: '${edge.node.defaultBranchRef?.name}', isArchived: '${edge.node.isArchived}'`);
          }
          cursor = edge.cursor;// keep overriding, the last cursor will be used
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
                              updatedAt,
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
      repoWithDetailsArray.push(
        {
          name: repo?.name,
          defaultBranch: repo?.defaultBranchRef?.name,
          stars: repo?.stargazers?.totalCount,
          lastUpdated: repo?.updatedAt,
          license: repo?.licenseInfo?.name,
          watchers: repo?.watchers?.totalCount
        });

    } catch (e) {
      console.error(`Error while fetching yaml file for ${repoName} repo. Error: ${e.message}`);
    }
  }
  const yamlAsJsons = await getAllPubCodeYamlsAsJSON(false);
  await bulkLoadPubCodes(yamlAsJsons);
} else {
  await performCrawling();
}

