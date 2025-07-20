import os from "os";
import puppeteer from "puppeteer";
import createReport from "./generateReport.mjs";
import runLighthouse from "./lighthouse.mjs";

const urlBase = "http://localhost:5500/Instrumentos/Codigos/front-end/";
const sizes = ["extra-small", "small", "medium", "large", "extra-large"];
const formats = ["json", "html"];
const numRuns = 1;

const scenarios = [
  { order: "small-to-large", sizes: sizes },
  { order: "large-to-small", sizes: [...sizes].reverse() },
  {
    order: "alternating",
    sizes: ["extra-small", "small", "medium", "large", "extra-large"],
  },
];

async function limitCpuUsage() {
  const numCPUs = os.cpus().length;
  return Math.max(1, Math.floor(numCPUs / 2));
}

async function getBrowserMemoryUsage(page) {
  const metrics = await page.metrics();
  return {
    JSHeapUsedSize: (metrics.JSHeapUsedSize / 1024).toFixed(0),
    JSHeapTotalSize: (metrics.JSHeapTotalSize / 1024).toFixed(0),
  };
}

async function runTest(page, size, format, runNumber) {
  const url = `${urlBase}/${format}.html?size=${size}`;
  let performanceScore = 0;
  let metrics = {
    LCP: 0,
    FID: 0,
    CLS: 0,
    FCP: 0,
    SI: 0,
    TTI: 0,
  };

  let memoryUsageNode = {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
  };

  let memoryUsageBrowser = {
    JSHeapUsedSize: 0,
    JSHeapTotalSize: 0,
  };

  let cpuUsage = {
    userCpu: 0,
    systemCpu: 0,
  };

  const numCPUs = await limitCpuUsage();

  try {
    await page.setCacheEnabled(false);
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCache");

    const initialCpu = process.cpuUsage();
    const start = performance.now();

    await page.goto(url, { waitUntil: "networkidle0" });
    const end = performance.now();
    const totalExecutionTime = end - start;

    const lighthouseResult = await runLighthouse(url);
    performanceScore = lighthouseResult.categories.performance.score * 100;

    metrics.LCP =
      lighthouseResult.audits["largest-contentful-paint"].displayValue;
    metrics.FID = lighthouseResult.audits["max-potential-fid"].displayValue;
    metrics.CLS =
      lighthouseResult.audits["cumulative-layout-shift"].displayValue;
    metrics.FCP =
      lighthouseResult.audits["first-contentful-paint"].displayValue;
    metrics.SI = lighthouseResult.audits["speed-index"].displayValue;
    metrics.TTI = lighthouseResult.audits["interactive"].displayValue;

    const finalCpu = process.cpuUsage(initialCpu);
    const userCpuPercentage = Math.min(
      ((finalCpu.user / 1000 / totalExecutionTime) * 100) / numCPUs,
      100
    );
    const systemCpuPercentage = Math.min(
      ((finalCpu.system / 1000 / totalExecutionTime) * 100) / numCPUs,
      100
    );

    cpuUsage.userCpu = userCpuPercentage.toFixed(2);
    cpuUsage.systemCpu = systemCpuPercentage.toFixed(2);

    const memUsageNode = process.memoryUsage();
    memoryUsageNode.rss = (memUsageNode.rss / 1024 / 1024).toFixed(0);
    memoryUsageNode.heapTotal = (memUsageNode.heapTotal / 1024 / 1024).toFixed(
      0
    );
    memoryUsageNode.heapUsed = (memUsageNode.heapUsed / 1024 / 1024).toFixed(0);

    const memoryMetricsBrowser = await getBrowserMemoryUsage(page);
    memoryUsageBrowser.JSHeapUsedSize = memoryMetricsBrowser.JSHeapUsedSize;
    memoryUsageBrowser.JSHeapTotalSize = memoryMetricsBrowser.JSHeapTotalSize;
  } catch (error) {
    console.error(`Error running test for ${size} ${format}:`, error);
  }

  return {
    format: format.toUpperCase(),
    size: size,
    run: runNumber,
    performanceScore,
    ...metrics,
    ...cpuUsage,
    ...memoryUsageNode,
    ...memoryUsageBrowser,
  };
}

(async () => {
  console.time();
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    for (const scenario of scenarios) {
      console.log(`Running scenario: ${scenario.order}`);

      const csvWriter = createReport(scenario);
      let results = [];

      for (const size of scenario.sizes) {
        for (const format of formats) {
          for (let run = 1; run <= numRuns; run++) {
            const result = await runTest(page, size, format, run);
            results.push(result);
          }
        }
      }

      await csvWriter.writeRecords(results);
      console.log(`Saved CSV for scenario: ${scenario.order}`);
    }
  } catch (error) {
    console.error("Error during execution:", error);
  } finally {
    await browser.close();
    console.timeEnd();
  }
})();
