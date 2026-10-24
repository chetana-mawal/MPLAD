import React from 'react';
import { RefreshCw, Search, ShieldCheck, Database, AlertCircle } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  totalWorks: number;
  totalAnomalies: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  totalWorks,
  totalAnomalies
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            MPLADS AI Sentinel
            <span className="text-[11px] font-semibold tracking-normal px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Official CSV Data Feed
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Members of Parliament Local Area Development Scheme · Autonomous Risk Intelligence & Audit Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dataset Quick Stats Pills */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium">
            <Database className="h-3.5 w-3.5 text-slate-500" />
            <span>Constituencies: <strong>{totalWorks}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            <span>Flagged Anomalies: <strong>{totalAnomalies}</strong></span>
          </div>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-xs disabled:opacity-50"
          title="Re-run pipeline and refresh data"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>
    </header>
  );
};
