import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Section from '../components/Section';
import SectionGroup from '../components/SectionGroup';
import DetailsModal from '../components/DetailsModal';
import { fetchDashboard, triggerManualRefresh, fetchTestDetails } from '../utils/api';

const SECTION_TITLES = {
  readyCluster: 'Ready Cluster Status',
  selenium: 'Selenium Tests',
  integrationTests: 'Integration Tests',
  smokeTests: 'Smoke Tests',
  newTestsAdded: 'New Tests Added (Yearly)',
  prxAutoTest: 'PRX Auto Test',
  csgServiceReporting: 'CSG Service Reporting',
  cstoreReporting: 'CSTORE Reporting Test',
  etlSIEM: 'ETL SIEM',
  etlSIEMCluster: 'ETL SIEM Cluster Test',
  reportingMetrics: 'Reporting Metrics'
};

const SECTION_GROUPS = {
  portal: {
    title: 'Portal',
    sections: [
      ['selenium', 'Selenium Tests'],
      ['integrationTests', 'Integration Tests'],
      ['smokeTests', 'Smoke Tests']
    ]
  },
  proxy: {
    title: 'Proxy',
    sections: [
      ['prxAutoTest', 'PRX Auto Test']
    ]
  },
  reporting: {
    title: 'Reporting',
    sections: [
      ['csgServiceReporting', 'CSG Service Reporting'],
      ['cstoreReporting', 'CSTORE Reporting Test'],
      ['etlSIEM', 'ETL SIEM'],
      ['etlSIEMCluster', 'ETL SIEM Cluster Test']
    ]
  }
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState(null);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 15 seconds to keep data current
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await triggerManualRefresh();
      // Wait 2 seconds for backend to process refresh, then reload immediately
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadDashboard();
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setError('Refresh failed: ' + err.message);
      setRefreshing(false);
    }
  }

  async function handleClickMetric(sectionKey, areaName, metric) {
    if (metric !== 'failed' && metric !== 'stale') {
      return; // Only show details for failed and stale
    }

    try {
      const testId = `${sectionKey}::${areaName}::${areaName}`;
      const details = await fetchTestDetails(testId);
      setSelectedTest(details);
    } catch (err) {
      console.error('Failed to load test details:', err);
      setError('Failed to load test details');
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text">
      {/* Sidebar Navigation - Full Height */}
      <div className="w-64 bg-dark-bg border-r border-gray-700 overflow-y-auto">
        <div className="sticky top-0 bg-dark-bg border-b border-gray-700 p-6 z-10">
          <h1 className="text-lg font-semibold text-dark-text">Cloud web Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Frame 5</p>
        </div>
        <div className="p-6">

          <div className="space-y-4">
            <button
              onClick={() => setSelectedSidebarItem('readyCluster')}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedSidebarItem === 'readyCluster'
                  ? 'bg-blue-900/50 border border-blue-700'
                  : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <p className="text-dark-text font-medium text-sm">Ready Cluster Status</p>
            </button>
            <button
              onClick={() => setSelectedSidebarItem('cstoreReporting')}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedSidebarItem === 'cstoreReporting'
                  ? 'bg-blue-900/50 border border-blue-700'
                  : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <p className="text-dark-text font-medium text-sm">CSTORE reporting test</p>
            </button>
            <button
              onClick={() => setSelectedSidebarItem('etlSIEMCluster')}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedSidebarItem === 'etlSIEMCluster'
                  ? 'bg-blue-900/50 border border-blue-700'
                  : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
              }`}
            >
              <p className="text-dark-text font-medium text-sm">ETL SIEM cluster test</p>
            </button>

            <div className="bg-gray-800 p-4 rounded-lg mt-8">
              <p className="text-dark-text font-medium text-sm mb-2">Recent changes</p>
              <p className="text-gray-400 text-xs">in CSG_Service</p>
              <p className="text-gray-500 text-xs mt-2">Frame 6</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Header + Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          lastUpdateTime={dashboardData?.timestamp}
          lastRefreshTime={lastRefreshTime}
          onRefresh={handleRefresh}
          isLoading={loading || refreshing}
          refreshing={refreshing}
          sectionGroupStats={dashboardData?.aiInsights?.sectionGroupStats}
        />

        {error && (
          <div className="bg-red-900/20 border-b border-red-700/50 text-red-200 px-6 py-3">
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-dark-bg via-dark-bg to-dark-bg">
          <div className="space-y-8">
            {dashboardData && (
              <>
                {/* Portal Section */}
                <div>
                  <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                    <span className="text-blue-400">📊</span>
                    <span>Portal</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    {SECTION_GROUPS.portal.sections.map(([sectionKey, sectionTitle]) => {
                      const section = dashboardData.sections[sectionKey];
                      if (!section) return null;
                      return (
                        <Section
                          key={sectionKey}
                          title={sectionTitle}
                          sectionKey={sectionKey}
                          data={section}
                          onClickMetric={handleClickMetric}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Proxy Section */}
                <div>
                  <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                    <span className="text-green-400">🔒</span>
                    <span>Proxy</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    {SECTION_GROUPS.proxy.sections.map(([sectionKey, sectionTitle]) => {
                      const section = dashboardData.sections[sectionKey];
                      if (!section) return null;
                      return (
                        <Section
                          key={sectionKey}
                          title={sectionTitle}
                          sectionKey={sectionKey}
                          data={section}
                          onClickMetric={handleClickMetric}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Reporting Section */}
                <div>
                  <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                    <span className="text-orange-400">📈</span>
                    <span>Reporting</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    {SECTION_GROUPS.reporting.sections.map(([sectionKey, sectionTitle]) => {
                      const section = dashboardData.sections[sectionKey];
                      if (!section) return null;
                      return (
                        <Section
                          key={sectionKey}
                          title={sectionTitle}
                          sectionKey={sectionKey}
                          data={section}
                          onClickMetric={handleClickMetric}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {selectedTest && (
        <DetailsModal
          testDetails={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}

      {/* Sidebar Section Modal */}
      {selectedSidebarItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSidebarItem(null)}>
          <div className="bg-dark-bg border border-gray-700 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-dark-bg border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark-text">
                {selectedSidebarItem === 'readyCluster' && 'Ready Cluster Status'}
                {selectedSidebarItem === 'cstoreReporting' && 'CSTORE reporting test'}
                {selectedSidebarItem === 'etlSIEMCluster' && 'ETL SIEM cluster test'}
              </h2>
              <button
                onClick={() => setSelectedSidebarItem(null)}
                className="text-gray-400 hover:text-white text-2xl font-light"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {dashboardData && selectedSidebarItem === 'readyCluster' && (
                <Section
                  title="Ready Cluster Status"
                  sectionKey="readyCluster"
                  data={dashboardData.sections.readyCluster}
                  onClickMetric={handleClickMetric}
                />
              )}
              {dashboardData && selectedSidebarItem === 'cstoreReporting' && (
                <Section
                  title="CSTORE reporting test"
                  sectionKey="cstoreReporting"
                  data={dashboardData.sections.cstoreReporting}
                  onClickMetric={handleClickMetric}
                />
              )}
              {dashboardData && selectedSidebarItem === 'etlSIEMCluster' && (
                <Section
                  title="ETL SIEM cluster test"
                  sectionKey="etlSIEMCluster"
                  data={dashboardData.sections.etlSIEMCluster}
                  onClickMetric={handleClickMetric}
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
