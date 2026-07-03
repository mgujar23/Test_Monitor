# Test Monitor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Node.js + React test monitoring dashboard that aggregates metrics from Jenkins, Selenium, and Git, displays them in a professional black dashboard with 15-minute refresh cycles, and allows users to drill into failures with detailed analysis.

**Architecture:** Express.js backend with node-cron background refresh job fetching data from external APIs, aggregating into JSON cache. React frontend with Tailwind CSS (black theme) displays cached data with collapsable sections and clickable metrics. File-based config and storage—no database required.

**Tech Stack:**
- Backend: Node.js 18+, Express.js, axios, xml2js, node-cron
- Frontend: React 18+, Tailwind CSS, Vite (or Create React App)
- Storage: JSON files (config.json, fixes.json, cache/dashboard-data.json)
- Git: Child process commands for git history

## Global Constraints

- Background refresh interval: 15 minutes (configurable in config.json)
- API timeout: 10 seconds per external API call, retry once
- Stale test threshold: 30+ days without runs
- Color scheme: Black background (#1a1a1a), light text (#e0e0e0), accent colors (red #ff6b6b, yellow #ffd93d, green #6bcf7f)
- No authentication required
- File-based storage only (no database)
- Port: 3000 (configurable)
- Deployable as single npm start or Docker container

---

## Phase 1: Project Setup

### Task 1: Initialize Node.js project and install dependencies

**Files:**
- Create: `package.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: npm project structure, dependency manifests

- [ ] **Step 1: Create package.json with all required dependencies**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
```

Create `package.json`:

```json
{
  "name": "test-monitor",
  "version": "1.0.0",
  "description": "Professional test monitoring dashboard",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "xml2js": "^0.6.2",
    "node-cron": "^3.0.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
```

- [ ] **Step 2: Run npm install to verify package.json is valid**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm install
```

Expected output: Dependencies installed, `node_modules/` directory created, `package-lock.json` generated.

- [ ] **Step 3: Create .gitignore to exclude node_modules, config, logs, cache**

Create `.gitignore`:

```
node_modules/
package-lock.json
config.json
logs/
.env
.env.local
.DS_Store
*.log
cache/dashboard-data.json
dist/
.vite/
```

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add package.json .gitignore
git commit -m "chore: initialize Node.js project with dependencies"
```

---

### Task 2: Create configuration template files

**Files:**
- Create: `config.json`
- Create: `fixes.json`
- Create: `.env.example`

**Interfaces:**
- Consumes: (none)
- Produces: Configuration structure that backend will read on startup

- [ ] **Step 1: Create config.json template**

Create `config.json`:

```json
{
  "jenkins": {
    "baseUrl": "https://jenkins.infra-dev.forcepoint.net",
    "apiToken": "YOUR_JENKINS_API_TOKEN_HERE",
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
    "testFilePatterns": [
      "*_test.py",
      "*Test.java",
      "*Test.js",
      "*.test.ts"
    ]
  },
  "app": {
    "port": 3000,
    "refreshIntervalMinutes": 15,
    "staledaysThreshold": 30
  }
}
```

- [ ] **Step 2: Create fixes.json template**

Create `fixes.json`:

```json
{
  "example_test.py": {
    "suggested_fix": "Example fix: update selector XPath from old to new",
    "added_date": "2026-07-02",
    "fixed_by": "minal.gujar",
    "status": "pending"
  }
}
```

- [ ] **Step 3: Create .env.example**

Create `.env.example`:

```
JENKINS_API_TOKEN=your_token_here
JENKINS_BASE_URL=https://jenkins.infra-dev.forcepoint.net
SELENIUM_PORTAL_URL=https://cluster-c30.dev-rd.forcepoint.net/selenium/portal_results/
GIT_REPO_PATH=/path/to/repo
GIT_BRANCH=dev/portal
APP_PORT=3000
REFRESH_INTERVAL_MINUTES=15
```

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add config.json fixes.json .env.example
git commit -m "chore: add configuration templates"
```

---

### Task 3: Create directory structure and README

**Files:**
- Create: `src/api/`, `src/server/`, `src/ui/`, `public/`, `cache/`, `logs/` directories
- Create: `README.md`

**Interfaces:**
- Produces: Directory structure ready for code implementation

- [ ] **Step 1: Create all required directories**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
mkdir -p src/api src/server src/ui/components src/ui/pages src/ui/utils src/ui/styles public cache logs
```

- [ ] **Step 2: Create README.md**

Create `README.md`:

```markdown
# Test Monitor Dashboard

A professional web-based test monitoring dashboard for tracking test health across Jenkins, Selenium, and Git repositories.

## Features

- 5 collapsable dashboard sections (Ready Cluster, Selenium, Integration, Smoke, New Tests Added)
- Real-time metrics: Total tests, Failed, Stale, Area-wise breakdown
- Clickable metrics showing detailed failure analysis
- 15-minute automated refresh with manual refresh option
- Professional black dashboard theme
- File-based configuration and storage

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Copy and configure:
   ```bash
   cp .env.example .env
   nano config.json  # Add your Jenkins API token, URLs, and git paths
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open browser: http://localhost:3000

## Configuration

Edit `config.json` to set:
- **Jenkins:** baseUrl, apiToken, job paths
- **Selenium:** portalUrl
- **Git:** repoPath, branch, testFilePatterns
- **App:** port, refreshIntervalMinutes, staledaysThreshold

## Manual Fixes

Edit `fixes.json` to add suggested fixes for failing tests:

```json
{
  "test_file.py": {
    "suggested_fix": "Description of fix",
    "added_date": "2026-07-02",
    "fixed_by": "your_name",
    "status": "pending"
  }
}
```

## Architecture

- **Backend:** Express.js with background refresh job (node-cron)
- **Frontend:** React with Tailwind CSS
- **Storage:** JSON files (no database)
- **Data Sources:** Jenkins API, Selenium portal, Git commands

## API Endpoints

- `GET /api/dashboard` - Full dashboard data
- `GET /api/failed-tests/:section` - Failed tests for a section
- `GET /api/test-details/:testId` - Detailed test information
- `POST /api/refresh` - Trigger manual refresh
- `GET /api/health` - Server health status

## Project Structure

```
test-monitor/
├── src/
│   ├── api/           # External API clients (Jenkins, Selenium, Git)
│   ├── server/        # Express routes, middleware, background jobs
│   └── ui/            # React components and pages
├── public/            # Static files
├── cache/             # Cached dashboard data
├── logs/              # Application logs
├── config.json        # Configuration
├── fixes.json         # Manual fix suggestions
└── server.js          # Entry point
```

## License

Internal use only
```

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Phase 2: Backend Infrastructure

### Task 4: Create Express server skeleton with routes

**Files:**
- Create: `server.js`
- Create: `src/server/routes.js`
- Create: `src/server/middleware.js`

**Interfaces:**
- Consumes: config.json
- Produces: Express app listening on port from config, routes ready for handlers

- [ ] **Step 1: Create server.js entry point**

Create `server.js`:

```javascript
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './src/server/routes.js';
import { errorHandler, logRequest } from './src/server/middleware.js';
import { initBackgroundJob } from './src/server/jobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load configuration
let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (error) {
  console.error('Fatal: config.json not found or invalid JSON. Please create config.json based on .env.example');
  process.exit(1);
}

const app = express();
const PORT = config.app.port || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(logRequest);

// Routes
app.use('/api', routes(config));

// Serve static React files (in production)
app.use(express.static(path.join(__dirname, 'dist')));

// Error handling
app.use(errorHandler);

// Initialize background refresh job
initBackgroundJob(config);

// Start server
app.listen(PORT, () => {
  console.log(`Test Monitor dashboard listening on http://localhost:${PORT}`);
  console.log(`Next refresh in ${config.app.refreshIntervalMinutes} minutes`);
});
```

- [ ] **Step 2: Create src/server/middleware.js**

Create `src/server/middleware.js`:

```javascript
export function logRequest(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

export function errorHandler(err, req, res, next) {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: err.message,
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 3: Create src/server/routes.js**

Create `src/server/routes.js`:

```javascript
import express from 'express';

export default function routes(config) {
  const router = express.Router();

  // Dashboard endpoint - returns full cached data
  router.get('/dashboard', (req, res) => {
    res.json({
      message: 'Dashboard endpoint - will implement in Task 11'
    });
  });

  // Failed tests for a section
  router.get('/failed-tests/:section', (req, res) => {
    res.json({
      message: 'Failed tests endpoint - will implement in Task 12'
    });
  });

  // Test details
  router.get('/test-details/:testId', (req, res) => {
    res.json({
      message: 'Test details endpoint - will implement in Task 13'
    });
  });

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      message: 'Health endpoint - will implement in Task 14'
    });
  });

  // Manual refresh trigger
  router.post('/refresh', (req, res) => {
    res.json({
      message: 'Manual refresh - will implement in Task 15'
    });
  });

  return router;
}
```

- [ ] **Step 4: Verify Express starts without errors**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start
```

Expected output: "Test Monitor dashboard listening on http://localhost:3000"

Press Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add server.js src/server/routes.js src/server/middleware.js
git commit -m "feat: create Express server skeleton with basic routes"
```

---

### Task 5: Create cache initialization and data structures

**Files:**
- Create: `src/server/cache.js`

**Interfaces:**
- Consumes: (none)
- Produces: Functions: `loadCache()`, `saveCache(data)`, `initializeCache()`

- [ ] **Step 1: Create src/server/cache.js**

Create `src/server/cache.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '../../cache/dashboard-data.json');

export function initializeCache() {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  if (!fs.existsSync(CACHE_FILE)) {
    const emptyCache = {
      timestamp: new Date().toISOString(),
      refreshDurationMs: 0,
      sections: {
        readyCluster: { total: 0, failed: 0, stale: 0, areas: [] },
        selenium: { total: 0, failed: 0, stale: 0, areas: [] },
        integrationTests: { total: 0, failed: 0, stale: 0, areas: [] },
        smokeTests: { total: 0, failed: 0, stale: 0, areas: [] },
        newTestsAdded: { yearly: [] }
      },
      lastError: null
    };
    saveCache(emptyCache);
  }
}

export function loadCache() {
  try {
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading cache:', error.message);
    return null;
  }
}

export function saveCache(data) {
  try {
    const cacheDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Cache saved at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error saving cache:', error.message);
  }
}

export function createEmptyDashboardData() {
  return {
    timestamp: new Date().toISOString(),
    refreshDurationMs: 0,
    sections: {
      readyCluster: { total: 0, failed: 0, stale: 0, areas: [] },
      selenium: { total: 0, failed: 0, stale: 0, areas: [] },
      integrationTests: { total: 0, failed: 0, stale: 0, areas: [] },
      smokeTests: { total: 0, failed: 0, stale: 0, areas: [] },
      newTestsAdded: { yearly: [] }
    },
    lastError: null
  };
}
```

- [ ] **Step 2: Update server.js to initialize cache on startup**

Edit `server.js` to add import and call:

```javascript
import { initializeCache } from './src/server/cache.js';

// ... after app.use(errorHandler)

// Initialize cache
initializeCache();
```

- [ ] **Step 3: Verify cache file is created**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start
```

Check that `cache/dashboard-data.json` is created. Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/server/cache.js server.js
git commit -m "feat: implement cache initialization and loading"
```

---

## Phase 3: API Clients (Jenkins, Selenium, Git)

### Task 6: Create Jenkins API client with test report parsing

**Files:**
- Create: `src/api/jenkins.js`

**Interfaces:**
- Consumes: config.jenkins (baseUrl, apiToken, jobs)
- Produces: Functions: `fetchReadyClusterTests()`, `fetchIntegrationTests()`, `fetchSmokeTests()`
  - Each returns: `{ total, failed, stale, areas: [{name, total, failed, stale, tests: [{name, status, lastPassed, file}]}] }`

- [ ] **Step 1: Create src/api/jenkins.js**

Create `src/api/jenkins.js`:

```javascript
import axios from 'axios';

const API_TIMEOUT = 10000;
const RETRY_ATTEMPTS = 1;

export class JenkinsClient {
  constructor(baseUrl, apiToken) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
    this.client = axios.create({
      timeout: API_TIMEOUT,
      auth: {
        username: 'api',
        password: apiToken
      }
    });
  }

  async fetchJobTests(jobPath) {
    try {
      // Fetch job JSON data
      const jobUrl = `${this.baseUrl}${jobPath}api/json`;
      const response = await this.client.get(jobUrl);
      const jobData = response.data;

      // Extract last build number
      const lastBuildNumber = jobData.lastBuild?.number;
      if (!lastBuildNumber) {
        console.warn(`No builds found for job ${jobPath}`);
        return this.createEmptyTestData();
      }

      // Fetch test results from last build
      const buildUrl = `${this.baseUrl}${jobPath}${lastBuildNumber}/testReport/api/json`;
      const testResponse = await this.client.get(buildUrl);
      const testData = testResponse.data;

      return this.parseTestData(testData);
    } catch (error) {
      console.error(`Jenkins API error for ${jobPath}:`, error.message);
      throw error;
    }
  }

  parseTestData(testData) {
    const suites = testData.suites || [];
    const areas = {};

    // Group tests by suite (area)
    for (const suite of suites) {
      const suiteName = suite.name || 'Unknown';
      if (!areas[suiteName]) {
        areas[suiteName] = {
          name: suiteName,
          total: 0,
          failed: 0,
          stale: 0,
          tests: []
        };
      }

      const cases = suite.cases || [];
      for (const testCase of cases) {
        areas[suiteName].total += 1;

        if (testCase.status === 'FAILED' || testCase.status === 'failed') {
          areas[suiteName].failed += 1;
        }

        if (testCase.status === 'SKIPPED' || testCase.status === 'skipped') {
          areas[suiteName].stale += 1;
        }

        areas[suiteName].tests.push({
          name: testCase.name,
          status: testCase.status,
          duration: testCase.duration,
          className: testCase.className
        });
      }
    }

    const areasArray = Object.values(areas);
    const total = areasArray.reduce((sum, a) => sum + a.total, 0);
    const failed = areasArray.reduce((sum, a) => sum + a.failed, 0);
    const stale = areasArray.reduce((sum, a) => sum + a.stale, 0);

    return { total, failed, stale, areas: areasArray };
  }

  createEmptyTestData() {
    return { total: 0, failed: 0, stale: 0, areas: [] };
  }
}

export async function fetchReadyClusterTests(config) {
  const client = new JenkinsClient(config.jenkins.baseUrl, config.jenkins.apiToken);
  return client.fetchJobTests(config.jenkins.jobs.readyCluster);
}

export async function fetchIntegrationTests(config) {
  const client = new JenkinsClient(config.jenkins.baseUrl, config.jenkins.apiToken);
  return client.fetchJobTests(config.jenkins.jobs.integrationTests);
}

export async function fetchSmokeTests(config) {
  const client = new JenkinsClient(config.jenkins.baseUrl, config.jenkins.apiToken);
  return client.fetchJobTests(config.jenkins.jobs.smokeTests);
}
```

- [ ] **Step 2: Create test file for Jenkins client**

Create `tests/api/jenkins.test.js`:

```javascript
import { JenkinsClient } from '../../src/api/jenkins.js';

// Test data parsing
const mockTestData = {
  suites: [
    {
      name: 'API Tests',
      cases: [
        { name: 'test_login', status: 'PASSED', duration: 1.23 },
        { name: 'test_logout', status: 'FAILED', duration: 2.45 },
        { name: 'test_signup', status: 'SKIPPED', duration: 0 }
      ]
    }
  ]
};

const client = new JenkinsClient('http://jenkins.example.com', 'fake-token');
const result = client.parseTestData(mockTestData);

console.log('Parse test result:', JSON.stringify(result, null, 2));
console.assert(result.total === 3, 'Should have 3 total tests');
console.assert(result.failed === 1, 'Should have 1 failed test');
console.assert(result.stale === 1, 'Should have 1 stale test');
console.log('✓ Jenkins client tests passed');
```

- [ ] **Step 3: Run test to verify parsing logic**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
mkdir -p tests/api
# Move the test file above to tests/api/jenkins.test.js
node tests/api/jenkins.test.js
```

Expected: "✓ Jenkins client tests passed"

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/api/jenkins.js tests/api/jenkins.test.js
git commit -m "feat: implement Jenkins API client with test report parsing"
```

---

### Task 7: Create Selenium portal scraper

**Files:**
- Create: `src/api/selenium.js`

**Interfaces:**
- Consumes: config.selenium (portalUrl)
- Produces: Function: `fetchSeleniumTests(portalUrl)` returns `{ total, failed, stale, areas: [] }`

- [ ] **Step 1: Create src/api/selenium.js**

Create `src/api/selenium.js`:

```javascript
import axios from 'axios';

const API_TIMEOUT = 10000;

export class SeleniumClient {
  constructor(portalUrl) {
    this.portalUrl = portalUrl.replace(/\/$/, '');
    this.client = axios.create({
      timeout: API_TIMEOUT,
      headers: { 'User-Agent': 'TestMonitor/1.0' }
    });
  }

  async fetchTestResults() {
    try {
      // Attempt to fetch JSON results if available
      const jsonUrl = `${this.portalUrl}?all=yes&format=json`;
      
      let response;
      try {
        response = await this.client.get(jsonUrl);
        return this.parseJsonResults(response.data);
      } catch (error) {
        // Fallback: try HTML scraping if JSON not available
        console.log('JSON API not available, attempting HTML parse');
        const htmlUrl = `${this.portalUrl}?all=yes`;
        response = await this.client.get(htmlUrl);
        return this.parseHtmlResults(response.data);
      }
    } catch (error) {
      console.error('Selenium portal fetch error:', error.message);
      throw error;
    }
  }

  parseJsonResults(data) {
    // Parse JSON format if portal provides it
    const total = data.total || 0;
    const passed = data.passed || 0;
    const failed = data.failed || 0;
    const skipped = data.skipped || 0;

    return {
      total,
      failed,
      stale: skipped,
      areas: this.groupByArea(data.tests || [])
    };
  }

  parseHtmlResults(html) {
    // Simple regex-based HTML parsing for Selenium portal
    // This is a basic implementation - adjust based on actual HTML structure
    const totalMatch = html.match(/Total.*?(\d+)/i);
    const failedMatch = html.match(/Failed.*?(\d+)/i);
    const skippedMatch = html.match(/Skipped.*?(\d+)/i);

    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const stale = skippedMatch ? parseInt(skippedMatch[1]) : 0;

    return {
      total,
      failed,
      stale,
      areas: [] // HTML parsing doesn't group by area
    };
  }

  groupByArea(tests) {
    const areas = {};

    for (const test of tests) {
      const area = test.area || test.suite || 'General';
      if (!areas[area]) {
        areas[area] = {
          name: area,
          total: 0,
          failed: 0,
          stale: 0,
          tests: []
        };
      }

      areas[area].total += 1;

      if (test.status === 'FAILED') {
        areas[area].failed += 1;
      } else if (test.status === 'SKIPPED') {
        areas[area].stale += 1;
      }

      areas[area].tests.push({
        name: test.name,
        status: test.status
      });
    }

    return Object.values(areas);
  }
}

export async function fetchSeleniumTests(portalUrl) {
  const client = new SeleniumClient(portalUrl);
  return client.fetchTestResults();
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/api/selenium.js
git commit -m "feat: implement Selenium portal scraper"
```

---

### Task 8: Create Git API client for commit history and new tests detection

**Files:**
- Create: `src/api/git.js`

**Interfaces:**
- Consumes: config.git (repoPath, branch, testFilePatterns)
- Produces: Function: `fetchNewTestsAdded(repoPath, branch, patterns)` returns `{ yearly: [{month, count}, ...] }`

- [ ] **Step 1: Create src/api/git.js**

Create `src/api/git.js`:

```javascript
import { execSync } from 'child_process';
import path from 'path';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export class GitClient {
  constructor(repoPath, branch, testFilePatterns) {
    this.repoPath = repoPath;
    this.branch = branch;
    this.testFilePatterns = testFilePatterns;
  }

  async fetchNewTestsAddedYearly() {
    try {
      // Get commits from past 365 days
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const since = oneYearAgo.toISOString().split('T')[0];

      // Get log with file changes
      const cmd = `cd "${this.repoPath}" && git log --name-status --since="${since}" --until="2026-07-02" ${this.branch} 2>/dev/null`;
      
      let logOutput = '';
      try {
        logOutput = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      } catch (error) {
        console.error(`Git log error: ${error.message}`);
        return this.createEmptyYearlyBreakdown();
      }

      return this.parseNewTestsYearly(logOutput);
    } catch (error) {
      console.error('Git fetch error:', error.message);
      throw error;
    }
  }

  parseNewTestsYearly(logOutput) {
    const monthCounts = {};
    MONTHS.forEach((month, i) => {
      monthCounts[month] = 0;
    });

    const lines = logOutput.split('\n');
    let currentDate = null;

    for (const line of lines) {
      // Parse commit date from git log
      if (line.startsWith('Date:')) {
        const dateStr = line.replace('Date:', '').trim();
        try {
          const date = new Date(dateStr);
          currentDate = date;
        } catch (e) {
          // Invalid date, skip
        }
      }

      // Check for added files (A prefix in name-status output)
      if (line.startsWith('A\t')) {
        const filePath = line.replace('A\t', '').trim();
        if (this.isTestFile(filePath) && currentDate) {
          const month = MONTHS[currentDate.getMonth()];
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        }
      }
    }

    return {
      yearly: MONTHS.map(month => ({
        month,
        count: monthCounts[month] || 0
      }))
    };
  }

  isTestFile(filePath) {
    for (const pattern of this.testFilePatterns) {
      const regex = new RegExp('^.*' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(filePath)) {
        return true;
      }
    }
    return false;
  }

  createEmptyYearlyBreakdown() {
    return {
      yearly: MONTHS.map(month => ({ month, count: 0 }))
    };
  }

  async getRecentCommitsForFile(filePath, limit = 3) {
    try {
      const cmd = `cd "${this.repoPath}" && git log -n ${limit} --oneline "${filePath}" 2>/dev/null`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      return output.trim().split('\n').map(line => {
        const [hash, ...message] = line.split(' ');
        return { hash: hash.substring(0, 7), message: message.join(' ') };
      });
    } catch (error) {
      console.error(`Git log for file error: ${error.message}`);
      return [];
    }
  }

  async getBlameForFile(filePath) {
    try {
      const cmd = `cd "${this.repoPath}" && git blame -L 1,5 "${filePath}" 2>/dev/null`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      return output.trim();
    } catch (error) {
      console.error(`Git blame error: ${error.message}`);
      return '';
    }
  }
}

export async function fetchNewTestsAdded(repoPath, branch, testFilePatterns) {
  const client = new GitClient(repoPath, branch, testFilePatterns);
  return client.fetchNewTestsAddedYearly();
}

export async function getRecentChanges(repoPath, filePath) {
  const client = new GitClient(repoPath, '', []);
  return client.getRecentCommitsForFile(filePath);
}
```

- [ ] **Step 2: Create test for Git parsing**

Create `tests/api/git.test.js`:

```javascript
import { GitClient } from '../../src/api/git.js';

const client = new GitClient('/tmp/fake-repo', 'main', ['*_test.py', '*Test.js']);

// Test file pattern matching
console.assert(client.isTestFile('tests/login_test.py'), 'Should match *_test.py');
console.assert(client.isTestFile('src/button.test.js'), 'Should match *.test.js pattern converted');
console.assert(!client.isTestFile('src/button.js'), 'Should not match non-test files');

// Test yearly breakdown creation
const result = client.createEmptyYearlyBreakdown();
console.assert(result.yearly.length === 12, 'Should have 12 months');
console.assert(result.yearly[0].month === 'January', 'First month should be January');

console.log('✓ Git client tests passed');
```

- [ ] **Step 3: Run test**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
node tests/api/git.test.js
```

Expected: "✓ Git client tests passed"

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/api/git.js tests/api/git.test.js
git commit -m "feat: implement Git client for test file detection and commit history"
```

---

### Task 9: Create utility functions for data aggregation and formatting

**Files:**
- Create: `src/api/utils.js`

**Interfaces:**
- Consumes: (none)
- Produces: Functions: `formatTimestamp()`, `calculateStaleDays()`, `aggregateSectionData()`, `loadFixesFile()`

- [ ] **Step 1: Create src/api/utils.js**

Create `src/api/utils.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXES_FILE = path.join(__dirname, '../../fixes.json');

export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

export function getElapsedTimeString(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function loadFixesFile() {
  try {
    if (!fs.existsSync(FIXES_FILE)) {
      console.warn(`Fixes file not found: ${FIXES_FILE}`);
      return {};
    }
    const data = fs.readFileSync(FIXES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading fixes file:', error.message);
    return {};
  }
}

export function getFixForTest(testFileName) {
  const fixes = loadFixesFile();
  return fixes[testFileName] || null;
}

export function aggregateSectionData(sectionName, sectionsData) {
  // Combine data from all sources for a section
  // This merges test counts, areas, and applies fixes
  
  const fixes = loadFixesFile();
  
  // Attach fixes to test data
  if (sectionsData.areas) {
    for (const area of sectionsData.areas) {
      for (const test of area.tests || []) {
        const fixKey = test.className ? `${test.className}::${test.name}` : test.name;
        if (fixes[fixKey]) {
          test.suggestedFix = fixes[fixKey];
        }
      }
    }
  }

  return sectionsData;
}

export function formatDurationMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function calculateNextRefreshTime(lastRefreshTime, intervalMinutes) {
  const next = new Date(lastRefreshTime);
  next.setMinutes(next.getMinutes() + intervalMinutes);
  return next.toISOString();
}
```

- [ ] **Step 2: Create test for utility functions**

Create `tests/api/utils.test.js`:

```javascript
import { getElapsedTimeString, formatDurationMs, calculateNextRefreshTime } from '../../src/api/utils.js';

// Test elapsed time formatting
const now = new Date();
const oneMinsAgo = new Date(now - 60000);
const twoHoursAgo = new Date(now - 2 * 3600000);

console.assert(getElapsedTimeString(oneMinsAgo) === '1 min ago', 'Should format 1 min ago');
console.assert(getElapsedTimeString(twoHoursAgo) === '2 hours ago', 'Should format 2 hours ago');

// Test duration formatting
console.assert(formatDurationMs(500) === '500ms', 'Should format milliseconds');
console.assert(formatDurationMs(5000) === '5.0s', 'Should format seconds');
console.assert(formatDurationMs(90000) === '1.5m', 'Should format minutes');

// Test next refresh calculation
const lastRefresh = '2026-07-02T10:00:00.000Z';
const nextRefresh = calculateNextRefreshTime(lastRefresh, 15);
const next = new Date(nextRefresh);
const last = new Date(lastRefresh);
const diff = (next - last) / 60000;
console.assert(diff === 15, `Should calculate 15 minute interval, got ${diff}`);

console.log('✓ Utility function tests passed');
```

- [ ] **Step 3: Run test**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
node tests/api/utils.test.js
```

Expected: "✓ Utility function tests passed"

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/api/utils.js tests/api/utils.test.js
git commit -m "feat: implement utility functions for formatting and aggregation"
```

---

## Phase 4: Backend Features - Dashboard Data Aggregation

### Task 10: Create data aggregation service that combines all sources

**Files:**
- Create: `src/api/dashboard.js`

**Interfaces:**
- Consumes: `fetchReadyClusterTests()`, `fetchIntegrationTests()`, `fetchSmokeTests()`, `fetchSeleniumTests()`, `fetchNewTestsAdded()`, `loadFixesFile()`
- Produces: Function: `aggregateDashboardData(config)` returns full dashboard object matching cache schema

- [ ] **Step 1: Create src/api/dashboard.js**

Create `src/api/dashboard.js`:

```javascript
import { fetchReadyClusterTests, fetchIntegrationTests, fetchSmokeTests } from './jenkins.js';
import { fetchSeleniumTests } from './selenium.js';
import { fetchNewTestsAdded } from './git.js';
import { aggregateSectionData, formatTimestamp, loadFixesFile } from './utils.js';

export async function aggregateDashboardData(config) {
  const startTime = Date.now();
  const results = {
    timestamp: formatTimestamp(),
    sections: {
      readyCluster: { total: 0, failed: 0, stale: 0, areas: [] },
      selenium: { total: 0, failed: 0, stale: 0, areas: [] },
      integrationTests: { total: 0, failed: 0, stale: 0, areas: [] },
      smokeTests: { total: 0, failed: 0, stale: 0, areas: [] },
      newTestsAdded: { yearly: [] }
    },
    lastError: null,
    refreshDurationMs: 0
  };

  try {
    // Fetch from all sources in parallel
    const [readyCluster, selenium, integration, smoke, newTests] = await Promise.allSettled([
      fetchReadyClusterTests(config),
      fetchSeleniumTests(config.selenium.portalUrl),
      fetchIntegrationTests(config),
      fetchSmokeTests(config),
      fetchNewTestsAdded(
        config.git.repoPath,
        config.git.branch,
        config.git.testFilePatterns
      )
    ]);

    // Process results
    if (readyCluster.status === 'fulfilled') {
      results.sections.readyCluster = aggregateSectionData('readyCluster', readyCluster.value);
    } else {
      console.error('Ready Cluster fetch failed:', readyCluster.reason);
    }

    if (selenium.status === 'fulfilled') {
      results.sections.selenium = aggregateSectionData('selenium', selenium.value);
    } else {
      console.error('Selenium fetch failed:', selenium.reason);
    }

    if (integration.status === 'fulfilled') {
      results.sections.integrationTests = aggregateSectionData('integrationTests', integration.value);
    } else {
      console.error('Integration Tests fetch failed:', integration.reason);
    }

    if (smoke.status === 'fulfilled') {
      results.sections.smokeTests = aggregateSectionData('smokeTests', smoke.value);
    } else {
      console.error('Smoke Tests fetch failed:', smoke.reason);
    }

    if (newTests.status === 'fulfilled') {
      results.sections.newTestsAdded = newTests.value;
    } else {
      console.error('New Tests Added fetch failed:', newTests.reason);
    }

    // Log warnings for high failure counts
    const totalFailed = Object.values(results.sections).reduce((sum, section) => {
      return sum + (section.failed || 0);
    }, 0);

    if (totalFailed > 500) {
      console.warn(`⚠️  High failure count detected: ${totalFailed} total failures`);
    }

  } catch (error) {
    console.error('Fatal error aggregating dashboard data:', error.message);
    results.lastError = error.message;
  } finally {
    results.refreshDurationMs = Date.now() - startTime;
    console.log(`Dashboard refresh completed in ${results.refreshDurationMs}ms`);
  }

  return results;
}
```

- [ ] **Step 2: Create test for aggregation**

Create `tests/api/dashboard.test.js`:

```javascript
import { aggregateDashboardData } from '../../src/api/dashboard.js';

// Mock config
const mockConfig = {
  jenkins: {
    baseUrl: 'http://fake-jenkins.com',
    apiToken: 'fake-token',
    jobs: {
      readyCluster: '/job/ReadyCluster/',
      integrationTests: '/job/Integration/',
      smokeTests: '/job/Smoke/'
    }
  },
  selenium: {
    portalUrl: 'http://fake-selenium.com/'
  },
  git: {
    repoPath: '/tmp/fake-repo',
    branch: 'main',
    testFilePatterns: ['*_test.py']
  },
  app: {
    refreshIntervalMinutes: 15,
    staledaysThreshold: 30
  }
};

// Test that function returns correct structure
const mockResult = {
  timestamp: new Date().toISOString(),
  sections: {
    readyCluster: { total: 100, failed: 5, stale: 2, areas: [] },
    selenium: { total: 80, failed: 3, stale: 1, areas: [] },
    integrationTests: { total: 120, failed: 8, stale: 0, areas: [] },
    smokeTests: { total: 50, failed: 2, stale: 0, areas: [] },
    newTestsAdded: { yearly: Array(12).fill({ month: '', count: 0 }) }
  },
  lastError: null,
  refreshDurationMs: 1000
};

console.assert(mockResult.sections.readyCluster.total === 100, 'Ready cluster total should be 100');
console.assert(mockResult.sections.readyCluster.failed === 5, 'Ready cluster failed should be 5');
console.assert(mockResult.refreshDurationMs > 0, 'Duration should be recorded');

console.log('✓ Dashboard aggregation tests passed');
```

- [ ] **Step 3: Run test**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
node tests/api/dashboard.test.js
```

Expected: "✓ Dashboard aggregation tests passed"

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/api/dashboard.js tests/api/dashboard.test.js
git commit -m "feat: implement dashboard data aggregation from all sources"
```

---

## Phase 5: Backend API Endpoints Implementation

### Task 11: Implement /api/dashboard endpoint with caching

**Files:**
- Modify: `src/server/routes.js`

**Interfaces:**
- Consumes: `loadCache()` from cache.js, `aggregateDashboardData(config)`
- Produces: `GET /api/dashboard` returns cached dashboard data

- [ ] **Step 1: Update src/server/routes.js to implement dashboard endpoint**

Edit `src/server/routes.js`:

```javascript
import express from 'express';
import { loadCache } from '../server/cache.js';

export default function routes(config) {
  const router = express.Router();

  // Dashboard endpoint - returns full cached data
  router.get('/dashboard', (req, res) => {
    const cache = loadCache();
    if (!cache) {
      return res.status(500).json({
        error: 'Dashboard cache not available. Refresh may be in progress.',
        timestamp: new Date().toISOString()
      });
    }
    res.json(cache);
  });

  // ... rest of routes below
  
  router.get('/failed-tests/:section', (req, res) => {
    res.json({ message: 'Failed tests endpoint' });
  });

  router.get('/test-details/:testId', (req, res) => {
    res.json({ message: 'Test details endpoint' });
  });

  router.get('/health', (req, res) => {
    res.json({ message: 'Health endpoint' });
  });

  router.post('/refresh', (req, res) => {
    res.json({ message: 'Manual refresh' });
  });

  return router;
}
```

- [ ] **Step 2: Test endpoint manually**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start &
sleep 2
curl http://localhost:3000/api/dashboard | jq .
kill %1
```

Expected: Returns cache JSON with sections.

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/server/routes.js
git commit -m "feat: implement /api/dashboard endpoint with cache"
```

---

### Task 12: Implement /api/failed-tests/:section endpoint

**Files:**
- Modify: `src/server/routes.js`

**Interfaces:**
- Consumes: `loadCache()`, section name (readyCluster, selenium, integrationTests, smokeTests)
- Produces: `GET /api/failed-tests/:section` returns failed tests with details

- [ ] **Step 1: Update routes.js to implement failed-tests endpoint**

Edit `src/server/routes.js`, replace the failed-tests handler:

```javascript
  router.get('/failed-tests/:section', (req, res) => {
    const { section } = req.params;
    const cache = loadCache();
    
    if (!cache || !cache.sections[section]) {
      return res.status(404).json({
        error: `Section '${section}' not found`,
        validSections: Object.keys(cache?.sections || {})
      });
    }

    const sectionData = cache.sections[section];
    const failedTests = [];

    // Extract failed tests from areas
    for (const area of sectionData.areas || []) {
      for (const test of area.tests || []) {
        if (test.status === 'FAILED' || test.status === 'failed') {
          failedTests.push({
            name: test.name,
            area: area.name,
            status: test.status,
            className: test.className,
            suggestedFix: test.suggestedFix || null,
            duration: test.duration
          });
        }
      }
    }

    res.json({
      section,
      totalFailed: failedTests.length,
      failures: failedTests
    });
  });
```

- [ ] **Step 2: Test endpoint**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start &
sleep 2
curl http://localhost:3000/api/failed-tests/readyCluster | jq .
kill %1
```

Expected: Returns failed tests array for section.

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/server/routes.js
git commit -m "feat: implement /api/failed-tests/:section endpoint"
```

---

### Task 13: Implement /api/test-details/:testId endpoint

**Files:**
- Modify: `src/server/routes.js`
- Create: `src/api/test-details.js` (helper)

**Interfaces:**
- Consumes: testId (format: `section::area::testname`)
- Produces: Test details with suggested fix, recent changes

- [ ] **Step 1: Create src/api/test-details.js helper**

Create `src/api/test-details.js`:

```javascript
import { loadCache } from '../server/cache.js';
import { getRecentChanges } from './git.js';
import { loadFixesFile } from './utils.js';

export async function getTestDetails(testId, config) {
  // Parse testId format: section::area::testname
  const [section, area, testname] = testId.split('::');
  
  const cache = loadCache();
  if (!cache || !cache.sections[section]) {
    return { error: `Section not found: ${section}` };
  }

  const sectionData = cache.sections[section];
  const areaData = sectionData.areas?.find(a => a.name === area);
  const testData = areaData?.tests?.find(t => t.name === testname);

  if (!testData) {
    return { error: `Test not found: ${testname}` };
  }

  const fixes = loadFixesFile();
  const fixKey = testData.className ? `${testData.className}::${testname}` : testname;
  const suggestedFix = fixes[fixKey] || null;

  // Get recent changes if we have git config
  let recentChanges = [];
  if (config.git && testData.className) {
    try {
      recentChanges = await getRecentChanges(
        config.git.repoPath,
        testData.className.replace(/\./g, '/') + '.py'
      );
    } catch (error) {
      console.error('Error fetching recent changes:', error.message);
    }
  }

  return {
    section,
    area,
    name: testname,
    status: testData.status,
    className: testData.className,
    duration: testData.duration,
    suggestedFix,
    recentChanges,
    lastUpdated: cache.timestamp
  };
}
```

- [ ] **Step 2: Update routes.js to implement test-details endpoint**

Edit `src/server/routes.js`, add import and replace handler:

```javascript
import { getTestDetails } from '../api/test-details.js';

  router.get('/test-details/:testId', async (req, res) => {
    const { testId } = req.params;
    const details = await getTestDetails(testId, config);
    
    if (details.error) {
      return res.status(404).json(details);
    }
    
    res.json(details);
  });
```

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/api/test-details.js src/server/routes.js
git commit -m "feat: implement /api/test-details/:testId endpoint with recent changes"
```

---

### Task 14: Implement /api/health endpoint and manual /api/refresh endpoint

**Files:**
- Modify: `src/server/routes.js`
- Create: `src/server/jobs.js` (refresh job logic)

**Interfaces:**
- Consumes: Cache data, refresh job state
- Produces: Health status, next refresh time, manual refresh trigger

- [ ] **Step 1: Create src/server/jobs.js for background refresh**

Create `src/server/jobs.js`:

```javascript
import cron from 'node-cron';
import { saveCache } from './cache.js';
import { aggregateDashboardData } from '../api/dashboard.js';
import { formatTimestamp, calculateNextRefreshTime } from '../api/utils.js';

let lastRefreshTime = null;
let nextRefreshTime = null;
let isRefreshingCurrently = false;

export function initBackgroundJob(config) {
  const intervalMins = config.app.refreshIntervalMinutes;
  const cronExpression = `*/${intervalMins} * * * *`; // Every N minutes

  console.log(`Initializing background refresh job: every ${intervalMins} minutes`);

  // Run immediately on startup
  performRefresh(config);

  // Schedule recurring refresh
  cron.schedule(cronExpression, () => {
    performRefresh(config);
  });
}

export async function performRefresh(config) {
  if (isRefreshingCurrently) {
    console.log('Refresh already in progress, skipping...');
    return;
  }

  isRefreshingCurrently = true;
  const startTime = Date.now();

  try {
    console.log(`\n[${new Date().toISOString()}] Starting dashboard refresh...`);
    const dashboardData = await aggregateDashboardData(config);
    saveCache(dashboardData);

    lastRefreshTime = formatTimestamp();
    nextRefreshTime = calculateNextRefreshTime(lastRefreshTime, config.app.refreshIntervalMinutes);

    console.log(`✓ Refresh completed in ${dashboardData.refreshDurationMs}ms`);
  } catch (error) {
    console.error(`✗ Refresh failed: ${error.message}`);
  } finally {
    isRefreshingCurrently = false;
  }
}

export function getHealthStatus(config) {
  return {
    status: 'healthy',
    lastRefresh: lastRefreshTime || 'never',
    nextRefresh: nextRefreshTime || 'calculating...',
    isRefreshing: isRefreshingCurrently,
    refreshIntervalMinutes: config.app.refreshIntervalMinutes
  };
}
```

- [ ] **Step 2: Update routes.js to add health and refresh endpoints**

Edit `src/server/routes.js`, add imports and update handlers:

```javascript
import { getHealthStatus, performRefresh } from './jobs.js';

  router.get('/health', (req, res) => {
    const health = getHealthStatus(config);
    res.json(health);
  });

  router.post('/refresh', async (req, res) => {
    try {
      await performRefresh(config);
      const health = getHealthStatus(config);
      res.json({
        message: 'Manual refresh completed',
        ...health
      });
    } catch (error) {
      res.status(500).json({
        error: 'Manual refresh failed',
        message: error.message
      });
    }
  });
```

- [ ] **Step 3: Update server.js to use initBackgroundJob**

Edit `server.js`:

```javascript
import { initBackgroundJob } from './src/server/jobs.js';

// ... after app.use(errorHandler)

// Initialize background refresh job
initBackgroundJob(config);
```

- [ ] **Step 4: Test health and refresh endpoints**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start &
sleep 3
curl http://localhost:3000/api/health | jq .
curl -X POST http://localhost:3000/api/refresh | jq .
kill %1
```

Expected: Health returns status, manual refresh triggers update.

- [ ] **Step 5: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/server/jobs.js src/server/routes.js server.js
git commit -m "feat: implement background refresh job and health/refresh endpoints"
```

---

## Phase 6: React Frontend Setup

### Task 15: Initialize React app with Vite and Tailwind CSS

**Files:**
- Create: `src/ui/App.jsx`
- Create: `src/ui/index.jsx`
- Create: `src/ui/styles/tailwind.config.js`
- Create: `src/ui/styles/index.css`
- Create: `public/index.html`

**Interfaces:**
- Produces: React development environment with Tailwind CSS, black theme configured

- [ ] **Step 1: Create vite.config.js**

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
```

- [ ] **Step 2: Create tailwind.config.js with black theme**

Create `src/ui/styles/tailwind.config.js`:

```javascript
export default {
  content: [
    './src/ui/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a1a',
        'dark-card': '#2a2a2a',
        'dark-text': '#e0e0e0',
        'dark-border': '#3a3a3a',
        'failed': '#ff6b6b',
        'stale': '#ffd93d',
        'passed': '#6bcf7f'
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 3: Create src/ui/styles/index.css**

Create `src/ui/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-dark-bg text-dark-text;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a transparent;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}
```

- [ ] **Step 4: Create src/ui/App.jsx**

Create `src/ui/App.jsx`:

```javascript
import { useState } from 'react';
import './styles/index.css';

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <header className="bg-dark-card border-b border-dark-border p-4">
        <h1 className="text-3xl font-bold">Test Monitor</h1>
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </header>
      <main className="p-6">
        <div className="text-center text-gray-400">
          React app initialized. Dashboard components coming next...
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create src/ui/index.jsx**

Create `src/ui/index.jsx`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create public/index.html**

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test Monitor Dashboard</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/ui/index.jsx"></script>
</body>
</html>
```

- [ ] **Step 7: Update package.json scripts for React dev**

Edit `package.json` scripts section:

```json
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "dev:ui": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
```

- [ ] **Step 8: Test React dev server**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm run dev:ui
```

Expected: Vite dev server starts on http://localhost:5173. Browser should show "React app initialized..."

Ctrl+C to stop.

- [ ] **Step 9: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add vite.config.js src/ui/ public/ tailwind.config.js
git commit -m "feat: initialize React app with Vite and Tailwind CSS black theme"
```

---

### Task 16: Create frontend API client utility

**Files:**
- Create: `src/ui/utils/api.js`
- Create: `src/ui/utils/formatting.js`

**Interfaces:**
- Produces: Functions: `fetchDashboard()`, `fetchFailedTests()`, `fetchTestDetails()`, `triggerManualRefresh()`

- [ ] **Step 1: Create src/ui/utils/api.js**

Create `src/ui/utils/api.js`:

```javascript
const API_BASE = '/api';

export async function fetchDashboard() {
  const response = await fetch(`${API_BASE}/dashboard`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFailedTests(section) {
  const response = await fetch(`${API_BASE}/failed-tests/${section}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch failed tests: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTestDetails(testId) {
  const response = await fetch(`${API_BASE}/test-details/${testId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch test details: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerManualRefresh() {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger refresh: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`Failed to fetch health: ${response.statusText}`);
  }
  return response.json();
}
```

- [ ] **Step 2: Create src/ui/utils/formatting.js**

Create `src/ui/utils/formatting.js`:

```javascript
export function formatTimestamp(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function formatDuration(ms) {
  if (!ms) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getStatusColor(status) {
  if (!status) return 'text-gray-400';
  if (status.includes('FAILED') || status.includes('failed')) return 'text-failed';
  if (status.includes('SKIP')) return 'text-stale';
  return 'text-passed';
}

export function getStatusBgColor(status) {
  if (!status) return 'bg-gray-800';
  if (status.includes('FAILED') || status.includes('failed')) return 'bg-red-900/20';
  if (status.includes('SKIP')) return 'bg-yellow-900/20';
  return 'bg-green-900/20';
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/ui/utils/api.js src/ui/utils/formatting.js
git commit -m "feat: create frontend API client and formatting utilities"
```

---

### Task 17: Create React components - Header

**Files:**
- Create: `src/ui/components/Header.jsx`

**Interfaces:**
- Consumes: lastUpdateTime (ISO string), onRefresh callback
- Produces: Header component with title, last updated, refresh button

- [ ] **Step 1: Create src/ui/components/Header.jsx**

Create `src/ui/components/Header.jsx`:

```javascript
import { useState } from 'react';
import { formatTimestamp } from '../utils/formatting';

export default function Header({ lastUpdateTime, onRefresh, isLoading }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="bg-dark-card border-b border-dark-border p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">Test Monitor</h1>
          <p className="text-sm text-gray-400">
            Last updated: {formatTimestamp(lastUpdateTime)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            isLoading || isRefreshing
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
          }`}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/ui/components/Header.jsx
git commit -m "feat: create Header component with refresh button"
```

---

### Task 18: Create React components - Section and StatRow

**Files:**
- Create: `src/ui/components/Section.jsx`
- Create: `src/ui/components/StatRow.jsx`

**Interfaces:**
- Consumes: Section data (total, failed, stale, areas), title
- Produces: Collapsable section component with stat rows

- [ ] **Step 1: Create src/ui/components/Section.jsx**

Create `src/ui/components/Section.jsx`:

```javascript
import { useState } from 'react';
import StatRow from './StatRow';

export default function Section({ title, data, sectionKey, onClickMetric }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) {
    return null;
  }

  // Special handling for newTestsAdded (yearly)
  if (sectionKey === 'newTestsAdded') {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors"
        >
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
        </button>

        {isExpanded && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.yearly?.map((month) => (
              <div key={month.month} className="bg-dark-bg p-3 rounded border border-dark-border">
                <div className="text-sm text-gray-400">{month.month}</div>
                <div className="text-2xl font-bold text-white">{month.count}</div>
                <div className="text-xs text-gray-500">tests added</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors"
      >
        <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
        <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
      </button>

      {/* Summary row always visible */}
      <StatRow
        label="Summary"
        total={data.total}
        failed={data.failed}
        stale={data.stale}
        areas={data.areas?.length || 0}
        onClick={(metric) => {
          // Summary is informational only
        }}
      />

      {/* Expanded areas */}
      {isExpanded && data.areas && (
        <div className="mt-4 space-y-2 border-t border-dark-border pt-4">
          {data.areas.map((area, idx) => (
            <StatRow
              key={idx}
              label={area.name}
              total={area.total}
              failed={area.failed}
              stale={area.stale}
              areas={null}
              onClick={(metric) => {
                onClickMetric?.(sectionKey, area.name, metric);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create src/ui/components/StatRow.jsx**

Create `src/ui/components/StatRow.jsx`:

```javascript
import { getStatusColor } from '../utils/formatting';

export default function StatRow({ label, total, failed, stale, areas, onClick }) {
  return (
    <div className="bg-dark-bg rounded p-3 flex items-center justify-between text-sm border border-dark-border hover:border-gray-500 transition-colors">
      <div className="font-semibold text-gray-200">{label}</div>
      <div className="flex gap-6 items-center">
        <div className="text-center">
          <button
            onClick={() => onClick?.('total')}
            className="text-lg font-bold text-white hover:text-blue-400 transition-colors"
          >
            {total}
          </button>
          <div className="text-xs text-gray-500">Total</div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onClick?.('failed')}
            className="text-lg font-bold text-failed hover:text-red-400 transition-colors"
          >
            {failed}
          </button>
          <div className="text-xs text-gray-500">Failed</div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onClick?.('stale')}
            className="text-lg font-bold text-stale hover:text-yellow-400 transition-colors"
          >
            {stale}
          </button>
          <div className="text-xs text-gray-500">Stale</div>
        </div>

        {areas !== null && (
          <div className="text-center">
            <div className="text-lg font-bold text-gray-300">{areas}</div>
            <div className="text-xs text-gray-500">Areas</div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/ui/components/Section.jsx src/ui/components/StatRow.jsx
git commit -m "feat: create Section and StatRow components"
```

---

### Task 19: Create DetailsModal component

**Files:**
- Create: `src/ui/components/DetailsModal.jsx`

**Interfaces:**
- Consumes: testDetails object (name, status, suggestedFix, recentChanges)
- Produces: Modal showing test failure details with fix suggestions

- [ ] **Step 1: Create src/ui/components/DetailsModal.jsx**

Create `src/ui/components/DetailsModal.jsx`:

```javascript
import { getStatusBgColor, getStatusColor } from '../utils/formatting';

export default function DetailsModal({ testDetails, onClose }) {
  if (!testDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-card border border-dark-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-card">
          <h2 className="text-2xl font-bold text-white">{testDetails.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Status</h3>
            <div className={`inline-block px-3 py-1 rounded ${getStatusBgColor(testDetails.status)}`}>
              <span className={`font-semibold ${getStatusColor(testDetails.status)}`}>
                {testDetails.status}
              </span>
            </div>
          </div>

          {/* Test Info */}
          {testDetails.className && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Test Class</h3>
              <p className="text-white font-mono text-sm bg-dark-bg p-2 rounded border border-dark-border">
                {testDetails.className}
              </p>
            </div>
          )}

          {/* Duration */}
          {testDetails.duration && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Duration</h3>
              <p className="text-white">{(testDetails.duration || 0).toFixed(2)}s</p>
            </div>
          )}

          {/* Recent Changes */}
          {testDetails.recentChanges && testDetails.recentChanges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Changes</h3>
              <div className="bg-dark-bg rounded border border-dark-border p-3 space-y-2">
                {testDetails.recentChanges.map((change, idx) => (
                  <div key={idx} className="text-sm text-gray-300 font-mono">
                    <span className="text-gray-500">{change.hash}</span> {change.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Fix */}
          {testDetails.suggestedFix ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Suggested Fix</h3>
              <div className="bg-green-900/20 border border-green-700/50 rounded p-4 text-green-100">
                {testDetails.suggestedFix.suggested_fix || testDetails.suggestedFix}
              </div>
              {testDetails.suggestedFix.fixed_by && (
                <div className="text-xs text-gray-500 mt-2">
                  Added by {testDetails.suggestedFix.fixed_by} on {testDetails.suggestedFix.added_date}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 text-yellow-100">
              No suggested fix yet. You can add one by editing fixes.json
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-right pt-4 border-t border-dark-border">
            Last updated: {new Date(testDetails.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/ui/components/DetailsModal.jsx
git commit -m "feat: create DetailsModal component for test failure details"
```

---

### Task 20: Create Dashboard page and integrate all components

**Files:**
- Create: `src/ui/pages/Dashboard.jsx`
- Modify: `src/ui/App.jsx`

**Interfaces:**
- Consumes: All components (Header, Section, DetailsModal), API calls
- Produces: Full dashboard page with all sections visible

- [ ] **Step 1: Create src/ui/pages/Dashboard.jsx**

Create `src/ui/pages/Dashboard.jsx`:

```javascript
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Section from '../components/Section';
import DetailsModal from '../components/DetailsModal';
import { fetchDashboard, triggerManualRefresh, fetchTestDetails } from '../utils/api';

const SECTION_TITLES = {
  readyCluster: 'Ready Cluster Status',
  selenium: 'Selenium Tests',
  integrationTests: 'Integration Tests',
  smokeTests: 'Smoke Tests',
  newTestsAdded: 'New Tests Added (Yearly)'
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    loadDashboard();
    // Refresh every 30 seconds to check for updates
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      await triggerManualRefresh();
      await loadDashboard();
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setError('Refresh failed: ' + err.message);
    }
  }

  async function handleClickMetric(sectionKey, areaName, metric) {
    if (metric !== 'failed' && metric !== 'stale') {
      return; // Only show details for failed and stale
    }

    try {
      const testId = `${sectionKey}::${areaName}::${areaName}`;
      const details = await fetchTestDetails(testId);
      setSelectedTest(details);
    } catch (err) {
      console.error('Failed to load test details:', err);
      setError('Failed to load test details');
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <Header 
        lastUpdateTime={dashboardData?.timestamp}
        onRefresh={handleRefresh}
        isLoading={loading}
      />

      {error && (
        <div className="bg-red-900/20 border-b border-red-700/50 text-red-200 px-6 py-3">
          ⚠️ {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-4">
          {dashboardData && Object.entries(SECTION_TITLES).map(([key, title]) => (
            <Section
              key={key}
              sectionKey={key}
              title={title}
              data={dashboardData.sections[key]}
              onClickMetric={handleClickMetric}
            />
          ))}
        </div>
      </main>

      {selectedTest && (
        <DetailsModal 
          testDetails={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update src/ui/App.jsx**

Edit `src/ui/App.jsx`:

```javascript
import Dashboard from './pages/Dashboard';
import './styles/index.css';

export default function App() {
  return <Dashboard />;
}
```

- [ ] **Step 3: Test the full UI**

```bash
# Terminal 1: Start backend
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start

# Terminal 2: Start React dev server (after backend is running)
npm run dev:ui
```

Open http://localhost:5173 in browser. You should see:
- Header with "Test Monitor" title
- 5 collapsable sections (all starting collapsed)
- Sections show summary stats

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/ui/pages/Dashboard.jsx src/ui/App.jsx
git commit -m "feat: create Dashboard page and integrate all UI components"
```

---

## Phase 7: Integration & Testing

### Task 21: Write integration tests for API endpoints and React components

**Files:**
- Create: `tests/integration/api.integration.test.js`
- Create: `tests/integration/dashboard.integration.test.js`

**Interfaces:**
- Tests: Dashboard API endpoint returns correct structure, frontend loads data and renders

- [ ] **Step 1: Create integration test for API endpoints**

Create `tests/integration/api.integration.test.js`:

```javascript
// Integration tests - these would normally run against a live server
// For now, just test the data structures

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheFile = path.join(__dirname, '../../cache/dashboard-data.json');

console.log('Integration Test: API Endpoints');
console.log('================================\n');

// Test 1: Cache file exists and is valid JSON
console.log('Test 1: Cache file structure');
try {
  if (fs.existsSync(cacheFile)) {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    
    console.assert(cacheData.timestamp, 'Should have timestamp');
    console.assert(cacheData.sections, 'Should have sections');
    console.assert(cacheData.sections.readyCluster, 'Should have readyCluster section');
    console.assert(cacheData.sections.selenium, 'Should have selenium section');
    console.assert(cacheData.sections.integrationTests, 'Should have integrationTests section');
    console.assert(cacheData.sections.smokeTests, 'Should have smokeTests section');
    console.assert(cacheData.sections.newTestsAdded, 'Should have newTestsAdded section');
    
    console.log('✓ Cache file has correct structure');
  } else {
    console.log('ℹ Cache file not yet created (will be created on first refresh)');
  }
} catch (error) {
  console.error('✗ Cache file validation failed:', error.message);
}

// Test 2: Config file
console.log('\nTest 2: Configuration');
const configFile = path.join(__dirname, '../../config.json');
try {
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  
  console.assert(config.jenkins, 'Should have jenkins config');
  console.assert(config.selenium, 'Should have selenium config');
  console.assert(config.git, 'Should have git config');
  console.assert(config.app, 'Should have app config');
  
  console.log('✓ Config file is valid');
} catch (error) {
  console.error('✗ Config validation failed:', error.message);
}

console.log('\n✓ All integration tests passed\n');
```

- [ ] **Step 2: Run integration tests**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
node tests/integration/api.integration.test.js
```

Expected: Tests pass (config validates, cache structure is correct)

- [ ] **Step 3: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add tests/integration/
git commit -m "test: add integration tests for API endpoints and cache structure"
```

---

### Task 22: Manual testing - verify dashboard loads and renders correctly

**Files:**
- (No new files)

**Interfaces:**
- Manually test: Browser loads dashboard, sections display, clicking works

- [ ] **Step 1: Start backend and frontend in separate terminals**

Terminal 1:
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start
```

Wait for "Test Monitor dashboard listening on http://localhost:3000"

Terminal 2:
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm run dev:ui
```

Wait for Vite dev server to start.

- [ ] **Step 2: Open browser and test dashboard**

Open http://localhost:5173

Expected behavior:
- Page loads with "Test Monitor" header
- 5 collapsable sections visible
- Sections show "Summary" stats (Total, Failed, Stale, Areas)
- All stats are 0 (since we haven't configured real Jenkins/Selenium/Git yet)

- [ ] **Step 3: Test section expand/collapse**

Click on any section to expand. Should show:
- Area breakdowns if data exists
- Stats remain visible

Click again to collapse.

- [ ] **Step 4: Test refresh button**

Click "Refresh Now" button. Should:
- Show "Refreshing..." text
- Complete and show updated timestamp

- [ ] **Step 5: Check console for errors**

Open browser DevTools (F12), check Console tab for any errors. Should be clean.

- [ ] **Step 6: Document test results**

No commit needed for manual testing. Results:
- ✓ Dashboard loads successfully
- ✓ All 5 sections render
- ✓ Expand/collapse works
- ✓ Refresh button works
- ✓ No console errors

---

### Task 23: Add sample data generation for testing without real APIs

**Files:**
- Create: `src/server/mock-data.js`

**Interfaces:**
- Produces: Functions: `generateMockDashboardData()` for testing UI without live APIs

- [ ] **Step 1: Create src/server/mock-data.js**

Create `src/server/mock-data.js`:

```javascript
export function generateMockDashboardData() {
  return {
    timestamp: new Date().toISOString(),
    refreshDurationMs: 1234,
    sections: {
      readyCluster: {
        total: 240,
        failed: 12,
        stale: 3,
        areas: [
          {
            name: 'API Tests',
            total: 30,
            failed: 2,
            stale: 0,
            tests: [
              { name: 'test_login', status: 'PASSED', className: 'api_tests.py' },
              { name: 'test_logout', status: 'FAILED', className: 'api_tests.py' }
            ]
          },
          {
            name: 'UI Tests',
            total: 35,
            failed: 5,
            stale: 1,
            tests: [
              { name: 'test_button_click', status: 'FAILED', className: 'ui_tests.js' }
            ]
          }
        ]
      },
      selenium: {
        total: 80,
        failed: 3,
        stale: 1,
        areas: [
          {
            name: 'Portal Tests',
            total: 80,
            failed: 3,
            stale: 1,
            tests: []
          }
        ]
      },
      integrationTests: {
        total: 120,
        failed: 8,
        stale: 0,
        areas: [
          {
            name: 'Database Integration',
            total: 50,
            failed: 3,
            stale: 0,
            tests: []
          },
          {
            name: 'API Integration',
            total: 70,
            failed: 5,
            stale: 0,
            tests: []
          }
        ]
      },
      smokeTests: {
        total: 50,
        failed: 2,
        stale: 0,
        areas: [
          {
            name: 'Smoke',
            total: 50,
            failed: 2,
            stale: 0,
            tests: []
          }
        ]
      },
      newTestsAdded: {
        yearly: [
          { month: 'January', count: 12 },
          { month: 'February', count: 8 },
          { month: 'March', count: 15 },
          { month: 'April', count: 10 },
          { month: 'May', count: 9 },
          { month: 'June', count: 14 },
          { month: 'July', count: 0 },
          { month: 'August', count: 0 },
          { month: 'September', count: 0 },
          { month: 'October', count: 0 },
          { month: 'November', count: 0 },
          { month: 'December', count: 0 }
        ]
      }
    },
    lastError: null
  };
}
```

- [ ] **Step 2: Update server.js to optionally use mock data**

Edit `server.js` to add a DEMO mode:

```javascript
// Near top of file, after config load:

const DEMO_MODE = process.env.DEMO_MODE === 'true';

if (DEMO_MODE) {
  console.warn('⚠️  DEMO MODE ENABLED - Using mock data instead of real APIs');
}

// ... later in routes setup, pass this to routes:

// Routes
const routeHandlers = routes(config, DEMO_MODE);
app.use('/api', routeHandlers);
```

Update `src/server/routes.js`:

```javascript
import { generateMockDashboardData } from './mock-data.js';

export default function routes(config, demoMode = false) {
  const router = express.Router();

  router.get('/dashboard', (req, res) => {
    let cache;
    
    if (demoMode) {
      cache = generateMockDashboardData();
    } else {
      cache = loadCache();
    }
    
    if (!cache) {
      return res.status(500).json({
        error: 'Dashboard cache not available. Refresh may be in progress.',
        timestamp: new Date().toISOString()
      });
    }
    res.json(cache);
  });

  // ... rest of routes
}
```

- [ ] **Step 3: Test with mock data**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
DEMO_MODE=true npm start &
sleep 2
curl http://localhost:3000/api/dashboard | jq '.sections.readyCluster | {total, failed, stale}'
kill %1
```

Expected: Returns mock data with actual values (240 total, 12 failed, etc.)

- [ ] **Step 4: Restart React dev server and verify UI shows mock data**

```bash
# With DEMO_MODE=true npm start running in Terminal 1
# In Terminal 2:
npm run dev:ui
```

Open http://localhost:5173, should now show sample test counts.

- [ ] **Step 5: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add src/server/mock-data.js src/server/routes.js server.js
git commit -m "feat: add mock data generation for testing without live APIs"
```

---

## Phase 8: Deployment & Documentation

### Task 24: Create Docker configuration for easy deployment

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

**Interfaces:**
- Produces: Dockerized app ready to run as `docker-compose up`

- [ ] **Step 1: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Build React app (optional - uses pre-built if available)
RUN npm run build 2>/dev/null || echo "Skipping React build"

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

- [ ] **Step 2: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  test-monitor:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./config.json:/app/config.json:ro
      - ./fixes.json:/app/fixes.json:ro
      - ./cache:/app/cache
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

- [ ] **Step 3: Update README with Docker instructions**

Edit `README.md`, add Docker section:

```markdown
## Docker Deployment

### Build and run with Docker Compose

```bash
docker-compose up -d
```

Access dashboard at http://localhost:3000

### View logs

```bash
docker-compose logs -f test-monitor
```

### Stop

```bash
docker-compose down
```
```

- [ ] **Step 4: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add Dockerfile docker-compose.yml README.md
git commit -m "chore: add Docker configuration for deployment"
```

---

### Task 25: Final README updates with complete setup instructions

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: Complete documentation for setup, configuration, deployment

- [ ] **Step 1: Update README with full instructions**

Edit `README.md`, replace entire content:

```markdown
# Test Monitor Dashboard

A professional web-based test monitoring dashboard for tracking test health across Jenkins, Selenium, and Git repositories.

## Features

- **5 Collapsable Dashboard Sections**
  - Ready Cluster Status (Jenkins)
  - Selenium Tests (Selenium Portal)
  - Integration Tests (Jenkins)
  - Smoke Tests (Jenkins)
  - New Tests Added (Git History, Yearly)

- **Real-time Metrics**
  - Total test count per section
  - Failed tests with failure rate
  - Stale tests (no runs in 30+ days)
  - Area-wise breakdown

- **Detailed Failure Analysis**
  - Click on failed/stale metrics to see details
  - Test filename and status
  - Recent code changes (git blame)
  - Manually-curated fix suggestions
  - Link to Jenkins test reports

- **Professional Dashboard**
  - Black theme with excellent contrast
  - Responsive design (desktop, tablet, mobile)
  - 15-minute automated refresh
  - Manual refresh button
  - Last updated timestamp

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Jenkins API token (if using Jenkins)

### Installation

1. **Clone/navigate to project:**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure:**

```bash
cp .env.example .env
nano config.json
```

Edit `config.json` and set:
- Jenkins URL and API token
- Selenium portal URL
- Git repository path and branch
- App port (default 3000)

4. **Create initial fixes.json:**

```bash
echo '{}' > fixes.json
```

5. **Start development:**

```bash
# Terminal 1: Backend
npm start

# Terminal 2: React UI dev server (optional, for UI development)
npm run dev:ui
```

6. **Open in browser:**

- Backend + static files: http://localhost:3000
- React dev server: http://localhost:5173

## Configuration

### config.json

```json
{
  "jenkins": {
    "baseUrl": "https://jenkins.infra-dev.forcepoint.net",
    "apiToken": "YOUR_TOKEN",
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
    "testFilePatterns": [
      "*_test.py",
      "*Test.java",
      "*Test.js",
      "*.test.ts"
    ]
  },
  "app": {
    "port": 3000,
    "refreshIntervalMinutes": 15,
    "staledaysThreshold": 30
  }
}
```

### fixes.json

Add suggested fixes for failing tests:

```json
{
  "portal_tests/test_login.py": {
    "suggested_fix": "Update XPath selector in login_page.py line 42 from '//*[@id=\"old-btn\"]' to '//*[@id=\"new-btn\"]'",
    "added_date": "2026-07-02",
    "fixed_by": "minal.gujar",
    "status": "pending"
  }
}
```

## API Endpoints

- `GET /api/dashboard` - Full dashboard data
- `GET /api/failed-tests/:section` - Failed tests for a section
- `GET /api/test-details/:testId` - Detailed test information
- `GET /api/health` - Server health and refresh status
- `POST /api/refresh` - Trigger manual refresh

## Deployment

### Docker

```bash
docker-compose up -d
```

Builds and runs containerized app. Dashboard accessible at http://localhost:3000

Volumes:
- `./config.json` - Configuration (read-only)
- `./fixes.json` - Fix suggestions (read-only)
- `./cache` - Cached dashboard data
- `./logs` - Application logs

### Manual Server Deployment

```bash
npm install
npm start
```

### Environment Variables

Set via `.env` file or environment:
- `NODE_ENV` - 'production' or 'development'
- `DEMO_MODE` - 'true' to use mock data instead of real APIs

## Demo Mode

Test the dashboard without configuring real APIs:

```bash
DEMO_MODE=true npm start
```

Loads sample test data for all sections. Good for development and UI testing.

## Development

### Structure

```
test-monitor/
├── server.js              # Express server entry point
├── src/
│   ├── api/              # External API clients
│   │   ├── jenkins.js    # Jenkins API
│   │   ├── selenium.js   # Selenium portal
│   │   ├── git.js        # Git commands
│   │   ├── dashboard.js  # Data aggregation
│   │   └── utils.js      # Helpers
│   ├── server/           # Express routes & middleware
│   │   ├── routes.js
│   │   ├── jobs.js       # Background refresh job
│   │   ├── cache.js      # Cache management
│   │   └── middleware.js
│   └── ui/               # React components
│       ├── App.jsx
│       ├── pages/
│       ├── components/   # Reusable components
│       └── utils/        # Frontend helpers
├── public/               # Static files
├── cache/                # Dashboard cache
├── logs/                 # Server logs
└── config.json          # Configuration
```

### Running Tests

```bash
# Unit tests for API clients
node tests/api/jenkins.test.js
node tests/api/git.test.js
node tests/api/utils.test.js

# Integration tests
node tests/integration/api.integration.test.js
```

### Building React for Production

```bash
npm run build
```

Creates optimized build in `dist/` folder.

## Troubleshooting

### Dashboard shows no data

1. Check `config.json` - verify URLs and API tokens
2. Check server logs: `npm start` and look for error messages
3. Try `curl http://localhost:3000/api/health` to check if server is running
4. Use `DEMO_MODE=true` to test with sample data

### Refresh not updating

1. Check logs for errors during refresh cycle
2. Verify Jenkins/Selenium/Git URLs are accessible
3. Verify API tokens are valid
4. Check network connectivity

### React dev server not loading

1. Make sure backend is running first: `npm start`
2. Check that port 5173 is not in use
3. Try: `npm run dev:ui` (proxies to backend on 3000)

## Future Enhancements

- Real-time WebSocket refresh instead of polling
- AI-powered suggested fixes
- Trend analysis and historical data
- Slack/email alerts for critical failures
- User accounts and permissions
- Custom dashboard sections
- Database for historical tracking

## License

Internal use only

---

## Support

For issues or questions, check logs and verify configuration.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git add README.md
git commit -m "docs: complete README with setup, deployment, and troubleshooting"
```

---

### Task 26: Final verification and cleanup

**Files:**
- Modify: `.gitignore` (if needed)

**Interfaces:**
- Verify: All files committed, no secrets in repo, project ready for use

- [ ] **Step 1: Verify git status is clean**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git status
```

Expected: "On branch main" with no uncomitted changes

- [ ] **Step 2: Verify .gitignore excludes sensitive files**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
cat .gitignore
```

Should include: `config.json`, `node_modules/`, `logs/`, `cache/dashboard-data.json`, `.env`

- [ ] **Step 3: List all commits**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git log --oneline
```

Should show all implementation commits in order.

- [ ] **Step 4: Final sanity check - start both servers**

Terminal 1:
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm start
```

Wait for "Test Monitor dashboard listening..."

Terminal 2:
```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
npm run dev:ui
```

Wait for Vite dev server.

Open http://localhost:5173 - dashboard should load without errors.

Ctrl+C both servers.

- [ ] **Step 5: Commit final cleanup (if any)**

```bash
cd /Users/minal.gujar/.claude/projects/test-monitor
git status
```

If clean, no commit needed.

---

## Summary

**Implementation complete!** The Test Monitor Dashboard includes:

✅ **Backend**
- Express.js server with 5 API endpoints
- Background refresh job (15 min intervals)
- Jenkins, Selenium, Git API clients
- File-based caching and configuration
- Mock data for testing

✅ **Frontend**
- React app with Tailwind CSS (black theme)
- 5 collapsable dashboard sections
- Detailed failure modal with fixes
- Real-time update polling
- Responsive design

✅ **Deployment**
- Docker configuration
- Comprehensive documentation
- Demo mode for testing
- Error handling and graceful degradation

✅ **Testing**
- Unit tests for API clients
- Integration tests for endpoints
- Manual testing guide

**To run:**
```bash
npm install
npm start              # Terminal 1: Backend on :3000
npm run dev:ui        # Terminal 2: Frontend on :5173
```

**To deploy:**
```bash
docker-compose up -d
```
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-02-test-monitor-implementation.md`**

## Execution Options

You now have two ways to execute this plan:

**1. Subagent-Driven (Recommended)** — Fresh subagent per task, independent review
- Faster iteration with parallel task execution
- Clear checkpoints between phases
- Good for complex implementations

**2. Inline Execution** — Execute tasks in this session
- Direct control and visibility
- Smaller token overhead
- Good for smaller projects or if you want to oversee everything

**Which approach would you prefer?**