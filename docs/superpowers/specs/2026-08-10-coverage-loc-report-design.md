# Coverage Metrics: Static LOC Report Design

**Date:** August 10, 2026
**Author:** Forcepoint Intelligence Platform
**Status:** Design Approved
**Goal:** Replace the broken live-cloc measurement path behind `/api/coverage-metrics` with a curated, static LOC dataset (`csg_service_loc.html`), rendered as real tables with a 4-area logical distribution (Portal, AWS, Reporting, Proxy).

---

## 1. Background

`src/api/coverage.js` shells out to `cloc` directly against raw Perforce depot paths (`//code_SaaS/csg_service/`) and bare GitHub Enterprise URLs. `cloc` cannot interpret either input form, so `getPerforceLoC`/`getRepoLoC` always throw, `getCoverageMetrics` always returns `null`, and `/api/coverage-metrics` always responds `503 { "error": "Coverage metrics not available" }`. This is unconditional, not intermittent — confirmed by reading the code, not just observed in production.

Separately, the user has already produced a verified, manually-generated LOC report (`csg_service_loc.html`, sitting untracked at the repo root, identical to a Downloads copy) covering four areas:

| Area | Total LoC | Source |
|---|---|---|
| Portal | 3,657,741 | 31 Perforce subdirectories, mix of SonarQube `ncloc` and `cloc` |
| AWS | 57,466 | 4 GitHub repos |
| Reporting | 1,184,492 | 7 GitHub repos |
| Proxy | 316,684 | 2 sources |
| **Grand Total** | **5,216,383** | |

This design replaces the broken live-measurement path with that dataset.

---

## 2. Data File

**New file:** `src/data/loc-report.json`

Hand-transcribed from `csg_service_loc.html`. Shape:

```json
{
  "generatedDate": "2026-07-28",
  "grandTotalLoC": 5216383,
  "notes": [
    "SonarQube ncloc and cloc code counts both exclude blank lines and comments.",
    "rly and categorization exclude vendored/third-party code (sendmail, KeyView, 7-Zip, etc.).",
    "No local copy of scanned code was retained.",
    "Four SonarQube projects excluded as out-of-scope GitHub-repo scans, not Perforce directories."
  ],
  "areas": {
    "portal": {
      "totalLoC": 3657741,
      "directories": [
        { "name": "csg_service-testing-dev", "loC": 591865, "method": "SonarQube (ncloc)" },
        { "name": "categorization", "loC": 1133366, "method": "cloc" }
      ]
    },
    "aws": {
      "totalLoC": 57466,
      "repos": [
        { "name": "web-security-control", "files": 143, "code": 25485, "comment": 1964, "blank": 4265 }
      ]
    },
    "reporting": {
      "totalLoC": 1184492,
      "repos": [
        { "name": "csg_service-reporting", "files": 7665, "code": 1009615, "comment": 41443, "blank": 69765 }
      ]
    },
    "proxy": {
      "totalLoC": 316684,
      "repos": [
        { "name": "csg_service-prx/proxy", "files": 752, "code": 313870, "comment": 39266, "blank": 36281 }
      ]
    }
  }
}
```

(Full row sets carry over every row from `csg_service_loc.html`'s four tables — abbreviated above for readability.)

---

## 3. Backend Changes (`src/api/coverage.js`)

- **Delete:** `calculateSLOC`, `countLinesInFiles`, `getPerforceLoC`, `getGitHubCSGLoC`, `getRepoLoC`, and the now-unused `execSync`/`fs`/`path` imports.
- **Delete:** the `config.sloc` manual-override branch in `getCoverageMetrics` — superseded by the JSON file.
- **Rewrite `getCoverageMetrics(config, testData)`** to:
  - Import `src/data/loc-report.json` directly (static, no I/O at request time).
  - Compute `coveragePercentage` for `portal`, `reporting`, `proxy` exactly as today: `min(round(testCount / 500000 * 100), 100)`, sourced from `testData`.
  - Set `aws.coveragePercentage = null` — no AWS test-count source exists yet. Structured so that once a `testData.aws` count is available, it drops into the same formula.
  - Preserve the existing response shape (`summary`, `byArea`, `bySource`, `distribution.areaRepos`) so `Object.entries(metrics.distribution.areaRepos)` in the frontend continues to work unchanged, with `aws` added as a fourth key.
  - Add `distribution.areaTables`: the raw per-area row data (`directories` for portal, `repos` with files/code/comment/blank for aws/reporting/proxy) for the frontend's new table rendering.
  - Include `generatedDate` at the top level of the response so the frontend can display "Data as of ...".
- **Net effect:** the function becomes a pure local read + arithmetic transform — no network calls, no subprocesses, cannot 503 for the reasons it does today.

---

## 4. Frontend Changes (`src/ui/pages/CoverageMetrics.jsx`)

- **Header:** subtitle gains `Data as of {generatedDate}` to make clear this is a point-in-time manual snapshot, not a live measurement.
- **"Coverage by Area"** section: hardcoded 3-item array → 4 items (`portal`, `aws`, `reporting`, `proxy`); grid becomes `grid-cols-4`. AWS card renders `Coverage: N/A` and omits the progress bar (since `coveragePercentage` is `null`), rather than showing a misleading `0%`/`NaN%`.
- **"Repositories by Area"** section: replaced with real `<table>` elements per area (not the current 2-column card grid), matching each area's actual columns:
  - Portal: `Directory / Project | LoC (code only) | Method`, all rows + bold TOTAL row, SonarQube/cloc method color-coded as in the source report.
  - AWS / Reporting / Proxy: `Repository | Files | Code | Comment | Blank` + TOTAL row.
- **"Top Languages"** section: unchanged, per explicit decision to keep the existing fabricated-percentage chart as-is.

---

## 5. Error Handling

The backend can no longer fail from network/subprocess issues, so the frontend's existing `error` state now only covers genuine API-unreachable cases. No behavior change needed there.

---

## 6. Testing

No existing test covers `coverage.js` (`tests/api/` currently has only `jenkins.test.js`). Add `tests/api/coverage.test.js` covering:
- Area totals match `loc-report.json`.
- Per-area coverage % math against known `testData` inputs.
- `aws.coveragePercentage` is `null` when no AWS test count is supplied.

Note: `jest` is referenced in `package.json`'s `test` script but is not actually present in this checkout's `node_modules` (pre-existing environment gap, unrelated to this change) — tests can be written but not run until `npm install` resolves it.

---

## 7. Rollout

Uncommitted local change (per prior decision to skip the branch/Jira-ticket flow for now). Deploy by copying `coverage.js`, `CoverageMetrics.jsx`, and the new `loc-report.json` to `test-monitor.infra-dev.forcepoint.net` and restarting `server.js`, consistent with the manual restart process already established for this host.

---
Generated by Forcepoint Intelligence Platform using Claude Sonnet 5
