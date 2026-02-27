'use client';
import { X, Link, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

const LOG_ICONS = {
  info:    <Info size={14} className="text-blue-500 flex-shrink-0" />,
  success: <CheckCircle size={14} className="text-green-500 flex-shrink-0" />,
  error:   <AlertCircle size={14} className="text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />,
};

const LOG_BG = {
  info:    'bg-blue-50 border-blue-100',
  success: 'bg-green-50 border-green-100',
  error:   'bg-red-50 border-red-100',
  warning: 'bg-yellow-50 border-yellow-100',
};

export default function LogModal({ slip, onClose }) {
  if (!slip) return null;

  const logs = slip.log_entries || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Activity Log
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {slip.first_name} {slip.last_name} · {slip.passport}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Generated Link Banner */}
        {slip.generated_link && (
          <div className="mx-6 mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Link size={16} className="text-green-600" />
              <span className="text-sm font-semibold text-green-800">Generated Payment Link</span>
            </div>
            <a
              href={slip.generated_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 break-all hover:underline font-mono"
            >
              {slip.generated_link}
            </a>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(slip.generated_link)}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <a
                href={slip.generated_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors"
              >
                Open Link
              </a>
            </div>
          </div>
        )}

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Info size={32} className="mb-3 opacity-40" />
              <p className="text-sm">No log entries yet.</p>
              <p className="text-xs mt-1">Generate a link to see automation logs.</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${LOG_BG[log.type] || LOG_BG.info}`}
              >
                <span className="mt-0.5">{LOG_ICONS[log.type] || LOG_ICONS.info}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 break-words leading-relaxed">{log.message}</p>
                  <p className="text-gray-400 mt-1 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
