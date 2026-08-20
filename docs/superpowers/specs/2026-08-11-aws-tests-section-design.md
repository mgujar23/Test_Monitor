# AWS Tests Section Design

**Date:** August 11, 2026
**Author:** Forcepoint Intelligence Platform
**Status:** Design Approved
**Goal:** Add two new test-result cards ("AWS System Test", "AWS Control Test") to the Portal group on the main Dashboard, backed by real data from two Jenkins jobs on `jenkins.cicd.cloud.fpdev.io`.

---

## 1. Background

The user asked to add an "AWS Tests" section to the Portal group, backed by two Jenkins jobs:
- `https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-system-test/job/master/`
- `https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-control/job/master/`

Both jobs live on the same Jenkins host (`jenkins.cicd.cloud.fpdev.io`) already used by this app's Reporting-group fetchers (`src/api/reporting.js`, via `config.reportingJenkins` credentials) — a *different* Jenkins host than `src/api/jenkins.js`'s `config.jenkins` (`jenkins.infra-dev.forcepoint.net`), used by the existing Selenium/Integration/Smoke Portal-group sections.

Decisions made during brainstorming:
- **Two separate cards**, not one combined card — matches how the Reporting group already shows 4 separate cards for 4 distinct jobs, rather than Integration Tests' pattern of summing multiple Jenkins sub-jobs into one card.
- **Real Jenkins test-report data**, not the fake/synthetic percentage-based area generation `jenkins.js` uses for Integration/Smoke Tests. `reporting.js` already does this correctly via `extractAreasFromSuites()`, which turns Jenkins' real `testReport.suites` into per-class/per-test breakdowns.
- **Flat grid placement** — the two new cards go directly into the existing Portal grid (which currently holds Selenium Tests, Integration Tests, Smoke Tests), growing it to 5 cards. No new sub-heading/grouping level is introduced.

---

## 2. Backend: `src/api/aws-tests.js` (new file)

Two exported functions, each modeled directly on `reporting.js`'s `fetchCSGServiceReporting`:

```js
export async function fetchAWSSystemTest(config) { ... }
export async function fetchAWSControlTest(config) { ... }
```

For each:
- Auth: `config.reportingJenkins.{baseUrl, username, apiToken}` (falls back to `config.jenkins?.apiToken` if `reportingJenkins.apiToken` is absent, matching the existing `apiToken || config.jenkins?.apiToken` fallback pattern already used throughout `reporting.js`).
- Job paths (hardcoded, matching how `reporting.js` hardcodes `jobPath` for ETL SIEM / CSTORE / PRX rather than sourcing them from config):
  - System Test: `/job/GHE-CPT-DEV/job/web-security-system-test/job/master/`
  - Control Test: `/job/GHE-CPT-DEV/job/web-security-control/job/master/`
- Flow: fetch job info (`api/json`) → resolve `lastSuccessfulBuild || lastCompletedBuild || lastBuild` → if no successful build exists, return the `statusMessage`/`hasTestData: false` shape (matching `fetchCSTOREReporting`'s and `fetchETLSIEMClusterTest`'s existing fallback pattern) → otherwise fetch `{buildNumber}/testReport/api/json` → compute `total`/`failed`/`stale: 0` → call `extractAreasFromSuites(testReport.suites || [])` for the real per-test breakdown.
- Return shape (matches every other `reporting.js` fetcher exactly):
  ```js
  {
    name: 'AWS System Test', // or 'AWS Control Test'
    buildNumber, buildUrl,
    passCount, failCount, skipCount, totalTests, passRate, duration,
    total, failed, stale: 0,
    areas, // from extractAreasFromSuites
    hasTestData: true // or false + statusMessage, on the no-successful-build path
  }
  ```
- On any thrown error: return the existing `getDefaultReportingStats()` shape (imported from `reporting.js`), same as every other fetcher in that file.

**`src/api/reporting.js`**: export `extractAreasFromSuites` (currently a private function) so `aws-tests.js` can import and reuse it without duplication. No behavior change to `reporting.js` itself.

**`src/api/dashboard.js`**:
- Import `fetchAWSSystemTest, fetchAWSControlTest` from `./aws-tests.js`.
- Add `awsSystemTest: {}` and `awsControl: {}` to the initial `results.sections` object (matching `prxAutoTest: {}`'s empty-object default).
- Add both calls to the `Promise.allSettled([...])` array.
- Add two `if (status === 'fulfilled') { results.sections.X = value } else { error(...) }` blocks, matching the existing `prxAutoTest` handling exactly (no `aggregateSectionData()` wrapping — `reporting.js`-style fetchers are assigned directly, same as `csgServiceReporting`/`cstoreReporting`/etc already are).

---

## 3. Frontend

**`src/ui/pages/Dashboard.jsx`**:
- `SECTION_TITLES`: add `awsSystemTest: 'AWS System Test'`, `awsControl: 'AWS Control Test'`.
- `SECTION_GROUPS.portal.sections`: append `['awsSystemTest', 'AWS System Test']`, `['awsControl', 'AWS Control Test']` — Portal's `grid-cols-1 xl:grid-cols-2` grid (already responsive, per today's earlier layout fix) now renders 5 cards instead of 3.

**`src/ui/components/Section.jsx`**:
- Add `'awsSystemTest'` and `'awsControl'` to the `['selenium', 'integrationTests', 'smokeTests'].includes(sectionKey)` condition, so both render through the existing test-section UI path (header + pass %, the 4-box Total/Failed/Passed/Stale metric grid, click-to-expand area/test table). `Stale` always shows `0` for these, same as Integration/Smoke today (Jenkins has no staleness concept).
- Add two more `sectionKey === 'awsSystemTest'` / `sectionKey === 'awsControl'` blocks for the "Click here for more details →" links, pointing at the two exact Jenkins URLs given.
- New: a small conditional banner for `hasTestData === false` (rendering `data.statusMessage`), styled like the existing yellow warning box already used elsewhere in the codebase for ETL SIEM Cluster Test's failed-builds case — today's test-section branch has no path for this at all, since Integration/Smoke Tests (jenkins.js-backed) never produce that shape. Without this, a broken AWS job would silently render as all-zeros instead of showing why.

---

## 4. Testing

New `tests/api/aws-tests.test.js` covering, for each of the two functions:
- Successful fetch with a populated `testReport.suites` → correct `total`/`failed`/`areas` mapping (verifying `extractAreasFromSuites` integration, not just that a number came back).
- No `lastSuccessfulBuild` → `hasTestData: false` + `statusMessage` present, `total`/`failed` are `0`.

Mocking `axios.get` the same way `tests/api/jenkins.test.js` already does for `fetchReadyClusterTests`, so this follows the established test style in this repo rather than introducing a new one.

---

## 5. Non-goals

- Not touching `jenkins.js`'s existing fake-data generation for Integration/Smoke Tests — out of scope, not requested.
- Not adding a new "AWS Tests" heading/grouping level — explicit choice to keep Portal's grid flat.
- Not combining the two jobs into one card — explicit choice to keep them separate, mirroring the Reporting group.

---
Generated by Forcepoint Intelligence Platform using Claude Sonnet 5
