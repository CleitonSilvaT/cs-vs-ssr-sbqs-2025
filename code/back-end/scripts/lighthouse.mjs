import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const runLighthouse = async (url) => {
  const chrome = await launch({ chromeFlags: ["--disable-gpu", "--headless"] });
  const options = {
    logLevel: "info",
    output: "json",
    port: chrome.port,
    output: "json",
    onlyCategories: ["performance"],
  };
  const { lhr } = await lighthouse(url, options);
  chrome.kill();

  return lhr;
};

const getLighouseResult = async (url) => {
  const lighthouseResult = await runLighthouse(url);
  const performanceScore = lighthouseResult.categories.performance.score * 100;
  let metrics = {
    LCP: 0,
    FID: 0,
    CLS: 0,
    FCP: 0,
    SI: 0,
    TTI: 0,
  };

  const auditKeys = {
    LCP: "largest-contentful-paint",
    FID: "max-potential-fid",
    CLS: "cumulative-layout-shift",
    FCP: "first-contentful-paint",
    SI: "speed-index",
    TTI: "interactive",
  };

  for (let key in auditKeys) {
    metrics[key] = lighthouseResult.audits[auditKeys[key]].displayValue;
  }

  return {
    ...metrics,
    performanceScore,
  };
};

export { runLighthouse, getLighouseResult };
