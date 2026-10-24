import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { fetchFinancialAnalytics } from '../api';

export const FinancialAnalytics: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFinancialAnalytics()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500 font-medium text-sm animate-pulse">Loading Financial Analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Financial Distribution & Allocation Benchmarks
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Macro-economic dispersion of MPLADS allocation limits across all 543 parliamentary constituencies.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Mean Allocation</div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            ₹ {(data.mean_amount / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Average per MP</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Median (Q50)</div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            ₹ {(data.median_amount / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">50th Percentile</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Standard Baseline</div>
          <div className="text-lg font-bold text-blue-600 mt-1">
            ₹ {(data.baseline / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-blue-500 font-medium mt-0.5">{data.baseline_count} Constituencies</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Std Deviation</div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            ₹ {(data.std_amount / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dispersion metric</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Min Allocation</div>
          <div className="text-lg font-bold text-red-600 mt-1">
            ₹ {(data.min_amount / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-red-500 font-medium mt-0.5">Basirhat (WB)</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Max Allocation</div>
          <div className="text-lg font-bold text-purple-600 mt-1">
            ₹ {(data.max_amount / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-purple-500 font-medium mt-0.5">Malkajgiri (TG)</div>
        </div>
      </div>

      {/* Distribution Histogram Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Parliamentary Allocation Distribution Histogram</h3>
            <p className="text-xs text-slate-500">
              Constituency frequency across allocation brackets (Standard Baseline mode at ₹14.70 Cr)
            </p>
          </div>
          <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 font-medium">
            321 Constituencies (59.2%) at Exactly ₹14.70 Cr
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.distribution_buckets} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip 
                formatter={(val: any) => [`${val} Constituencies`, 'Count']}
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Extreme Outliers Comparison Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Allocations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-purple-700">
                <ArrowUpRight className="h-4 w-4" />
                Top 10 Highest Allocation Ceilings
              </h3>
              <p className="text-xs text-slate-500">Seats with significant supplementary / rollover allocations</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Constituency</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Hon'ble MP</th>
                  <th className="py-2.5 px-3 text-right">Limit (₹ Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.highest_allocations.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.constituency}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.state}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.mp_name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-700 text-right">
                      ₹ {(item.amount / 10000000).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lowest / Sub-baseline Allocations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-red-700">
                <ArrowDownRight className="h-4 w-4" />
                Top 10 Lowest Allocation Ceilings
              </h3>
              <p className="text-xs text-slate-500">Seats with truncated or sub-baseline allocations</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Constituency</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Hon'ble MP</th>
                  <th className="py-2.5 px-3 text-right">Limit (₹ Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.lowest_allocations.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.constituency}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.state}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.mp_name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-red-700 text-right">
                      ₹ {(item.amount / 10000000).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
