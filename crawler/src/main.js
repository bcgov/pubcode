import axios from "axios";
import * as dotenv from "dotenv";
import jsYaml from "js-yaml";
dotenv.config();
const token = process.env.GIT_TOKEN;
const repoWithDetailsArray = [];

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

async function getAllPubCodeYamlsAsJSON() {
  const yamlArray = [];
  for (const repoWithDetails of repoWithDetailsArray) {
    try {
      const yamlResponse = await axios.get(`https://raw.githubusercontent.com/bcgov/${repoWithDetails.name}/${repoWithDetails.defaultBranch}/bcgovpubcode.yml`);
      const yaml = yamlResponse.data;
      const yamlJson = jsYaml.load(yaml);
      yamlJson.repo_name = repoWithDetails.name;
      yamlArray.push(yamlJson);
    } catch (e) {
      console.error(e.response?.status);
      console.error(e.response?.config?.url);
    }
  }
  return yamlArray;

}
async function bulkLoadPubCodes(yamlArrayAsJson) {
  if (yamlArrayAsJson.length > 0) {
    console.info(`Found ${yamlArrayAsJson.length} yaml files to load into database.`);
    console.info(yamlArrayAsJson);
    //send to backend api bulk load endpoint
    try {
      const response = await axios.post(`${API_URL}/api/pub-code/bulk-load`, yamlArrayAsJson, {
        headers: {
          "X-API-KEY": API_KEY
        }
      });
      console.info(response.data);
      console.info(`Successfully loaded ${yamlArrayAsJson.length} yaml files into database.`);
    } catch (e) {
      console.error(e.response?.status);
      console.error(e.response?.config?.url);
    }
  } else {
    console.info(`No yaml files found at the root of repositories under bcgov.`);
  }
}


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
                            }
                          }
                          cursor
                        }
                      }
                    }
                  }`;
    try {
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
      const responseData = response.data;
      if (responseData.data?.organization?.repositories?.edges?.length > 0) {
        for (const edge of responseData.data.organization.repositories.edges) {
          if (edge.node?.defaultBranchRef?.name && !edge.node.isArchived) {
            repoWithDetailsArray.push(
              {
                name: edge.node.name,
                defaultBranch: edge.node.defaultBranchRef.name
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
  const yamlAsJsons = await getAllPubCodeYamlsAsJSON();
  await bulkLoadPubCodes(yamlAsJsons);
};

if (!token || !API_KEY || !API_URL) {
  console.error("Please provide GIT_TOKEN, API_KEY and API_URL in .env file");
  process.exit(1);
}
await performCrawling();
