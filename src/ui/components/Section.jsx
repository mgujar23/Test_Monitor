import { useState } from 'react';
import StatRow from './StatRow';
import { generateTestFixDiff } from '../utils/generateTestFix';

const ROWS_PER_PAGE = 10;

export default function Section({ title, data, sectionKey, onClickMetric }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isChangesExpanded, setIsChangesExpanded] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [currentDiff, setCurrentDiff] = useState(null);
  const [currentTestName, setCurrentTestName] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedYearArea, setSelectedYearArea] = useState(null);

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
            {data.changes && (
              <div className="mt-6 bg-dark-bg rounded border border-dark-border">
                <button
                  onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                  className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-4 rounded transition-colors"
                >
                  <span className="text-lg">{isChangesExpanded ? '▼' : '▶'}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-300">Recent Changes (Last Month)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      (Change on repo: //code_SaaS/csg_service/)
                    </p>
                  </div>
                </button>

                {isChangesExpanded && (
                  <div className="border-t border-dark-border p-4">
                    {data.changes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No recent changes available</p>
                        <p className="text-xs mt-2 text-gray-600">Waiting for real data from Jenkins changeSet or Perforce...</p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto overflow-x-auto border border-dark-border rounded" style={{ maxHeight: '500px' }}>
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

    return (
      <>
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

      {/* Diff Modal - rendered at root level to avoid overflow-hidden clipping */}
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

  return null;
}