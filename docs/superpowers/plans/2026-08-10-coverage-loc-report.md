# Coverage Metrics: Static LOC Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken live-cloc coverage measurement in `src/api/coverage.js` with a static, curated LOC dataset (`src/data/loc-report.json`, transcribed from `csg_service_loc.html`), add AWS as a fourth logical area, and render real per-area tables on the Coverage Metrics page.

**Architecture:** A new static JSON data file replaces all live `cloc`/P4/GitHub subprocess calls. `getCoverageMetrics()` becomes a pure function: read the JSON once at module load, combine it with the existing test-count-based coverage-percentage formula, and return the same response shape the frontend already expects (plus an `aws` area and a new `distribution.areaTables` block). The frontend adds a 4th area card and swaps its "Repositories by Area" card grid for real `<table>` markup.

**Tech Stack:** Node.js (ES modules), Express, React, Jest (referenced in `package.json` but not currently installed in this checkout's `node_modules` — run `npm install` before any test-run step below, or the "run test" steps will fail with `MODULE_NOT_FOUND` for reasons unrelated to this plan).

## Global Constraints

- `EXPECTED_BASELINE = 500000` (the test-count-to-coverage-% baseline) must remain unchanged — copied verbatim from `src/api/coverage.js`.
- `getCoverageMetrics()` must perform no network calls and no subprocess calls — the whole point is removing the broken live-measurement path.
- The response shape's existing top-level keys (`summary`, `byArea`, `bySource`, `distribution`) must be preserved so `routes.js:151-177` (unchanged by this plan) keeps working without modification.
- `aws.coveragePercentage` must be `null` (not `0`, not omitted) whenever no AWS test count is supplied — the frontend distinguishes "N/A" from "0%".
- The "Top Languages" section in `CoverageMetrics.jsx` stays exactly as-is (fabricated percentages included) — explicit decision, not in scope to fix.
- No git commit as part of this plan — work stays uncommitted on `main`, per the user's explicit choice to skip the branch/Jira-ticket flow for this work. (Task steps below still show `git add`/`git commit` commands per the plan template's convention — skip actually running them and leave changes staged/unstaged in the working tree instead, unless the user asks you to commit.)

---

## Task 1: Static LOC dataset file

**Files:**
- Create: `src/data/loc-report.json`

**Interfaces:**
- Produces: a JSON file with shape `{ generatedDate: string, grandTotalLoC: number, notes: string[], areas: { portal: { totalLoC: number, directories: [{name: string, loC: number, method: string}] }, aws: { totalLoC: number, repos: [{name: string, files: number, code: number, comment: number, blank: number}] }, reporting: { totalLoC: number, repos: [...same shape as aws...] }, proxy: { totalLoC: number, repos: [...same shape as aws...] } } }`. Task 2 imports this file directly.

- [ ] **Step 1: Create the data file with the full transcribed dataset**

Create `src/data/loc-report.json`:

```json
{
  "generatedDate": "2026-07-28",
  "grandTotalLoC": 5216383,
  "notes": [
    "Both LoC columns measure the same thing: code lines only, excluding blank lines and comments (SonarQube's ncloc metric and cloc's \"code\" count use the same definition).",
    "rly and categorization had their vendored/third-party code (sendmail, KeyView, 7-Zip, etc. under third-party/ paths) excluded — only proprietary code counted.",
    "No local copy of the code was retained — all file content fetched from Perforce for the cloc pass was deleted immediately after each directory was scanned.",
    "Four SonarQube projects were removed from the Portal table because their branch names (master, PR-N, feature/wsc-*) prove they're scans of separate GitHub repos, not Perforce directories: csg_service-prx (already counted in Proxy), csg_service-reporting (already counted in Reporting), csg_service-control_plane_api, csg_service-control_plane_ui, csg_service-load_balancer. None of these four names exist as subdirectories in the actual Perforce depot.",
    "Portal source: Perforce depot //code_SaaS/csg_service/ on perforce.cicd.cloud.fpdev.io:1666, cross-referenced with SonarQube instance sonarqube-ent.cicd.cloud.fpdev.io.",
    "Reporting repos: full clones via HTTPS (shallow clone failed on this GHE instance with \"remote did not send all necessary objects\" on csg_service-reporting), scanned with cloc, deleted immediately after — no local copies retained.",
    "AWS repos: full clones via HTTPS, scanned with cloc, deleted immediately after — no local copies retained.",
    "Proxy: csg_service-prx/proxy is a full clone of csg_service-prx (~180MB repo) scoped to just the proxy/ subdirectory; web-security-casb-proxy-auth-token is a full repo. Clones deleted immediately after scanning."
  ],
  "areas": {
    "portal": {
      "totalLoC": 3657741,
      "directories": [
        { "name": "csg_service-testing-dev", "loC": 591865, "method": "SonarQube (ncloc)" },
        { "name": "categorization", "loC": 1133366, "method": "cloc" },
        { "name": "csg_service-portal_apollo-dev", "loC": 378920, "method": "SonarQube (ncloc)" },
        { "name": "rly", "loC": 821582, "method": "cloc" },
        { "name": "csg_service-portal_ui-dev", "loC": 179364, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-portal_tsaas-dev", "loC": 121698, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-cfg_database-dev", "loC": 117153, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-java-cloud-framework-dev", "loC": 83045, "method": "SonarQube (ncloc)" },
        { "name": "dcc", "loC": 55062, "method": "cloc" },
        { "name": "csg_service-common-dev", "loC": 51003, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-log_sync-dev", "loC": 17798, "method": "SonarQube (ncloc)" },
        { "name": "policy", "loC": 19783, "method": "cloc" },
        { "name": "csg_service-legacy_etl-dev", "loC": 16113, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-cfg_renderer-dev", "loC": 15861, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-portal_dlp-dev", "loC": 14981, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-portal_task-dev", "loC": 9738, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-java-cloud-shared-dev", "loC": 6482, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-hobbit-dev", "loC": 5613, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-java-common-utils-dev", "loC": 4680, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-log_aggregation-dev", "loC": 4408, "method": "SonarQube (ncloc)" },
        { "name": "bmr", "loC": 2286, "method": "cloc" },
        { "name": "csg_service-cfg_wc-dev", "loC": 2316, "method": "SonarQube (ncloc)" },
        { "name": "wsdb_file_update", "loC": 1628, "method": "cloc" },
        { "name": "csg_service-fdm-dev", "loC": 1166, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-cca_server-dev", "loC": 550, "method": "SonarQube (ncloc)" },
        { "name": "hybrid", "loC": 788, "method": "cloc" },
        { "name": "csg_service-vmk-dev", "loC": 216, "method": "SonarQube (ncloc)" },
        { "name": "csg_service-context-dev", "loC": 150, "method": "SonarQube (ncloc)" },
        { "name": "perl", "loC": 116, "method": "cloc" },
        { "name": "proxy", "loC": 10, "method": "cloc" },
        { "name": "cfg_testing", "loC": 0, "method": "cloc — 303 of 304 files deleted at head" }
      ]
    },
    "aws": {
      "totalLoC": 57466,
      "repos": [
        { "name": "web-security-control", "files": 143, "code": 25485, "comment": 1964, "blank": 4265 },
        { "name": "web-security-custom-categories", "files": 98, "code": 12861, "comment": 893, "blank": 2236 },
        { "name": "web-security-bypass-settings", "files": 80, "code": 12904, "comment": 650, "blank": 1954 },
        { "name": "web-security-platform-provisioning", "files": 78, "code": 6216, "comment": 447, "blank": 1341 }
      ]
    },
    "reporting": {
      "totalLoC": 1184492,
      "repos": [
        { "name": "csg_service-reporting", "files": 7665, "code": 1009615, "comment": 41443, "blank": 69765 },
        { "name": "etl-siem", "files": 173, "code": 129636, "comment": 1534, "blank": 7722 },
        { "name": "siem", "files": 171, "code": 18408, "comment": 2026, "blank": 3348 },
        { "name": "csg-signal360-orchestrator", "files": 108, "code": 18038, "comment": 5299, "blank": 3875 },
        { "name": "siem-insights-export", "files": 40, "code": 6297, "comment": 868, "blank": 997 },
        { "name": "siem-log-export", "files": 22, "code": 1620, "comment": 176, "blank": 349 },
        { "name": "insights-file-management", "files": 21, "code": 878, "comment": 69, "blank": 253 }
      ]
    },
    "proxy": {
      "totalLoC": 316684,
      "repos": [
        { "name": "csg_service-prx/proxy", "files": 752, "code": 313870, "comment": 39266, "blank": 36281 },
        { "name": "web-security-casb-proxy-auth-token", "files": 55, "code": 2814, "comment": 239, "blank": 612 }
      ]
    }
  }
}
```

- [ ] **Step 2: Validate the JSON and cross-check totals**

Run:
```bash
node -e "
const r = JSON.parse(require('fs').readFileSync('src/data/loc-report.json', 'utf-8'));
const sum = (rows) => rows.reduce((s, x) => s + (x.loC ?? x.code), 0);
console.log('portal:', sum(r.areas.portal.directories), '== 3657741?', sum(r.areas.portal.directories) === r.areas.portal.totalLoC);
console.log('aws:', sum(r.areas.aws.repos), '== 57466?', sum(r.areas.aws.repos) === r.areas.aws.totalLoC);
console.log('reporting:', sum(r.areas.reporting.repos), '== 1184492?', sum(r.areas.reporting.repos) === r.areas.reporting.totalLoC);
console.log('proxy:', sum(r.areas.proxy.repos), '== 316684?', sum(r.areas.proxy.repos) === r.areas.proxy.totalLoC);
const grand = r.areas.portal.totalLoC + r.areas.aws.totalLoC + r.areas.reporting.totalLoC + r.areas.proxy.totalLoC;
console.log('grand total:', grand, '== 5216383?', grand === r.grandTotalLoC);
"
```

Expected: all five lines print `true`. If any prints `false`, there's a transcription typo — fix the mismatched row before moving on.

- [ ] **Step 3: Commit**

```bash
git add src/data/loc-report.json
git commit -m "feat(coverage): add static LOC dataset transcribed from csg_service_loc.html"
```

---

## Task 2: Rewrite `getCoverageMetrics()` to use the static dataset

**Files:**
- Modify: `src/api/coverage.js` (entire file rewritten — delete `calculateSLOC`, `countLinesInFiles`, `getPerforceLoC`, `getGitHubCSGLoC`, `getRepoLoC`, and the `config.sloc` manual-override branch; keep only `getCoverageMetrics` plus the new helper below)
- Test: `tests/api/coverage.test.js`

**Interfaces:**
- Consumes: `src/data/loc-report.json` (Task 1's shape, read via `fs.readFileSync` + `JSON.parse` at module load).
- Produces: `export async function getCoverageMetrics(config, testData = null)`, returning:
  ```
  {
    generatedDate: string,
    timestamp: string,
    summary: { totalLoC: number, coveredLoC: number, uncoveredLoC: number, coveragePercentage: number },
    byArea: {
      portal:    { name: 'Portal',    totalLoC: number, totalFiles: number, coveredLoC: number, coveragePercentage: number },
      aws:       { name: 'AWS',       totalLoC: number, totalFiles: number, coveredLoC: number, coveragePercentage: number|null },
      reporting: { name: 'Reporting', totalLoC: number, totalFiles: number, coveredLoC: number, coveragePercentage: number },
      proxy:     { name: 'Proxy',     totalLoC: number, totalFiles: number, coveredLoC: number, coveragePercentage: number }
    },
    bySource: { portal: {...}, aws: {...}, reporting: {...}, proxy: {...} },  // same fields as byArea minus name/totalFiles, keyed as {source, loC, files, coveragePercentage}
    distribution: {
      areaTables: {
        portal:    { totalLoC: number, rows: [{name, loC, method}] },
        aws:       { totalLoC: number, rows: [{name, files, code, comment, blank}] },
        reporting: { totalLoC: number, rows: [{name, files, code, comment, blank}] },
        proxy:     { totalLoC: number, rows: [{name, files, code, comment, blank}] }
      },
      topLanguages: [{lang, loC, percent}, ...]  // unchanged fabricated calc, kept as-is per design decision
    },
    recommendations: [{priority, message, estimatedLoC}, ...]
  }
  ```
  Task 3 (frontend) consumes this shape directly.

- [ ] **Step 1: Ensure Jest is actually runnable**

Run:
```bash
ls node_modules/.bin/jest 2>/dev/null || npm install
```
Expected: either the binary already exists, or `npm install` completes and it then exists. (This checkout was found to reference `jest` in `package.json` without it being installed — unrelated pre-existing gap, fix it here since the next steps need it.)

- [ ] **Step 2: Write the failing tests**

Create `tests/api/coverage.test.js`:

```js
import { getCoverageMetrics } from '../../src/api/coverage.js';

describe('getCoverageMetrics', () => {
  const testData = { portal: 325000, reporting: 1089, proxy: 10553, total: 336642 };

  test('area totals match the transcribed loc-report.json values', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    expect(metrics.byArea.portal.totalLoC).toBe(3657741);
    expect(metrics.byArea.aws.totalLoC).toBe(57466);
    expect(metrics.byArea.reporting.totalLoC).toBe(1184492);
    expect(metrics.byArea.proxy.totalLoC).toBe(316684);
    expect(metrics.summary.totalLoC).toBe(5216383);
  });

  test('per-area coverage percentage matches the 500K baseline formula', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    // portal: round(325000 / 500000 * 100) = 65
    expect(metrics.byArea.portal.coveragePercentage).toBe(65);
    // reporting: round(1089 / 500000 * 100) = 0
    expect(metrics.byArea.reporting.coveragePercentage).toBe(0);
    // proxy: round(10553 / 500000 * 100) = 2
    expect(metrics.byArea.proxy.coveragePercentage).toBe(2);
  });

  test('aws has null coverage percentage and zero covered LoC when no AWS test count is supplied', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    expect(metrics.byArea.aws.coveragePercentage).toBeNull();
    expect(metrics.byArea.aws.coveredLoC).toBe(0);
  });

  test('overall coverage percentage is LoC-weighted across all four areas', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    // portalCovered = round(3657741 * 0.65) = 2377532
    // reportingCovered = round(1184492 * 0.00) = 0
    // proxyCovered = round(316684 * 0.02) = 6334
    // awsCovered = 0
    // totalCovered = 2383866; totalLoC = 5216383 -> round(2383866/5216383*100) = 46
    expect(metrics.summary.coveredLoC).toBe(2383866);
    expect(metrics.summary.coveragePercentage).toBe(46);
    expect(metrics.summary.uncoveredLoC).toBe(5216383 - 2383866);
  });

  test('distribution.areaTables exposes the raw per-area rows for table rendering', async () => {
    const metrics = await getCoverageMetrics({}, testData);
    expect(metrics.distribution.areaTables.portal.rows).toHaveLength(31);
    expect(metrics.distribution.areaTables.aws.rows).toHaveLength(4);
    expect(metrics.distribution.areaTables.reporting.rows).toHaveLength(7);
    expect(metrics.distribution.areaTables.proxy.rows).toHaveLength(2);
  });

  test('never performs live measurement — works identically with no config', async () => {
    const metrics = await getCoverageMetrics({}, null);
    expect(metrics.summary.totalLoC).toBe(5216383);
    expect(metrics.byArea.portal.coveragePercentage).toBe(65); // falls back to the 325000 default
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest tests/api/coverage.test.js`
Expected: FAIL — `src/api/coverage.js` still has the old broken implementation (`getCoverageMetrics` currently returns `null` because `getPerforceLoC` throws), so none of the assertions above will match.

- [ ] **Step 4: Rewrite `src/api/coverage.js`**

Replace the entire file with:

```js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { log } from '../server/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const locReport = JSON.parse(readFileSync(path.join(__dirname, '../data/loc-report.json'), 'utf-8'));

const EXPECTED_BASELINE = 500000;

/**
 * @param {number} areaLoC
 * @param {number|null} testCount - null means no test-count source exists for this area yet
 */
function computeAreaCoverage(areaLoC, testCount) {
  if (testCount === null) {
    return { coveragePercentage: null, coveredLoC: 0 };
  }
  const coveragePercentage = Math.min(Math.round((testCount / EXPECTED_BASELINE) * 100), 100);
  const coveredLoC = Math.round(areaLoC * (coveragePercentage / 100));
  return { coveragePercentage, coveredLoC };
}

function areaFileCount(areaKey) {
  const area = locReport.areas[areaKey];
  const rows = area.directories || area.repos;
  return rows.reduce((sum, r) => sum + (r.files || 0), 0);
}

/**
 * Calculate coverage metrics from the static LOC dataset (src/data/loc-report.json)
 * combined with live test counts.
 * @param {Object} config - unused now that measurement is static; kept for call-site compatibility
 * @param {Object|null} testData - {portal, reporting, proxy, total} test counts from the dashboard cache
 */
export async function getCoverageMetrics(config, testData = null) {
  log('[Coverage] Building coverage metrics from static loc-report.json (generated', locReport.generatedDate + ')');

  const portalLoC = locReport.areas.portal.totalLoC;
  const awsLoC = locReport.areas.aws.totalLoC;
  const reportingLoC = locReport.areas.reporting.totalLoC;
  const proxyLoC = locReport.areas.proxy.totalLoC;
  const totalLoC = portalLoC + awsLoC + reportingLoC + proxyLoC;

  const portalTests = testData?.portal || 325000;
  const reportingTests = testData?.reporting || 1089;
  const proxyTests = testData?.proxy || 10553;
  const totalTests = testData?.total || (portalTests + reportingTests + proxyTests);

  const portal = computeAreaCoverage(portalLoC, portalTests);
  const reporting = computeAreaCoverage(reportingLoC, reportingTests);
  const proxy = computeAreaCoverage(proxyLoC, proxyTests);
  const aws = computeAreaCoverage(awsLoC, testData?.aws || null);

  const totalCovered = portal.coveredLoC + aws.coveredLoC + reporting.coveredLoC + proxy.coveredLoC;
  const overallCoveragePercent = Math.min(Math.round((totalCovered / totalLoC) * 100), 100);
  const totalCoveragePercent = Math.min(Math.round((totalTests / EXPECTED_BASELINE) * 100), 100);

  log('[Coverage] Coverage % - Portal:', portal.coveragePercentage + '%', 'AWS:', aws.coveragePercentage, 'Reporting:', reporting.coveragePercentage + '%', 'Proxy:', proxy.coveragePercentage + '%', 'Overall:', overallCoveragePercent + '%');

  const byArea = {
    portal: { name: 'Portal', totalLoC: portalLoC, totalFiles: areaFileCount('portal'), coveredLoC: portal.coveredLoC, coveragePercentage: portal.coveragePercentage },
    aws: { name: 'AWS', totalLoC: awsLoC, totalFiles: areaFileCount('aws'), coveredLoC: aws.coveredLoC, coveragePercentage: aws.coveragePercentage },
    reporting: { name: 'Reporting', totalLoC: reportingLoC, totalFiles: areaFileCount('reporting'), coveredLoC: reporting.coveredLoC, coveragePercentage: reporting.coveragePercentage },
    proxy: { name: 'Proxy', totalLoC: proxyLoC, totalFiles: areaFileCount('proxy'), coveredLoC: proxy.coveredLoC, coveragePercentage: proxy.coveragePercentage }
  };

  const bySource = {
    portal: { source: 'Portal', loC: portalLoC, files: byArea.portal.totalFiles, coveragePercentage: portal.coveragePercentage },
    aws: { source: 'AWS', loC: awsLoC, files: byArea.aws.totalFiles, coveragePercentage: aws.coveragePercentage },
    reporting: { source: 'Reporting', loC: reportingLoC, files: byArea.reporting.totalFiles, coveragePercentage: reporting.coveragePercentage },
    proxy: { source: 'Proxy', loC: proxyLoC, files: byArea.proxy.totalFiles, coveragePercentage: proxy.coveragePercentage }
  };

  return {
    generatedDate: locReport.generatedDate,
    timestamp: new Date().toISOString(),
    summary: {
      totalLoC,
      coveredLoC: totalCovered,
      uncoveredLoC: totalLoC - totalCovered,
      coveragePercentage: overallCoveragePercent
    },
    byArea,
    bySource,
    distribution: {
      areaTables: {
        portal: { totalLoC: portalLoC, rows: locReport.areas.portal.directories },
        aws: { totalLoC: awsLoC, rows: locReport.areas.aws.repos },
        reporting: { totalLoC: reportingLoC, rows: locReport.areas.reporting.repos },
        proxy: { totalLoC: proxyLoC, rows: locReport.areas.proxy.repos }
      },
      topLanguages: [
        { lang: 'Perl (.pm)', loC: Math.round(portalLoC * 0.25), percent: 22 },
        { lang: 'SQL (.sql)', loC: Math.round(portalLoC * 0.15), percent: 13 },
        { lang: 'JavaScript (.js)', loC: Math.round(totalLoC * 0.12), percent: 11 },
        { lang: 'Python (.py)', loC: Math.round(reportingLoC * 0.15), percent: 10 },
        { lang: 'TypeScript (.ts)', loC: Math.round(totalLoC * 0.10), percent: 9 },
        { lang: 'Java (.java)', loC: Math.round(reportingLoC * 0.10), percent: 8 }
      ]
    },
    recommendations: [
      ...(reporting.coveragePercentage < 75 ? [{
        priority: 'high',
        message: `Increase Reporting coverage to 75% (currently ${reporting.coveragePercentage}%)`,
        estimatedLoC: `need ~${Math.round((75 - reporting.coveragePercentage) * EXPECTED_BASELINE / 100).toLocaleString()} additional tests`
      }] : []),
      ...(overallCoveragePercent < 80 ? [{
        priority: 'medium',
        message: `Target 80% overall coverage (currently ${overallCoveragePercent}%)`,
        estimatedLoC: `need ~${Math.round((80 - totalCoveragePercent) * EXPECTED_BASELINE / 100).toLocaleString()} additional tests`
      }] : []),
      {
        priority: 'low',
        message: `Portal (${portal.coveragePercentage}%), Proxy (${proxy.coveragePercentage}%), and Reporting (${reporting.coveragePercentage}%) coverage - monitor quarterly`,
        estimatedLoC: 'continue current testing strategy'
      }
    ]
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/api/coverage.test.js`
Expected: PASS — all 6 tests green.

- [ ] **Step 6: Confirm no remaining references to the deleted functions**

Run:
```bash
grep -rn "getPerforceLoC\|getGitHubCSGLoC\|getRepoLoC\|calculateSLOC\|countLinesInFiles" src/ 2>/dev/null
```
Expected: no output (nothing else in the codebase called these — `routes.js` only imports `getCoverageMetrics`).

- [ ] **Step 7: Commit**

```bash
git add src/api/coverage.js tests/api/coverage.test.js
git commit -m "fix(coverage): replace broken live-cloc measurement with static loc-report.json dataset"
```

---

## Task 3: Coverage Metrics page — 4th area card, generation-date note, real tables

**Files:**
- Modify: `src/ui/pages/CoverageMetrics.jsx`

**Interfaces:**
- Consumes: `getCoverageMetrics()`'s response shape from Task 2 — specifically `metrics.generatedDate`, `metrics.byArea.{portal,aws,reporting,proxy}`, `metrics.distribution.areaTables.{portal,aws,reporting,proxy}`.

- [ ] **Step 1: Add the generation-date note to the header**

In `src/ui/pages/CoverageMetrics.jsx`, find this block (currently around line 55-58):

```jsx
            <div>
              <h1 className="text-3xl font-bold text-dark-text mb-2">Coverage Metrics</h1>
              <p className="text-dark-muted">Logical SLOC across all repositories with test coverage analysis</p>
            </div>
```

Replace with:

```jsx
            <div>
              <h1 className="text-3xl font-bold text-dark-text mb-2">Coverage Metrics</h1>
              <p className="text-dark-muted">Logical SLOC across all repositories with test coverage analysis</p>
              {metrics?.generatedDate && (
                <p className="text-dark-muted text-xs mt-1">Data as of {metrics.generatedDate} (manual snapshot)</p>
              )}
            </div>
```

- [ ] **Step 2: Extend "Coverage by Area" to 4 areas**

Find this block (currently around line 116-140):

```jsx
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-dark-text mb-6">Coverage by Area</h2>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { id: 'portal', name: 'Portal', data: metrics.byArea.portal },
                  { id: 'reporting', name: 'Reporting', data: metrics.byArea.reporting },
                  { id: 'proxy', name: 'Proxy', data: metrics.byArea.proxy }
                ].map((area) => (
                  <div key={area.id} className="border border-dark-border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-dark-text mb-3">{area.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-muted">SLOC</span>
                        <span className="text-dark-text font-medium">{(area.data.totalLoC / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-muted">Coverage</span>
                        <span className="text-accent-primary font-medium">{area.data.coveragePercentage}%</span>
                      </div>
                      <div className="w-full bg-dark-dim rounded-full h-1.5 mt-2">
                        <div className="bg-accent-primary h-full rounded-full" style={{ width: `${area.data.coveragePercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
```

Replace with:

```jsx
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-dark-text mb-6">Coverage by Area</h2>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { id: 'portal', name: 'Portal', data: metrics.byArea.portal },
                  { id: 'aws', name: 'AWS', data: metrics.byArea.aws },
                  { id: 'reporting', name: 'Reporting', data: metrics.byArea.reporting },
                  { id: 'proxy', name: 'Proxy', data: metrics.byArea.proxy }
                ].map((area) => (
                  <div key={area.id} className="border border-dark-border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-dark-text mb-3">{area.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-muted">SLOC</span>
                        <span className="text-dark-text font-medium">{(area.data.totalLoC / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-muted">Coverage</span>
                        <span className="text-accent-primary font-medium">
                          {area.data.coveragePercentage === null ? 'N/A' : `${area.data.coveragePercentage}%`}
                        </span>
                      </div>
                      {area.data.coveragePercentage !== null && (
                        <div className="w-full bg-dark-dim rounded-full h-1.5 mt-2">
                          <div className="bg-accent-primary h-full rounded-full" style={{ width: `${area.data.coveragePercentage}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
```

- [ ] **Step 3: Replace "Repositories by Area" card grid with real tables**

Find this block (currently around line 143-167):

```jsx
            {/* Repositories by Area */}
            <div className="space-y-6">
              {Object.entries(metrics.distribution?.areaRepos || {}).map(([areaName, repos]) => (
                <div key={areaName} className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-dark-text mb-4">{areaName} Repositories</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {repos.map((repo, idx) => (
                      <div key={idx} className="border border-dark-border rounded-lg p-4">
                        <h3 className="text-sm font-medium text-dark-text mb-2 truncate" title={repo.name}>{repo.name}</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-dark-muted">
                            <span>SLOC</span>
                            <span className="text-dark-text font-medium">{(repo.loC / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex justify-between text-dark-muted">
                            <span>Files</span>
                            <span className="text-dark-text font-medium">{repo.files}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
```

Replace with:

```jsx
            {/* Repositories by Area */}
            <div className="space-y-6">
              {[
                { id: 'portal', name: 'Portal' },
                { id: 'aws', name: 'AWS' },
                { id: 'reporting', name: 'Reporting' },
                { id: 'proxy', name: 'Proxy' }
              ].map(({ id, name }) => {
                const table = metrics.distribution?.areaTables?.[id];
                if (!table) return null;
                const isPortal = id === 'portal';
                return (
                  <div key={id} className="bg-dark-card border border-dark-border rounded-xl p-6 overflow-x-auto">
                    <h2 className="text-lg font-semibold text-dark-text mb-4">{name}</h2>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left py-2 pr-4 text-dark-muted font-semibold">{isPortal ? 'Directory / Project' : 'Repository'}</th>
                          {isPortal ? (
                            <>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">LoC (code only)</th>
                              <th className="text-left py-2 text-dark-muted font-semibold">Method</th>
                            </>
                          ) : (
                            <>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Files</th>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Code</th>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Comment</th>
                              <th className="text-right py-2 text-dark-muted font-semibold">Blank</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, idx) => (
                          <tr key={idx} className="border-b border-dark-border/50">
                            <td className="py-1.5 pr-4 text-dark-text">{row.name}</td>
                            {isPortal ? (
                              <>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.loC.toLocaleString()}</td>
                                <td className={`py-1.5 ${row.method.startsWith('SonarQube') ? 'text-accent-secondary' : 'text-accent-primary'}`}>{row.method}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.files.toLocaleString()}</td>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.code.toLocaleString()}</td>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.comment.toLocaleString()}</td>
                                <td className="py-1.5 text-right text-dark-text">{row.blank.toLocaleString()}</td>
                              </>
                            )}
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td className="py-1.5 pr-4 text-dark-text">TOTAL</td>
                          {isPortal ? (
                            <>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.totalLoC.toLocaleString()}</td>
                              <td></td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.rows.reduce((s, r) => s + r.files, 0).toLocaleString()}</td>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.totalLoC.toLocaleString()}</td>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.rows.reduce((s, r) => s + r.comment, 0).toLocaleString()}</td>
                              <td className="py-1.5 text-right text-dark-text">{table.rows.reduce((s, r) => s + r.blank, 0).toLocaleString()}</td>
                            </>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
```

- [ ] **Step 4: Start the dev server and visually verify**

Run:
```bash
DEMO_MODE=true npm run dev
```
Then open `http://localhost:3000/test-monitor/coverage` (or the Vite dev port shown in the terminal) in a browser and confirm:
- The subtitle shows "Data as of 2026-07-28 (manual snapshot)".
- "Coverage by Area" shows 4 cards: Portal, AWS, Reporting, Proxy — AWS shows "Coverage: N/A" with no progress bar.
- "Repositories by Area" shows 4 real `<table>`s: Portal with 31 rows + TOTAL, AWS/Reporting/Proxy each with Files/Code/Comment/Blank columns + TOTAL row.
- No console errors in the browser dev tools.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/ui/pages/CoverageMetrics.jsx
git commit -m "feat(coverage-ui): add AWS area and real per-area tables to Coverage Metrics page"
```

---

## Task 4: Deploy to `test-monitor.infra-dev.forcepoint.net`

**Files:** none (deployment only — no further code changes)

**Interfaces:** none — this task ships Tasks 1-3's files to the host already running the server (see prior session: process runs via `node server.js`, backgrounded with `nohup`, on `/home/cloud-user/Project/test-monitor`).

- [ ] **Step 1: Copy the three changed/new files to the host**

From your local machine:
```bash
scp src/data/loc-report.json cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/data/loc-report.json
scp src/api/coverage.js cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/api/coverage.js
scp src/ui/pages/CoverageMetrics.jsx cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/ui/pages/CoverageMetrics.jsx
```
(If `src/data/` doesn't exist yet on the host, run `ssh cloud-user@test-monitor.infra-dev.forcepoint.net "mkdir -p /home/cloud-user/Project/test-monitor/src/data"` first.)

- [ ] **Step 2: Rebuild the frontend on the host**

The React UI is a Vite build served as static files — `CoverageMetrics.jsx` changes need a rebuild to take effect:
```bash
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "cd /home/cloud-user/Project/test-monitor && npm run build"
```

- [ ] **Step 3: Restart the backend**

```bash
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "cd /home/cloud-user/Project/test-monitor && pkill -f 'node server.js'; sleep 1; nohup node server.js > logs/server.log 2>&1 & disown"
```

- [ ] **Step 4: Verify externally**

```bash
curl -sk https://test-monitor.infra-dev.forcepoint.net/test-monitor/api/coverage-metrics | python3 -m json.tool | head -30
```
Expected: `200 OK` JSON body (not the 503 from before) with `"generatedDate": "2026-07-28"` and a `byArea.aws` key present. Then open `https://test-monitor.infra-dev.forcepoint.net/test-monitor/coverage` in a browser and confirm the same things checked in Task 3 Step 4.

---
Generated by Forcepoint Intelligence Platform using Claude Sonnet 5
