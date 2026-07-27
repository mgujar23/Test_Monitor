export default function Sidebar({ dashboardData }) {
  const categories = [
    {
      name: 'Ready Build Cluster',
      key: 'readyCluster'
    },
    {
      name: 'CSTORE reporting test',
      key: 'cstoreReporting'
    },
    {
      name: 'ETL SIEM cluster test',
      key: 'etlSIEMCluster'
    }
  ];

  return (
    <div className="w-64 bg-gray-100 p-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-gray-900">Cloud web Test Monitor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Frame 5</p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.key} className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 font-medium text-sm">{category.name}</p>
          </div>
        ))}

        <div className="bg-white p-4 rounded-lg shadow-sm mt-8">
          <p className="text-gray-900 font-medium text-sm mb-2">Recent changes</p>
          <p className="text-gray-600 text-xs">in CSG_Service</p>
          <p className="text-gray-400 text-xs mt-2">Frame 6</p>
        </div>
      </div>
    </div>
  );
}
