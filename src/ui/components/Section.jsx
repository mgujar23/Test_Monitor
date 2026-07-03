import { useState } from 'react';
import StatRow from './StatRow';

export default function Section({ title, data, sectionKey, onClickMetric }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) {
    return null;
  }

  // Special handling for newTestsAdded (yearly)
  if (sectionKey === 'newTestsAdded') {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center gap-3 hover:bg-dark-border/50 p-2 rounded transition-colors"
        >
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
        </button>

        {isExpanded && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.yearly?.map((month) => (
              <div key={month.month} className="bg-dark-bg p-3 rounded border border-dark-border">
                <div className="text-sm text-gray-400">{month.month}</div>
                <div className="text-2xl font-bold text-white">{month.count}</div>
                <div className="text-xs text-gray-500">tests added</div>
              </div>
            ))}
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
