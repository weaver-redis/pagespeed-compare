#!/usr/bin/env node

const fs = require("fs-extra");
const { exec } = require("child_process");
const path = require("path");
const { promisify } = require("util");

const execAsync = promisify(exec);

class PageSpeedMonitor {
  constructor() {
    this.baseDir = path.join(__dirname, "..");
    this.urlsFile = path.join(this.baseDir, "urls.json");
    this.baselineDir = path.join(this.baseDir, "baseline");
    this.latestDir = path.join(this.baseDir, "latest");
    this.reportsDir = path.join(this.baseDir, "reports");
  }

  async loadUrls() {
    try {
      const urlsData = await fs.readFile(this.urlsFile, "utf8");
      return JSON.parse(urlsData);
    } catch (error) {
      console.error("Error loading URLs:", error.message);
      process.exit(1);
    }
  }

  urlToFilename(url) {
    return (
      url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "-") + ".json"
    );
  }

  async runLighthouse(url) {
    console.log(`Running Lighthouse for ${url}...`);

    try {
      const { stdout } = await execAsync(
        `npx lighthouse "${url}" --output=json --quiet --chrome-flags="--headless --no-sandbox"`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
      );

      const result = JSON.parse(stdout);

      // Handle different Lighthouse output formats
      const categories = result.categories;
      if (!categories) {
        throw new Error(
          "Invalid Lighthouse result format - no categories found"
        );
      }
      return {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round(
          (categories["best-practices"]?.score || 0) * 100
        ),
        seo: Math.round((categories.seo?.score || 0) * 100),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error running Lighthouse for ${url}:`, error.message);
      return null;
    }
  }

  async runMultipleLighthouse(url, runs = 3) {
    console.log(`Testing ${url} (${runs} runs)...`);
    const results = [];

    for (let i = 1; i <= runs; i++) {
      console.log(`  Run ${i}/${runs}`);
      const result = await this.runLighthouse(url);
      if (result) {
        results.push(result);
      }

      // Small delay between runs
      if (i < runs) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (0 === results.length) {
      console.error(`All Lighthouse runs failed for ${url}`);
      return null;
    }

    // Calculate averages
    const averaged = {
      url,
      runs: results.length,
      performance: Math.round(
        results.reduce((sum, r) => sum + r.performance, 0) / results.length
      ),
      accessibility: Math.round(
        results.reduce((sum, r) => sum + r.accessibility, 0) / results.length
      ),
      bestPractices: Math.round(
        results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length
      ),
      seo: Math.round(
        results.reduce((sum, r) => sum + r.seo, 0) / results.length
      ),
      timestamp: new Date().toISOString(),
      rawResults: results,
    };

    console.log(
      `  Averaged scores: P:${averaged.performance} A:${averaged.accessibility} BP:${averaged.bestPractices} SEO:${averaged.seo}`
    );
    return averaged;
  }

  async saveResults(results, isBaseline = false) {
    const targetDir = isBaseline ? this.baselineDir : this.latestDir;

    for (const result of results) {
      const filename = this.urlToFilename(result.url);
      const filepath = path.join(targetDir, filename);
      await fs.writeFile(filepath, JSON.stringify(result, null, 2));
      console.log(
        `Saved ${isBaseline ? "baseline" : "latest"} results to ${filename}`
      );
    }
  }

  async loadBaseline(url) {
    const filename = this.urlToFilename(url);
    const filepath = path.join(this.baselineDir, filename);

    try {
      const data = await fs.readFile(filepath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  calculateDelta(current, baseline) {
    if (!baseline) return null;

    return {
      performance: current.performance - baseline.performance,
      accessibility: current.accessibility - baseline.accessibility,
      bestPractices: current.bestPractices - baseline.bestPractices,
      seo: current.seo - baseline.seo,
    };
  }

  generateHtmlReport(current, baseline, delta) {
    const formatDelta = (value) => {
      if (null === value) return "N/A";
      const sign = value > 0 ? "+" : "";
      const colorClass =
        value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
      return `<span class="${colorClass}">${sign}${value}</span>`;
    };

    const formatScore = (score) => {
      let colorClass = "poor";
      if (score >= 90) colorClass = "good";
      else if (score >= 50) colorClass = "needs-improvement";
      return `<span class="score ${colorClass}">${score}</span>`;
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>PageSpeed Report - ${current.url}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .score.good { color: #0c7e3e; font-weight: bold; }
        .score.needs-improvement { color: #e67e22; font-weight: bold; }
        .score.poor { color: #d93025; font-weight: bold; }
        .positive { color: #0c7e3e; font-weight: bold; }
        .negative { color: #d93025; font-weight: bold; }
        .neutral { color: #666; }
        .timestamp { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PageSpeed Report</h1>
        <h2>${current.url}</h2>
        <p class="timestamp">Generated: ${current.timestamp}</p>
        <p>Based on ${current.runs} Lighthouse runs (averaged)</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <h3>Performance</h3>
            <p>Current: ${formatScore(current.performance)}</p>
            ${
              baseline
                ? `<p>Baseline: ${formatScore(baseline.performance)}</p>`
                : ""
            }
            <p>Delta: ${formatDelta(delta ? delta.performance : null)}</p>
        </div>
        <div class="metric">
            <h3>Accessibility</h3>
            <p>Current: ${formatScore(current.accessibility)}</p>
            ${
              baseline
                ? `<p>Baseline: ${formatScore(baseline.accessibility)}</p>`
                : ""
            }
            <p>Delta: ${formatDelta(delta ? delta.accessibility : null)}</p>
        </div>
        <div class="metric">
            <h3>Best Practices</h3>
            <p>Current: ${formatScore(current.bestPractices)}</p>
            ${
              baseline
                ? `<p>Baseline: ${formatScore(baseline.bestPractices)}</p>`
                : ""
            }
            <p>Delta: ${formatDelta(delta ? delta.bestPractices : null)}</p>
        </div>
        <div class="metric">
            <h3>SEO</h3>
            <p>Current: ${formatScore(current.seo)}</p>
            ${baseline ? `<p>Baseline: ${formatScore(baseline.seo)}</p>` : ""}
            <p>Delta: ${formatDelta(delta ? delta.seo : null)}</p>
        </div>
    </div>

    ${
      baseline
        ? `
    <table>
        <thead>
            <tr>
                <th>Metric</th>
                <th>Baseline</th>
                <th>Current</th>
                <th>Change</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Performance</td>
                <td>${formatScore(baseline.performance)}</td>
                <td>${formatScore(current.performance)}</td>
                <td>${formatDelta(delta.performance)}</td>
            </tr>
            <tr>
                <td>Accessibility</td>
                <td>${formatScore(baseline.accessibility)}</td>
                <td>${formatScore(current.accessibility)}</td>
                <td>${formatDelta(delta.accessibility)}</td>
            </tr>
            <tr>
                <td>Best Practices</td>
                <td>${formatScore(baseline.bestPractices)}</td>
                <td>${formatScore(current.bestPractices)}</td>
                <td>${formatDelta(delta.bestPractices)}</td>
            </tr>
            <tr>
                <td>SEO</td>
                <td>${formatScore(baseline.seo)}</td>
                <td>${formatScore(current.seo)}</td>
                <td>${formatDelta(delta.seo)}</td>
            </tr>
        </tbody>
    </table>
    `
        : "<p><em>No baseline data available. Run with --update-baseline to establish baseline.</em></p>"
    }
</body>
</html>`;
  }

  async generateReports(results) {
    console.log("\nGenerating HTML reports...");

    for (const result of results) {
      const baseline = await this.loadBaseline(result.url);
      const delta = this.calculateDelta(result, baseline);
      const html = this.generateHtmlReport(result, baseline, delta);

      const filename = this.urlToFilename(result.url).replace(".json", ".html");
      const filepath = path.join(this.reportsDir, filename);

      await fs.writeFile(filepath, html);
      console.log(`Generated report: ${filename}`);
    }
  }

  async run() {
    const args = process.argv.slice(2);
    const updateBaseline = args.includes("--update-baseline");
    const singleUrlIndex = args.findIndex((arg) => arg.startsWith("--url"));

    let urls;
    if (-1 !== singleUrlIndex && args[singleUrlIndex + 1]) {
      urls = [args[singleUrlIndex + 1]];
      console.log(`Testing single URL: ${urls[0]}`);
    } else {
      urls = await this.loadUrls();
      console.log(`Testing ${urls.length} URLs from urls.json`);
    }

    const results = [];

    for (const url of urls) {
      const result = await this.runMultipleLighthouse(url);
      if (result) {
        results.push(result);
      }
    }

    if (0 === results.length) {
      console.error("No successful results to save.");
      process.exit(1);
    }

    // Save results
    if (updateBaseline) {
      await this.saveResults(results, true);
      console.log("\n✅ Baseline updated successfully!");
    } else {
      await this.saveResults(results, false);
      await this.generateReports(results);
      console.log("\n✅ PageSpeed testing completed!");
      console.log(`📊 Reports available in the reports/ directory`);
    }
  }
}

// Run the monitor
if (require.main === module) {
  const monitor = new PageSpeedMonitor();
  monitor.run().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}

module.exports = PageSpeedMonitor;
