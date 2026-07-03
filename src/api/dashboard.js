const JenkinsClient = require('./jenkins');
const SeleniumClient = require('./selenium');
const GitClient = require('./git');
const { aggregateSectionData, loadFixesFile, getFixForTest } = require('./utils');

class DashboardAggregator {
  constructor(config) {
    this.config = config;
    this.jenkinsClient = new JenkinsClient(config.jenkins.url);
    this.seleniumClient = new SeleniumClient(config.selenium.url);
    this.gitClient = new GitClient(config.git.repoPath, config.git.branch);
    this.fixes = loadFixesFile(config.fixesFilePath);
  }

  async aggregateDashboardData() {
    const startTime = Date.now();

    try {
      const results = await Promise.allSettled([
        this.jenkinsClient.fetchJobStatus(),
        this.seleniumClient.fetchTestResults(),
        this.gitClient.fetchNewTestsAddedYearly(),
      ]);

      const [jenkinsResult, seleniumResult, gitResult] = results;

      const dashboardData = {
        timestamp: new Date().toISOString(),
        jenkins: jenkinsResult.status === 'fulfilled' ? jenkinsResult.value : { jobs: [] },
        selenium: seleniumResult.status === 'fulfilled' ? seleniumResult.value : { total: 0, failed: 0, stale: 0, areas: [] },
        git: gitResult.status === 'fulfilled' ? gitResult.value : { yearly: [] },
        fixes: this.fixes,
        executionTimeMs: Date.now() - startTime,
      };

      // Merge fixes with test results
      if (dashboardData.selenium.areas) {
        dashboardData.selenium.areas.forEach(area => {
          if (area.tests) {
            area.tests = area.tests.map(test => ({
              ...test,
              fix: getFixForTest(this.fixes, test.name),
            }));
          }
        });
      }

      return dashboardData;
    } catch (error) {
      console.error('Error aggregating dashboard data:', error);
      return {
        timestamp: new Date().toISOString(),
        jenkins: { jobs: [] },
        selenium: { total: 0, failed: 0, stale: 0, areas: [] },
        git: { yearly: [] },
        fixes: this.fixes,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}

module.exports = DashboardAggregator;
