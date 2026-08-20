import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API_BASE = window.location.hostname === 'localhost' ? '/api' : '/test-monitor/api';

export default function CoverageMetrics({ sectionGroupStats }) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      const response = await fetch(`${API_BASE}/coverage-metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching coverage metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ label, value, unit, color = 'primary', onClick }) => {
    const colorClasses = {
      primary: 'text-accent-primary border-accent-primary/20 bg-accent-primary/5',
      secondary: 'text-accent-secondary border-accent-secondary/20 bg-accent-secondary/5',
      warning: 'text-accent-warning border-accent-warning/20 bg-accent-warning/5',
      alert: 'text-accent-alert border-accent-alert/20 bg-accent-alert/5'
    };
    return (
      <div
        onClick={onClick}
        className={`border border-dark-border rounded-xl p-6 bg-dark-card hover:border-dark-border/80 transition-colors ${onClick ? 'cursor-pointer hover:border-accent-primary/50' : ''}`}
      >
        <p className="text-dark-muted text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
          <p className="text-dark-muted text-xs">{unit}</p>
        </div>
        {onClick && <p className="text-dark-muted text-[10px] mt-2">Click for details →</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <div className="border-b border-dark-border bg-dark-bg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark-text mb-2">Coverage Metrics</h1>
              <p className="text-dark-muted">Logical SLOC across all repositories with test coverage analysis</p>
              {metrics?.generatedDate && (
                <p className="text-dark-muted text-xs mt-1">Data as of {metrics.generatedDate} (manual snapshot)</p>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-card border border-dark-border hover:border-dark-border/80 text-dark-text transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
              <p className="text-dark-muted">Loading coverage metrics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-accent-alert/10 border border-accent-alert/30 text-accent-alert p-6 rounded-xl">
            ⚠️ Error: {error}
          </div>
        ) : metrics ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total SLOC" value={(metrics.summary.totalLoC / 1000).toFixed(0)} unit="K" color="primary" />
              <StatCard label="Covered SLOC" value={(metrics.summary.coveredLoC / 1000).toFixed(0)} unit="K" color="primary" />
              <StatCard label="Uncovered SLOC" value={(metrics.summary.uncoveredLoC / 1000).toFixed(0)} unit="K" color="warning" />
              <StatCard label="Coverage" value={metrics.summary.coveragePercentage} unit="%" color="alert" onClick={() => setSelectedMetric('overall')} />
            </div>

            {/* Top Languages */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-dark-text mb-4">Top Languages Across All Repos</h2>
              <div className="space-y-3">
                {metrics.distribution?.topLanguages.slice(0, 8).map((lang, idx) => {
                  const maxLoC = Math.max(...(metrics.distribution?.topLanguages || []).map(l => l.loC));
                  const width = (lang.loC / maxLoC) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-dark-text">{lang.lang}</span>
                        <span className="text-xs text-dark-muted">{lang.percent}%</span>
                      </div>
                      <div className="w-full bg-dark-dim rounded-full h-1.5 overflow-hidden">
                        <div className="bg-accent-primary h-full transition-all" style={{ width: `${width}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coverage by Area */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-dark-text mb-6">Coverage by Area</h2>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { id: 'portal', name: 'Portal', data: metrics.byArea.portal },
                  { id: 'aws', name: 'AWS', data: metrics.byArea.aws },
                  { id: 'reporting', name: 'Reporting', data: metrics.byArea.reporting },
                  { id: 'proxy', name: 'Proxy', data: metrics.byArea.proxy }
                ].map((area) => (
                  <div key={area.id} className="border border-dark-border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-dark-text mb-3">{area.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-dark-muted">SLOC</span>
                        <span className="text-dark-text font-medium">{(area.data.totalLoC / 1000).toFixed(0)}K</span>
                      </div>
                      <div
                        className="flex justify-between cursor-pointer hover:underline decoration-dashed underline-offset-2"
                        onClick={() => setSelectedMetric(area.id)}
                      >
                        <span className="text-dark-muted">Coverage</span>
                        <span className="text-accent-primary font-medium">
                          {area.data.coveragePercentage === null ? 'N/A' : `${area.data.coveragePercentage}%`}
                        </span>
                      </div>
                      {area.data.coveragePercentage !== null && (
                        <div className="w-full bg-dark-dim rounded-full h-1.5 mt-2">
                          <div className="bg-accent-primary h-full rounded-full" style={{ width: `${area.data.coveragePercentage}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jenkins-Reported Coverage (real, tool-measured — distinct from the test-count-based estimate above) */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-dark-text mb-2">Jenkins-Reported Coverage</h2>
              <p className="text-dark-muted text-xs mb-6">
                Real, instrumented code coverage published by Jenkins (JaCoCo / coverage.py) — a different methodology than the test-count estimate above, and only available where a coverage tool is actually wired into the CI job.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {['reporting', 'proxy'].map((id) => {
                  const jc = metrics.jenkinsReportedCoverage?.[id];
                  if (!jc) return null;
                  return (
                    <div key={id} className="border border-dark-border rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-dark-text mb-1">{jc.name}</h3>
                      <p className="text-dark-muted text-xs mb-3">Source: {jc.source}</p>
                      {jc.available ? (
                        <>
                          {jc.totalLoC != null && (
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-dark-muted">Total SLOC</span>
                              <span className="text-dark-text font-medium">{jc.totalLoC.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-dark-muted">{jc.metric} coverage</span>
                            <span className="text-accent-secondary font-medium text-lg">{jc.percentage}%</span>
                          </div>
                          <div className="w-full bg-dark-dim rounded-full h-1.5 mt-2 mb-3">
                            <div className="bg-accent-secondary h-full rounded-full" style={{ width: `${jc.percentage}%` }}></div>
                          </div>
                          {jc.buildUrl && (
                            <a
                              href={jc.buildUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs underline"
                            >
                              View report in Jenkins →
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="text-dark-muted text-sm">Not available ({jc.reason || 'unknown reason'})</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scope comparison: our SLOC estimate vs what the coverage tool actually measured */}
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-sm font-semibold text-dark-text mb-3">Why these numbers don't match "Coverage by Area" above</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left py-2 pr-4 text-dark-muted font-semibold">Area</th>
                      <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Our SLOC (full codebase, all languages)</th>
                      <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Jenkins-Measured LOC</th>
                      <th className="text-right py-2 pr-4 text-dark-muted font-semibold">% of Our SLOC</th>
                      <th className="text-left py-2 text-dark-muted font-semibold">Why the gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: 'reporting',
                        note: 'JaCoCo only sees JVM languages (Java/Kotlin/Scala) and only instruments the csg_service-reporting repo — the other 6 repos in this area (etl-siem, siem, csg-signal360-orchestrator, etc.) have no coverage tool wired in at all.'
                      },
                      {
                        id: 'proxy',
                        note: 'coverage.py only measures Python — confirmed it instruments just 196 specific files under /opt/ods and /opt/webdefence. The rest of this multi-language codebase (C, Perl, shell, etc.) is invisible to this tool by design, not untested.'
                      }
                    ].map(({ id, note }) => {
                      const ourSLOC = metrics.byArea?.[id]?.totalLoC;
                      const jc = metrics.jenkinsReportedCoverage?.[id];
                      if (!jc || !jc.available || ourSLOC == null || jc.totalLoC == null) return null;
                      const pctOfOurs = ((jc.totalLoC / ourSLOC) * 100).toFixed(1);
                      return (
                        <tr key={id} className="border-b border-dark-border/50">
                          <td className="py-2 pr-4 text-dark-text font-medium">{jc.name}</td>
                          <td className="py-2 pr-4 text-right text-dark-text">{ourSLOC.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right text-dark-text">{jc.totalLoC.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right text-accent-secondary font-medium">{pctOfOurs}%</td>
                          <td className="py-2 text-dark-muted text-xs max-w-md">{note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Repositories by Area */}
            <div className="space-y-6">
              {[
                { id: 'portal', name: 'Portal' },
                { id: 'aws', name: 'AWS' },
                { id: 'reporting', name: 'Reporting' },
                { id: 'proxy', name: 'Proxy' }
              ].map(({ id, name }) => {
                const table = metrics.distribution?.areaTables?.[id];
                if (!table) return null;
                const isPortal = id === 'portal';
                return (
                  <div key={id} className="bg-dark-card border border-dark-border rounded-xl p-6 overflow-x-auto">
                    <h2 className="text-lg font-semibold text-dark-text mb-4">{name}</h2>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left py-2 pr-4 text-dark-muted font-semibold">{isPortal ? 'Directory / Project' : 'Repository'}</th>
                          {isPortal ? (
                            <>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">LoC (code only)</th>
                              <th className="text-left py-2 text-dark-muted font-semibold">Method</th>
                            </>
                          ) : (
                            <>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Files</th>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Code</th>
                              <th className="text-right py-2 pr-4 text-dark-muted font-semibold">Comment</th>
                              <th className="text-right py-2 text-dark-muted font-semibold">Blank</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, idx) => (
                          <tr key={idx} className="border-b border-dark-border/50">
                            <td className="py-1.5 pr-4 text-dark-text">{row.name}</td>
                            {isPortal ? (
                              <>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.loC.toLocaleString()}</td>
                                <td className={`py-1.5 ${row.method.startsWith('SonarQube') ? 'text-accent-secondary' : 'text-accent-primary'}`}>{row.method}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.files.toLocaleString()}</td>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.code.toLocaleString()}</td>
                                <td className="py-1.5 pr-4 text-right text-dark-text">{row.comment.toLocaleString()}</td>
                                <td className="py-1.5 text-right text-dark-text">{row.blank.toLocaleString()}</td>
                              </>
                            )}
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td className="py-1.5 pr-4 text-dark-text">TOTAL</td>
                          {isPortal ? (
                            <>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.totalLoC.toLocaleString()}</td>
                              <td></td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.rows.reduce((s, r) => s + r.files, 0).toLocaleString()}</td>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.totalLoC.toLocaleString()}</td>
                              <td className="py-1.5 pr-4 text-right text-dark-text">{table.rows.reduce((s, r) => s + r.comment, 0).toLocaleString()}</td>
                              <td className="py-1.5 text-right text-dark-text">{table.rows.reduce((s, r) => s + r.blank, 0).toLocaleString()}</td>
                            </>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Coverage Calculation Explanation Modal */}
      {selectedMetric && metrics && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMetric(null)}
        >
          <div
            className="bg-dark-card border border-dark-border rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-dark-text">
                {selectedMetric === 'overall' ? 'Overall Coverage' : `${metrics.byArea[selectedMetric]?.name} Coverage`}
              </h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-dark-muted hover:text-dark-text text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {selectedMetric === 'overall' ? (
              <div className="space-y-4">
                <div className="text-3xl font-bold text-accent-alert">{metrics.summary.coveragePercentage}%</div>
                <div className="bg-dark-bg rounded p-3 border border-dark-border/50">
                  <p className="text-dark-muted text-sm leading-relaxed">
                    <strong className="text-dark-text">How it's calculated:</strong><br /><br />
                    Covered SLOC: {metrics.summary.coveredLoC.toLocaleString()} ÷ Total SLOC: {metrics.summary.totalLoC.toLocaleString()} = {metrics.summary.coveragePercentage}%<br /><br />
                    Each area's "covered SLOC" comes from applying that area's own test-count-based coverage % to its SLOC. The overall figure is the LoC-weighted sum across all four areas — larger codebases (like Portal) influence the overall number more than smaller ones.
                  </p>
                </div>
                <div className="border-t border-dark-border pt-3">
                  <h4 className="text-sm font-semibold text-dark-muted mb-2">Breakdown by Area:</h4>
                  <div className="space-y-1 text-xs text-dark-muted">
                    {['portal', 'aws', 'reporting', 'proxy'].map((id) => {
                      const area = metrics.byArea[id];
                      return (
                        <div key={id} className="flex justify-between">
                          <span>{area.name}: {area.coveredLoC.toLocaleString()} / {area.totalLoC.toLocaleString()} SLOC</span>
                          <span className="text-accent-primary">{area.coveragePercentage === null ? 'N/A' : `${area.coveragePercentage}%`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              (() => {
                const area = metrics.byArea[selectedMetric];
                if (!area) return null;
                return (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-accent-primary">
                      {area.coveragePercentage === null ? 'N/A' : `${area.coveragePercentage}%`}
                    </div>
                    <div className="bg-dark-bg rounded p-3 border border-dark-border/50">
                      <p className="text-dark-muted text-sm leading-relaxed">
                        <strong className="text-dark-text">How it's calculated:</strong><br /><br />
                        {area.testCount === null || area.testCount === undefined ? (
                          <>No test-count source is wired up for {area.name} yet, so coverage can't be calculated — it shows N/A rather than a misleading 0%.</>
                        ) : (
                          <>
                            Tests measured: {area.testCount.toLocaleString()} ÷ {area.name}'s expected baseline: {area.expectedBaseline.toLocaleString()} = {area.coveragePercentage}%<br /><br />
                            {area.name}'s baseline ({area.expectedBaseline.toLocaleString()}) is {area.name}'s share of the {metrics.summary.expectedBaseline.toLocaleString()}-test full-coverage target, scaled by its {(area.totalLoC / (metrics.byArea.portal.totalLoC + metrics.byArea.aws.totalLoC + metrics.byArea.reporting.totalLoC + metrics.byArea.proxy.totalLoC) * 100).toFixed(1)}% share of total SLOC — so a small module isn't held to the same target as the whole codebase. Coverage % is capped at 100% once a section's test count meets or exceeds its own baseline.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="border-t border-dark-border pt-3 text-xs text-dark-muted">
                      <div className="flex justify-between">
                        <span>{area.name} SLOC</span>
                        <span>{area.totalLoC.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Covered SLOC (at this coverage %)</span>
                        <span>{area.coveredLoC.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
