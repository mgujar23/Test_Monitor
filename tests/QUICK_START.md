# Quick Start: Running Tests

## Installation

```bash
npm install
```

This installs Jest and testing dependencies as defined in `package.json`.

## Prerequisites

**Start the services before running tests:**

```bash
# Terminal 1: Backend server (required for all tests)
npm run dev

# Terminal 2 (optional): Frontend server (for UI tests)
npm run dev:ui
```

Both services must be running and responsive.

## Run All Tests

```bash
npm test
```

This runs all test suites with real data from the running services.

## Run Tests by Category

### Backend Tests Only
```bash
npm test:backend
```
- API endpoint tests
- Data fetching (Jenkins, Selenium, etc.)
- Diff generation

### Frontend Tests Only
```bash
npm test:frontend
```
- Section component tests
- Diff modal tests

### UI/E2E Tests Only
```bash
npm test:ui
```
- Full dashboard workflow tests
- User interactions
- Integration flows

### Utility Tests Only
```bash
npm test:utils
```
- Formatting functions
- Calculations
- Helper utilities

## Run Specific Tests

### API Tests Only
```bash
npm test:api
```

### Diff Generation Tests
```bash
npm test:diff
```

### Section Component Tests
```bash
npm test:section
```

### Modal Tests
```bash
npm test:modal
```

## Watch Mode

```bash
npm test:watch
```

Tests re-run on file changes. Press `q` to quit.

## Coverage Report

```bash
npm test:coverage
```

Generates coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines

## Troubleshooting

### Tests Timeout
**Problem:** Tests taking > 10 seconds  
**Solution:** Check if services are running
```bash
curl http://localhost:3000/api/dashboard
curl http://localhost:5181/
```

### Connection Refused
**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:3000`  
**Solution:** Start backend server
```bash
npm run dev
```

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE :::3000`  
**Solution:** Kill process using port
```bash
lsof -i :3000
kill -9 <PID>
```

### No Real Data
**Problem:** Tests fail with empty data  
**Solution:** Ensure data sources are configured
- Check `config.json` for Jenkins, Selenium, Git settings
- Verify credentials are correct
- Run background refresh job: `npm run dev`

### Tests Show as "No Tests Found"
**Problem:** Jest not finding test files  
**Solution:** Check jest.config.js paths match your test files
```bash
find tests -name "*.test.js"
```

## Test Output Examples

### Successful Run
```
PASS  tests/backend/api.test.js
  Backend API Endpoints
    GET /api/dashboard
      ✓ should return dashboard data (234ms)
      ✓ should have correct structure (156ms)
    Error Handling
      ✓ should handle missing parameters (89ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Time:        2.456s
```

### Failed Test
```
FAIL  tests/backend/api.test.js
  Backend API Endpoints
    GET /api/dashboard
      ✕ should return dashboard data (2456ms)

Expected: true
Received: false

Tests:  1 failed, 0 passed
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Dashboard load | < 3s | ✓ |
| API response | < 2s | ✓ |
| Modal open | < 100ms | ✓ |
| Pagination | < 100ms | ✓ |

## Common Commands

```bash
# Run everything
npm test

# Run with detailed output
npm test -- --verbose

# Run single test by name
npm test -- --testNamePattern="should display"

# Stop on first failure
npm test -- --bail

# Run tests for file changes
npm test:watch

# Show coverage
npm test:coverage

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test File Organization

```
tests/
├── backend/
│   ├── api.test.js              # 25 tests
│   ├── data-fetching.test.js    # 35 tests
│   └── diff-generation.test.js  # 30 tests
├── frontend/
│   ├── Section.test.jsx         # 45 tests
│   └── DiffModal.test.jsx       # 40 tests
├── ui/
│   └── dashboard.ui.test.js     # 35 tests
├── utilities/
│   └── formatting.test.js       # 30 tests
├── setup.js                      # Global setup
├── TEST_GUIDE.md                # Detailed guide
├── TEST_SUMMARY.md              # Statistics
└── QUICK_START.md              # This file
```

## Test Execution Examples

### Run All Backend Tests
```bash
npm test:backend
```

### Run Specific Component Tests
```bash
npm test:section
```

### Run with Coverage
```bash
npm test:coverage
```

Output shows:
- Files analyzed
- Line coverage %
- Branch coverage %
- Function coverage %
- Uncovered lines

### Watch Mode Development
```bash
npm test:watch
```

Then edit test files, Jest auto-runs related tests.

## Integration with IDE

### VS Code
1. Install Jest extension
2. Tests run automatically in editor
3. See pass/fail indicators
4. Debug tests with breakpoints

### IntelliJ/WebStorm
1. Right-click test file → Run
2. Set breakpoints
3. Debug tests

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm install
    npm run dev &
    sleep 5
    npm test
```

### GitLab CI
```yaml
test:
  script:
    - npm install
    - npm run dev &
    - sleep 5
    - npm test
```

## Next Steps

1. **Read TEST_GUIDE.md** for detailed documentation
2. **Check TEST_SUMMARY.md** for statistics
3. **Run tests regularly** during development
4. **Add tests** for new features
5. **Monitor coverage** to stay above 95%

## Support

For test issues:
1. Check service is running: `curl http://localhost:3000/api/dashboard`
2. Review TEST_GUIDE.md for detailed info
3. Check test file comments for implementation details
4. Run with `--verbose` for more details

---

**Happy Testing! ✓**
