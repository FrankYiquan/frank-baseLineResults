# Blacklight Query
This fork modifies the [main Blacklight Query](https://github.com/the-markup/blacklight-query) behavior so that, instead of outputting a full inspection report and screenshots, **it only outputs the non-duplicated number of cookies and third-party trackers detected for each scanned website listed in `urls.txt`**.

The output is written to `output/baselinedata.json` and is used as `baselineData` for the comparative analysis graph in [graphics-blacklight-client](https://github.com/the-markup/graphics-blacklight-client).

## Output

The generated `baselinedata.json` file contains an array of summarized results in the following format:



Example Output:
```json
[
  {
    "website": "https://www.google.com",
    "cookies": 5,
    "trackers": 2
  },
  {
    "website": "https://www.nytimes.com",
    "cookies": 92,
    "trackers": 94
  }
]
```

## Rationale and Implementation Details

### Why This Change Was Made

The inspection report generated directly by [**Blacklight Collector**](https://github.com/the-markup/blacklight-collector) does **not** include the logic for deduplicating cookies and third-party trackers. Deduplication is instead implemented in [**blacklight-lambda**](https://github.com/the-markup/blacklight-lambda).

Because this fork only needs accurate **counts** of cookies and third-party trackers (rather than full inspection artifacts), relying on the raw collector output would produce inflated or inconsistent numbers.

To preserve the existing deduplication logic, this fork routes inspections through **blacklight-lambda** rather than invoking the collector directly.

---

### Where the Modification Was Made

The modification replaces direct calls to the `collect()` function in **blacklight-collector** with requests to the Blacklight API endpoint exposed by **blacklight-lambda**.

Specifically:

- Instead of calling `collect()` locally in [`main.ts`](https://github.com/FrankYiquan/frank-baseLineResults/blob/main/src/main.ts)
- The query now sends inspection requests to the Express-wrapped API endpoint in **blacklight-lambda**
- The lambda executes the inspection, applies cookie and third-party tracker deduplication, and returns deduplicated results.


## Prerequisites

- [`nvm`](https://www.linode.com/docs/guides/how-to-install-use-node-version-manager-nvm/)
- [`npm`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Getting Started

- `nvm use`
- `npm install`
- ## Set up Lambda Express Server

    1. Refer to the `README` at [**blacklight-lambda**](https://github.com/the-markup/blacklight-lambda) to set up the local Lambda Express server.  
        - This setup is **exactly the same** as the local Lambda Express server used by **graphics-blacklight-client**.
        - You can change the parameter when calling lambda express API in `main.ts`
            ```ts
            // these are the default values in blacklight-lambda
            // numPages: use default value of 1 in blacklight-lambda
            {
                device: "mobile", 
                location: "us-oh",
                force: false
            }
            ```
        - To change other parameters, do it in [**blacklight-lambda**](https://github.com/the-markup/blacklight-lambda/blob/main/src-api-lambda/api.js)

    2. Paste the Lambda Express API URL into `src/config.ts`:

    ```ts
    // example
    export const DEFAULT_API_URL = "http://localhost:1980";
    ```
- `./blacklight-query urls.txt` where `urls.txt` has newline-separated absolute URLs to scan
-  ## Used Output in graphics-blacklight-client
    1. Paste the output into [graphics-blacklight-client](src/blacklight-client/data/baselineData.js)

## Inputs

Write all URLs you wish to scan as **absolute URLs** (including protocol, domain, and path). Separate each URL with a newline.

### Sample `urls.txt` file

```text
https://www.themarkup.org
https://www.calmatters.org
```

### You can use pipes

You can also pipe your list of URLs.

- `echo "https://themarkup.org/" | ./blacklight-query`
- `./blacklight-query < urls.txt`

## Notes

Be aware that the lambda is fairly resource-heavy, and may slow down your computer. We recommend scanning smaller lists if hardware becomes overtaxed.