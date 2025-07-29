# PageSpeed Compare

A Node.js-based PageSpeed monitoring system that uses Lighthouse to track performance metrics over time.

## Features

- 🔍 **Multiple test runs**: Each URL is tested 3 times and scores are averaged for accuracy
- 📊 **Baseline comparison**: Compare current performance against saved baselines
- 📈 **Delta tracking**: See exactly how scores have changed over time
- 🎯 **Lighthouse integration**: Uses official Lighthouse CLI for reliable scoring
- 📋 **HTML reports**: Beautiful, readable reports with color-coded scores
- 🤖 **GitHub Actions**: Automated weekly testing with commit-back of results
- 🔧 **Flexible usage**: Test all URLs or single URLs via CLI arguments

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Edit URLs** (optional):
   The system comes pre-configured with Redis.io URLs. Edit `urls.json` to test your own sites:

   ```json
   ["https://your-site.com", "https://your-site.com/about"]
   ```

3. **Establish baseline**:

   ```bash
   npm run update-baseline
   ```

4. **Run tests**:

   ```bash
   npm test
   ```

5. **View reports**:
   Open any HTML file in the `reports/` directory in your browser.

## Usage

### Test all URLs and generate reports

```bash
node scripts/run.js
# or
npm test
```

### Update baseline scores

```bash
node scripts/run.js --update-baseline
# or
npm run update-baseline
```

### Test a single URL

```bash
node scripts/run.js --url https://redis.io/
# or
npm run test-url https://redis.io/
```

## Directory Structure

```
/
├── urls.json                 # URLs to test
├── package.json             # Dependencies and scripts
├── scripts/
│   └── run.js              # Main monitoring script
├── baseline/               # Baseline score data (JSON)
├── latest/                 # Latest test results (JSON)
├── reports/                # HTML reports
└── .github/workflows/
    └── pagespeed.yml       # Automated testing workflow
```

## Reports

HTML reports include:

- **Current scores** for Performance, Accessibility, Best Practices, SEO
- **Baseline comparison** (if available)
- **Score deltas** with color-coded improvements/regressions
- **Detailed metrics table** for easy analysis

Scores are color-coded:

- 🟢 **Green**: 90-100 (Good)
- 🟡 **Orange**: 50-89 (Needs Improvement)
- 🔴 **Red**: 0-49 (Poor)

## Automation

The system includes a GitHub Action that:

- Runs every Monday at 2 AM UTC
- Can be triggered manually from the Actions tab
- Installs dependencies and runs tests
- Commits results back to the repository
- Uploads reports as downloadable artifacts

To enable automation:

1. Push this code to a GitHub repository
2. The workflow will automatically start running on schedule
3. Check the Actions tab to monitor progress

## How It Works

1. **Load URLs**: Reads URLs from `urls.json`
2. **Run Tests**: For each URL, runs Lighthouse 3 times
3. **Average Scores**: Calculates mean scores across the 3 runs
4. **Compare Baselines**: Loads existing baseline (if available) and calculates deltas
5. **Generate Reports**: Creates HTML reports with current vs baseline comparison
6. **Save Results**: Stores raw data in `baseline/` or `latest/` directories

## Lighthouse Metrics

The system tracks four core Lighthouse metrics:

- **Performance**: Loading speed and runtime performance
- **Accessibility**: How accessible the site is to users with disabilities
- **Best Practices**: Follows web development best practices
- **SEO**: Search engine optimization effectiveness

Each metric is scored 0-100, with higher scores being better.

## Pre-configured URLs

This system comes pre-configured to test these Redis.io pages:

- redis.io/
- redis.io/try-free
- redis.io/meeting
- redis.io/cloud
- redis.io/software
- redis.io/insight
- redis.io/downloads
- redis.io/lp/try1/
- redis.io/resources
- redis.io/pricing

## Requirements

- Node.js 18+
- Chrome/Chromium (for Lighthouse)
- Internet connection for testing URLs

## Troubleshooting

**Lighthouse fails to run:**

- Ensure Chrome is installed
- Try running with `--no-sandbox` flag (already included)
- Check internet connectivity

**No baseline found:**

- Run with `--update-baseline` first to establish baseline data

**GitHub Action fails:**

- Check that the repository has write permissions for Actions
- Verify the workflow file is in `.github/workflows/`
