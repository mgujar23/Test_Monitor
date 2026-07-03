# Test Monitor Dashboard Design

**Date:** 2026-07-02  
**Author:** Minal Gujar  
**Status:** Approved

---

## 1. Overview

A standalone professional web-based test monitoring dashboard for tracking test health across multiple testing systems (Jenkins, Selenium, Git). The dashboard displays real-time aggregated metrics from:
- Ready Cluster status (Jenkins)
- Selenium test results
- Integration tests (Jenkins)
- Smoke tests (Jenkins)
- New test cases added (Git history, yearly breakdown)

Users can drill into failed/stale tests to view detailed failure analysis including recent code changes and manually-curated fix suggestions.

---

## 2. Architecture

### 2.1 Tech Stack
- **Frontend:** React with Tailwind CSS (black theme)
- **Backend:** Node.js + Express.js
- **Storage:** JSON file-based (config, cache, manual fixes)
- **Refresh Mechanism:** Node.js background job (every 15 minutes)
- **Deployment:** Single application (npm start or Docker container)
- **Authentication:** None (open access)

### 2.2 High-Level Flow
```
Browser → React UI → GET /api/dashboard → Express API
                                              ↓
                                         Returns cached data
                                         from dashboard-data.json
                                              ↓
Every 15 minutes:
  Express background job fetches from Jenkins, Selenium, Git APIs
  → Parses test reports and commits
  → Aggregates into dashboard format
  → Writes to cache/dashboard-data.json
  → Frontend detects update, refreshes UI
```

---

## 3. Frontend Design

### 3.1 Layout Structure
- **Header:** Title "Test Monitor" + Last Updated timestamp + Manual Refresh button
- **Main Content:** 5 horizontal collapsable sections (cards with expand/collapse)
  1. Ready Cluster Status
  2. Selenium Tests
  3. Integration Tests
  4. Smoke Tests
  5. New Tests Added (Yearly)

### 3.2 Section Structure (Collapsed View)
Each section displays summary stats in a single row:
```
▼ Ready Cluster Status          [Last updated: 2 mins ago]
  Total: 240 | Failed: 12 | Stale: 3 | Areas: 8
```

### 3.3 Expanded View
When a section expands, show detailed breakdown by area:
```
▼ Ready Cluster Status
  Total: 240 | Failed: 12 | Stale: 3 | Areas: 8
  
  [Area 1: API Tests]        Total: 30 | Failed: 2 | Stale: 0
  [Area 2: UI Tests]         Total: 35 | Failed: 5 | Stale: 1
  [Area 3: Database Tests]   Total: 25 | Failed: 0 | Stale: 2
  ... (more areas)
```

### 3.4 Clickable Metrics
- **Failed, Stale, Area names:** All clickable
- Opens modal/drawer with detailed information
- Modal shows:
  - Test filename
  - Last passed timestamp
  - Recent changes (from git blame)
  - Suggested fix (from manual fixes.json)
  - Link to Jenkins test report
  - List of similar failures (if multiple)

### 3.5 Color Scheme (Black Theme)
- **Background:** Dark gray/charcoal (#1a1a1a)
- **Card Background:** Slightly lighter (#2a2a2a)
- **Text:** Light gray (#e0e0e0)
- **Section Headers:** White (#ffffff)
- **Failed Tests:** Red accent (#ff6b6b)
- **Stale Tests:** Yellow accent (#ffd93d)
- **Passed/Healthy:** Green accent (#6bcf7f)
- **Hover/Active:** Slightly brighter shade of accent color

### 3.6 Responsive Design
- Desktop-first (1200px+)
- Collapsable sections stack on tablet/mobile
- Touch-friendly on mobile (larger tap targets)

---

## 4. Backend Design

### 4.1 Express API Endpoints
- `GET /api/dashboard` — Returns full dashboard data (cached)
- `GET /api/failed-tests/:section` — Returns detailed failures for section (Ready, Selenium, Integration, Smoke)
- `POST /api/refresh` — Trigger manual refresh immediately
- `GET /api/health` — Returns health status, last refresh time, next refresh time
- `GET /api/test-details/:testId` — Returns full details for a specific test (file, recent changes, fixes)

### 4.2 Background Refresh Job (Every 15 Minutes)
1. **Ready Cluster:** Fetch from Jenkins `/api/json` endpoint
   - Extract job status, build history, test results
   - Parse test report (XML/JSON) for pass/fail counts
   - Group by area/test suite

2. **Selenium Tests:** Fetch from Selenium portal or parse results URL
   - Parse test results page
   - Extract: total, passed, failed, test names
   - Identify stale tests (no runs in 30+ days)

3. **Integration Tests:** Fetch from Jenkins job
   - Parse test report, extract results by area
   - Calculate failure rate, stale test count

4. **Smoke Tests:** Fetch from Jenkins job
   - Same as Integration Tests

5. **New Tests Added:** Query git repository
   - Fetch all commits on the specified branch for the past year
   - Detect new test files (patterns: `*_test.py`, `*Test.java`, `*Test.js`, `*.test.ts`)
   - Group by month, sum per month to show yearly breakdown

6. **Aggregate & Cache**
   - Combine all data into single JSON object
   - Write to `cache/dashboard-data.json` with timestamp
   - Load `fixes.json` and merge into response
   - Log refresh completion and any errors

### 4.3 Error Handling & Graceful Degradation
- **API Timeouts:** 10-second timeout per external API call, retry once
- **Jenkins Unavailable:** Show cached data + banner "Jenkins unavailable"
- **Git Repo Unreachable:** Skip "New Tests Added" section, log error
- **Selenium Portal Fails:** Show last known data + "Data may be stale" warning
- **Missing Config:** Exit with helpful error message at startup

### 4.4 Logging
- Log all refresh cycles (start time, end time, duration)
- Log API failures with timestamp and error details
- Log when test count exceeds thresholds (e.g., >500 failures)
- Write logs to `logs/` directory or stdout (for Docker)

---

## 5. Data Storage & Configuration

### 5.1 Configuration File (`config.json`)
```json
{
  "jenkins": {
    "baseUrl": "https://jenkins.infra-dev.forcepoint.net",
    "apiToken": "***",
    "jobs": {
      "readyCluster": "/job/Projects/job/Test/job/ReadyCluster/",
      "integrationTests": "/job/Projects/job/Test/job/IntegrationTests/",
      "smokeTests": "/job/Projects/job/Test/job/SmokeTest/"
    }
  },
  "selenium": {
    "portalUrl": "https://cluster-c30.dev-rd.forcepoint.net/selenium/portal_results/"
  },
  "git": {
    "repoPath": "/path/to/code_SaaS/csg_service/portal_ui",
    "branch": "dev/portal",
    "testFilePatterns": ["*_test.py", "*Test.java", "*Test.js", "*.test.ts"],
    "apiToken": "***"
  },
  "app": {
    "port": 3000,
    "refreshIntervalMinutes": 15,
    "staledaysThreshold": 30
  }
}
```

### 5.2 Manual Fixes File (`fixes.json`)
```json
{
  "portal_tests/test_login.py": {
    "suggested_fix": "Update XPath selector from '//*[@id=\"old-button\"]' to '//*[@id=\"new-button\"]'. Page layout changed in latest UI update.",
    "added_date": "2026-07-01",
    "fixed_by": "minal.gujar",
    "status": "pending"
  },
  "integration/test_api_response.py": {
    "suggested_fix": "Mock the external API response timeout to 30s instead of 5s in mock_config.py. Flaky due to slow network in test environment.",
    "added_date": "2026-06-28",
    "fixed_by": "minal.gujar",
    "status": "applied"
  }
}
```

### 5.3 Cache File (`cache/dashboard-data.json`)
```json
{
  "timestamp": "2026-07-02T14:30:00Z",
  "refreshDurationMs": 3200,
  "sections": {
    "readyCluster": {
      "total": 240,
      "failed": 12,
      "stale": 3,
      "areas": [
        {
          "name": "API Tests",
          "total": 30,
          "failed": 2,
          "stale": 0,
          "tests": [...]
        }
      ]
    },
    "selenium": { ... },
    "integrationTests": { ... },
    "smokeTests": { ... },
    "newTestsAdded": {
      "yearly": [
        { "month": "January", "count": 12 },
        { "month": "February", "count": 8 },
        ...
      ]
    }
  }
}
```

---

## 6. File Structure

```
test-monitor/
├── package.json
├── server.js                    # Main Express app + background job setup
├── config.json                  # API tokens, URLs, paths
├── fixes.json                   # Manual suggested fixes (user-maintained)
├── .env.example                 # Template for environment variables
├── .gitignore                   # Exclude config.json, node_modules, logs
│
├── src/
│   ├── api/
│   │   ├── jenkins.js           # Jenkins API client
│   │   ├── selenium.js          # Selenium portal scraper/API
│   │   ├── git.js               # Git commands interface
│   │   ├── dashboard.js         # Aggregates all data into dashboard format
│   │   └── utils.js             # Helper functions (parsing, formatting)
│   │
│   ├── server/
│   │   ├── routes.js            # Express route handlers
│   │   ├── jobs.js              # Background refresh job definition
│   │   └── middleware.js        # CORS, error handling, etc.
│   │
│   └── ui/
│       ├── components/
│       │   ├── Section.jsx       # Collapsable section component
│       │   ├── DetailsModal.jsx  # Detailed failure view
│       │   ├── StatRow.jsx       # Stats row (Total|Failed|Stale|Areas)
│       │   └── Header.jsx        # Header with refresh button & timestamp
│       │
│       ├── pages/
│       │   └── Dashboard.jsx     # Main dashboard page
│       │
│       ├── App.jsx              # Root React component
│       ├── index.jsx            # React entry point
│       ├── styles/
│       │   └── tailwind.config.js # Tailwind config (black theme)
│       └── utils/
│           ├── api.js            # Frontend API client
│           └── formatting.js     # Format timestamps, numbers, etc.
│
├── public/
│   ├── index.html               # HTML template
│   └── favicon.ico
│
├── cache/
│   └── dashboard-data.json      # Cached data from last refresh
│
├── logs/
│   └── (refresh logs written here)
│
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-07-02-test-monitor-dashboard-design.md
│
└── README.md                    # Setup & usage instructions
```

---

## 7. Data Flow Example

**User Flow:**
1. User opens `http://localhost:3000` in browser
2. React mounts, calls `GET /api/dashboard`
3. Express returns `cache/dashboard-data.json` (cached from 5 mins ago)
4. UI renders 5 sections, displays "Last updated: 5 mins ago"
5. User clicks "Expand" on Selenium Tests section
6. Section expands showing breakdown by area
7. User clicks on "Failed: 8" in "API Tests" area
8. Modal opens showing:
   - Test filename: `test_api_response.py`
   - Last passed: 2026-06-30 14:22:00
   - Recent changes: Last 3 commits that modified this file (git blame)
   - Suggested fix: From `fixes.json` if exists
   - Link: Direct to Jenkins test report

**Background Flow (Every 15 Minutes):**
1. Express background job wakes up
2. Fetches latest data from Jenkins, Selenium, Git
3. Parses test reports, aggregates by area
4. Detects new tests added in git commits (monthly breakdown)
5. Merges with `fixes.json`
6. Writes to `cache/dashboard-data.json`
7. Frontend detects update (via polling or WebSocket), refreshes

---

## 8. Success Criteria

- ✅ Dashboard loads in <2 seconds
- ✅ All 5 sections display correct metrics (verified against source systems)
- ✅ Clicking on failed/stale tests shows accurate details
- ✅ Manual fixes appear correctly in detailed view
- ✅ Background refresh completes within 5 minutes
- ✅ UI gracefully handles API failures (shows cached data + warning)
- ✅ Professional black dashboard with good contrast/readability
- ✅ User can update `fixes.json` and changes appear on next refresh

---

## 9. Future Enhancements (Out of Scope for v1)

- AI-powered suggested fixes (currently manual)
- Real-time refresh with WebSocket instead of polling
- User accounts & permission levels
- Trend analysis (charts showing failure rate over time)
- Slack/email alerts for critical failures
- Custom dashboard sections (user-configurable)
- Historical data storage (database instead of single cache file)

---

## 10. Implementation Notes

- Start with hardcoded Jenkins/Selenium/Git URLs in `config.json`
- Use simple Node.js `child_process` to run git commands (no dependency on external git library)
- For Jenkins XML parsing, use `xml2js` npm package
- Use `node-cron` for background job scheduling
- For Selenium results, may need to scrape HTML if no API available
- Use `axios` for HTTP requests to external APIs
- Tailwind CSS pre-configured with black theme (no custom CSS needed)
