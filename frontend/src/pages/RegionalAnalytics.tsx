import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  ArrowUpDown, 
  Building2, 
  IndianRupee, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { RegionalMetric } from '../types';

interface RegionalAnalyticsProps {
  regional: RegionalMetric[];
  onNavigateTab: (tab: string) => void;
}

export const RegionalAnalytics: React.FC<RegionalAnalyticsProps> = ({
  regional,
  onNavigateTab
}) => {
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('total_allocated');
  const [sortDir, setSortDir] = useState<string>('desc');

  const filtered = regional.filter((r) =>
    r.state.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a: any, b: any) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Regional & State-Level Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Comparative state and union territory metrics across 36 jurisdictions in the Indian Union.
          </p>
        </div>
        <div className="text-xs text-slate-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs font-medium">
          Total States/UTs: <strong>{regional.length}</strong> · Constituencies: <strong>543</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search state or union territory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* State Aggregation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th 
                  onClick={() => toggleSort('state')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-1">
                    <span>State / Union Territory</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('mp_count')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>MPs / Seats</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('total_allocated')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Allocated Limit (₹ Cr)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('average_allocated')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Mean / MP (₹ Cr)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('anomalies_count')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Flagged Anomalies</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Data Completeness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((item, idx) => (
                <tr key={item.state} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px] w-5">{idx + 1}.</span>
                    <span>{item.state}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">
                    {item.mp_count}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                    ₹ {item.total_allocated_cr.toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">
                    ₹ {item.average_allocated_cr.toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.anomalies_count > 0 ? (
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        item.critical_anomalies > 0 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.anomalies_count} ({item.critical_anomalies} Critical)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium">Standard</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.missing_allocations > 0 ? (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {item.missing_allocations} Unassigned NaN
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        100% Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
