import axios from "axios";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;
// Set the URL for the initial HTTP GET request
const pubcodeURL = process.env.PUBCODE_URL || "https://pubcode-api.apps.silver.devops.gov.bc.ca/api/pub-code";
// Set the URL for the secondary API call

async function doProcess() {
  try {
    // Perform the initial HTTP GET request
    const pubCodeResponse = await axios.get(pubcodeURL);
    const items = pubCodeResponse.data;

    // Initialize an array to store the final results
    const results = [];

    // Iterate through items and make secondary API calls
    for (const item of items) {
      try {
        // get result from GitHub API
        const repoName = item.repo_name;
        const defaultBranch = item.default_branch;
        try{
          await getYamlFromRepo(repoName, defaultBranch);
        }catch (e){
          if (e.response?.status === 404) {
            item.is_deleted = true;
          }
        }
        results.push(item);
      } catch (error) {
        console.error(`Failed to fetch data for ${item.repo_name}:`, error);
        process.exit(1);
      }
    }
    await bulkLoadPubCodes(results);

  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}
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
try{
  await doProcess();
}catch (e) {
  console.error(e);
  process.exit(1);
}

