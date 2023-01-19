import axios from "axios";
import * as dotenv from "dotenv";
import retry from "async-retry";

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

function processResponseData(responseData) {
  let cursor, moreRecords;
  if (responseData.data?.organization?.repositories?.edges?.length > 0) {
    responseData.data.organization.repositories.edges.forEach(element => {
      repoWithDetailsArray.push(
        {
          name: element.node.name,
          defaultBranch: element.node.defaultBranchRef.name
        });
      cursor = element.cursor;// keep overriding, the last cursor will be used
    });
    if (responseData.data.organization.repositories.edges?.length < 100) {
      moreRecords = false;
    }
  } else {
    moreRecords = false;
  }
  return { cursor, moreRecords };
}

const performCrawling = async () => {
  let moreRecords = true;
  do {
    let cursor;
    let after = "";
    if (cursor) {
      after = `,after:${cursor}`;
    }
    const query = `query {
                    organization(login: "bcgov") {
                      repositories(first:100${after}){
                        edges{
                          node{
                            url,
                            name,
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

      await retry(
        async (bail) => {
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
          const __ret = processResponseData(responseData);
          console.info(__ret);
          cursor = __ret.cursor;
          moreRecords = __ret.moreRecords;
          if (200 !== response.status && 429 !== response.status) {
            // don't retry other than 429
            bail(new Error(response.status));
          }

        },
        {
          retries: 5,
          factor: 10
        }
      );

    } catch (e) {
      console.error(e);
    }
  } while (moreRecords);
  await getAllPubCodeYamls();
};

await performCrawling();
