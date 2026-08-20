# AWS Tests Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new Jenkins-backed test cards ("AWS System Test", "AWS Control Test") to the Portal group on the Dashboard, using real Jenkins test-report data.

**Architecture:** A new `src/api/aws-tests.js` module fetches each Jenkins job's real test report (reusing `reporting.js`'s proven `extractAreasFromSuites`/`getDefaultReportingStats` helpers, now exported), wired into `dashboard.js`'s existing `Promise.allSettled` aggregation. The frontend needs no new rendering code: `Section.jsx` already has a branch (lines 807-1092) built for exactly this `reporting.js`-shaped data (`buildNumber`, `areas`, `statusMessage`) — we extend its `sectionKey` allowlist and add two portal-link blocks, following the exact pattern already used for `csgServiceReporting`/`etlSIEM`/etc.

**Tech Stack:** Node.js (ESM), axios, Express, React, Jest (`jest.unstable_mockModule` for ESM-native axios mocking — this project runs Jest under `--experimental-vm-modules`, see `package.json`'s `test` script).

## Global Constraints

- Job paths (exact, hardcoded — matching how `reporting.js` hardcodes `jobPath` for its own jobs rather than sourcing from config):
  - AWS System Test: `/job/GHE-CPT-DEV/job/web-security-system-test/job/master/`
  - AWS Control Test: `/job/GHE-CPT-DEV/job/web-security-control/job/master/`
- Both use `config.reportingJenkins.{baseUrl, username, apiToken}` for auth (same Jenkins host as the Reporting group, `jenkins.cicd.cloud.fpdev.io`) — NOT `config.jenkins` (a different host, `jenkins.infra-dev.forcepoint.net`, wrong credentials for these URLs).
- Two separate cards, not combined — explicit design decision, do not sum the two jobs into one section.
- Cards go directly into the existing Portal grid (5 cards total: Selenium, Integration, Smoke, AWS System Test, AWS Control Test) — no new sub-heading/grouping level.
- Real Jenkins test-report data via `extractAreasFromSuites`, not `jenkins.js`'s fake/synthetic percentage-based area generation.
- `tests/api/jenkins.test.js` is dead/broken code (imports a `JenkinsClient` class that does not exist in `jenkins.js` — confirmed by reading the actual file). Do not use it as a style reference for the new test file; use `tests/api/coverage.test.js`'s working Jest style instead.

---

## Task 1: `aws-tests.js` fetchers with real Jenkins data (TDD)

**Files:**
- Create: `src/api/aws-tests.js`
- Modify: `src/api/reporting.js:367` (export `extractAreasFromSuites`), `src/api/reporting.js:754` (export `getDefaultReportingStats`)
- Test: `tests/api/aws-tests.test.js`

**Interfaces:**
- Consumes: `reporting.js`'s `extractAreasFromSuites(suites: Array) => Array<{name, total, failed, stale, tests}>` and `getDefaultReportingStats() => {name, buildNumber, buildUrl, passCount, failCount, skipCount, totalTests, passRate, duration, total, failed, stale, areas}`.
- Produces: `export async function fetchAWSSystemTest(config)` and `export async function fetchAWSControlTest(config)`, each returning:
  ```
  {
    name: string,            // 'AWS System Test' or 'AWS Control Test'
    buildNumber: number|string,
    buildUrl: string,
    passCount: number, failCount: number, skipCount: number,
    totalTests: number, passRate: string, duration: string,
    total: number, failed: number, stale: 0,
    areas: Array<{name, total, failed, stale, tests}>,
    hasTestData: boolean,
    statusMessage?: string   // present only when hasTestData is false
  }
  ```
  Task 2 (`dashboard.js`) imports both by name. Task 3 (`Section.jsx`) reads `buildNumber`/`total`/`failed`/`stale`/`areas`/`statusMessage` from whichever section key holds this shape — already true today for the sibling `reporting.js` fetchers.

- [ ] **Step 1: Export the two helpers `aws-tests.js` needs**

In `src/api/reporting.js`, change line 367 from:
```js
function extractAreasFromSuites(suites) {
```
to:
```js
export function extractAreasFromSuites(suites) {
```

And change line 754 from:
```js
function getDefaultReportingStats() {
```
to:
```js
export function getDefaultReportingStats() {
```

- [ ] **Step 2: Write the failing tests**

Create `tests/api/aws-tests.test.js`:

```js
import { jest } from '@jest/globals';

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { get: mockGet }
}));

const { fetchAWSSystemTest, fetchAWSControlTest } = await import('../../src/api/aws-tests.js');

const config = {
  reportingJenkins: {
    baseUrl: 'https://jenkins.cicd.cloud.fpdev.io',
    username: 'testuser',
    apiToken: 'test-token'
  }
};

const mockJobInfo = {
  lastSuccessfulBuild: { number: 42, url: 'https://jenkins.cicd.cloud.fpdev.io/job/x/42/' }
};

const mockTestReport = {
  passCount: 18,
  failCount: 2,
  skipCount: 0,
  duration: 123.45,
  suites: [
    {
      name: 'com.example.web.LoginTest',
      cases: [
        { name: 'testLoginSuccess', status: 'PASSED' },
        { name: 'testLoginFailure', status: 'FAILED', errorDetails: 'assertion failed' }
      ]
    }
  ]
};

describe('fetchAWSSystemTest', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  test('returns real total/failed/areas from a successful build', async () => {
    mockGet
      .mockResolvedValueOnce({ data: mockJobInfo })
      .mockResolvedValueOnce({ data: mockTestReport });

    const result = await fetchAWSSystemTest(config);

    expect(result.name).toBe('AWS System Test');
    expect(result.buildNumber).toBe(42);
    expect(result.total).toBe(20);
    expect(result.failed).toBe(2);
    expect(result.stale).toBe(0);
    expect(result.hasTestData).toBe(true);
    expect(result.areas).toHaveLength(1);
    expect(result.areas[0].name).toBe('LoginTest');
    expect(result.areas[0].total).toBe(2);
    expect(result.areas[0].failed).toBe(1);
    expect(result.areas[0].tests).toHaveLength(2);

    // Verify it hit the correct job path and host
    expect(mockGet).toHaveBeenCalledWith(
      'https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-system-test/job/master/api/json',
      expect.objectContaining({ auth: { username: 'testuser', password: 'test-token' } })
    );
  });

  test('returns hasTestData false with a statusMessage when there is no successful build', async () => {
    mockGet.mockResolvedValueOnce({
      data: { builds: [{ number: 10 }, { number: 9 }], firstBuild: { number: 5 }, lastBuild: { number: 10 } }
    });

    const result = await fetchAWSSystemTest(config);

    expect(result.hasTestData).toBe(false);
    expect(result.total).toBe(0);
    expect(result.failed).toBe(0);
    expect(typeof result.statusMessage).toBe('string');
    expect(result.statusMessage).toMatch(/failed/i);
  });

  test('falls back to default stats on a network error', async () => {
    mockGet.mockRejectedValueOnce(new Error('connect ETIMEDOUT'));

    const result = await fetchAWSSystemTest(config);

    expect(result.total).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.areas).toEqual([]);
  });
});

describe('fetchAWSControlTest', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  test('returns real total/failed/areas from a successful build', async () => {
    mockGet
      .mockResolvedValueOnce({ data: mockJobInfo })
      .mockResolvedValueOnce({ data: mockTestReport });

    const result = await fetchAWSControlTest(config);

    expect(result.name).toBe('AWS Control Test');
    expect(result.total).toBe(20);
    expect(result.failed).toBe(2);

    expect(mockGet).toHaveBeenCalledWith(
      'https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-control/job/master/api/json',
      expect.objectContaining({ auth: { username: 'testuser', password: 'test-token' } })
    );
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --experimental-vm-modules node_modules/jest/bin/jest.js tests/api/aws-tests.test.js`
Expected: FAIL — `Cannot find module '../../src/api/aws-tests.js'` (the file doesn't exist yet).

- [ ] **Step 4: Create `src/api/aws-tests.js`**

```js
import axios from 'axios';
import https from 'https';
import { log, error } from '../server/logger.js';
import { extractAreasFromSuites, getDefaultReportingStats } from './reporting.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchJenkinsJobTestResults(config, jobPath, displayName) {
  try {
    const baseUrl = config.reportingJenkins?.baseUrl || 'https://jenkins.cicd.cloud.fpdev.io';
    const username = config.reportingJenkins?.username || 'mgujar';
    const apiToken = config.reportingJenkins?.apiToken || config.jenkins?.apiToken;

    if (!apiToken) {
      return getDefaultReportingStats();
    }

    // Get job info
    const jobUrl = `${baseUrl}${jobPath}api/json`;
    const jobResponse = await axios.get(jobUrl, {
      auth: { username, password: apiToken },
      timeout: 10000,
      httpsAgent: httpsAgent
    });

    if (!jobResponse.data.lastSuccessfulBuild) {
      const builds = jobResponse.data.builds || [];
      const firstBuild = jobResponse.data.firstBuild?.number;
      const lastBuild = jobResponse.data.lastBuild?.number;
      const failedCount = Math.min(6, builds.length);

      return {
        name: displayName,
        buildNumber: lastBuild,
        buildUrl: jobResponse.data.lastBuild?.url || '',
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        totalTests: 0,
        passRate: '0.00',
        duration: '0',
        total: 0,
        failed: 0,
        stale: 0,
        areas: [],
        statusMessage: `⚠️ Last ${failedCount} builds failed (builds ${firstBuild}-${lastBuild})`,
        hasTestData: false
      };
    }

    const lastBuild = jobResponse.data.lastSuccessfulBuild || jobResponse.data.lastCompletedBuild || jobResponse.data.lastBuild;
    if (!lastBuild) return getDefaultReportingStats();

    // Get test report
    let testReport = { passCount: 0, failCount: 0, skipCount: 0, duration: 0, suites: [] };
    try {
      const testReportUrl = `${baseUrl}${jobPath}${lastBuild.number}/testReport/api/json`;
      const testReportResponse = await axios.get(testReportUrl, {
        auth: { username, password: apiToken },
        timeout: 15000,
        httpsAgent: httpsAgent
      });
      testReport = testReportResponse.data;
    } catch (e) {
      log(`[AWS Tests] ${displayName}: No test report available`);
    }

    const total = (testReport.passCount || 0) + (testReport.failCount || 0) + (testReport.skipCount || 0);
    const passRate = total > 0 ? ((testReport.passCount / total) * 100).toFixed(2) : 0;
    const areas = extractAreasFromSuites(testReport.suites || []);

    log(`[AWS Tests] ${displayName}: Build`, lastBuild.number, 'Pass:', testReport.passCount, 'Fail:', testReport.failCount);

    return {
      name: displayName,
      buildNumber: lastBuild.number,
      buildUrl: lastBuild.url,
      passCount: testReport.passCount || 0,
      failCount: testReport.failCount || 0,
      skipCount: testReport.skipCount || 0,
      totalTests: total,
      passRate: passRate,
      duration: (testReport.duration || 0).toFixed(2),
      total: total,
      failed: testReport.failCount || 0,
      stale: 0,
      areas: areas,
      hasTestData: true
    };
  } catch (e) {
    error(`[AWS Tests] Error fetching ${displayName}:`, e.message);
    return getDefaultReportingStats();
  }
}

export async function fetchAWSSystemTest(config) {
  return fetchJenkinsJobTestResults(config, '/job/GHE-CPT-DEV/job/web-security-system-test/job/master/', 'AWS System Test');
}

export async function fetchAWSControlTest(config) {
  return fetchJenkinsJobTestResults(config, '/job/GHE-CPT-DEV/job/web-security-control/job/master/', 'AWS Control Test');
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --experimental-vm-modules node_modules/jest/bin/jest.js tests/api/aws-tests.test.js`
Expected: PASS — all 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/api/aws-tests.js src/api/reporting.js tests/api/aws-tests.test.js
git commit -m "feat(aws-tests): add real-data Jenkins fetchers for AWS System/Control Test"
```

---

## Task 2: Wire fetchers into `dashboard.js` aggregation

**Files:**
- Modify: `src/api/dashboard.js`

**Interfaces:**
- Consumes: `fetchAWSSystemTest(config)`, `fetchAWSControlTest(config)` from Task 1 — both return the shape documented in Task 1's Interfaces block.
- Produces: `results.sections.awsSystemTest` and `results.sections.awsControl`, each holding that same shape. Task 3 (frontend) reads these two keys.

- [ ] **Step 1: Add the import**

In `src/api/dashboard.js:5`, change:
```js
import { fetchCSGServiceReporting, fetchCSTOREReporting, fetchETLSIEM, fetchETLSIEMClusterTest, fetchReportingMetrics, fetchPRXAutoTest } from './reporting.js';
```
to:
```js
import { fetchCSGServiceReporting, fetchCSTOREReporting, fetchETLSIEM, fetchETLSIEMClusterTest, fetchReportingMetrics, fetchPRXAutoTest } from './reporting.js';
import { fetchAWSSystemTest, fetchAWSControlTest } from './aws-tests.js';
```

- [ ] **Step 2: Add default section shapes**

In `src/api/dashboard.js`, in the `results.sections` object (around line 26, right after `prxAutoTest: {}`), add:
```js
      prxAutoTest: {},
      awsSystemTest: {},
      awsControl: {}
```
(replacing the existing `prxAutoTest: {}` line with these three lines).

- [ ] **Step 3: Add the fetch calls**

In `src/api/dashboard.js:41-54`, change:
```js
    const [readyCluster, selenium, integration, smoke, newTests, csgServiceReporting, cstoreReporting, etlSIEM, etlSIEMCluster, reportingMetrics, prxAutoTest, recentChanges] = await Promise.allSettled([
      fetchReadyClusterTests(config),
      fetchSeleniumTests(config.selenium.portalUrl),
      fetchIntegrationTests(config),
      fetchSmokeTests(config),
      fetchNewTestsAdded(config),
      fetchCSGServiceReporting(config),
      fetchCSTOREReporting(config),
      fetchETLSIEM(config),
      fetchETLSIEMClusterTest(config),
      fetchReportingMetrics(config),
      fetchPRXAutoTest(config),
      fetchRecentChanges(config)
    ]);
```
to:
```js
    const [readyCluster, selenium, integration, smoke, newTests, csgServiceReporting, cstoreReporting, etlSIEM, etlSIEMCluster, reportingMetrics, prxAutoTest, recentChanges, awsSystemTest, awsControl] = await Promise.allSettled([
      fetchReadyClusterTests(config),
      fetchSeleniumTests(config.selenium.portalUrl),
      fetchIntegrationTests(config),
      fetchSmokeTests(config),
      fetchNewTestsAdded(config),
      fetchCSGServiceReporting(config),
      fetchCSTOREReporting(config),
      fetchETLSIEM(config),
      fetchETLSIEMClusterTest(config),
      fetchReportingMetrics(config),
      fetchPRXAutoTest(config),
      fetchRecentChanges(config),
      fetchAWSSystemTest(config),
      fetchAWSControlTest(config)
    ]);
```

- [ ] **Step 4: Add the result-assignment blocks**

In `src/api/dashboard.js`, right after the existing `prxAutoTest` block (currently lines 125-129):
```js
    if (prxAutoTest.status === 'fulfilled') {
      results.sections.prxAutoTest = prxAutoTest.value;
    } else {
      error('PRX Auto Test fetch failed:', prxAutoTest.reason);
    }
```
add:
```js

    if (awsSystemTest.status === 'fulfilled') {
      results.sections.awsSystemTest = awsSystemTest.value;
    } else {
      error('AWS System Test fetch failed:', awsSystemTest.reason);
    }

    if (awsControl.status === 'fulfilled') {
      results.sections.awsControl = awsControl.value;
    } else {
      error('AWS Control Test fetch failed:', awsControl.reason);
    }
```

- [ ] **Step 5: Verify the wiring with a syntax and smoke check**

Run:
```bash
node --check src/api/dashboard.js
```
Expected: no output (valid syntax).

Then run the full existing coverage test suite to confirm nothing broke from the reporting.js export changes in Task 1:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/api/
```
Expected: `tests/api/coverage.test.js` and `tests/api/aws-tests.test.js` both pass (the pre-existing `tests/api/jenkins.test.js` is dead code per Global Constraints — if Jest reports it failing to import `JenkinsClient`, that is a pre-existing condition, not something this task introduced; confirm by checking the failure is specifically about `JenkinsClient`, not about anything in `dashboard.js`, `reporting.js`, or `aws-tests.js`).

- [ ] **Step 6: Commit**

```bash
git add src/api/dashboard.js
git commit -m "feat(aws-tests): wire AWS System/Control Test fetchers into dashboard aggregation"
```

---

## Task 3: Render the two new cards on the Dashboard

**Files:**
- Modify: `src/ui/pages/Dashboard.jsx:8-28`
- Modify: `src/ui/components/Section.jsx:808`, `src/ui/components/Section.jsx:859-919`

**Interfaces:**
- Consumes: `results.sections.awsSystemTest` / `results.sections.awsControl` from Task 2, shaped as documented in Task 1.

- [ ] **Step 1: Add section titles**

In `src/ui/pages/Dashboard.jsx`, change lines 8-20 from:
```js
const SECTION_TITLES = {
  readyCluster: 'Ready Cluster Status',
  selenium: 'Selenium Tests',
  integrationTests: 'Integration Tests',
  smokeTests: 'Smoke Tests',
  newTestsAdded: 'New Tests Added (Yearly)',
  prxAutoTest: 'PRX Auto Test',
  csgServiceReporting: 'CSG Service Reporting',
  cstoreReporting: 'CSTORE Reporting Test',
  etlSIEM: 'ETL SIEM',
  etlSIEMCluster: 'ETL SIEM Cluster Test',
  reportingMetrics: 'Reporting Metrics'
};
```
to:
```js
const SECTION_TITLES = {
  readyCluster: 'Ready Cluster Status',
  selenium: 'Selenium Tests',
  integrationTests: 'Integration Tests',
  smokeTests: 'Smoke Tests',
  newTestsAdded: 'New Tests Added (Yearly)',
  prxAutoTest: 'PRX Auto Test',
  csgServiceReporting: 'CSG Service Reporting',
  cstoreReporting: 'CSTORE Reporting Test',
  etlSIEM: 'ETL SIEM',
  etlSIEMCluster: 'ETL SIEM Cluster Test',
  reportingMetrics: 'Reporting Metrics',
  awsSystemTest: 'AWS System Test',
  awsControl: 'AWS Control Test'
};
```

- [ ] **Step 2: Add the two cards to the Portal group**

In `src/ui/pages/Dashboard.jsx`, change lines 23-29 from:
```js
  portal: {
    title: 'Portal',
    sections: [
      ['selenium', 'Selenium Tests'],
      ['integrationTests', 'Integration Tests'],
      ['smokeTests', 'Smoke Tests']
    ]
  },
```
to:
```js
  portal: {
    title: 'Portal',
    sections: [
      ['selenium', 'Selenium Tests'],
      ['integrationTests', 'Integration Tests'],
      ['smokeTests', 'Smoke Tests'],
      ['awsSystemTest', 'AWS System Test'],
      ['awsControl', 'AWS Control Test']
    ]
  },
```

- [ ] **Step 3: Extend `Section.jsx`'s reporting-style branch to include the two new section keys**

In `src/ui/components/Section.jsx:808`, change:
```js
  if (['csgServiceReporting', 'cstoreReporting', 'etlSIEM', 'etlSIEMCluster', 'prxAutoTest'].includes(sectionKey) && data?.buildNumber) {
```
to:
```js
  if (['csgServiceReporting', 'cstoreReporting', 'etlSIEM', 'etlSIEMCluster', 'prxAutoTest', 'awsSystemTest', 'awsControl'].includes(sectionKey) && data?.buildNumber) {
```

- [ ] **Step 4: Add the two portal-link blocks**

In `src/ui/components/Section.jsx`, right after the existing `prxAutoTest` link block (currently lines 908-919):
```js
          {sectionKey === 'prxAutoTest' && (
            <div className="flex justify-end mb-4">
              <a
                href="https://jenkins.infra-dev.forcepoint.net/job/Projects/job/Test/job/PrxAutotests/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Click here for more details →
              </a>
            </div>
          )}
```
add:
```js

          {sectionKey === 'awsSystemTest' && (
            <div className="flex justify-end mb-4">
              <a
                href="https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-system-test/job/master/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Click here for more details →
              </a>
            </div>
          )}
          {sectionKey === 'awsControl' && (
            <div className="flex justify-end mb-4">
              <a
                href="https://jenkins.cicd.cloud.fpdev.io/job/GHE-CPT-DEV/job/web-security-control/job/master/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Click here for more details →
              </a>
            </div>
          )}
```

- [ ] **Step 5: Build check**

Run:
```bash
npm run build
```
Expected: `vite build` completes with no errors (this catches JSX syntax mistakes; it does not verify runtime data-shape correctness).

- [ ] **Step 6: Manual verification checklist (browser, once deployed — see Task 4)**

- Portal group shows 5 cards: Selenium Tests, Integration Tests, Smoke Tests, AWS System Test, AWS Control Test.
- Each new card shows a Total/Failed/Passed/Stale metric grid with real numbers (not all zeros, assuming the Jenkins jobs have a successful build).
- Each new card's "Click here for more details →" link opens the correct Jenkins job URL.
- Clicking a metric box expands real per-suite areas (e.g., Jenkins test class names, not fabricated names like `test_area_pass_1.py`).
- If either Jenkins job has no successful build, its card shows the yellow "⚠️ Last N builds failed..." banner instead of misleading zeros.

- [ ] **Step 7: Commit**

```bash
git add src/ui/pages/Dashboard.jsx src/ui/components/Section.jsx
git commit -m "feat(aws-tests): render AWS System/Control Test cards in the Portal group"
```

---

## Task 4: Deploy to `test-monitor.infra-dev.forcepoint.net`

**Files:** none (deployment only)

**Interfaces:** none — ships Tasks 1-3's files to the host already running the server.

- [ ] **Step 1: Copy the four new/changed files**

```bash
scp src/api/aws-tests.js cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/api/aws-tests.js
scp src/api/reporting.js cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/api/reporting.js
scp src/api/dashboard.js cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/api/dashboard.js
scp src/ui/pages/Dashboard.jsx cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/ui/pages/Dashboard.jsx
scp src/ui/components/Section.jsx cloud-user@test-monitor.infra-dev.forcepoint.net:/home/cloud-user/Project/test-monitor/src/ui/components/Section.jsx
```

- [ ] **Step 2: Rebuild the frontend on the host**

```bash
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "cd /home/cloud-user/Project/test-monitor && npm run build"
```

- [ ] **Step 3: Pre-restart sanity check**

```bash
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "cd /home/cloud-user/Project/test-monitor && node -e \"
Promise.all([
  import('./src/api/aws-tests.js'),
  import('./src/api/dashboard.js')
]).then(([awsTests, dashboard]) => {
  console.log('modules import OK');
  console.log('fetchAWSSystemTest:', typeof awsTests.fetchAWSSystemTest);
  console.log('fetchAWSControlTest:', typeof awsTests.fetchAWSControlTest);
  console.log('aggregateDashboardData:', typeof dashboard.aggregateDashboardData);
}).catch(e => { console.error('FAIL:', e.message); process.exit(1); })
\""
```
Expected: `modules import OK` plus all three `typeof` lines printing `function`.

- [ ] **Step 4: Restart the backend**

(Do not use `disown` — this session found it fails under a one-shot non-interactive SSH command with no job control.)
```bash
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "cd /home/cloud-user/Project/test-monitor && pkill -f 'node server.js'; sleep 1"
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "cd /home/cloud-user/Project/test-monitor && nohup node server.js < /dev/null > logs/server.log 2>&1 &"
```
This second command may hang without returning (a known quirk of `nohup`+SSH in this environment) — if so, verify independently rather than waiting on it:
```bash
ssh cloud-user@test-monitor.infra-dev.forcepoint.net "ps aux | grep '[n]ode server.js'"
```
Expected: one `node server.js` process listed. If the second `ssh` call above is still hanging locally, find and kill it (`ps aux | grep test-monitor.infra-dev.forcepoint.net`), then kill the harmless leftover remote `bash -c` wrapper process (not the `node server.js` process itself).

- [ ] **Step 5: Verify externally**

```bash
curl -sk https://test-monitor.infra-dev.forcepoint.net/test-monitor/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
for key in ['awsSystemTest', 'awsControl']:
    s = d['sections'].get(key, {})
    print(key, '-> total:', s.get('total'), 'failed:', s.get('failed'), 'hasTestData:', s.get('hasTestData'))
"
```
Expected: both keys present with `hasTestData: True` and non-error numbers (or `hasTestData: False` with a `statusMessage`, if that Jenkins job genuinely has no successful build — not a bug in that case).

Then do the Task 3 Step 6 manual browser checklist against the live URL.

---
Generated by Forcepoint Intelligence Platform using Claude Sonnet 5
