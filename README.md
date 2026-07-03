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
