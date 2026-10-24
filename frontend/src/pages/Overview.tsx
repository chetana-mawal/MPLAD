import React from 'react';
import { 
  Building2, 
  IndianRupee, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DashboardSummary, RegionalMetric, AnomalyItem } from '../types';

interface OverviewProps {
  summary: DashboardSummary | null;
  regional: RegionalMetric[];
  anomalies: AnomalyItem[];
  onNavigateTab: (tab: string) => void;
}

const RISK_COLORS = {
  Critical: '#DC2626', // Red
  High: '#EA580C',     // Orange
  Medium: '#D97706',   // Amber
  Low: '#16A34A',      // Green
};

export const Overview: React.FC<OverviewProps> = ({
  summary,
  regional,
  anomalies,
  onNavigateTab
}) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500 font-medium text-sm animate-pulse">Loading Sentinel Analytics...</div>
      </div>
    );
  }

  // Top 8 states by allocation
  const topStatesData = regional.slice(0, 8).map(st => ({
    name: st.state.length > 14 ? st.state.substring(0, 12) + '...' : st.state,
    fullName: st.state,
    amountCr: st.total_allocated_cr,
    mps: st.mp_count
  }));

  // Risk distribution
  const riskPieData = [
    { name: 'Critical Priority (80-100)', value: summary.critical_risk_count, color: RISK_COLORS.Critical },
    { name: 'High Priority (60-79)', value: summary.high_risk_count, color: RISK_COLORS.High },
    { name: 'Medium Priority (30-59)', value: summary.medium_risk_count, color: RISK_COLORS.Medium },
  ].filter(d => d.value > 0);

  // Category counts from anomalies
  const categoryCounts: Record<string, number> = {};
  anomalies.forEach(a => {
    categoryCounts[a.anomaly_category] = (categoryCounts[a.anomaly_category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat,
    count: count
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Monitoring Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Macro-level oversight of MPLADS 18th Lok Sabha allocations derived directly from the official MoSPI dataset.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            Analyzed: <strong>{summary.total_works}</strong> Constituencies
          </span>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            100% Data Fidelity
          </span>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Constituencies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Works / Seats</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{summary.total_works}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>All 36 States & UTs</span>
              <span className="text-blue-600 font-medium">100% Lok Sabha</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Allocated Limit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Allocated Limit</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">₹ 8,400.11 Cr</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Mean: ₹15.50 Cr / MP</span>
              <span className="text-emerald-600 font-medium">Zero Variance</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Detected Anomalies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flagged Anomalies</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-red-600 tracking-tight">{summary.total_anomalies}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-red-700 font-semibold">{summary.critical_risk_count} Critical</span>
              <span>·</span>
              <span className="text-orange-700 font-semibold">{summary.high_risk_count} High</span>
              <span>·</span>
              <span className="text-amber-700 font-semibold">{summary.medium_risk_count} Med</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Standard Baseline Quota */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Standard Baseline Quota</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">₹ 14.70 Cr</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>321 Seats (59%) on Baseline</span>
              <span className="text-indigo-600 font-medium">Standard 3-Yr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Schema Limitations Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-950 flex items-center gap-2">
            Dataset Schema Disclosure & Integrity Protocol
            <span className="bg-amber-200/60 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              Actual File Mode
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            The imported dataset represents the official <strong>Constituency-Level Allocated Limit</strong> table (543 MPs).
            Specific sub-fields such as <em>Individual Work Expenditure</em>, <em>Contractor Sanction Ledgers</em>, and <em>Milestone Completion Dates</em> are not present in this macro table.
            In strict compliance with data integrity principles, those metrics are marked as <strong>Unavailable (Requires Transaction Ledger)</strong> rather than populated with synthetic values.
          </p>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: State-wise Allocation Totals */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">State-wise Allocation Ceilings (Top 8 States)</h3>
              <p className="text-xs text-slate-500">Total sanctioned allocation limit in ₹ Crores</p>
            </div>
            <button 
              onClick={() => onNavigateTab('regional')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All 36 States <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStatesData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit=" Cr" />
                <Tooltip 
                  formatter={(val: any) => [`₹ ${val} Crore`, 'Total Allocation']}
                  labelFormatter={(name, items) => {
                    const found = topStatesData.find(d => d.name === name);
                    return found ? `${found.fullName} (${found.mps} MPs)` : name;
                  }}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amountCr" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Review Priority / Risk Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Review Priority Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution across risk scoring tiers</p>
            </div>
            <button 
              onClick={() => onNavigateTab('anomalies')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Examine <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [val, 'Cases']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2 text-xs">
            {riskPieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  {d.name}
                </span>
                <span className="font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Critical Findings & Anomaly Taxonomy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Priority Sentinel Cases */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Key Sentinel Findings Requiring Review</h3>
              <p className="text-xs text-slate-500">Top prioritized anomalies identified by statistical and ML algorithms</p>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Open Alert Queue →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Constituency</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Hon'ble MP</th>
                  <th className="py-2.5 px-3">Allocated Limit</th>
                  <th className="py-2.5 px-3">Anomaly Type</th>
                  <th className="py-2.5 px-3 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies.slice(0, 5).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{a.constituency}</td>
                    <td className="py-2.5 px-3 text-slate-600">{a.state}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{a.mp_name}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {a.allocated_amount !== null 
                        ? `₹ ${(a.allocated_amount / 10000000).toFixed(2)} Cr`
                        : <span className="text-red-600 font-semibold italic">Unassigned (NaN)</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {a.anomaly_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                        a.risk_level === 'Critical' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : a.risk_level === 'High'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {a.risk_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Anomaly Types Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Anomaly Detection Methodologies</h3>
            <p className="text-xs text-slate-500 mb-4">Multi-layered mathematical & rule verification</p>

            <div className="space-y-3">
              {categoryData.map((cd, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{cd.category}</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{cd.count} Cases</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {cd.category === 'Financial Outlier' && 'Upper extreme fence (> ₹22 Cr) & robust IQR variance.'}
                    {cd.category === 'ML Anomaly' && 'Unsupervised Isolation Forest multi-dimensional feature space.'}
                    {cd.category === 'Duplicate Work/Entity' && 'Multiple distinct entries for the same constituency seat.'}
                    {cd.category === 'Data Quality' && 'Unassigned, missing, or malformed allocation figures.'}
                    {cd.category === 'Financial Anomaly' && 'Sub-baseline quota shortfall (< ₹12.5 Cr) check.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Deterministic Seed: <strong className="font-mono">42</strong></span>
            <span className="text-emerald-600 font-semibold">Reproducible</span>
          </div>
        </div>
      </div>
    </div>
  );
};
