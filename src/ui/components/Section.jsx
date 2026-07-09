import { useState } from 'react';
import StatRow from './StatRow';
import { generateTestFixDiff } from '../utils/generateTestFix';

const ROWS_PER_PAGE = 10;

export default function Section({ title, data, sectionKey, onClickMetric }) {
  // All state hooks at top level (React rules)
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isChangesExpanded, setIsChangesExpanded] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [currentDiff, setCurrentDiff] = useState(null);
  const [currentTestName, setCurrentTestName] = useState(null);

  if (!data) {
    return null;
  }

  // ========== READY CLUSTER SECTION ==========
  if (sectionKey === 'readyCluster' && data.builds && Array.isArray(data.builds)) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>

        {data.builds.length === 0 ? (
          <div className="text-gray-400 text-sm">No builds available</div>
        ) : (
          <>
            {data.builds.map((build) => (
              <div key={build.number} className="mb-6">
                <div className="bg-dark-bg rounded p-4 border border-dark-border text-sm space-y-3">
                  <div className="border-b border-dark-border pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Build #:</span>
                      <span className="font-bold text-white">{build.number}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-bold ${build.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                        {build.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Cluster:</span>
                      <span className="text-gray-300">{build.clusterName}</span>
                    </div>
                  </div>

                  {build.url && (
                    <div className="text-right">
                      <a
                        href={build.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                      >
                        See details here →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Recent Changes Section */}
            {data.changes && (
              <div className="mt-6 bg-dark-bg rounded border border-dark-border">
                <button
                  onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                  className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-4 rounded transition-colors"
                >
                  <span className="text-lg">{isChangesExpanded ? '▼' : '▶'}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-300">Recent Changes</h3>
                    <p className="text-xs text-gray-500 mt-1">(Repo: //code_SaaS/csg_service/)</p>
                  </div>
                </button>

                {isChangesExpanded && (
                  <div className="border-t border-dark-border p-4">
                    {data.changes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No recent changes available</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-dark-border rounded" style={{ maxHeight: '500px' }}>
                        <table className="w-full text-xs text-gray-300">
                          <thead className="bg-dark-card border-b border-dark-border sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 min-w-[70px]">Build #</th>
                              <th className="text-left px-3 py-2 min-w-[80px]">Date</th>
                              <th className="text-left px-3 py-2 min-w-[70px]">Ticket #</th>
                              <th className="text-left px-3 py-2 min-w-[200px]">Details</th>
                              <th className="text-left px-3 py-2 min-w-[120px]">Author</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.changes.map((change, idx) => (
                              <tr key={idx} className="border-b border-dark-border hover:bg-dark-border/30">
                                <td className="px-3 py-2 text-gray-300 font-semibold">{change.buildNum || '-'}</td>
                                <td className="px-3 py-2 text-gray-400">{change.date || '-'}</td>
                                <td className="px-3 py-2 text-blue-400">{change.ticketNum || '-'}</td>
                                <td className="px-3 py-2 truncate text-gray-400">{change.details || '-'}</td>
                                <td className="px-3 py-2 text-green-300 font-semibold">{change.author || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ========== TEST SECTIONS (Selenium, Integration, Smoke Tests) ==========
  if (['selenium', 'integrationTests', 'smokeTests'].includes(sectionKey)) {
    const passed = (data.total || 0) - (data.failed || 0);
    const passingPercentage = data.total > 0 ? ((passed / data.total) * 100).toFixed(2) : '0.00';

    // Get the appropriate areas array based on selected metric
    const getAreasArray = () => {
      if (selectedMetric === 'totalAvailable') {
        return data.areasAvailable || [];
      }
      return data.areas || [];
    };

    // Get filtered tests based on selected metric and area
    const getFilteredTests = () => {
      if (!selectedArea) return [];
      const areasArray = getAreasArray();
      const area = areasArray?.[selectedArea];
      if (!area) return [];

      if (selectedMetric === 'failed') {
        return area.tests?.filter(t => t.status === 'FAIL') || [];
      } else if (selectedMetric === 'stale') {
        return area.tests?.filter(t => t.status === 'STALE') || [];
      } else if (selectedMetric === 'passed') {
        return area.tests?.filter(t => t.status === 'PASS') || [];
      }
      return area.tests || [];
    };

    const allTests = getFilteredTests();
    const totalPages = Math.ceil(allTests.length / ROWS_PER_PAGE);
    const visibleTests = allTests.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

    return (
      <>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
          {/* Header - Always Visible */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors"
              >
                <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                <h2 className="text-xl font-bold text-white">{title}</h2>
              </button>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{passingPercentage}%</div>
              <div className="text-xs text-gray-400">passing</div>
            </div>
          </div>

          {/* Metric Boxes - Always Visible */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {(sectionKey === 'selenium' ? [
              { key: 'total', label: 'Unique tests run', value: data.total || 0 },
              { key: 'totalAvailable', label: 'Total available tests', value: data.totalAvailable || 0 },
              { key: 'failed', label: 'Failed tests', value: data.failed || 0 },
              { key: 'passed', label: 'Pass tests', value: passed }
            ] : [
              { key: 'total', label: 'Total tests', value: data.total || 0 },
              { key: 'failed', label: 'Failed tests', value: data.failed || 0 },
              { key: 'passed', label: 'Pass tests', value: passed },
              { key: 'stale', label: 'Stale tests', value: data.stale || 0 }
            ]).map((metric) => (
              <button
                key={metric.key}
                onClick={() => {
                  setIsExpanded(true);
                  setSelectedMetric(selectedMetric === metric.key ? null : metric.key);
                  setSelectedArea(null);
                  setCurrentPage(0);
                }}
                className={`p-3 rounded border transition-colors ${
                  selectedMetric === metric.key
                    ? 'bg-blue-900/50 border-blue-500 border-2'
                    : 'bg-dark-bg border-dark-border hover:border-gray-500'
                }`}
              >
                <div className="text-gray-400 text-xs mb-1">{metric.label}</div>
                <div className={`text-2xl font-bold ${
                  metric.key === 'failed' ? 'text-red-400' :
                  metric.key === 'stale' ? 'text-yellow-400' :
                  metric.key === 'passed' ? 'text-green-400' :
                  metric.key === 'totalAvailable' ? 'text-blue-400' :
                  'text-white'
                }`}>
                  {metric.value}
                </div>
              </button>
            ))}
          </div>

          {isExpanded && (
            <>
              {/* Areas - Collapsible Section */}
              {(() => {
                const areasArray = getAreasArray();
                return selectedMetric && areasArray && areasArray.length > 0 && (
                  <div className="mt-4 bg-dark-bg rounded border border-dark-border overflow-hidden">
                    {/* Areas Header - Collapsible */}
                    <button
                      onClick={() => setSelectedArea(selectedArea === 'collapsed' ? null : 'collapsed')}
                      className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-4 transition-colors border-b border-dark-border"
                    >
                      <span className="text-lg">{selectedArea !== 'collapsed' ? '▼' : '▶'}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-300">
                          {selectedMetric === 'failed' && 'Areas with Failures'}
                          {selectedMetric === 'stale' && 'Stale Test Areas'}
                          {selectedMetric === 'passed' && 'Passing Tests by Area'}
                          {selectedMetric === 'total' && 'Unique Tests Run by Area'}
                          {selectedMetric === 'totalAvailable' && 'Total Available Tests by Area'}
                        </div>
                      </div>
                    </button>

                    {/* Areas Grid - Shown when expanded */}
                    {selectedArea !== 'collapsed' && (
                      <div className="p-4 border-t border-dark-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {areasArray.map((area, idx) => {
                            const shouldShow = selectedMetric === 'failed' ? area.failed > 0 :
                                              selectedMetric === 'stale' ? area.stale > 0 : true;

                            if (!shouldShow) return null;

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedArea(selectedArea === idx ? null : idx);
                                  setCurrentPage(0);
                                }}
                                className={`p-3 rounded border transition-colors text-left ${
                                  selectedArea === idx
                                    ? 'bg-blue-900/50 border-blue-500 border-2'
                                    : 'bg-dark-card border-dark-border hover:border-gray-500'
                                }`}
                              >
                                <div className="text-gray-400 text-xs">{area.name}</div>
                                <div className="text-xl font-bold text-white">
                                  {selectedMetric === 'failed' ? area.failed :
                                   selectedMetric === 'stale' ? area.stale :
                                   selectedMetric === 'passed' ? (area.total - area.failed) :
                                   selectedMetric === 'total' ? area.total :
                                   selectedMetric === 'totalAvailable' ? area.total :
                                   area.total}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Test Details Table */}
              {selectedMetric && selectedArea !== null && selectedArea !== 'collapsed' && (
                <div className="mt-4 bg-dark-card rounded border border-dark-border p-4">
                  <div className="text-sm font-semibold text-gray-300 mb-2">
                    Details ({allTests.length} tests)
                  </div>
                  {(() => {
                    const areasArray = getAreasArray();
                    if (!areasArray?.[selectedArea] || selectedArea === 'collapsed') return null;

                    const area = areasArray[selectedArea];
                    let displayCount = 0;
                    let totalCount = 0;
                    let label = '';

                    if (selectedMetric === 'failed') {
                      displayCount = area.failed;
                      label = 'failures';
                    } else if (selectedMetric === 'passed') {
                      displayCount = area.total - area.failed;
                      label = 'passing tests';
                    } else if (selectedMetric === 'total') {
                      displayCount = area.total;
                      label = 'total tests';
                    } else if (selectedMetric === 'stale') {
                      displayCount = area.stale;
                      label = 'stale tests';
                    } else if (selectedMetric === 'totalAvailable') {
                      displayCount = area.total;
                      label = 'total available tests';
                    }

                    if (displayCount > allTests.length) {
                      return (
                        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3 mb-3 text-yellow-100 text-xs">
                          <span className="font-semibold">ℹ️ Note:</span> This area has <span className="font-bold">{displayCount} {label}</span> in total. The count represents aggregated results from the entire test suite in this area.
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="overflow-x-auto border border-dark-border rounded" style={{ maxHeight: '400px' }}>
                    <table className="w-full text-xs text-gray-300">
                      <thead className="sticky top-0 bg-dark-bg border-b border-dark-border">
                        <tr>
                          <th className="text-left px-3 py-2">File name</th>
                          <th className="text-left px-3 py-2">Status</th>
                          <th className="text-left px-3 py-2">Last passed</th>
                          <th className="text-left px-3 py-2">Recent changes</th>
                          <th className="text-left px-3 py-2">Suggested fix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTests.length > 0 ? (
                          visibleTests.map((test, idx) => (
                            <tr key={idx} className="border-b border-dark-border hover:bg-dark-border/30">
                              <td className="px-3 py-2">{test.filename}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  test.status === 'PASS' ? 'bg-green-900 text-green-200' :
                                  test.status === 'FAIL' ? 'bg-red-900 text-red-200' :
                                  'bg-yellow-900 text-yellow-200'
                                }`}>
                                  {test.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-400">{test.lastPassed || 'N/A'}</td>
                              <td className="px-3 py-2 text-gray-400 max-w-xs truncate">{test.recentChanges || 'N/A'}</td>
                              <td className="px-3 py-2">
                                {test.status === 'PASS' ? (
                                  <span className="text-gray-500 text-xs">N/A</span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const diff = generateTestFixDiff({
                                        name: test.filename,
                                        className: test.filename,
                                        status: test.status
                                      });
                                      setCurrentDiff(diff);
                                      setCurrentTestName(test.filename);
                                      setShowDiffModal(true);
                                    }}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold transition-colors"
                                  >
                                    View
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-3 py-4 text-center text-gray-500">No tests found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <span>Page {currentPage + 1} of {totalPages}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          className="px-2 py-1 bg-dark-bg border border-dark-border rounded disabled:opacity-50"
                        >
                          ← Prev
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                          disabled={currentPage === totalPages - 1}
                          className="px-2 py-1 bg-dark-bg border border-dark-border rounded disabled:opacity-50"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Diff Modal */}
        {showDiffModal && currentDiff && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
            <div className="bg-dark-card border border-dark-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-card sticky top-0">
                <div>
                  <h3 className="text-lg font-bold text-white">Suggested Code Changes</h3>
                  <p className="text-xs text-gray-500 mt-1">Diff for {currentTestName}</p>
                </div>
              </div>

              {/* Diff Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-dark-bg">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words bg-dark-card border border-dark-border rounded p-4">
{currentDiff}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 p-6 border-t border-dark-border bg-dark-card">
                <button
                  onClick={() => setShowDiffModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(currentDiff));
                    element.setAttribute('download', `fix-${currentTestName}.patch`);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    alert('Patch downloaded to your Downloads folder!');
                    setShowDiffModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ========== NEW TESTS SECTION ==========
  if (sectionKey === 'newTestsAdded') {
    const [selectedViewType, setSelectedViewType] = useState('yearly'); // 'yearly' or 'areas'
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);

    const totalTests = Object.values(data.yearly || {}).reduce((sum, tests) => sum + tests.length, 0);

    // Ensure all years 2023-2026 are shown, even if empty
    const allYears = [2023, 2024, 2025, 2026];
    const yearlyMetrics = allYears.map(year => ({
      year: String(year),
      count: (data.yearly?.[year] || []).length
    }));

    const areaMetrics = Object.entries(data.byArea || {}).map(([area, tests]) => ({
      area,
      count: tests.length
    }));

    const getSelectedTests = () => {
      if (selectedViewType === 'yearly' && selectedYear) {
        return (data.yearly && data.yearly[selectedYear]) || [];
      } else if (selectedViewType === 'areas' && selectedArea) {
        return (data.byArea && data.byArea[selectedArea]) || [];
      }
      return [];
    };

    const selectedTests = getSelectedTests();

    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors mb-4"
        >
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
          <span className="text-2xl font-bold text-blue-400">{totalTests}</span>
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-6">
            {/* View Type Tabs */}
            <div className="flex gap-2 border-b border-dark-border">
              <button
                onClick={() => {
                  setSelectedViewType('yearly');
                  setSelectedYear(null);
                  setSelectedArea(null);
                }}
                className={`px-4 py-2 border-b-2 font-semibold text-sm transition-colors ${
                  selectedViewType === 'yearly'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                By Year
              </button>
              <button
                onClick={() => {
                  setSelectedViewType('areas');
                  setSelectedYear(null);
                  setSelectedArea(null);
                }}
                className={`px-4 py-2 border-b-2 font-semibold text-sm transition-colors ${
                  selectedViewType === 'areas'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                By Area
              </button>
            </div>

            {/* Yearly View */}
            {selectedViewType === 'yearly' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Tests Added Per Year</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {yearlyMetrics.map(({ year, count }) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                      className={`p-3 rounded border transition-colors text-left ${
                        selectedYear === year
                          ? 'bg-blue-900/50 border-blue-500 border-2'
                          : 'bg-dark-bg border-dark-border hover:border-gray-500'
                      }`}
                    >
                      <div className="text-gray-400 text-xs">Year {year}</div>
                      <div className="text-2xl font-bold text-green-400">{count}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area View */}
            {selectedViewType === 'areas' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Tests Added Per Area</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {areaMetrics.map(({ area, count }) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(selectedArea === area ? null : area)}
                      className={`p-3 rounded border transition-colors text-left ${
                        selectedArea === area
                          ? 'bg-blue-900/50 border-blue-500 border-2'
                          : 'bg-dark-bg border-dark-border hover:border-gray-500'
                      }`}
                    >
                      <div className="text-gray-400 text-xs truncate">{area}</div>
                      <div className="text-2xl font-bold text-green-400">{count}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Details Table */}
            {(selectedYear || selectedArea) && (
              <div className="bg-dark-card rounded border border-dark-border p-4">
                <div className="text-sm font-semibold text-gray-300 mb-3">
                  Details ({selectedTests.length} tests)
                </div>
                <div className="overflow-x-auto border border-dark-border rounded" style={{ maxHeight: '400px' }}>
                  <table className="w-full text-xs text-gray-300">
                    <thead className="sticky top-0 bg-dark-bg border-b border-dark-border">
                      <tr>
                        <th className="text-left px-3 py-2">File Name</th>
                        <th className="text-left px-3 py-2">Date Added</th>
                        <th className="text-left px-3 py-2">Author</th>
                        <th className="text-left px-3 py-2">Change #</th>
                        <th className="text-left px-3 py-2">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTests.length > 0 ? (
                        selectedTests.map((test, idx) => (
                          <tr key={idx} className="border-b border-dark-border hover:bg-dark-border/30">
                            <td className="px-3 py-2 truncate">{test.filename}</td>
                            <td className="px-3 py-2 text-gray-400">{test.date || 'N/A'}</td>
                            <td className="px-3 py-2 text-gray-400">{test.author || 'N/A'}</td>
                            <td className="px-3 py-2 text-gray-400">{test.changeNum || 'N/A'}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => {
                                  const diff = generateTestFixDiff({
                                    name: test.filename,
                                    className: test.filename,
                                    status: 'ADDED',
                                    author: test.author,
                                    date: test.date
                                  });
                                  setCurrentDiff(diff);
                                  setCurrentTestName(test.filename);
                                  setShowDiffModal(true);
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-4 text-center text-gray-500">No tests found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diff Modal for New Tests */}
        {showDiffModal && currentDiff && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
            <div className="bg-dark-card border border-dark-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-card sticky top-0">
                <div>
                  <h3 className="text-lg font-bold text-white">Test File Details</h3>
                  <p className="text-xs text-gray-500 mt-1">{currentTestName}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-dark-bg">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words bg-dark-card border border-dark-border rounded p-4">
{currentDiff}
                </pre>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-dark-border bg-dark-card">
                <button
                  onClick={() => setShowDiffModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
