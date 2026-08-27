import React from 'react';
import { HistoryRecord } from '../types';
import { History, X, Trash2, ArrowUpRight, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-[#0B1220] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#35C6F4]/10 border border-[#35C6F4]/30 text-[#35C6F4]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                REGISTRATION HISTORY
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Local browser session records &amp; benchmark runs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                id="clear-history-btn"
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-xs font-mono text-red-300 border border-red-800/50 transition-all"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              id="close-history-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs">
          {history.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <History className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm">No registration history records found.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Completed registrations and simulated benchmark runs will automatically be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#050812]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">RUN ID</th>
                    <th className="py-2.5 px-3">SENSORS</th>
                    <th className="py-2.5 px-3">RMSE</th>
                    <th className="py-2.5 px-3">MATCHES</th>
                    <th className="py-2.5 px-3">INLIER %</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {history.map((item, index) => (
                    <tr 
                      key={`${item.id}-${index}`}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectRecord(item)}
                    >
                      <td className="py-3 px-3 font-semibold text-[#35C6F4]">
                        {item.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-200">{item.referenceSensor}</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="text-slate-200">{item.sourceSensor}</span>
                      </td>
                      <td className="py-3 px-3 text-[#35D07F] font-bold">
                        {item.rmse}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {item.matches.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {item.inlierRatio}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#35D07F]/10 text-[#35D07F] border border-[#35D07F]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRecord(item);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#35C6F4]/10 hover:bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/30 transition-colors"
                        >
                          <span>Load</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] font-mono text-slate-500 px-5">
          <span>Persisted in LocalStorage</span>
          <span>Prototype Demonstration Records</span>
        </div>
      </div>
    </div>
  );
};
