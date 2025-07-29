#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

class IndexGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, "..", "reports");
    this.docsDir = path.join(__dirname, "..", "docs");
    this.latestDir = path.join(__dirname, "..", "latest");
  }

  async generateIndex() {
    // Ensure docs directory exists
    await fs.ensureDir(this.docsDir);

    // Copy all HTML reports to docs
    if (await fs.pathExists(this.reportsDir)) {
      const reportFiles = await fs.readdir(this.reportsDir);
      for (const file of reportFiles.filter((f) => f.endsWith(".html"))) {
        await fs.copy(
          path.join(this.reportsDir, file),
          path.join(this.docsDir, file)
        );
      }
    }

    // Generate index.html
    const indexHtml = await this.createIndexHtml();
    await fs.writeFile(path.join(this.docsDir, "index.html"), indexHtml);

    console.log("📊 Generated GitHub Pages index at docs/index.html");
  }

  async createIndexHtml() {
    const reports = await this.getReportData();
    const timestamp = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 PageSpeed Monitoring Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background: #f8fafc;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 0.9rem; }
        .reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .report-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .report-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .report-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #2d3748;
        }
        .scores {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }
        .score {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .score-label { font-weight: 500; }
        .score-value { font-weight: 700; }
        .score.good { background: #f0fff4; color: #22543d; }
        .score.needs-improvement { background: #fffbf0; color: #b7791f; }
        .score.poor { background: #fff5f5; color: #c53030; }
        .view-report {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }
        .view-report:hover { background: #5a67d8; }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
        }
        .no-reports {
            text-align: center;
            background: white;
            padding: 60px 20px;
            border-radius: 12px;
            color: #666;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .scores { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 PageSpeed Monitoring Dashboard</h1>
        <p>Real-time performance monitoring with Lighthouse</p>
    </div>

    ${this.generateStatsSection(reports)}

    ${
      reports.length > 0
        ? `
    <div class="reports-grid">
        ${reports.map((report) => this.generateReportCard(report)).join("")}
    </div>
    `
        : `
    <div class="no-reports">
        <h2>🚀 No reports available yet</h2>
        <p>Reports will appear here after the first PageSpeed test runs.</p>
    </div>
    `
    }

    <div class="footer">
        <p>🤖 Last updated: ${timestamp}</p>
        <p>📈 Powered by Lighthouse • 🔄 Auto-updated via GitHub Actions</p>
    </div>
</body>
</html>`;
  }

  generateStatsSection(reports) {
    if (reports.length === 0) return "";

    const avgPerformance = Math.round(
      reports.reduce((sum, r) => sum + r.performance, 0) / reports.length
    );
    const avgAccessibility = Math.round(
      reports.reduce((sum, r) => sum + r.accessibility, 0) / reports.length
    );
    const avgBestPractices = Math.round(
      reports.reduce((sum, r) => sum + r.bestPractices, 0) / reports.length
    );
    const avgSeo = Math.round(
      reports.reduce((sum, r) => sum + r.seo, 0) / reports.length
    );

    return `
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number" style="color: ${this.getScoreColor(
              avgPerformance
            )}">${avgPerformance}</div>
            <div class="stat-label">Avg Performance</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="color: ${this.getScoreColor(
              avgAccessibility
            )}">${avgAccessibility}</div>
            <div class="stat-label">Avg Accessibility</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="color: ${this.getScoreColor(
              avgBestPractices
            )}">${avgBestPractices}</div>
            <div class="stat-label">Avg Best Practices</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" style="color: ${this.getScoreColor(
              avgSeo
            )}">${avgSeo}</div>
            <div class="stat-label">Avg SEO</div>
        </div>
    </div>`;
  }

  generateReportCard(report) {
    const url = new URL(report.url);
    const displayName =
      url.pathname === "/" ? url.hostname : `${url.hostname}${url.pathname}`;

    return `
    <div class="report-card">
        <h3 class="report-title">${displayName}</h3>
        <div class="scores">
            <div class="score ${this.getScoreClass(report.performance)}">
                <span class="score-label">Performance</span>
                <span class="score-value">${report.performance}</span>
            </div>
            <div class="score ${this.getScoreClass(report.accessibility)}">
                <span class="score-label">Accessibility</span>
                <span class="score-value">${report.accessibility}</span>
            </div>
            <div class="score ${this.getScoreClass(report.bestPractices)}">
                <span class="score-label">Best Practices</span>
                <span class="score-value">${report.bestPractices}</span>
            </div>
            <div class="score ${this.getScoreClass(report.seo)}">
                <span class="score-label">SEO</span>
                <span class="score-value">${report.seo}</span>
            </div>
        </div>
        <a href="${report.filename}" class="view-report">📋 View Full Report</a>
    </div>`;
  }

  async getReportData() {
    const reports = [];

    if (!(await fs.pathExists(this.latestDir))) return reports;

    const files = await fs.readdir(this.latestDir);

    for (const file of files.filter((f) => f.endsWith(".json"))) {
      try {
        const data = await fs.readFile(path.join(this.latestDir, file), "utf8");
        const report = JSON.parse(data);
        reports.push({
          ...report,
          filename: file.replace(".json", ".html"),
        });
      } catch (error) {
        console.warn(`Could not read report file ${file}:`, error.message);
      }
    }

    return reports.sort((a, b) => a.url.localeCompare(b.url));
  }

  getScoreClass(score) {
    if (score >= 90) return "good";
    if (score >= 50) return "needs-improvement";
    return "poor";
  }

  getScoreColor(score) {
    if (score >= 90) return "#22543d";
    if (score >= 50) return "#b7791f";
    return "#c53030";
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new IndexGenerator();
  generator.generateIndex().catch((error) => {
    console.error("Error generating index:", error.message);
    process.exit(1);
  });
}

module.exports = IndexGenerator;
