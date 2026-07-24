import SectionGroup from './SectionGroup';

export default function FrameLayout({ dashboardData, frameNumber, title, sections, onClickMetric }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-gray-500 text-xs font-semibold mb-4">FRAME {frameNumber}</h2>
      {title && <h3 className="text-gray-900 font-semibold text-lg mb-4">{title}</h3>}

      <div className="space-y-4">
        {sections.map((sectionKey) => {
          const section = dashboardData?.sections?.[sectionKey];
          const sectionTitles = {
            readyCluster: 'Ready Cluster Status',
            selenium: 'Selenium Tests',
            integrationTests: 'Integration Tests',
            smokeTests: 'Smoke Tests',
            prxAutoTest: 'PRX Auto Test',
            csgServiceReporting: 'CSG Service Reporting',
            cstoreReporting: 'CSTORE Reporting Test',
            etlSIEM: 'ETL SIEM',
            etlSIEMCluster: 'ETL SIEM Cluster Test',
            reportingMetrics: 'Reporting Metrics'
          };

          return (
            <div key={sectionKey} className="border-t border-gray-200 pt-4">
              <h4 className="text-gray-700 font-medium text-sm mb-3">{sectionTitles[sectionKey]}</h4>
              {section?.areas && section.areas.length > 0 ? (
                <div className="text-xs text-gray-600">
                  <p>Total: {section.total} | Failed: {section.failed} | Stale: {section.stale}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No data available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
