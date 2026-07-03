# Test Monitor Dashboard

A professional web-based test monitoring dashboard for tracking test health across Jenkins, Selenium, and Git repositories. Features real-time metrics, automated refresh, and detailed test failure analysis with manual fix suggestions.

## Features

- **5 Dashboard Sections**: Ready Cluster, Selenium, Integration, Smoke, New Tests Added
- **Real-time Metrics**: Total tests, Failed, Stale, Area-wise breakdown
- **Detailed Analysis**: Click metrics to see failure details and error messages
- **Automated Refresh**: 15-minute refresh cycle with manual trigger option
- **Dark Theme UI**: Professional black dashboard with responsive design
- **Manual Fixes**: Track fix suggestions with status and owner tracking
- **Demo Mode**: Built-in mock data for testing without live connections
- **Multi-Source**: Aggregates data from Jenkins, Selenium, and Git
- **File-Based Storage**: No database required, JSON-based caching

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd test-monitor
   ```

2. Copy and configure:
   ```bash
   cp .env.example .env
   # Edit config.json with your Jenkins API token, URLs, and git paths
   cp config.json.example config.json
   nano config.json
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

### Environment Variables

```bash
# Demo mode - use mock data instead of real test sources
DEMO_MODE=true

# Node environment
NODE_ENV=production  # or development

# Optional: Logging level
LOG_LEVEL=info       # debug, info, warn, error
```

To run in demo mode:
```bash
DEMO_MODE=true npm start
```

## Docker Deployment

### Using Docker Compose (Recommended)

The easiest way to deploy:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f test-monitor

# Stop the container
docker-compose down
```

The container will:
- Build the React frontend with Vite
- Install dependencies in production mode
- Expose the dashboard on `http://localhost:3000`
- Mount volumes for persistent data (config, cache, logs)

### Using Docker CLI

Build the image:
```bash
docker build -t test-monitor:latest .
```

Run the container:
```bash
docker run -d \
  --name test-monitor \
  -p 3000:3000 \
  -v $(pwd)/config.json:/app/config.json:ro \
  -v $(pwd)/cache:/app/cache \
  -v $(pwd)/logs:/app/logs \
  test-monitor:latest
```

### Docker Environment Variables

Pass environment variables to Docker:
```bash
docker run -d \
  -p 3000:3000 \
  -e DEMO_MODE=true \
  -e NODE_ENV=production \
  test-monitor:latest
```

## Demo Mode

Demo mode provides realistic mock data without requiring live connections to Jenkins, Selenium, or Git:

### Enable Demo Mode

```bash
# Command line
DEMO_MODE=true npm start

# Docker Compose - uncomment in docker-compose.yml
# DEMO_MODE: "true"

# Docker CLI
docker run -e DEMO_MODE=true ...
```

When demo mode is enabled:
- The `/api/dashboard` endpoint returns realistic mock test data
- Dashboard shows ~263 tests across 5 sections
- Includes realistic failure rates (~5%) and stale tests (~3%)
- Perfect for testing UI and features without live data sources

The mock data includes:
- Various test status values (PASSED, FAILED, STALE)
- Realistic error messages
- Duration measurements
- Area-wise organization (Authentication, API, UI, Performance, Security)
- Last run timestamps

Example request:
```bash
DEMO_MODE=true npm start
# Then visit: http://localhost:3000/api/dashboard
```

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

## API Endpoints

### Dashboard Data
- `GET /api/dashboard` - Returns full dashboard with all test sections
  - Response includes sections, summary, timestamp, last error
  - Uses real data or mock data (if DEMO_MODE enabled)
  - Status: 200 (success), 503 (cache not available)

### Test Details
- `GET /api/failed-tests/:section` - Failed tests for a specific section
  - Parameters: section (readyCluster, selenium, integrationTests, smokeTests, newTestsAdded)
  - Returns array of failed tests with error details
  - Status: 200 (success), 503 (cache unavailable)

- `GET /api/test-details/:testId` - Detailed information for a specific test
  - Returns full test details including history and metadata
  - Status: 200 (success), 404 (test not found), 503 (cache unavailable)

### System
- `POST /api/refresh` - Trigger manual data refresh
  - Initiates background job to fetch latest test data
  - Returns status and estimated completion time
  - Status: 200 (triggered), 500 (error)

- `GET /api/health` - Server health status
  - Returns uptime, cache status, last refresh time
  - Status: 200 (healthy), 503 (degraded)

### Example API Usage

```bash
# Get dashboard data
curl http://localhost:3000/api/dashboard | jq .

# Get failed tests from integration section
curl http://localhost:3000/api/failed-tests/integrationTests | jq .

# Get specific test details
curl http://localhost:3000/api/test-details/test-123 | jq .

# Trigger refresh
curl -X POST http://localhost:3000/api/refresh

# Check health
curl http://localhost:3000/api/health | jq .
```

## Troubleshooting

### Dashboard shows "Cache not available"
- **Cause:** Application just started or previous refresh failed
- **Solution:** Wait 30 seconds for initial refresh to complete, or manually trigger refresh via UI

### Config validation errors
- **Cause:** config.json has invalid JSON or missing required fields
- **Solution:** 
  ```bash
  # Validate JSON syntax
  cat config.json | jq .
  
  # Check required fields
  npm test
  ```
- **Fix:** Copy from .env.example and fill in your values

### Jenkins authentication failed
- **Cause:** Invalid API token or wrong Jenkins URL
- **Solution:**
  - Verify Jenkins URL is accessible: `curl -I https://your-jenkins-url`
  - Generate new API token in Jenkins user profile
  - Test authentication: `curl -u username:token https://jenkins-url/api/json`

### Cache file corruption
- **Cause:** Interrupted write or disk error
- **Solution:**
  ```bash
  # Remove corrupted cache
  rm cache/dashboard-data.json
  
  # Server will recreate on next run
  npm start
  ```

### Docker container exits immediately
- **Cause:** Missing config.json or invalid configuration
- **Solution:**
  ```bash
  # Check logs
  docker-compose logs test-monitor
  
  # Verify config.json exists
  ls -la config.json
  
  # Run in foreground to see errors
  docker-compose up test-monitor
  ```

### Port 3000 already in use
- **Solution:**
  ```bash
  # Find what's using port 3000
  lsof -i :3000
  
  # Use different port in config.json
  # Or kill the process: kill -9 <PID>
  ```

## Future Enhancements

### Planned Features
- **Slack Integration:** Send alerts for test failures
- **Email Reports:** Daily/weekly test health summaries
- **Test History:** Track test performance trends over time
- **Database Backend:** Replace JSON files with PostgreSQL/MongoDB
- **Advanced Filtering:** Filter by area, test type, failure reason
- **Performance Metrics:** Track test execution time trends
- **Retry Logic:** Auto-retry failed tests and track retry patterns
- **Test Flakiness Detection:** Identify and highlight flaky tests
- **Metrics Export:** Prometheus/Grafana integration
- **Authentication:** User login and role-based access
- **Test Categorization:** Organize tests by team, feature, criticality
- **Custom Dashboards:** Allow users to create filtered views

### Architecture Improvements
- **Caching Strategy:** Implement Redis for faster cache operations
- **Job Queue:** Use Bull/RabbitMQ for background job management
- **GraphQL API:** Alternative API layer alongside REST
- **Web Sockets:** Real-time updates via server push
- **Rate Limiting:** Add API rate limits and throttling
- **API Versioning:** Support multiple API versions

## Architecture

- **Backend:** Express.js with background refresh job (node-cron)
- **Frontend:** React with Tailwind CSS
- **Storage:** JSON files (no database)
- **Data Sources:** Jenkins API, Selenium portal, Git commands
- **Deployment:** Docker and Docker Compose support
- **Demo Mode:** Built-in mock data generation

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
