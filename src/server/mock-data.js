export function generateMockDashboardData() {
  const timestamp = new Date().toISOString();

  return {
    timestamp,
    refreshDurationMs: 1234,
    sections: {
      readyCluster: {
        builds: [
          {
            number: 6910,
            status: 'PASS',
            clusterName: 'cluster-c30.dev-rd.forcepoint.net',
            url: 'https://jenkins.infra-dev.forcepoint.net/job/Projects/job/Test/job/ReadyCluster/6960/',
            changes: [
              { author: 'sa_githubsmtp', message: 'WSC-7657 - No longer publishing RLY RPMs' },
              { author: 'sa_githubsmtp', message: 'CES-6542 - Stops head->rly dev sync, document dev_ia8 sync (#553)' },
              { author: 'mrobinson', message: 'WSC-6658: auto-wire HAProxy portal door (.220) when a cluster has lb-www' },
              { author: 'mrobinson', message: 'WSC-6658: harden portal-path-test.sh verdict logic' },
              { author: 'mrobinson', message: 'WSC-7616: re-enable crond for the post-install phase (cca_server/Trellix DB)' },
              { author: 'mrobinson', message: 'WSC-7616: quiesce crond during the in-build OS upgrade' }
            ]
          }
        ],
        total: 1,
        failed: 0,
        stale: 0,
        areas: []
      },
      selenium: {
        total: 0,
        failed: 0,
        stale: 0,
        areas: []
      },
      integrationTests: {
        total: 0,
        failed: 0,
        stale: 0,
        areas: []
      },
      smokeTests: {
        total: 0,
        failed: 0,
        stale: 0,
        areas: []
      },
      newTestsAdded: {
        yearly: [
          { month: 'January', count: 12 },
          { month: 'February', count: 8 },
          { month: 'March', count: 15 },
          { month: 'April', count: 10 },
          { month: 'May', count: 9 },
          { month: 'June', count: 14 },
          { month: 'July', count: 0 },
          { month: 'August', count: 0 },
          { month: 'September', count: 0 },
          { month: 'October', count: 0 },
          { month: 'November', count: 0 },
          { month: 'December', count: 0 }
        ]
      }
    },
    lastError: null
  };
}
