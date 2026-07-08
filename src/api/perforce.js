import { execSync } from 'child_process';
import { log, warn, error } from '../server/logger.js';

export async function fetchNewTestsAdded(config) {
  try {
    const p4Config = config.perforce;
    if (!p4Config || !p4Config.serverUrl) {
      warn('[P4] Perforce config not available, using defaults');
      return getDefaultNewTestsData();
    }

    const serverUrl = p4Config.serverUrl;
    const username = p4Config.username;
    const apiToken = p4Config.apiToken || p4Config.password;
    const depotPath = p4Config.depotPath;

    console.log('[P4] Using p4 CLI to fetch changes from:', depotPath);
    console.log('[P4] Connecting to:', serverUrl, 'as user:', username);

    try {
      // Get changes from all years - fetch more history (1000 changes covers ~2-3 years of activity)
      const changesCmd = `p4 -p ${serverUrl} -u ${username} changes -m 1000 "${depotPath}/..."`;
      log('[P4] Running command: p4 changes...');

      const changesOutput = execSync(changesCmd, {
        encoding: 'utf-8',
        env: { ...process.env, P4PORT: serverUrl, P4USER: username }
      });

      const changeLines = changesOutput.trim().split('\n').filter(line => line.length > 0);
      log('[P4] Found', changeLines.length, 'changes');

      // Debug: Show date range of changes
      const firstLine = changeLines[0];
      const lastLine = changeLines[changeLines.length - 1];
      const firstMatch = firstLine.match(/on\s+(\d{4}\/\d{2}\/\d{2})/);
      const lastMatch = lastLine.match(/on\s+(\d{4}\/\d{2}\/\d{2})/);
      if (firstMatch && lastMatch) {
        log('[P4] Date range: ', lastMatch[1], ' to ', firstMatch[1]);
      }

      if (changeLines.length === 0) {
        warn('[P4] No changes found');
        return getDefaultNewTestsData();
      }

      // Parse changes and extract file information
      // Process ALL changes (not just first 50) to get data from all years
      const commits = [];
      for (const changeLine of changeLines) {
        try {
          // Format: Change 12345 on 2026/07/06 by user@workspace 'description'
          const match = changeLine.match(/Change\s+(\d+)\s+on\s+(\d{4}\/\d{2}\/\d{2})\s+by\s+([^\s@]+)/);
          if (!match) continue;

          const changeNum = match[1];
          const changeDate = match[2].replace(/\//g, '-');
          const author = match[3];

          log('[P4] Processing change', changeNum);

          // Get files in this change
          const filesCmd = `p4 -p ${serverUrl} -u ${username} describe -s ${changeNum}`;
          const filesOutput = execSync(filesCmd, {
            encoding: 'utf-8',
            env: { ...process.env, P4PORT: serverUrl, P4USER: username }
          });

          // Parse file list from describe output
          // Format: ... //depot/path/file#revision action
          const fileLines = filesOutput.split('\n').filter(line => line.startsWith('...'));

          if (fileLines.length > 0 && changeNum === '1871952') {
            log('[P4] DEBUG - Found', fileLines.length, 'file lines in change', changeNum);
            fileLines.slice(0, 3).forEach((line, idx) => {
              const match = line.match(/\.\.\.\s+([^\s#]+)/);
              if (match) {
                const filename = match[1].split('/').pop();
                console.log(`[P4] DEBUG - File ${idx}:`, filename, '-> matches:', matchesTestPattern(filename));
              }
            });
          }

          fileLines.forEach(line => {
            // Extract filepath between '...' and '#'
            const match = line.match(/\.\.\.\s+([^\s#]+)/);
            if (match) {
              const filePath = match[1];
              const filename = filePath.split('/').pop();

              if (matchesTestPattern(filename)) {
                log('[P4] MATCHED FILE:', filename);
                commits.push({
                  filename: filename,
                  filePath: filePath,
                  author: author,
                  date: new Date(changeDate),
                  changeNum: changeNum
                });
              }
            }
          });
        } catch (e) {
          warn('[P4] Could not process change:', e.message);
        }
      }

      log('[P4] Found', commits.length, 'test file changes');

      if (commits.length === 0) {
        warn('[P4] No test files found in changes');
        return getDefaultNewTestsData();
      }

      const groupedData = groupCommitsByYearAndArea(commits);

      // Debug: Show breakdown by year
      if (groupedData.yearly) {
        Object.entries(groupedData.yearly).forEach(([year, tests]) => {
          if (tests.length > 0) {
            log('[P4] Year', year, ':', tests.length, 'test files');
          }
        });
      }

      return groupedData;

    } catch (error) {
      error('[P4] p4 CLI error:', error.message);
      return getDefaultNewTestsData();
    }

  } catch (error) {
    console.error('[P4] Error fetching from Perforce:', error.message);
    return getDefaultNewTestsData();
  }
}

function matchesTestPattern(filename) {
  const testPatterns = [
    /_test\.py$/i,
    /Test\.java$/,
    /Test\.js$/,
    /\.test\.ts$/i,
    /_test\.ts$/i,
    /spec\.ts$/i,
    /\.test\.tsx$/i,
    /_test\.jsx$/i,
    /\.mhtml$/i,           // Selenium test files
    /Suite\.mhtml$/i,       // Selenium test suites
    /Check[A-Z].*\.mhtml$/i // Selenium test cases
  ];
  return testPatterns.some(pattern => pattern.test(filename));
}

function extractAreaFromPath(filePath, filename) {
  // Extract meaningful area name from file path and filename
  // e.g., //code_SaaS/.../portal/tests/selenium/portal_tests/CheckOffice365Feature.mhtml

  // Look for common test type indicators in path
  if (filePath.includes('selenium')) return 'Selenium Tests';
  if (filePath.includes('integration')) return 'Integration Tests';
  if (filePath.includes('smoke')) return 'Smoke Tests';
  if (filePath.includes('unit')) return 'Unit Tests';
  if (filePath.includes('api')) return 'API Tests';
  if (filePath.includes('e2e')) return 'E2E Tests';
  if (filePath.includes('performance')) return 'Performance Tests';

  // Extract area from test filename (e.g., CheckOffice365Feature -> Office365 Feature)
  if (filename) {
    // Remove common prefixes and extensions
    let testName = filename.replace(/^Check/, '').replace(/^test_/, '').replace(/\.(mhtml|py|js|java|ts)$/, '');

    // Handle camelCase: CheckOffice365Feature -> Office365 Feature
    testName = testName.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Handle numbers: Office365 -> Office 365
    testName = testName.replace(/(\D)(\d+)(\D)/g, '$1 $2 $3');

    if (testName && testName.length > 0 && testName.length < 50) {
      return testName;
    }
  }

  return 'Other';
}

function groupCommitsByYearAndArea(commits) {
  const yearMap = {};
  const areaMap = {};

  commits.forEach(commit => {
    const year = commit.date.getFullYear();
    const area = extractAreaFromPath(commit.filePath, commit.filename);

    // Group by year
    if (!yearMap[year]) {
      yearMap[year] = [];
    }
    yearMap[year].push({
      filename: commit.filename,
      filePath: commit.filePath,
      author: commit.author,
      date: commit.date.toISOString().split('T')[0],
      changeNum: commit.changeNum,
      area: area
    });

    // Group by area
    if (!areaMap[area]) {
      areaMap[area] = [];
    }
    areaMap[area].push({
      filename: commit.filename,
      filePath: commit.filePath,
      author: commit.author,
      date: commit.date.toISOString().split('T')[0],
      changeNum: commit.changeNum,
      year: year
    });
  });

  return { yearly: yearMap, byArea: areaMap };
}

function getDefaultNewTestsData() {
  return {
    yearly: {
      2023: [],
      2024: [],
      2025: [],
      2026: []
    },
    byArea: {}
  };
}
