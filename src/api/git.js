import { execSync } from 'child_process';

export async function fetchNewTestsAdded(repoPath, branch, testFilePatterns) {
  // Returns empty for now - prevents import errors
  return {
    yearly: [
      { month: 'January', count: 0 },
      { month: 'February', count: 0 },
      { month: 'March', count: 0 },
      { month: 'April', count: 0 },
      { month: 'May', count: 0 },
      { month: 'June', count: 0 },
      { month: 'July', count: 0 },
      { month: 'August', count: 0 },
      { month: 'September', count: 0 },
      { month: 'October', count: 0 },
      { month: 'November', count: 0 },
      { month: 'December', count: 0 }
    ]
  };
}

export async function getRecentChanges(repoPath, filePath) {
  return [];
}
