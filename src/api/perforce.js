import { execSync } from 'child_process';

export async function fetchNewTestsAdded(config) {
  try {
    const p4Config = config.perforce;
    if (!p4Config || !p4Config.serverUrl) {
      console.warn('[P4] Perforce config not available, using defaults');
      return getDefaultNewTestsData();
    }

    const serverUrl = p4Config.serverUrl;
    const username = p4Config.username;
    const apiToken = p4Config.apiToken || p4Config.password;
    const depotPath = p4Config.depotPath;

    console.log('[P4] Using p4 CLI to fetch changes from:', depotPath);
    console.log('[P4] Connecting to:', serverUrl, 'as user:', username);

    try {
      // Get recent changes using p4 CLI
      const changesCmd = `p4 -p ${serverUrl} -u ${username} changes -m 100 "${depotPath}/..."`;
      console.log('[P4] Running command: p4 changes...');

      const changesOutput = execSync(changesCmd, {
        encoding: 'utf-8',
        env: { ...process.env, P4PASSWD: apiToken }
      });

      const changeLines = changesOutput.trim().split('\n').filter(line => line.length > 0);
      console.log('[P4] Found', changeLines.length, 'changes');

      if (changeLines.length === 0) {
        console.warn('[P4] No changes found');
        return getDefaultNewTestsData();
      }

      // Parse changes and extract file information
      const commits = [];
      for (const changeLine of changeLines.slice(0, 50)) {
        try {
          // Format: Change 12345 on 2026/07/06 by user@workspace 'description'
          const match = changeLine.match(/Change\s+(\d+)\s+on\s+(\d{4}\/\d{2}\/\d{2})\s+by\s+([^\s@]+)/);
          if (!match) continue;

          const changeNum = match[1];
          const changeDate = match[2].replace(/\//g, '-');
          const author = match[3];

          console.log('[P4] Processing change', changeNum);

          // Get files in this change
          const filesCmd = `p4 -p ${serverUrl} -u ${username} describe -s ${changeNum}`;
          const filesOutput = execSync(filesCmd, {
            encoding: 'utf-8',
            env: { ...process.env, P4PASSWD: apiToken }
          });

          // Parse file list from describe output
          // Format: ... //depot/path/file#revision action
          const fileLines = filesOutput.split('\n').filter(line => line.startsWith('...'));

          if (fileLines.length > 0 && changeNum === '1871952') {
            console.log('[P4] DEBUG - Found', fileLines.length, 'file lines in change', changeNum);
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
                console.log('[P4] MATCHED FILE:', filename);
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
          console.warn('[P4] Could not process change:', e.message);
        }
      }

      console.log('[P4] Found', commits.length, 'test file changes');

      if (commits.length === 0) {
        console.warn('[P4] No test files found in changes');
        return getDefaultNewTestsData();
      }

      const yearlyData = groupCommitsByYearAndArea(commits);
      return { yearly: yearlyData };

    } catch (error) {
      console.error('[P4] p4 CLI error:', error.message);
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

function groupCommitsByYearAndArea(commits) {
  const yearMap = {};

  commits.forEach(commit => {
    const year = commit.date.getFullYear();
    if (!yearMap[year]) {
      yearMap[year] = [];
    }

    yearMap[year].push({
      filename: commit.filename,
      filePath: commit.filePath,
      author: commit.author,
      date: commit.date.toISOString().split('T')[0],
      changeNum: commit.changeNum
    });
  });

  return yearMap;
}

function getDefaultNewTestsData() {
  return {
    yearly: {
      [new Date().getFullYear()]: []
    }
  };
}
