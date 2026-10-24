import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  ShieldAlert, 
  BellRing, 
  TrendingUp, 
  MapPin, 
  FileText, 
  FolderSync, 
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingAlertsCount: number;
  totalAnomaliesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  pendingAlertsCount,
  totalAnomaliesCount
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'works', label: 'Works Registry', icon: Database },
    { id: 'anomalies', label: 'AI Anomaly Detection', icon: ShieldAlert, badge: totalAnomaliesCount, badgeColor: 'bg-red-500' },
    { id: 'alerts', label: 'Risk Alerts', icon: BellRing, badge: pendingAlertsCount, badgeColor: 'bg-amber-500' },
    { id: 'financial', label: 'Financial Analytics', icon: TrendingUp },
    { id: 'regional', label: 'Regional Analytics', icon: MapPin },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'data', label: 'Data Management', icon: FolderSync },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 shadow-xl border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="text-white font-bold tracking-tight text-base flex items-center gap-1.5">
            MPLADS AI Sentinel
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-wide">
            Scheme Intelligence
          </div>
        </div>
      </div>

      {/* Official MoSPI / Governance Tag */}
      <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Ingest Active
        </span>
        <span className="text-slate-500 font-mono text-[10px]">v1.0.4</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-inner'
                  : 'hover:bg-slate-800/70 hover:text-white text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-white shadow-sm ${item.badgeColor || 'bg-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dataset & Session Metadata Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] text-slate-400 flex flex-col gap-1">
          <span className="font-semibold text-slate-300">Data Source:</span>
          <span className="truncate text-slate-400 font-mono text-[10px] bg-slate-900/90 px-2 py-1 rounded border border-slate-800" title="Allocated Limit for Honble MPs.csv">
            Allocated Limit for Honble MPs.csv
          </span>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>543 Constituencies</span>
            <span className="text-emerald-400 font-medium">Reconciled</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
