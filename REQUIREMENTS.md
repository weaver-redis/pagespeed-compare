# Cursor Instructions: PageSpeed Monitor App

## Goal

Build a Node.js app that:

- Accepts a list of URLs from a `urls.json` file.
- Uses the `lighthouse` CLI to run PageSpeed tests.
- Runs each test **3 times per URL**, then averages the scores.
- Saves both the raw and averaged results.
- Compares the current run with a saved baseline and generates a **diff report**.
- Outputs a **simple, human-readable HTML report** showing:
  - Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
  - Before/after comparison
  - Deltas (score differences)

## Execution

- Preferred: Use a **GitHub Action** to automate periodic runs (e.g., weekly), **but only if** it does not block builds or deployments.
- Alternate: Use a local `cron` job or a manual command-line trigger to run the measurement.

## Input Format

`urls.json`:

````json
[
  "https://example.com",
  "https://example.com/about"
]

## Output Structure

```pgsql
/
|- urls.json
|- .cursor/instructions.md
|- baseline/
|  |- example-com.json
|- latest/
|  |- example-com.json
|- reports/
|  |- example-com.html
|- scripts/
|  |- run.js (or run.ts)
|- .github/workflows/
|  |- pagespeed.yml

````

## Features

- On first run:
  - Save the averaged scores per URL as baseline JSON
- On subsequent runs:
  - Save new measurements in a separate latest/ directory
  - Compare current scores to baseline
  - Generate delta and report
- For each URL:
  - Run Lighthouse CLI 3 times
  - Average all four core scores: Performance, Accessibility, Best Practices, SEO
- Reports:
  - HTML output (per-URL or single combined)
  - Easy to read — show old score, new score, delta (+/-)
- CLI arguments to:
  - --update-baseline
  - --url=https://example.com to test a single URL

## Tech Stack

- Node.js
- lighthouse CLI (invoked via npx lighthouse)
- fs and child_process built-ins
- Optional: ejs or handlebars for HTML generation
- Output files in baseline/, latest/, and reports/

## GitHub Action (Optional Automation)

If using GitHub Actions, configure it like this:

- Trigger on a schedule (e.g., every Monday at 2am UTC)
- Use node with actions/setup-node
- Run `npm install` if dependencies are added
- Use `npx lighthouse` to run measurements
- Commit updated results and reports to a pagespeed-reports branch

Example YAML (`.github/workflows/pagespeed.yml`)

```yaml
name: PageSpeed Monitor

on:
  schedule:
    - cron: "0 2 * * 1" # Every Monday at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  pagespeed:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Lighthouse CLI
        run: npm install -g lighthouse

      - name: Run PageSpeed script
        run: node scripts/run.js

      - name: Commit & push report
        run: |
          git config --global user.name "pagespeed-bot"
          git config --global user.email "pagespeed@users.noreply.github.com"
          git add baseline/ latest/ reports/
          git commit -m "chore: update PageSpeed reports" || echo "No changes to commit"
          git push
```

## Nice-to-Haves (For Later)

- Trend line graph of score history
- CSV export of score history
- Slack/Email notification with score summary
- Error handling for Lighthouse CLI crashes
- Parallel runs using Promise.allSettled for speed
- Merge report into a single dashboard

## Assumptions

- Chrome is installed or Lighthouse is running in headless Chromium
- Node.js and npx are available
- You are fine storing report output in your repo or a branch like pagespeed-reports
