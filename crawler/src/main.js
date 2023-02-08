import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();
const token = process.env.GIT_TOKEN;
const repoWithDetailsArray = [];
const yamlArray = [];

async function getAllPubCodeYamls() {
  for (const repoWithDetails of repoWithDetailsArray) {
    try {
      const yamlResponse = await axios.get(`https://raw.githubusercontent.com/bcgov/${repoWithDetails.name}/${repoWithDetails.defaultBranch}/bcgovpubcode.yml`);
      const yaml = yamlResponse.data;
      yamlArray.push(yaml);
    } catch (e) {
      //continue
      console.error(e.response?.status);
      console.error(e.response?.config?.url);
    }
  }
  console.info(yamlArray); //print it for the time being, when api is ready this data will be pushed to an endpoint.
}


const performCrawling = async () => {
  let moreRecords = true;
  let cursor='';
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
              if(edge.node?.defaultBranchRef?.name && !edge.node.isArchived){
                repoWithDetailsArray.push(
                  {
                    name: edge.node.name,
                    defaultBranch: edge.node.defaultBranchRef.name
                  });
              }else{
                console.warn(`skipping ${edge.node.name} as it does not have default branch or is archived.`);
              }
              cursor = edge.cursor;// keep overriding, the last cursor will be used
            }
            if (responseData.data.organization.repositories.edges?.length < 100) {
              moreRecords = false;
            }
          } else {
            moreRecords = false;
          }
          console.info('iteration completed, cursor at ', cursor);
    } catch (e) {
      console.error(e);
    }
  } while (moreRecords);
  await getAllPubCodeYamls();
};

await performCrawling();
