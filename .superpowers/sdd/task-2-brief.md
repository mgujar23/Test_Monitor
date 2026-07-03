# Task 2: Create configuration template files

**Phase:** 1 - Project Setup  
**Goal:** Create three configuration template files for Jenkins, Selenium, Git, and app settings.

## Requirements

Create exactly these three files in `/Users/minal.gujar/.claude/projects/test-monitor/`:

### File 1: config.json
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

### File 2: fixes.json
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

### File 3: .env.example
```
JENKINS_API_TOKEN=your_token_here
JENKINS_BASE_URL=https://jenkins.infra-dev.forcepoint.net
SELENIUM_PORTAL_URL=https://cluster-c30.dev-rd.forcepoint.net/selenium/portal_results/
GIT_REPO_PATH=/path/to/repo
GIT_BRANCH=dev/portal
APP_PORT=3000
REFRESH_INTERVAL_MINUTES=15
```

## Steps

1. **Create config.json** with exact JSON content above
2. **Create fixes.json** with exact JSON content above  
3. **Create .env.example** with exact content above
4. **Verify all files** are valid (JSON for config.json and fixes.json)
5. **Commit all three files** with message: "chore: add configuration templates"

## Verification

- ✓ config.json created and valid JSON
- ✓ fixes.json created and valid JSON
- ✓ .env.example created with all required variables
- ✓ All three files committed to git

## Success Criteria

- All three files match specification exactly
- config.json and fixes.json contain valid JSON
- Git commit created with all three files
