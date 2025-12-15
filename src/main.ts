import * as fs from "fs";
import * as progress from "ts-progress";
import { join } from "path";
import { exit } from "process";
import { fetchInspection } from "./fetchInspection";
import { reportFailures } from "./utils";
import { BaselineResult } from "./types";

const urlsFile = process.argv[2];

if (!urlsFile) {
  console.error("Usage: ts-node baseline.ts <urls.txt>");
  exit(1);
}

let urlsPath: string;
if (urlsFile.startsWith("/") || urlsFile.startsWith("~")) {
  urlsPath = urlsFile;
} else {
  urlsPath = join(process.cwd(), urlsFile);
}

if (!fs.existsSync(urlsPath)) {
  console.log(`Could not find ${urlsPath}.`);
  exit(1);
}

const urls = fs.readFileSync(urlsPath, "utf8");
const urlsList = urls
  .trim()
  .split(/\r?\n|\r|\n/g)
  .filter(Boolean);

// the output file is alaways at ../outputs/baselinedata.json
const outDir = join(__dirname, "../outputs");
const baselineOutputPath = join(outDir, "baselinedata.json");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const progressBar = progress.create({ total: urlsList.length });

const failedUrls: string[] = [];
const BaselineResults: BaselineResult[] = []; //output values

(async () => {
  for (const url of urlsList) {
    console.log(`Scanning ${url} ...`);

    try {
      const data = await fetchInspection(url, {
        device: "mobile",   // match frontend default
        location: "us-oh",
        force: false
      });

      // we only interest in number of cookies and 3rd-party trackers
      const cookiesCounts = data?.groups?.[0]?.cards?.[1]?.bigNumber ?? 0;
      const trackersCounts = data?.groups?.[0]?.cards?.[0]?.bigNumber ?? 0;

      BaselineResults.push({
        website: url,
        cookies: cookiesCounts,
        trackers: trackersCounts
      });

    } catch (err) {
      console.error(`${url} failed with error:`, err);
      failedUrls.push(url);
    }

    progressBar.update();
  }

  // write output
  fs.writeFileSync(
    baselineOutputPath,
    JSON.stringify(BaselineResults, null, 2),
    "utf8"
  );
  console.log(`\nBaseline data written to: ${baselineOutputPath}`);

  reportFailures(failedUrls, urlsList.length);
})();
