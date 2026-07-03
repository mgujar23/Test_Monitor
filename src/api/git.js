const { execSync } = require('child_process');
const path = require('path');

class GitClient {
  constructor(repoPath, branch = 'main', testFilePatterns = ['**/*.test.js', '**/*.spec.js']) {
    this.repoPath = repoPath;
    this.branch = branch;
    this.testFilePatterns = testFilePatterns;
  }

  fetchNewTestsAddedYearly() {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

      const cmd = `cd ${this.repoPath} && git log --name-status --pretty=format:%ai --since="${oneYearAgo.toISOString()}" ${this.branch}`;
      const output = execSync(cmd, { encoding: 'utf-8' });

      const months = {};
      const lines = output.split('\n');
      let currentDate = null;

      lines.forEach(line => {
        if (/^\d{4}-\d{2}-\d{2}/.test(line)) {
          currentDate = line.split(' ')[0];
        } else if (line.startsWith('A') && this.isTestFile(line.substring(2))) {
          const month = currentDate.substring(0, 7);
          months[month] = (months[month] || 0) + 1;
        }
      });

      return {
        yearly: Object.entries(months).map(([month, count]) => ({
          month,
          count,
        })),
      };
    } catch (error) {
      console.error('Error fetching new tests:', error);
      return { yearly: [] };
    }
  }

  getRecentCommitsForFile(filePath) {
    try {
      const cmd = `cd ${this.repoPath} && git log --oneline -10 -- ${filePath}`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      return output.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.error(`Error fetching commits for ${filePath}:`, error);
      return [];
    }
  }

  getBlameForFile(filePath) {
    try {
      const cmd = `cd ${this.repoPath} && git blame ${filePath}`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      return output;
    } catch (error) {
      console.error(`Error fetching blame for ${filePath}:`, error);
      return '';
    }
  }

  isTestFile(filePath) {
    return this.testFilePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\./g, '\\.'));
      return regex.test(filePath);
    });
  }
}

module.exports = GitClient;
