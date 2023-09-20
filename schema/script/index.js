import * as fs from "fs";
import axios from "axios";
import core from "@actions/core";
import * as cheerio from "cheerio";

const fs_promises = fs.promises;
const jsonSchemaResponse = await axios({
  method: "get",
  url: "https://raw.githubusercontent.com/bcgov/pubcode/main/schema/bcgovpubcode.json",
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache"
  }
});
const jsonSchema = jsonSchemaResponse.data;
const ministryNames = jsonSchema?.definitions?.product_information?.properties?.ministry?.items?.enum;

//https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries
if (ministryNames) {
  let htmlResponse = await axios({
    method: "get",
    url: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries"
  });
  const dom = cheerio.load(htmlResponse.data);
  const items = dom(`#body li `);
  const notFoundNames = [];
  let index = 0;
  items.each(function(idx, el) {
    const name = dom(el).text().replace(/\u00a0/g, " ");
    const currentIndex = ministryNames.indexOf(name);
    if (currentIndex === -1) {
      ++index;
      ministryNames.splice(index, 0, name);
      notFoundNames.push(name);
    } else {
      index = currentIndex;
    }
    // and the rest of your code
  });
  if (notFoundNames.length > 0) {
    console.error("Below Ministry names not found in pubcode JSON schema");
    jsonSchema.definitions.product_information.properties.ministry.items["enum"] = ministryNames;
    core.setOutput("schemaChanged", "true");
    await fs_promises.writeFile("../bcgovpubcode.json", JSON.stringify(jsonSchema, null, 2));
  } else {
    core.setOutput("schemaChanged", "false");
  }
// BC Data Catalogue option, in future if there is a direct API endpoint to get list of active ministry names, that would be much better.
  /*const guids = [
    "96860f84-dc45-4eb0-b0cb-9dedd3b58fe9",
    "3239fc90-cc88-49a8-94d9-e2d391bf0a75",
    /!*"63d8e800-bf95-451d-ad84-3069a4d4f0e6",*!/
    "4f7ae636-4cdf-4273-b274-6608c615dba0",
    "1ad99b07-4f04-4e97-88d5-cf476668ba39",
    "0661d32b-1e00-4523-b337-b52e79ab5caf",
    "df6ab6f0-e025-4d7e-9792-861b90ccd554",
    "2a242ed6-e26e-4e45-b046-66bd0d402203",
    "e33eddfa-6220-40c6-a476-4e4d2a19f4ea",
    "8bed5363-3da9-48b3-b1a3-547773dcf8ad",
    "7a66db63-26f4-4052-9cd5-3272b63910f8",
    "f95a4895-ed8d-4348-990d-96c17589a9d5",
    "d033ab8d-5a94-4cad-9d71-f38e15cef4c8",
    "d77936dd-2214-46b3-b8e7-b0da8ac052cf",
    "0e3d8d24-2948-43ed-8806-735c128987b4",
    "da20e649-1ff0-457f-ba13-82116a511fcf",
    "d9e382c6-4b51-4fa5-ae5f-65dda702ebb2",
    "46a17348-04ca-44ce-b5f4-25266f759f76",
    "c3ffbc17-2a82-415d-8221-d28f106aa2f7",
    "7c66d6cf-7886-47fc-95db-ec0605b98eaf",
    "50a81a66-bd0d-42fb-930a-cba0648c1154",
    "2febcf4b-d2c8-4bce-b7cd-e06a10a39c08",
    "0c450efa-5afc-40e9-add9-e103c809047e"
  ];

  const requests = guids.map(guid => axios.get(`https://catalogue.data.gov.bc.ca/api/3/action/organization_show?id=${guid}`));

  const responses = await Promise.all(requests);
  responses.forEach(response => {
    const name = response.data.result?.title?.replace("Ministry of ","");
   // console.log(name);
    if (ministryNames.indexOf(name) === -1) {
      console.error("Ministry name not found in schema");
      process.exit(1);
    }
  });*/

} else {
  console.error("Ministry names not found in pubcode JSON schema");
  process.exit(1);
}
