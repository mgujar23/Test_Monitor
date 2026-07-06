# Test Monitor - Comprehensive Test Suite

This document provides detailed test coverage for the Test Monitor Dashboard across backend, frontend, API, and UI layers.

## Test Organization

```
tests/
├── backend/
│   ├── api.test.js              # REST API endpoint tests
│   ├── data-fetching.test.js    # Data source integration tests
│   └── diff-generation.test.js  # Diff generation and test fixes
├── frontend/
│   ├── Section.test.jsx         # Collapsible section component tests
│   └── DiffModal.test.jsx       # Diff modal functionality tests
├── ui/
│   └── dashboard.ui.test.js     # End-to-end UI tests
├── utilities/
│   └── formatting.test.js       # Utility function tests
└── TEST_GUIDE.md               # This file
```

## Backend Tests

### 1. API Endpoint Tests (`backend/api.test.js`)

Tests all REST API endpoints for the dashboard.

**Coverage:**
- `GET /api/dashboard` - Dashboard data retrieval
- `GET /api/test-details/:section/:area` - Test details by section
- `GET /api/diff/:testId` - Diff generation
- `GET /api/recent-changes` - Recent commits
- Error handling and edge cases
- Performance benchmarks

**Running Tests:**
```bash
npm test backend/api.test.js
```

**Key Test Cases:**
- Dashboard returns valid structure with all sections
- Test metrics totals correctly (failed ≤ total)
- API handles missing parameters gracefully
- All endpoints return valid JSON
- Response time < 5 seconds
- Handles concurrent requests (10 parallel)

### 2. Data Fetching Tests (`backend/data-fetching.test.js`)

Tests integration with Jenkins, Selenium, Perforce, and Git.

**Coverage:**
- Ready Cluster builds from Jenkins
- Selenium test results with area breakdown
- Integration test data
- Smoke test results
- New tests from Git commits
- Data caching and refresh
- Real data from APIs (no mocks)

**Running Tests:**
```bash
npm test backend/data-fetching.test.js
```

**Key Test Cases:**
- Jenkins builds have valid structure
- Selenium areas aggregate correctly
- Pass rate calculation is accurate
- Data refreshes at 15-minute intervals
- Cached data returns faster
- All data sources have real content

### 3. Diff Generation Tests (`backend/diff-generation.test.js`)

Tests realistic code diff generation for different test types.

**Coverage:**
- Selenium test diffs with WebDriverWait
- Integration test diffs with API mocking
- Unit test diffs with Mockito
- Database test diffs with TestContainers
- Performance test diffs with @Timeout
- Diff format validation (unified format)
- Diff accessibility and quality

**Running Tests:**
```bash
npm test backend/diff-generation.test.js
```

**Key Test Cases:**
- Each test type generates appropriate fix
- Diffs include necessary imports and setup
- Unified diff format is valid
- Diffs are under 100KB
- Line numbers and context preserved
- Fixes are specific to test type

## Frontend Tests

### 1. Section Component Tests (`frontend/Section.test.jsx`)

Tests the collapsible test section component.

**Coverage:**
- Section rendering (title, metrics, percentage)
- Expand/collapse functionality
- Metric box display and selection
- Area selection and filtering
- Test details table display
- Pagination (10 tests per page)
- View Diff button integration
- Data updates and accessibility

**Running Tests:**
```bash
npm test frontend/Section.test.jsx
```

**Key Test Cases:**
- Section displays all metrics correctly
- Clicking metric filters tests appropriately
- Area selection highlights properly
- Pagination calculates pages correctly
- Selected area shows filtered tests
- Pass percentage updates when data changes

### 2. Diff Modal Component Tests (`frontend/DiffModal.test.jsx`)

Tests the View Diff modal popup functionality.

**Coverage:**
- Modal visibility (show/hide)
- Modal header with title and test name
- Diff content display and formatting
- Dismiss button functionality
- Download button (creates .patch file)
- Modal positioning (centered, not clipped)
- Keyboard accessibility
- Performance with large diffs

**Running Tests:**
```bash
npm test frontend/DiffModal.test.jsx
```

**Key Test Cases:**
- Modal hidden by default
- Modal appears when triggered
- Header shows test name correctly
- Diff content is scrollable
- Dismiss closes modal
- Download creates valid patch file
- Escape key closes modal
- Modal not affected by parent overflow

## UI/E2E Tests

### Dashboard UI Tests (`ui/dashboard.ui.test.js`)

End-to-end tests for complete dashboard functionality.

**Coverage:**
- Page load and initialization
- All section rendering (Ready Cluster, Selenium, Integration, Smoke, New Tests)
- Section expansion/collapse with real data
- Metric display and real numbers
- Area selection and filtering
- Test details table with real data
- Pagination functionality
- View Diff modal trigger and display
- Recent changes display
- Responsive design
- Dark theme styling
- Performance metrics

**Running Tests:**
```bash
npm test ui/dashboard.ui.test.js
```

**Key Test Cases:**

**Dashboard Load:**
- Page loads without errors
- All sections render properly
- API responds with valid data
- Page load < 3 seconds
- API response < 2 seconds

**Section Display:**
- Each section shows correct metrics
- Pass percentage displays correctly
- Metrics sum properly
- Real data from API (not mocked)

**User Interactions:**
- Clicking metric filters tests
- Area selection shows filtered tests
- Pagination navigates correctly
- View Diff opens modal with real diff
- Download creates valid patch file
- Dismiss closes modal

**Data Validation:**
- All test details populated
- Status colors applied correctly
- Recent changes display commits
- Repo paths shown
- Build numbers displayed

## Utility Tests

### Formatting Utilities Tests (`utilities/formatting.test.js`)

Tests data formatting and calculation functions.

**Coverage:**
- Percentage calculation (pass rate)
- Status formatting and colors
- Date/time formatting
- File path handling
- Metric aggregation
- Number formatting
- String validation
- Diff content parsing
- Error message formatting
- Array utilities (filter, sort, paginate)
- Object utilities (extract, merge)

**Running Tests:**
```bash
npm test utilities/formatting.test.js
```

**Key Test Cases:**
- Pass percentage accuracy
- Edge cases (0 tests, all failed)
- Decimal precision (2 places)
- Status-to-color mapping
- Date parsing and formatting
- File path extraction
- Metric aggregation from areas
- Array pagination with correct boundaries

## Running All Tests

### Quick Start

```bash
# Install test dependencies (if not already installed)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Run Specific Test Suites

```bash
# Backend tests only
npm test backend

# Frontend tests only
npm test frontend

# UI tests only
npm test ui

# Utilities tests only
npm test utilities

# Specific test file
npm test api.test.js
```

### Run Tests by Pattern

```bash
# Run only API tests
npm test -- --testPathPattern=api

# Run only Section component tests
npm test -- --testPathPattern=Section

# Run only modal tests
npm test -- --testPathPattern=Modal
```

## Test Data Requirements

**All tests use REAL data from running services:**

1. **Backend server** running on `http://localhost:3000`
   - Must have `/api/dashboard` endpoint
   - Must have test data from Jenkins, Selenium, etc.

2. **Frontend server** running on `http://localhost:5181`
   - Must have React app loaded
   - Must be connected to backend API

3. **Data sources** must be accessible:
   - Jenkins API (for Ready Cluster builds)
   - Selenium portal (for test results)
   - Git repository (for commits)

**Start servers before running tests:**

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (if testing UI)
npm run dev:ui
```

## Test Coverage Goals

| Layer | Target Coverage | Current |
|-------|-----------------|---------|
| API Endpoints | 100% | ✓ |
| Data Fetching | 100% | ✓ |
| Components | 95% | ✓ |
| Utilities | 100% | ✓ |
| UI/E2E | 90% | ✓ |

## Performance Benchmarks

Tests verify these performance targets:

- Dashboard load: < 3 seconds
- API response: < 2 seconds
- Modal opening: < 100ms
- Pagination: < 100ms for 100 page changes
- Concurrent requests: 10 parallel requests handled

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Monitor Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      node:
        image: node:18
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dev &
      - run: sleep 5
      - run: npm test
```

## Common Issues and Troubleshooting

### Tests Fail: Backend Not Running
```bash
# Start backend server
npm run dev
```

### Tests Fail: Port Already in Use
```bash
# Check what's using port 3000/5181
lsof -i :3000
lsof -i :5181

# Kill process
kill -9 <PID>
```

### Tests Timeout
- Increase timeout in test file: `jest.setTimeout(10000)`
- Check if APIs are responding: `curl http://localhost:3000/api/dashboard`

### Real Data Not Loading
- Verify Jenkins, Selenium, Git are accessible
- Check config.json for correct credentials
- Verify API caching is working: `curl http://localhost:3000/api/dashboard`

## Adding New Tests

### Test Structure Template

```javascript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    test('should do something', async () => {
      const response = await fetch('http://localhost:3000/api/endpoint');
      const data = await response.json();

      assert(data.property);
      assert.strictEqual(data.value, expectedValue);
    });
  });
});
```

### Best Practices

1. **Use real data** - Fetch from actual APIs, don't mock
2. **Test user workflows** - Simulate real usage patterns
3. **Include edge cases** - Empty data, errors, timeouts
4. **Verify performance** - Ensure response times are acceptable
5. **Document test intent** - Clear describe/test names

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should display metrics"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug in Node
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Maintenance

- Review tests monthly for API changes
- Update tests when UI components change
- Add tests for bug fixes
- Keep real data sources up to date
- Monitor test execution time

## Contact & Support

For test-related questions or issues:
- Check test comments for implementation details
- Review API responses with `curl`
- Verify all services are running
- Check test logs for specific failure reasons
