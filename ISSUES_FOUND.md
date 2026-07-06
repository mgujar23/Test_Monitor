# Test Monitor - Issues Found During Testing

## Executive Summary

**Test Results: 60% Pass Rate (6/10 tests passed)**

When running the comprehensive test suite against the Test Monitor dashboard, **4 critical API endpoints are missing**, preventing key features from functioning:
- ✗ View Diff modal
- ✗ Test details filtering by section/area
- ✗ Recent changes display

---

## Issues Breakdown

### 🔴 CRITICAL ISSUES

#### Issue #1: Missing `/api/diff/:testId` Endpoint
**Severity:** CRITICAL  
**Impact:** View Diff feature is completely non-functional

**Problem:**
- The "View Diff" button in test details table has no backend support
- Expected endpoint: `GET /api/diff/:testId`
- Current status: Returns 404 Not Found

**Required Response Format:**
```json
{
  "testId": "test_id",
  "testName": "test_name",
  "diff": "diff --git a/file.java b/file.java\nindex 1a2b3c4..5d6e7f8 100644\n--- a/file.java\n+++ b/file.java\n@@ -1,5 +1,6 @@\n ..."
}
```

**UI Components Affected:**
- `Section.jsx` - View button handler
- `DiffModal.jsx` - Diff content display
- Download functionality

**Current Behavior:**
```
User clicks "View" button → Modal opens → No diff displays → Error
```

---

#### Issue #2: Missing `/api/recent-changes` Endpoint
**Severity:** CRITICAL  
**Impact:** Recent Changes section is empty

**Problem:**
- Recent commits/builds are not displayed
- Expected endpoint: `GET /api/recent-changes`
- Current status: Returns 404 Not Found

**Required Response Format:**
```json
[
  {
    "hash": "abc123f",
    "build": "#6999",
    "date": "2026-07-06T10:45:00Z",
    "author": "john.doe",
    "message": "Fix auth validation",
    "ticket": "PROJ-123",
    "repoPath": "//code_SaaS/csg_service"
  }
]
```

**UI Components Affected:**
- Dashboard - Recent Changes section
- Build history display

**Current Behavior:**
```
Recent Changes section → Empty/No data
```

---

#### Issue #3: Missing `/api/test-details/:section/:area` Endpoint
**Severity:** CRITICAL  
**Impact:** Cannot filter tests by section and area

**Problem:**
- UI expects: `GET /api/test-details/selenium/Authentication`
- Current endpoint: `GET /api/test-details/:testId` (expects single testId)
- Mismatch in endpoint structure

**Required Endpoint:**
```
GET /api/test-details/:section/:area
```

**Required Response Format:**
```json
{
  "section": "selenium",
  "area": "Authentication",
  "tests": [
    {
      "id": "test_id",
      "filename": "test_auth_login.py",
      "status": "FAIL",
      "lastPassed": "Build #6995",
      "recentChanges": "Commit message",
      "suggestedFix": "Add explicit wait for WebDriverWait"
    }
  ]
}
```

**UI Components Affected:**
- `Section.jsx` - Test filtering
- Test details table display

**Current Behavior:**
```
Click metric → Shows areas → Click area → 404 Error
```

---

### 🟡 HIGH PRIORITY ISSUES

#### Issue #4: Test Details Response Missing Required Fields
**Severity:** HIGH  
**Impact:** UI cannot display test information properly

**Current Response:**
```json
{
  "error": "Test not found",
  "testId": "test_id"
}
```

**Missing Fields:**
- `filename` - Test file path
- `status` - Test status (PASS/FAIL/SKIP)
- `lastPassed` - Last successful build
- `recentChanges` - Recent commits
- `suggestedFix` - Fix suggestions

**Expected Response:**
```json
{
  "id": "test_id",
  "filename": "test_auth.py",
  "status": "FAIL",
  "lastPassed": "Build #6995",
  "recentChanges": "Fixed timeout handling",
  "suggestedFix": "Add WebDriverWait with explicit wait conditions"
}
```

---

#### Issue #5: Endpoint Parameter Mismatch
**Severity:** HIGH  
**Impact:** API structure doesn't match UI expectations

**Current Structure:**
```
GET /api/test-details/:testId
```

**Expected Structure:**
```
GET /api/test-details/:section/:area
```

**Example Mismatch:**
```
UI sends:     GET /api/test-details/selenium/Authentication
Backend has:  GET /api/test-details/:testId
Result:       404 Not Found
```

---

## Test Results

### Passing Tests (6/10) ✓
```
✓ Test 1: Dashboard returns sections
✓ Test 2: Sections have required fields
✓ Test 3: Metrics are logically correct (failed ≤ total)
✓ Test 8: API response time acceptable (26ms)
✓ Test 9: Handles concurrent requests
✓ Test 10: Correct content type (application/json)
```

### Failing Tests (4/10) ✗
```
✗ Test 4: Test details endpoint missing filename or status
  → Endpoint doesn't exist or returns error
  
✗ Test 5: Invalid test status values
  → No test data in response
  
✗ Test 6: Diff format invalid
  → Endpoint missing completely
  
✗ Test 7: Recent changes missing fields
  → Endpoint missing completely
```

### Performance Metrics ✓
```
✓ Dashboard load: 26ms (< 3000ms target)
✓ Concurrent handling: 5 parallel requests successful
✓ Content-Type: application/json
```

---

## Current API Endpoints Status

### Available Endpoints ✓
| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/dashboard` | ✓ Working | Returns full dashboard data |
| `GET /api/failed-tests/:section` | ✓ Working | Failed tests by section |
| `GET /api/test-details/:testId` | ⚠ Partial | Takes testId, not section/area |
| `GET /api/health` | ✓ Working | Health status |
| `POST /api/refresh` | ✓ Working | Trigger refresh |

### Missing Endpoints ✗
| Endpoint | Status | Priority |
|----------|--------|----------|
| `GET /api/test-details/:section/:area` | ✗ Missing | CRITICAL |
| `GET /api/diff/:testId` | ✗ Missing | CRITICAL |
| `GET /api/recent-changes` | ✗ Missing | CRITICAL |

---

## Impact on UI Components

### Section.jsx
- ❌ Area filtering broken (endpoint mismatch)
- ❌ Cannot fetch filtered test details
- ⚠️ Tests display but can't drill down

### DiffModal.jsx
- ❌ View button non-functional
- ❌ No diff data to display
- ❌ Download button broken

### Dashboard.jsx
- ❌ Recent Changes section empty
- ✓ Metrics display correctly
- ⚠️ Partial functionality

### App.jsx
- ⚠️ Routes defined but endpoints missing
- ❌ Navigation to test details fails

---

## Fix Priority

### Phase 1: Urgent (Breaks Core Features)
```
1. Create GET /api/diff/:testId endpoint
2. Create GET /api/recent-changes endpoint
3. Fix GET /api/test-details to accept :section/:area
```

### Phase 2: High Priority (Data Issues)
```
4. Update test-details response with all required fields
5. Implement diff generation logic
6. Fetch recent changes from git/Jenkins
```

### Phase 3: Quality (Testing)
```
7. Re-run full test suite
8. Update tests to match actual API
9. Add integration tests
```

---

## Recommended Implementation

### 1. Create Missing Endpoints

**Endpoint: `/api/diff/:testId`**
```javascript
router.get('/diff/:testId', (req, res) => {
  const { testId } = req.params;
  const cachedData = loadCache();
  
  const test = findTestById(cachedData, testId);
  if (!test) return res.status(404).json({ error: 'Test not found' });
  
  const diff = generateTestFixDiff(test);
  res.json({
    testId: testId,
    testName: test.filename,
    diff: diff
  });
});
```

**Endpoint: `/api/recent-changes`**
```javascript
router.get('/recent-changes', (req, res) => {
  const cachedData = loadCache();
  const changes = cachedData.recentChanges || [];
  res.json(changes);
});
```

**Endpoint: `/api/test-details/:section/:area`**
```javascript
router.get('/test-details/:section/:area', (req, res) => {
  const { section, area } = req.params;
  const cachedData = loadCache();
  
  const sectionData = cachedData.sections[section];
  const areaData = sectionData.areas.find(a => a.name === area);
  
  res.json({
    section: section,
    area: area,
    tests: areaData.tests || []
  });
});
```

### 2. Update Test Details Response
Ensure each test object includes:
- `id` - unique identifier
- `filename` - file path
- `status` - PASS/FAIL/SKIP
- `lastPassed` - build number
- `recentChanges` - commit info
- `suggestedFix` - fix suggestion

### 3. Re-run Tests
```bash
npm test
```

Expected: 10/10 tests passing (100% success rate)

---

## Files to Modify

1. **`src/server/routes.js`**
   - Add `/api/diff/:testId` endpoint
   - Add `/api/recent-changes` endpoint
   - Update `/api/test-details` to handle `:section/:area`

2. **`src/api/dashboard.js`**
   - Ensure all test objects have required fields
   - Implement diff generation if missing

3. **`tests/backend/api.test.js`**
   - Update tests to use correct endpoints
   - Remove expectations for non-existent endpoints

---

## Testing After Fixes

Run the test suite to verify fixes:
```bash
npm test
```

Expected output:
```
✓ 10 tests passed
✗ 0 tests failed
Success Rate: 100%
```

---

## Summary

The test suite identified **3 missing critical endpoints** and **2 high-priority data issues** that prevent the dashboard from functioning completely. The core dashboard metrics work correctly, but drill-down features, code diffs, and recent changes are non-functional.

**Estimated fix time:** 2-3 hours  
**Complexity:** Medium (straightforward endpoint creation)  
**Risk:** Low (isolated changes, no breaking changes to existing APIs)

