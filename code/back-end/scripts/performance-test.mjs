import puppeteer from "puppeteer";
import lighthouse from "lighthouse";
import { URL } from "url";
import fs from "fs";

// Configuração dos dados a serem testados
const sizes = ["extra-small", "small", "medium", "large", "extra-large"];
const formats = ["json", "html"];
const lighthouseFlags = {
  output: "json",
  onlyCategories: ["performance"],
};
const iterations = 10;

// Função para executar Lighthouse com Puppeteer
async function runLighthouse(url, browser) {
  const { lhr } = await lighthouse(url, {
    ...lighthouseFlags,
    port: new URL(browser.wsEndpoint()).port,
  });

  const metrics = {
    lcp: lhr.audits["largest-contentful-paint"]?.numericValue,
    cls: lhr.audits["cumulative-layout-shift"]?.numericValue,
    fcp: lhr.audits["first-contentful-paint"]?.numericValue,
    si: lhr.audits["speed-index"]?.numericValue,
    tti: lhr.audits["interactive"]?.numericValue,
    score: lhr.categories.performance.score * 100,
  };
  return metrics;
}

// Função para coletar as métricas de heap e uso de CPU do sistema
async function getHeapAndCpuUsage() {
  const cpuUsage = process.cpuUsage();
  const memoryUsage = process.memoryUsage();

  return {
    heapTotal: memoryUsage.heapTotal,
    heapUsed: memoryUsage.heapUsed,
    jsHeapUsed: memoryUsage.heapUsed,
    jsHeapTotal: memoryUsage.heapTotal,
    systemCpuUser: cpuUsage.user,
    systemCpuSystem: cpuUsage.system,
  };
}

// Função para calcular a média dos valores
function calculateAverage(results) {
  const average = {
    lcp: 0,
    cls: 0,
    fcp: 0,
    si: 0,
    tti: 0,
    score: 0,
    heapTotal: 0,
    heapUsed: 0,
    jsHeapUsed: 0,
    jsHeapTotal: 0,
    systemCpuUser: 0,
    systemCpuSystem: 0,
  };

  results.forEach((result) => {
    average.lcp += result.lcp || 0;
    average.cls += result.cls || 0;
    average.fcp += result.fcp || 0;
    average.si += result.si || 0;
    average.tti += result.tti || 0;
    average.score += result.score || 0;
    average.heapTotal += result.heapTotal || 0;
    average.heapUsed += result.heapUsed || 0;
    average.jsHeapUsed += result.jsHeapUsed || 0;
    average.jsHeapTotal += result.jsHeapTotal || 0;
    average.systemCpuUser += result.systemCpuUser || 0;
    average.systemCpuSystem += result.systemCpuSystem || 0;
  });

  const count = results.length;

  // Calculando a média dividindo pela quantidade de execuções
  for (let key in average) {
    average[key] = average[key] / count;
  }

  return average;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  console.time();
  let allAverages = [];

  // Loop por cada tamanho e tipo de renderização
  for (let size of sizes) {
    for (let format of formats) {
      let url;
      if (format === "json") {
        url = `http://localhost:5500/front-end/json.html?size=${size}`;
      } else {
        url = `http://localhost:3000/data?size=${size}&format=html`;
      }

      console.log(`Testing: Size = ${size}, Format = ${format}, URL = ${url}`);

      // Array para armazenar os resultados de cada uma das 10 execuções
      let runResults = [];

      // Executa o teste 10 vezes
      for (let i = 0; i < iterations; i++) {
        console.log(
          `Iteration ${i + 1} for Size = ${size}, Format = ${format}`
        );
        await page.goto(url);

        // Executa o Lighthouse e obtém as métricas de desempenho
        const lighthouseMetrics = await runLighthouse(url, browser);

        // Coleta as métricas de heap e uso de CPU do sistema
        const heapAndCpuMetrics = await getHeapAndCpuUsage();

        // Combina as métricas do Lighthouse com as métricas de heap e CPU
        runResults.push({
          ...lighthouseMetrics,
          ...heapAndCpuMetrics,
        });
      }

      // Calcula a média dos resultados das 10 execuções
      const averageMetrics = calculateAverage(runResults);

      // Armazena os resultados médios
      allAverages.push({
        size,
        format,
        ...averageMetrics,
      });

      // Salva os resultados individuais em um arquivo separado
      fs.writeFileSync(
        `${size}-${format}.json`,
        JSON.stringify(runResults, null, 2)
      );
    }
  }

  await browser.close();
  console.timeEnd();

  // Salvar as médias de todos os tamanhos e formatos em um arquivo JSON
  fs.writeFileSync(
    "average-results.json",
    JSON.stringify(allAverages, null, 2)
  );

  console.log(
    "Lighthouse tests completed. Individual and average results saved."
  );
})();
