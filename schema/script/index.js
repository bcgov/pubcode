import * as fs from "fs";
import axios from "axios";
import * as core from "@actions/core";
import * as cheerio from "cheerio";
import pkg from 'lodash';
import { pathToFileURL } from "node:url";
const { isEqual } = pkg;

const fs_promises = fs.promises;
export const MINISTRIES_URL = "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries";
export const CABINET_URL = "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/cabinet/cabinet-ministers";
const SCHEMA_FILE = new URL("../bcgovpubcode.json", import.meta.url);
// Official ministry pages live under this path with a slug; leftover CMS links do not.
const MINISTRY_PAGE_HREF = /\/ministries-organizations\/ministries\/[^/?#]+\/?(?:[?#].*)?$/;

axios.defaults.timeout = 30000;

/**
 * Normalize typographic quotes and spacing in scraped ministry names
 * @param {string} text
 * @returns {string}
 */
export function normalizeTypography(text) {
  return String(text)
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ministry names listed in the schema's ministry enum
 * @param jsonSchema
 * @returns {string[]|undefined}
 */
export function ministryNamesFromSchema(jsonSchema) {
  return jsonSchema?.definitions?.product_information?.properties?.ministry?.items?.enum;
}

/**
 * Current ministry names listed on the BC Gov ministries page.
 * Only links to an official ministry page under ministries-organizations/ministries/<slug>
 * are included, so leftover or stale list items (for example a /gov/content?id=… link) are dropped.
 * @param {string} html page HTML
 * @returns {string[]}
 */
export function ministryNamesFromHtml(html) {
  const dom = cheerio.load(html);
  const ministryNamesFromWeb = [];
  dom("#body a").each(function(idx, el) {
    const href = dom(el).attr("href") || "";
    if (!MINISTRY_PAGE_HREF.test(href)) {
      return;
    }
    const name = normalizeTypography(dom(el).text());
    if (name) {
      ministryNamesFromWeb.push(name);
    }
  });
  return ministryNamesFromWeb;
}

/**
 * Portfolio title from the cabinet ministers page, or undefined when it is not a ministry
 * (Premier, minister of state, or parliamentary secretary).
 * "and Deputy Premier" is a role suffix, not part of the ministry name.
 * @param {string} title
 * @returns {string|undefined}
 */
export function ministryNameFromCabinetTitle(title) {
  const normalized = normalizeTypography(title);
  if (/^The Premier$/i.test(normalized)) {
    return undefined;
  }
  if (/^Minister of State\b/i.test(normalized)) {
    return undefined;
  }
  if (/^Parliamentary Secretary\b/i.test(normalized)) {
    return undefined;
  }
  return normalized.replace(/^Minister of /, "").replace(/ and Deputy Premier$/, "");
}

/**
 * Ministry names listed on the BC Gov cabinet ministers page
 * @param {string} html page HTML
 * @returns {string[]}
 */
export function ministryNamesFromCabinetHtml(html) {
  const dom = cheerio.load(html);
  const names = [];
  dom("#body h4").each(function(idx, el) {
    const name = ministryNameFromCabinetTitle(dom(el).text());
    if (name) {
      names.push(name);
    }
  });
  return names;
}

function uniqueNames(names) {
  const seen = new Set();
  const duplicates = [];
  for (const name of names) {
    if (seen.has(name)) {
      duplicates.push(name);
    }
    seen.add(name);
  }
  return { unique: [...seen], duplicates };
}

/**
 * Fail when either list is empty, has duplicates, or the two gov.bc.ca sources disagree.
 * Does not merge or otherwise fall back to one list.
 * @param {string[]} ministryPageNames
 * @param {string[]} cabinetNames
 */
export function assertConsistentMinistryLists(ministryPageNames, cabinetNames) {
  const problems = [];

  const inspect = (label, names) => {
    if (!Array.isArray(names) || names.length === 0) {
      problems.push(`${label} list is empty`);
      return new Set();
    }
    const { unique, duplicates } = uniqueNames(names);
    if (duplicates.length > 0) {
      problems.push(`${label} list has duplicate name(s): ${JSON.stringify(duplicates)}`);
    }
    return new Set(unique);
  };

  const pageSet = inspect("ministries page", ministryPageNames);
  const cabinetSet = inspect("cabinet page", cabinetNames);

  if (pageSet.size > 0 && cabinetSet.size > 0) {
    const onlyOnMinistries = [...pageSet].filter((name) => !cabinetSet.has(name));
    const onlyOnCabinet = [...cabinetSet].filter((name) => !pageSet.has(name));
    if (onlyOnMinistries.length > 0 || onlyOnCabinet.length > 0) {
      problems.push(
        `ministry lists do not match. Only on ministries page: ${JSON.stringify(onlyOnMinistries)}. Only on cabinet page: ${JSON.stringify(onlyOnCabinet)}.`
      );
    }
  }

  if (problems.length > 0) {
    const message = `Ministry list validation failed: ${problems.join("; ")}`;
    console.error(message);
    throw new Error(message);
  }
}

/**
 * Replace the schema's ministry enum when it differs from the web list
 * @param jsonSchema schema, updated in place
 * @param ministryNamesFromWeb
 * @returns {boolean} whether the schema changed
 */
export function updateMinistryNames(jsonSchema, ministryNamesFromWeb) {
  const ministryNames = ministryNamesFromSchema(jsonSchema);
  if (isEqual(ministryNamesFromWeb, ministryNames)) {
    return false;
  }
  console.error("Ministry name mismatch between web and schema", ministryNamesFromWeb, ministryNames);
  jsonSchema.definitions.product_information.properties.ministry.items["enum"] = ministryNamesFromWeb;
  return true;
}

export async function loadSchema(schemaPath = SCHEMA_FILE) {
  const content = await fs_promises.readFile(schemaPath, "utf-8");
  return JSON.parse(content);
}

export async function saveSchema(jsonSchema, schemaPath = SCHEMA_FILE) {
  await fs_promises.writeFile(schemaPath, JSON.stringify(jsonSchema, null, 2) + "\n");
}

/**
 * Fetches the HTML of the BC Gov ministries page with retry and backoff
 * @param {string} [url=MINISTRIES_URL]
 * @param {number} [retries=3]
 * @param {number} [delayMs=1000]
 * @returns {Promise<string>}
 */
export async function getMinistriesHtml(url = MINISTRIES_URL, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; pubcode-schema-validator/1.0)",
          "Accept": "text/html,application/xhtml+xml"
        }
      });
      return response.data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} to fetch ${url} failed: ${error.message}. Retrying in ${delayMs * attempt}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

export async function main() {
  const jsonSchema = await loadSchema();

  if (ministryNamesFromSchema(jsonSchema)) {
    const ministriesHtml = await getMinistriesHtml(MINISTRIES_URL);
    const cabinetHtml = await getMinistriesHtml(CABINET_URL);
    const ministryPageNames = ministryNamesFromHtml(ministriesHtml);
    const cabinetNames = ministryNamesFromCabinetHtml(cabinetHtml);
    assertConsistentMinistryLists(ministryPageNames, cabinetNames);
    if (updateMinistryNames(jsonSchema, ministryPageNames)) {
      core.setOutput("schemaChanged", "true");
      await saveSchema(jsonSchema);
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
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
