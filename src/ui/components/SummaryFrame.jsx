export default function SummaryFrame({ dashboardData }) {
  const getSectionTotal = (sectionKey) => {
    const section = dashboardData?.sections?.[sectionKey];
    return section?.total || 0;
  };

  const getSectionFailed = (sectionKey) => {
    const section = dashboardData?.sections?.[sectionKey];
    return section?.failed || 0;
  };

  const cwTotal = getSectionTotal('readyCluster') + getSectionTotal('selenium') + getSectionTotal('integrationTests') + getSectionTotal('smokeTests');
  const portalTotal = getSectionTotal('readyCluster') + getSectionTotal('selenium');
  const proxyTotal = getSectionTotal('prxAutoTest');

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-gray-500 text-xs font-semibold mb-4">FRAME 1</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-200 p-4 rounded">
          <p className="text-gray-600 text-sm font-medium">Total Tests in CW</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{cwTotal}</p>
        </div>

        <div className="bg-gray-200 p-4 rounded">
          <p className="text-gray-600 text-sm font-medium">Total Portal</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{portalTotal}</p>
        </div>

        <div className="bg-gray-200 p-4 rounded">
          <p className="text-gray-600 text-sm font-medium">Total Proxy</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{proxyTotal}</p>
        </div>

        <div className="bg-gray-200 p-4 rounded">
          <p className="text-gray-600 text-sm font-medium">Total Reporting</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="col-span-1 bg-gray-100 p-4 rounded">
          <p className="text-gray-600 text-sm font-medium">Total failed TCs</p>
          <p className="text-xl font-bold text-red-600 mt-2">{getSectionFailed('readyCluster') + getSectionFailed('selenium')}</p>
        </div>
      </div>
    </div>
  );
}
