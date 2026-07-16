import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/formatting';

export default function Header({ lastUpdateTime, onRefresh, isLoading, sectionGroupStats }) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <header className="bg-dark-card border-b border-dark-border p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">Cloud Web - Test Monitor</h1>
            <p className="text-sm text-gray-400">
              Last updated: {formatTimestamp(lastUpdateTime)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/insights')}
              className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
            >
              🤖 AI Insights
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isLoading || isRefreshing
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </header>

      {/* Test Statistics by Section Group */}
      {sectionGroupStats && (
        <div className="bg-dark-bg border-b border-dark-border/50 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Test Summary by Section</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-dark-card border border-dark-border rounded p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">Portal</div>
                <div className="text-2xl font-bold text-blue-400">{(sectionGroupStats.portal || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">Proxy</div>
                <div className="text-2xl font-bold text-green-400">{(sectionGroupStats.proxy || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded p-3">
                <div className="text-gray-400 text-xs font-medium mb-1">Reporting</div>
                <div className="text-2xl font-bold text-orange-400">{(sectionGroupStats.reporting || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded p-3 bg-blue-900/20">
                <div className="text-gray-400 text-xs font-medium mb-1">Total</div>
                <div className="text-2xl font-bold text-white">{(sectionGroupStats.total || 0).toLocaleString()}</div>
                <div className="text-gray-500 text-xs mt-1">tests</div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-300 mb-3">Coverage & Quality Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedMetric('codeCoverage')}
                className="bg-dark-card border border-dark-border rounded p-4 cursor-pointer hover:border-blue-500 transition-colors text-left"
              >
                <div className="text-gray-400 text-xs font-medium mb-2">Code Coverage</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-blue-400">{sectionGroupStats.codeCoverage || 0}%</div>
                  <div className="text-gray-500 text-xs mb-1">Click for details</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedMetric('testCoverage')}
                className="bg-dark-card border border-dark-border rounded p-4 cursor-pointer hover:border-green-500 transition-colors text-left"
              >
                <div className="text-gray-400 text-xs font-medium mb-2">Test Coverage</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-green-400">{sectionGroupStats.testCoverage || 0}%</div>
                  <div className="text-gray-500 text-xs mb-1">Click for details</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedMetric('passingPercentage')}
                className="bg-dark-card border border-dark-border rounded p-4 cursor-pointer hover:border-green-500 transition-colors text-left"
              >
                <div className="text-gray-400 text-xs font-medium mb-2">Passing Percentage</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-green-400">{sectionGroupStats.passingPercentage || 0}%</div>
                  <div className="text-gray-500 text-xs mb-1">Click for details</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Explanation Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedMetric(null)}>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedMetric === 'codeCoverage' && 'Code Coverage'}
                {selectedMetric === 'testCoverage' && 'Test Coverage'}
                {selectedMetric === 'passingPercentage' && 'Passing Percentage'}
              </h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold mb-2">
                  {selectedMetric === 'codeCoverage' && <span className="text-blue-400">{sectionGroupStats.codeCoverage}%</span>}
                  {selectedMetric === 'testCoverage' && <span className="text-green-400">{sectionGroupStats.testCoverage}%</span>}
                  {selectedMetric === 'passingPercentage' && <span className="text-green-400">{sectionGroupStats.passingPercentage}%</span>}
                </div>
              </div>

              <div className="bg-dark-bg rounded p-3 border border-dark-border/50">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedMetric === 'codeCoverage' && (
                    <>
                      <strong>How it's calculated:</strong><br/>
                      Tests: {sectionGroupStats.total?.toLocaleString()} ÷ Expected baseline: 500,000 = {sectionGroupStats.codeCoverage}%<br/><br/>
                      Measures the extent of test coverage relative to a full production baseline.
                    </>
                  )}
                  {selectedMetric === 'testCoverage' && (
                    <>
                      <strong>How it's calculated:</strong><br/>
                      Tests with results: {sectionGroupStats.total?.toLocaleString()} ÷ Total expected tests = {sectionGroupStats.testCoverage}%<br/><br/>
                      Indicates what percentage of all test executions have recorded results available.
                    </>
                  )}
                  {selectedMetric === 'passingPercentage' && (
                    <>
                      <strong>How it's calculated:</strong><br/>
                      Passed tests: {(sectionGroupStats.total - sectionGroupStats.totalFailed)?.toLocaleString()} ÷ Total tests: {sectionGroupStats.total?.toLocaleString()} = {sectionGroupStats.passingPercentage}%<br/><br/>
                      Shows the percentage of all tests that are passing across Portal ({sectionGroupStats.passingPercentage}%), Proxy, and Reporting sections.
                    </>
                  )}
                </p>
              </div>

              <div className="border-t border-dark-border pt-3">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Breakdown by Section:</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Portal: {sectionGroupStats.portal?.toLocaleString()} tests</span>
                    <span className="text-blue-400">{sectionGroupStats.portal > 0 ? Math.round(((sectionGroupStats.portal - sectionGroupStats.portalFailed) / sectionGroupStats.portal) * 100) : 0}% passing</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proxy: {sectionGroupStats.proxy?.toLocaleString()} tests</span>
                    <span className="text-green-400">{sectionGroupStats.proxy > 0 ? Math.round(((sectionGroupStats.proxy - sectionGroupStats.proxyFailed) / sectionGroupStats.proxy) * 100) : 0}% passing</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reporting: {sectionGroupStats.reporting?.toLocaleString()} tests</span>
                    <span className="text-orange-400">{sectionGroupStats.reporting > 0 ? Math.round(((sectionGroupStats.reporting - sectionGroupStats.reportingFailed) / sectionGroupStats.reporting) * 100) : 0}% passing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
