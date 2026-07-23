import { CronJob } from "cron";
import http from "node:http";
import https from "node:https";

function getBaseUrl() {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL.trim();
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.trim();
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

// every 14 minutes send a GET request to the health endpoint
const job = new CronJob("*/14 * * * *", function () {
  const base = getBaseUrl();
  if (!base) return;
  const url = new URL("/health", base).href;
  const client = url.startsWith("https:") ? https : http;

  client
    .get(url, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

export default job;
