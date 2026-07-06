import { useState } from 'react';
import StatRow from './StatRow';

const ROWS_PER_PAGE = 10;

export default function Section({ title, data, sectionKey, onClickMetric }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isChangesExpanded, setIsChangesExpanded] = useState(false);

  if (!data) {
    return null;
  }

  // Special handling for readyCluster
  if (sectionKey === 'readyCluster' && data.builds && Array.isArray(data.builds)) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>

        {data.builds.length === 0 ? (
          <div className="text-gray-400 text-sm">No builds available</div>
        ) : (
          <>
            {/* Build Info Section */}
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
                      <span className={`font-bold ${build.status === 'PASS' ? 'text-passed' : 'text-failed'}`}>
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
            {data.changes && data.changes.length > 0 && (
              <div className="mt-6 bg-dark-bg rounded border border-dark-border">
                <button
                  onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                  className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-4 rounded transition-colors"
                >
                  <span className="text-lg">{isChangesExpanded ? '▼' : '▶'}</span>
                  <h3 className="text-sm font-semibold text-gray-300">Recent Changes</h3>
                </button>

                {isChangesExpanded && (
                  <div className="border-t border-dark-border p-4">
                    <div className="overflow-x-auto border border-dark-border rounded">
                      <table className="w-full text-xs text-gray-300">
                        <thead className="bg-dark-card border-b border-dark-border">
                          <tr>
                            <th className="text-left px-3 py-2">Build #</th>
                            <th className="text-left px-3 py-2">Date</th>
                            <th className="text-left px-3 py-2">Ticket #</th>
                            <th className="text-left px-3 py-2">Details</th>
                            <th className="text-left px-3 py-2">Author</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.changes.slice(0, 20).map((change, idx) => (
                            <tr key={idx} className="border-b border-dark-border hover:bg-dark-border/30">
                              <td className="px-3 py-2 text-gray-300 font-semibold">{change.buildNum || '-'}</td>
                              <td className="px-3 py-2 text-gray-400">{change.date || '-'}</td>
                              <td className="px-3 py-2 text-blue-400">{change.ticketNum || '-'}</td>
                              <td className="px-3 py-2 max-w-xs truncate">{change.details || '-'}</td>
                              <td className="px-3 py-2 text-green-300 font-semibold">{change.author || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Special handling for sections with builds (selenium, integrationTests, smokeTests)
  if (data.builds && Array.isArray(data.builds)) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors"
        >
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
        </button>

        {data.builds.length === 0 ? (
          <div className="mt-3 text-gray-400 text-sm">No builds available</div>
        ) : (
          data.builds.map((build) => (
            <div key={build.number}>
              <div className="mt-3 bg-dark-bg rounded p-4 border border-dark-border text-sm space-y-3">
                {/* Build Info Rows */}
                <div className="border-b border-dark-border pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Build #:</span>
                    <span className="font-bold text-white">{build.number}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-bold ${build.status === 'PASS' ? 'text-passed' : 'text-failed'}`}>
                      {build.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Cluster:</span>
                    <span className="text-gray-300">{build.clusterName}</span>
                  </div>
                </div>

                {/* Changes */}
                {build.changes && build.changes.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-300 mb-2">Latest changes:</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {build.changes.map((change, idx) => (
                        <div key={idx} className="text-xs text-gray-400 border-l-2 border-gray-600 pl-2">
                          <div className="text-gray-300 font-semibold">{change.author}</div>
                          <div className="text-gray-500">{change.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jenkins Link */}
                {build.url && (
                  <div className="border-t border-dark-border pt-2 text-right">
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
          ))
        )}
      </div>
    );
  }

  // Special handling for newTestsAdded (yearly with collapsible details)
  if (sectionKey === 'newTestsAdded') {
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedYearArea, setSelectedYearArea] = useState(null);

    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors mb-4"
        >
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
        </button>

        {isExpanded && (
          <div>
            {/* Year boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {data.yearly?.map((year) => (
                <button
                  key={year.year}
                  onClick={() => {
                    setSelectedYear(selectedYear === year.year ? null : year.year);
                    setSelectedYearArea(null);
                    setCurrentPage(0);
                  }}
                  className={`p-3 rounded border transition-colors ${
                    selectedYear === year.year
                      ? 'bg-dark-border border-blue-500 border-2'
                      : 'bg-dark-bg border-dark-border hover:border-gray-500'
                  }`}
                >
                  <div className="text-gray-400 text-sm">{year.year}</div>
                  <div className="text-2xl font-bold text-white">{year.count}</div>
                  <div className="text-xs text-gray-500">tests added</div>
                </button>
              ))}
            </div>

            {/* Details section - shown when year is selected */}
            {selectedYear !== null && (
              <div className="mt-4 bg-dark-bg rounded border border-dark-border p-4">
                <div className="text-sm font-semibold text-gray-300 mb-3">
                  {selectedYear} - Details
                </div>

                {/* Area boxes */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.yearly
                    ?.find(y => y.year === selectedYear)
                    ?.areas?.map((area, areaIdx) => (
                      <button
                        key={areaIdx}
                        onClick={() => {
                          setSelectedYearArea(selectedYearArea === areaIdx ? null : areaIdx);
                          setCurrentPage(0);
                        }}
                        className={`p-3 rounded border transition-colors text-left ${
                          selectedYearArea === areaIdx
                            ? 'bg-dark-border border-blue-500 border-2'
                            : 'bg-dark-card border-dark-border hover:border-gray-500'
                        }`}
                      >
                        <div className="text-gray-400 text-xs">{area.name}</div>
                        <div className="text-lg font-bold text-white">{area.count}</div>
                      </button>
                    ))}
                </div>

                {/* Test files details - shown when area is selected */}
                {selectedYearArea !== null && (
                  <div className="mt-4 bg-dark-card rounded border border-dark-border p-4">
                    <div className="text-sm font-semibold text-gray-300 mb-3">
                      Test Files
                    </div>
                    <div className="overflow-y-auto border border-dark-border rounded" style={{ maxHeight: '400px' }}>
                      <table className="w-full text-xs text-gray-300">
                        <thead className="sticky top-0 bg-dark-bg border-b border-dark-border">
                          <tr>
                            <th className="text-left px-3 py-2">File Name</th>
                            <th className="text-left px-3 py-2">Committed By</th>
                            <th className="text-left px-3 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.yearly
                            ?.find(y => y.year === selectedYear)
                            ?.areas?.[selectedYearArea]
                            ?.tests?.map((test, idx) => (
                              <tr key={idx} className="border-b border-dark-border hover:bg-dark-border/30">
                                <td className="px-3 py-2 text-gray-300">{test.filename}</td>
                                <td className="px-3 py-2 text-gray-400">{test.author}</td>
                                <td className="px-3 py-2 text-gray-500">{test.date}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Special handling for selenium, integrationTests, smokeTests (hierarchical stats)
  if (['selenium', 'integrationTests', 'smokeTests'].includes(sectionKey)) {
    const passed = (data.total || 0) - (data.failed || 0);

    // Filter tests based on metric
    const getFilteredTests = () => {
      if (selectedMetric === 'passed') {
        return data.areas
          .flatMap((area) => area.tests?.filter(t => t.status === 'PASS') || [])
          .map(t => ({ ...t, suggestedFix: 'N/A' }));
      } else if (selectedMetric === 'failed') {
        return data.areas.find((_, idx) => idx === selectedArea)?.tests?.filter(t => t.status === 'FAIL') || [];
      } else if (selectedMetric === 'stale') {
        return data.areas.find((_, idx) => idx === selectedArea)?.tests?.filter(t => t.status === 'STALE') || [];
      } else if (selectedMetric === 'total') {
        return data.areas.find((_, idx) => idx === selectedArea)?.tests || [];
      }
      return [];
    };

    const allTests = getFilteredTests();
    const totalPages = Math.ceil(allTests.length / ROWS_PER_PAGE);
    const visibleTests = allTests.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

    const passingPercentage = data.total > 0 ? ((passed / data.total) * 100).toFixed(2) : '0.00';

    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
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
            <div className="text-2xl font-bold text-passed">{passingPercentage}%</div>
            <div className="text-xs text-gray-400">passing</div>
          </div>
        </div>

        {/* Level 1: Always visible metric boxes */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { key: 'total', label: 'Total tests', value: data.total || 0 },
            { key: 'failed', label: 'Failed tests', value: data.failed || 0 },
            { key: 'passed', label: 'Pass tests', value: passed },
            { key: 'stale', label: 'Stale tests', value: data.stale || 0 }
          ].map((metric) => (
            <button
              key={metric.key}
              onClick={() => {
                setSelectedMetric(selectedMetric === metric.key ? null : metric.key);
                setSelectedArea(null);
                setCurrentPage(0);
                if (selectedMetric !== metric.key) setIsExpanded(true);
              }}
              className={`p-3 rounded border transition-colors ${
                selectedMetric === metric.key
                  ? 'bg-dark-border border-blue-500 border-2'
                  : 'bg-dark-bg border-dark-border hover:border-gray-500'
              }`}
            >
              <div className="text-gray-400 text-xs mb-1">{metric.label}</div>
              <div className={`text-2xl font-bold ${
                metric.key === 'failed' ? 'text-failed' :
                metric.key === 'stale' ? 'text-yellow-400' :
                metric.key === 'passed' ? 'text-passed' :
                'text-white'
              }`}>
                {metric.value}
              </div>
            </button>
          ))}
        </div>

        {/* Level 2: Areas section */}
        {isExpanded && selectedMetric && data.areas && data.areas.length > 0 && (
          <div className="mt-4 bg-dark-bg rounded border border-dark-border p-4 mb-4">
            <div className="text-sm font-semibold text-gray-300 mb-3">
              {selectedMetric === 'total' && 'Select an Area'}
              {selectedMetric === 'failed' && 'Areas with Failures'}
              {selectedMetric === 'stale' && 'Stale Test Areas'}
            </div>
            <div className="overflow-y-auto overflow-x-hidden border border-dark-border rounded p-3" style={{ maxHeight: '340px' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.areas
                .filter(area => {
                  if (selectedMetric === 'failed') return area.failed > 0;
                  if (selectedMetric === 'stale') return area.stale > 0;
                  return true;
                })
                .map((area) => {
                  const areaIndex = data.areas.indexOf(area);
                  return (
                  <button
                    key={areaIndex}
                    onClick={() => {
                      setSelectedArea(selectedArea === areaIndex ? null : areaIndex);
                      setCurrentPage(0);
                    }}
                    className={`p-3 rounded border transition-colors text-left ${
                      selectedArea === areaIndex
                        ? 'bg-dark-border border-blue-500 border-2'
                        : 'bg-dark-card border-dark-border hover:border-gray-500'
                    }`}
                  >
                    <div className="text-gray-400 text-xs">{area.name}</div>
                    <div className="text-xl font-bold text-white">
                      {selectedMetric === 'failed' ? area.failed :
                       selectedMetric === 'stale' ? area.stale :
                       selectedMetric === 'passed' ? (area.total - area.failed) :
                       area.total}
                    </div>
                  </button>
                  );
                })}
            </div>
            </div>
          </div>
        )}

        {/* Level 3: Details table with pagination (only show if area selected) */}
        {isExpanded && selectedMetric && selectedArea !== null && (
          <div className="mt-4 bg-dark-card rounded border border-dark-border p-4">
            <div className="text-sm font-semibold text-gray-300 mb-3">
              Details ({allTests.length} tests)
            </div>
            <div className="overflow-y-auto border border-dark-border rounded" style={{ maxHeight: '400px' }}>
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
                        <td className="px-3 py-2">{test.lastPassed || 'N/A'}</td>
                        <td className="px-3 py-2 max-w-xs truncate">{test.recentChanges || 'N/A'}</td>
                        <td className="px-3 py-2">{test.suggestedFix || 'N/A'}</td>
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
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors"
      >
        <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
        <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
      </button>

      {/* Summary row always visible */}
      <StatRow
        label="Summary"
        total={data.total}
        failed={data.failed}
        stale={data.stale}
        areas={data.areas?.length || 0}
        onClick={(metric) => {
          // Summary is informational only
        }}
      />

      {/* Expanded areas */}
      {isExpanded && data.areas && (
        <div className="mt-4 space-y-2 border-t border-dark-border pt-4">
          {data.areas.map((area, idx) => (
            <StatRow
              key={idx}
              label={area.name}
              total={area.total}
              failed={area.failed}
              stale={area.stale}
              areas={null}
              onClick={(metric) => {
                onClickMetric?.(sectionKey, area.name, metric);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
