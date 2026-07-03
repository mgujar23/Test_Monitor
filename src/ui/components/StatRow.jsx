import { getStatusColor } from '../utils/formatting';

export default function StatRow({ label, total, failed, stale, areas, onClick }) {
  return (
    <div className="bg-dark-bg rounded p-3 flex items-center justify-between text-sm border border-dark-border hover:border-gray-500 transition-colors">
      <div className="font-semibold text-gray-200">{label}</div>
      <div className="flex gap-6 items-center">
        <div className="text-center">
          <button
            onClick={() => onClick?.('total')}
            className="text-lg font-bold text-white hover:text-blue-400 transition-colors"
          >
            {total}
          </button>
          <div className="text-xs text-gray-500">Total</div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onClick?.('failed')}
            className="text-lg font-bold text-failed hover:text-red-400 transition-colors"
          >
            {failed}
          </button>
          <div className="text-xs text-gray-500">Failed</div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onClick?.('stale')}
            className="text-lg font-bold text-stale hover:text-yellow-400 transition-colors"
          >
            {stale}
          </button>
          <div className="text-xs text-gray-500">Stale</div>
        </div>

        {areas !== null && (
          <div className="text-center">
            <div className="text-lg font-bold text-gray-300">{areas}</div>
            <div className="text-xs text-gray-500">Areas</div>
          </div>
        )}
      </div>
    </div>
  );
}
