import { createObjectCsvWriter as createCsvWriter } from "csv-writer";

const createReport = (scenario) => {
  return createCsvWriter({
    path: `${scenario.order}.csv`,
    header: [
      { id: "format", title: "Format" },
      { id: "size", title: "Size" },
      { id: "performanceScore", title: "Score" },
      { id: "LCP", title: "LCP (s)" },
      { id: "FID", title: "FID (ms)" },
      { id: "CLS", title: "CLS (s)" },
      { id: "FCP", title: "FCP (s)" },
      { id: "SI", title: "SI (s)" },
      { id: "TTI", title: "TTI (s_" },
      { id: "userCpu", title: "User CPU (%)" },
      { id: "systemCpu", title: "System CPU (%)" },
      { id: "rss", title: "Memory RSS (Kb)" },
      { id: "heapTotal", title: "Heap Total (Kb)" },
      { id: "heapUsed", title: "Heap Used (Kb)" },
      { id: "JSHeapUsedSize", title: "JS Heap Used Size (Kb)" },
      { id: "JSHeapTotalSize", title: "JS Heap Total Size (Kb)" },
    ],
  });
};

export default createReport;
