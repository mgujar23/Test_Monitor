import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API_BASE = window.location.hostname === 'localhost' ? '/api' : '/test-monitor/api';

export default function CoverageMetrics({ sectionGroupStats }) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const StatCard = ({ label, value, unit, color = 'primary' }) => {
    const colorClasses = {
      primary: 'text-accent-primary border-accent-primary/20 bg-accent-primary/5',
      secondary: 'text-accent-secondary border-accent-secondary/20 bg-accent-secondary/5',
      warning: 'text-accent-warning border-accent-warning/20 bg-accent-warning/5',
      alert: 'text-accent-alert border-accent-alert/20 bg-accent-alert/5'
    };
    return (
      <div className={`border border-dark-border rounded-xl p-6 bg-dark-card hover:border-dark-border/80 transition-colors`}>
        <p className="text-dark-muted text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
          <p className="text-dark-muted text-xs">{unit}</p>
        </div>
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
      <div className="max-w-7xl mx-auto px-6 py-8">>
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
              <StatCard label="Coverage" value={metrics.summary.coveragePercentage} unit="%" color="alert" />
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
              <div className="grid grid-cols-3 gap-6">
                {[
                  { id: 'portal', name: 'Portal', data: metrics.byArea.portal },
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
                      <div className="flex justify-between">
                        <span className="text-dark-muted">Coverage</span>
                        <span className="text-accent-primary font-medium">{area.data.coveragePercentage}%</span>
                      </div>
                      <div className="w-full bg-dark-dim rounded-full h-1.5 mt-2">
                        <div className="bg-accent-primary h-full rounded-full" style={{ width: `${area.data.coveragePercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Repositories by Area */}
            <div className="space-y-6">
              {Object.entries(metrics.distribution?.areaRepos || {}).map(([areaName, repos]) => (
                <div key={areaName} className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-dark-text mb-4">{areaName} Repositories</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {repos.map((repo, idx) => (
                      <div key={idx} className="border border-dark-border rounded-lg p-4">
                        <h3 className="text-sm font-medium text-dark-text mb-2 truncate" title={repo.name}>{repo.name}</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-dark-muted">
                            <span>SLOC</span>
                            <span className="text-dark-text font-medium">{(repo.loC / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex justify-between text-dark-muted">
                            <span>Files</span>
                            <span className="text-dark-text font-medium">{repo.files}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
