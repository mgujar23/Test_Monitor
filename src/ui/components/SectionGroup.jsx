import { useState } from 'react';
import Section from './Section';

export default function SectionGroup({ title, sections, dashboardData, onClickMetric }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 hover:bg-dark-border/50 p-4 transition-colors border-b border-dark-border"
      >
        <span className="text-lg font-bold">{isExpanded ? '▼' : '▶'}</span>
        <h2 className="text-2xl font-bold text-white flex-1">{title}</h2>
      </button>

      {/* Group Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {sections.map(([key, sectionTitle]) => (
            <Section
              key={key}
              sectionKey={key}
              title={sectionTitle}
              data={dashboardData.sections[key]}
              onClickMetric={onClickMetric}
            />
          ))}
        </div>
      )}
    </div>
  );
}
