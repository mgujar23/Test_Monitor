# Test Monitor Setup Guide

Complete step-by-step instructions to configure and deploy the Test Monitor dashboard for your team.

## Quick Navigation

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Perforce Setup](#perforce-setup)
5. [Jenkins Setup](#jenkins-setup)
6. [Running the Application](#running-the-application)
7. [Using the Dashboard](#using-the-dashboard)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure your system has the following installed:

- **Node.js 18+** and npm (verify with `node --version`)
- **Git** (verify with `git --version`)
- **Perforce CLI (p4)** — [download here](https://www.perforce.com/downloads/helix-command-line-client)
- Access to Perforce and Jenkins instances
- Valid credentials for both services

> **Note:** This guide assumes you're on macOS or Linux. Windows users may need to adjust path syntax in commands.

## Installation

### Clone the Repository

```bash
git clone https://github.com/mgujar23/Test_Monitor.git
cd Test_Monitor
```

### Install Dependencies

```bash
npm install
```

This installs all required npm packages including Express, Axios, and other dependencies.

### Verify Installation

```bash
npm run build
```

This builds the React frontend. If successful, you should see a `dist/` folder created.

## Configuration

### Create Config File

Copy the example config and customize it:

```bash
cp config.example.json config.json
```

### Edit config.json

Open `config.json` and fill in your environment-specific values:

```json
{
  "jenkins": {
    "baseUrl": "https://jenkins.your-domain.com",
    "apiToken": "your-jenkins-api-token-here",
    "jobs": {
      "readyCluster": "/job/Projects/job/Test/job/ReadyCluster/",
      "integrationTests": "/job/Projects/job/Test/job/IntegrationTests/",
      "smokeTests": "/job/Projects/job/Test/job/SmokeTest/"
    }
  },
  "perforce": {
    "serverUrl": "perforce.your-domain.com:1666",
    "username": "your-p4-username",
    "apiToken": "your-p4-api-token",
    "depotPath": "//code_SaaS/csg_service/portal_ui/dev/portal/tests/selenium/portal_tests"
  },
  "app": {
    "port": 3000,
    "refreshIntervalMinutes": 15
  }
}
```

| Field | Description |
|-------|-------------|
| `jenkins.baseUrl` | Your Jenkins server URL (without trailing slash) |
| `jenkins.apiToken` | API token from your Jenkins user profile |
| `jenkins.jobs.*` | Job paths for ReadyCluster, IntegrationTests, and SmokeTests |
| `perforce.serverUrl` | Perforce server address with port |
| `perforce.username` | Your Perforce username |
| `perforce.apiToken` | P4 authentication token (or password) |
| `perforce.depotPath` | Path to your test files in Perforce |
| `app.port` | Port for the dashboard (default: 3000) |
| `app.refreshIntervalMinutes` | How often to refresh data (default: 15 minutes) |

> **Security Warning:** Never commit `config.json` to version control. Add it to `.gitignore` to protect credentials.

## Perforce Setup

### Step 1: Verify P4 Installation

```bash
p4 -V
```

You should see version information. If not, install the [P4 CLI](https://www.perforce.com/downloads/helix-command-line-client).

### Step 2: Configure P4 Connection

Set environment variables for P4:

```bash
export P4PORT=perforce.your-domain.com:1666
export P4USER=your-username
```

### Step 3: Authenticate with P4

Create a persistent ticket:

```bash
p4 login
```

Enter your Perforce password when prompted. This creates a cached ticket at `~/.p4tickets` that persists across sessions.

### Step 4: Verify Connection

```bash
p4 info
```

You should see connection information. If you get an error, check your P4PORT and credentials.

> **Tip:** The p4 ticket approach is more reliable than storing passwords in config. The application automatically uses cached tickets via the p4 CLI.

## Jenkins Setup

### Step 1: Generate Jenkins API Token

1. Log in to your Jenkins instance
2. Click your username in the top-right corner
3. Select "Configure"
4. Under "API Token", click "Add new Token"
5. Give it a name (e.g., "Test-Monitor")
6. Copy the generated token
7. Paste it into `config.json` under `jenkins.apiToken`

### Step 2: Verify Job Paths

In Jenkins, navigate to each job and verify the paths match your config:

- ReadyCluster job URL
- IntegrationTests job URL
- SmokeTest job URL

The paths should follow the pattern: `/job/Projects/job/Test/job/YourJobName/`

> **Note:** Ensure your Jenkins user has read access to these job test reports.

## Running the Application

### Start the Server

```bash
npm start
```

The application will:

- Clear any stale cache
- Initialize the dashboard
- Start fetching data from Perforce, Jenkins, and Selenium
- Begin background refresh job (every 15 minutes by default)
- Listen on `http://localhost:3000`

### Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

Initial data fetch may take 30-60 seconds. Wait for logs to show:

```
[Jobs] Dashboard refresh completed in XXXms
```

### Development Mode (Optional)

To run with verbose logging and auto-reload:

```bash
DEBUG=true npm start
```

To suppress detailed logging:

```bash
DEBUG=false npm start
```

> **Important:** If port 3000 is in use, the app will automatically kill the existing process and restart. You can specify a different port in `config.json`.

## Using the Dashboard

### Dashboard Sections

**Ready Cluster**
- Shows latest cluster test builds
- Displays recent changes from Git
- Click "See details here" for full build information

**Integration Tests**
- Aggregates test counts from IntTest-Canonical and IntTest-Shadow jobs
- Click on metrics to drill down by area
- Shows sample test files with status and recent changes

**Smoke Tests**
- Quick health checks on core services
- Fast feedback on deployment readiness

**Selenium Tests**
- Portal test results from Selenium
- Broken down by functional areas

**New Tests Added (Yearly)**
- Switch between "By Year" and "By Area" views
- See which areas are getting test coverage
- View specific files, authors, and dates

### Common Actions

**View Test Details:** Click a test file → See suggested fixes (for failed tests) or "N/A" (for passing tests)

**See Code Changes:** Click "View Diff" on a test to see code changes related to that test

**Filter by Status:** Click on metric boxes (Total, Failed, Passed, Stale) to filter tests by status

> **Tip:** The dashboard auto-refreshes every 15 minutes (configurable). Manual refresh is not needed — just keep the page open.

## Troubleshooting

### Port 3000 Already in Use

**Issue:** Error: "listen EADDRINUSE: address already in use :::3000"

**Solution:** The app automatically kills any existing process on port 3000 on startup. If you still see this error:

```bash
lsof -ti:3000 | xargs kill -9
npm start
```

Or specify a different port in `config.json`

### Perforce Authentication Failed

**Issue:** "Perforce password (P4PASSWD) invalid or unset"

**Solution:** Re-authenticate with Perforce:

```bash
export P4PORT=perforce.your-domain.com:1666
export P4USER=your-username
p4 login
```

Enter your password. This creates a fresh ticket. Then restart the app.

### Jenkins Connection Timeout

**Issue:** Dashboard loads but Jenkins data is missing

**Solution:** Check Jenkins URL and API token:

1. Verify `jenkins.baseUrl` is correct (no trailing slash)
2. Verify API token is still valid (regenerate if needed)
3. Check network connectivity to Jenkins
4. Look at server logs for detailed error messages

### No Data Showing After First Load

**Issue:** Dashboard loaded but all sections show zero tests

**Solution:** Check the server logs for errors. Common issues:

- Incorrect Perforce depot path in config
- Jenkins jobs don't exist or are misspelled
- Selenium portal URL is unreachable
- Credentials expired — re-authenticate

### Cache Issues

The dashboard caches data for 15 minutes. To force a refresh:

1. Stop the server (`Ctrl+C`)
2. Delete the cache: `rm -rf cache/`
3. Restart: `npm start`

### Logging and Debugging

To see full debug output:

```bash
DEBUG=true npm start
```

Look for logs like:

- `[P4] Found X changes` — Perforce is working
- `[Integration] SCRAPED: Total=X, Failed=Y` — Jenkins is working
- `[Selenium] Parsed X total tests` — Selenium is working

### Report an Issue

If you encounter a problem not covered here:

1. Collect server logs: run with `DEBUG=true npm start`
2. Note the exact error message
3. Check your config.json (don't share credentials)
4. Open an issue on [GitHub](https://github.com/mgujar23/Test_Monitor)

---

**Test Monitor Setup Guide** — Last updated July 2026
