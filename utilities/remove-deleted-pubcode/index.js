import axios from "axios";
import { pathToFileURL } from "node:url";

/**
 * Returns the repo names whose bcgovpubcode.yml/.yaml is gone (404) from their default branch.
 * Any other error keeps the entry, so a GitHub outage never hides products.
 */
export async function findRemovedRepos(items, getYaml) {
  const removed = [];
  for (const item of items) {
    try {
      await getYaml(item.repo_name, item.default_branch);
    } catch (e) {
      if (e.response?.status === 404) {
        removed.push(item.repo_name);
      }
    }
  }
  return removed;
}

async function getYamlFromRepo(repoName, branchName) {
  try {
    return await axios.get(`https://raw.githubusercontent.com/bcgov/${repoName}/${branchName}/bcgovpubcode.yml`);
  } catch (e) {
    if (e.response?.status !== 404) {
      throw e;
    }
    return await axios.get(`https://raw.githubusercontent.com/bcgov/${repoName}/${branchName}/bcgovpubcode.yaml`);
  }
}

/**
 * Soft deletes each repo through deleteRepo; throws after trying all of them if any failed.
 */
export async function markSoftDeleted(repoNames, deleteRepo) {
  if (repoNames.length === 0) {
    console.info(`No yaml files to mark as soft delete.`);
    return;
  }
  console.info(`Found ${repoNames.length} yaml files to mark as soft delete.`);
  console.info(repoNames);
  const failed = [];
  for (const repoName of repoNames) {
    try {
      await deleteRepo(repoName);
    } catch (e) {
      console.error(`Failed to soft delete ${repoName}: ${e.response?.status ?? e.message}`);
      failed.push(repoName);
    }
  }
  if (failed.length > 0) {
    throw new Error(`Failed to soft delete ${failed.length} of ${repoNames.length} repos: ${failed.join(", ")}`);
  }
}

async function main() {
  const { API_KEY, API_URL } = process.env;
  if (!API_KEY || !API_URL) {
    throw new Error("API_KEY and API_URL are required");
  }
  const { data: items } = await axios.get(`${API_URL}/api/pub-code`);
  const removed = await findRemovedRepos(items, getYamlFromRepo);
  await markSoftDeleted(removed, (repoName) =>
    axios.delete(`${API_URL}/api/pub-code/${repoName}`, { headers: { "X-API-KEY": API_KEY } })
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
