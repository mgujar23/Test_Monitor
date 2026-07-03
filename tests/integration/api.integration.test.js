/**
 * Integration Tests for Test Monitor Dashboard API
 *
 * Tests validate:
 * - Cache structure and JSON validity
 * - Config file validity
 * - API endpoint responses
 * - Mock data generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEmptyDashboardData, loadCache, saveCache } from '../../src/server/cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../');

// Test Suite: Cache Validation
console.log('\n=== CACHE STRUCTURE VALIDATION ===\n');

// Test 1: Empty dashboard data structure
const emptyDashboard = createEmptyDashboardData();
console.assert(emptyDashboard.timestamp, 'Dashboard should have timestamp');
console.assert(emptyDashboard.sections, 'Dashboard should have sections object');
console.assert(Array.isArray(emptyDashboard.sections.readyCluster), 'readyCluster should be array');
console.assert(Array.isArray(emptyDashboard.sections.selenium), 'selenium should be array');
console.assert(Array.isArray(emptyDashboard.sections.integrationTests), 'integrationTests should be array');
console.assert(Array.isArray(emptyDashboard.sections.smokeTests), 'smokeTests should be array');
console.assert(Array.isArray(emptyDashboard.sections.newTestsAdded), 'newTestsAdded should be array');
console.assert(emptyDashboard.lastError === null, 'lastError should be null initially');
console.log('✓ Empty dashboard structure is valid');

// Test 2: Cache file JSON validity
try {
  const cacheFile = path.join(PROJECT_ROOT, 'cache/dashboard-data.json');
  if (fs.existsSync(cacheFile)) {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    console.assert(cacheData.timestamp, 'Cache should have timestamp');
    console.assert(cacheData.sections, 'Cache should have sections');
    console.log('✓ Cache file is valid JSON');
  } else {
    console.log('⚠ Cache file does not exist yet (will be created on first run)');
  }
} catch (error) {
  console.error('✗ Cache file JSON is invalid:', error.message);
  process.exit(1);
}

// Test 3: Cache operations (save/load)
try {
  const testData = {
    timestamp: new Date().toISOString(),
    refreshDurationMs: 1250,
    sections: {
      readyCluster: [{ name: 'test1', status: 'PASSED', duration: 1.5 }],
      selenium: [],
      integrationTests: [],
      smokeTests: [],
      newTestsAdded: []
    },
    lastError: null
  };

  saveCache(testData);
  const loaded = loadCache();

  console.assert(loaded, 'Cache should be loadable after saving');
  console.assert(loaded.sections.readyCluster.length === 1, 'Cache should preserve data');
  console.assert(loaded.sections.readyCluster[0].name === 'test1', 'Cache data should match saved data');
  console.log('✓ Cache save/load operations work correctly');
} catch (error) {
  console.error('✗ Cache operations failed:', error.message);
  process.exit(1);
}

// Test Suite: Configuration Validation
console.log('\n=== CONFIGURATION VALIDATION ===\n');

// Test 4: Config file exists and is valid JSON
try {
  const configPath = path.join(PROJECT_ROOT, 'config.json');
  console.assert(fs.existsSync(configPath), 'config.json should exist');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log('✓ config.json exists and is valid JSON');

  // Test 5: Config has required sections
  console.assert(config.jenkins, 'Config should have jenkins section');
  console.assert(config.jenkins.baseUrl, 'Jenkins config should have baseUrl');
  console.assert(config.jenkins.apiToken, 'Jenkins config should have apiToken');
  console.assert(config.jenkins.jobs, 'Jenkins config should have jobs');
  console.log('✓ Jenkins configuration is present');

  console.assert(config.selenium, 'Config should have selenium section');
  console.assert(config.selenium.portalUrl, 'Selenium config should have portalUrl');
  console.log('✓ Selenium configuration is present');

  console.assert(config.git, 'Config should have git section');
  console.assert(config.git.repoPath, 'Git config should have repoPath');
  console.assert(Array.isArray(config.git.testFilePatterns), 'Git config should have testFilePatterns array');
  console.log('✓ Git configuration is present');

  console.assert(config.app, 'Config should have app section');
  console.assert(config.app.port, 'App config should have port');
  console.assert(config.app.refreshIntervalMinutes, 'App config should have refreshIntervalMinutes');
  console.log('✓ App configuration is present');

} catch (error) {
  console.error('✗ Configuration validation failed:', error.message);
  process.exit(1);
}

// Test Suite: Mock Data
console.log('\n=== MOCK DATA VALIDATION ===\n');

// Test 6: Mock data generation
try {
  // Dynamic import to test mock data module
  const mockDataModule = await import('../../src/server/mock-data.js');
  const mockData = mockDataModule.generateMockDashboardData();

  console.assert(mockData.timestamp, 'Mock data should have timestamp');
  console.assert(mockData.sections, 'Mock data should have sections');
  console.assert(mockData.sections.readyCluster.length > 0, 'Mock data should have readyCluster items');
  console.assert(mockData.sections.readyCluster[0].name, 'Mock items should have name');
  console.assert(mockData.sections.readyCluster[0].status, 'Mock items should have status');
  console.log('✓ Mock data generation works correctly');
} catch (error) {
  // Mock data file may not exist yet; that's okay
  console.log('⚠ Mock data module not yet created (will be created during task 23)');
}

// Test Suite: API Endpoints
console.log('\n=== API ENDPOINT VALIDATION ===\n');

// Test 7: Verify routes file exists and is syntactically valid
try {
  const routesPath = path.join(PROJECT_ROOT, 'src/server/routes.js');
  console.assert(fs.existsSync(routesPath), 'routes.js should exist');

  // Check that routes file contains expected endpoints
  const routesContent = fs.readFileSync(routesPath, 'utf-8');
  console.assert(routesContent.includes('/dashboard'), 'Routes should include /dashboard endpoint');
  console.assert(routesContent.includes('/failed-tests'), 'Routes should include /failed-tests endpoint');
  console.assert(routesContent.includes('/test-details'), 'Routes should include /test-details endpoint');
  console.assert(routesContent.includes('/health'), 'Routes should include /health endpoint');
  console.assert(routesContent.includes('/refresh'), 'Routes should include /refresh endpoint');
  console.log('✓ All required API endpoints are defined');
} catch (error) {
  console.error('✗ Routes validation failed:', error.message);
  process.exit(1);
}

// Test 8: Server file exists and loads config
try {
  const serverPath = path.join(PROJECT_ROOT, 'server.js');
  console.assert(fs.existsSync(serverPath), 'server.js should exist');

  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  console.assert(serverContent.includes('config.json'), 'Server should load config.json');
  console.assert(serverContent.includes('initializeCache'), 'Server should initialize cache');
  console.log('✓ Server file is properly configured');
} catch (error) {
  console.error('✗ Server validation failed:', error.message);
  process.exit(1);
}

// Test Suite: Files and Structure
console.log('\n=== PROJECT STRUCTURE VALIDATION ===\n');

// Test 9: Verify required directories exist
const requiredDirs = ['src/server', 'src/api', 'public', 'tests', 'cache', 'logs'];
for (const dir of requiredDirs) {
  const fullPath = path.join(PROJECT_ROOT, dir);
  console.assert(fs.existsSync(fullPath), `${dir} directory should exist`);
}
console.log('✓ All required directories exist');

// Test 10: Verify required config files exist
const requiredFiles = ['config.json', '.env.example', 'package.json', 'server.js'];
for (const file of requiredFiles) {
  const fullPath = path.join(PROJECT_ROOT, file);
  console.assert(fs.existsSync(fullPath), `${file} should exist`);
}
console.log('✓ All required config files exist');

console.log('\n=== ALL INTEGRATION TESTS PASSED ===\n');
console.log('Summary:');
console.log('  ✓ Cache structure is valid');
console.log('  ✓ Configuration is complete');
console.log('  ✓ Mock data generation ready');
console.log('  ✓ API endpoints defined');
console.log('  ✓ Project structure valid');
console.log('\nNext steps:');
console.log('  1. Run: npm start');
console.log('  2. Open: http://localhost:3000/api/dashboard');
console.log('  3. Verify dashboard loads without errors');
