import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Brain,
  Binary
} from 'lucide-react';
import { AnomalyItem } from '../types';
import { triggerAnomalyDetection } from '../api';

interface AnomalyDetectionProps {
  anomalies: AnomalyItem[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  anomalies,
  onRefresh,
  isRefreshing
}) => {
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isRunningEngine, setIsRunningEngine] = useState<boolean>(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const handleRunEngine = async () => {
    try {
      setIsRunningEngine(true);
      setRunMessage(null);
      await triggerAnomalyDetection();
      setRunMessage('ML Isolation Forest and statistical models executed successfully.');
      onRefresh();
    } catch (err: any) {
      setRunMessage('Failed to execute anomaly engine: ' + err.message);
    } finally {
      setIsRunningEngine(false);
    }
  };

  const filtered = anomalies.filter((a) => {
    if (selectedRisk !== 'All' && a.risk_level !== selectedRisk) return false;
    if (selectedCategory !== 'All' && a.anomaly_category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.constituency.toLowerCase().includes(q) ||
        a.mp_name.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q) ||
        a.anomaly_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = Array.from(new Set(anomalies.map(a => a.anomaly_category)));

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            AI Anomaly Detection Engine
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" />
              Isolation Forest + IQR
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Dual-layered anomaly scoring combining machine learning outlier detection with statutory MPLADS regulatory rules.
          </p>
        </div>

        <button
          onClick={handleRunEngine}
          disabled={isRunningEngine || isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRunningEngine ? 'animate-spin' : ''}`} />
          <span>{isRunningEngine ? 'Computing Models...' : 'Re-Run Anomaly Pipeline'}</span>
        </button>
      </div>

      {runMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{runMessage}</span>
        </div>
      )}

      {/* Model Methodology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-900">Isolation Forest (Unsupervised ML)</div>
            <p className="text-slate-500 leading-relaxed">
              Trains 100 decision trees to isolate anomalies in scaled financial feature space. Contamination: 4%, Deterministic Seed: 42.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Binary className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-900">IQR & Robust Z-Scores</div>
            <p className="text-slate-500 leading-relaxed">
              Detects extreme high outliers (&gt; ₹22 Cr) and sub-baseline allocations using median absolute deviation fences.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-900">Constituency & Quota Integrity</div>
            <p className="text-slate-500 leading-relaxed">
              Identifies duplicate seat representations (e.g. Nanded), unassigned allocation values, and by-election conflicts.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search anomalies by constituency, MP, or rule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="All">All Priority Tiers</option>
              <option value="Critical">Critical (80-100)</option>
              <option value="High">High (60-79)</option>
              <option value="Medium">Medium (30-59)</option>
              <option value="Low">Low (0-29)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> of <strong>{anomalies.length}</strong> detected findings
        </div>
      </div>

      {/* Anomaly Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200 text-xs">
            No anomalies found matching current filters.
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Summary Row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 px-2.5 py-1 rounded-md text-xs font-bold border ${
                      item.risk_level === 'Critical' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : item.risk_level === 'High'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : item.risk_level === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {item.risk_score} · {item.risk_level}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.constituency}</span>
                        <span className="text-xs text-slate-500 font-medium">({item.state})</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.anomaly_type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        MP: <strong className="text-slate-800">{item.mp_name}</strong> · Allocation:{' '}
                        {item.allocated_amount !== null ? (
                          <span className="font-mono font-semibold text-slate-900">
                            ₹ {(item.allocated_amount / 10000000).toFixed(2)} Cr
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">Unassigned (NaN)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                      {item.anomaly_category}
                    </span>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Evidence Accordion */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 mb-1">Observation Reason:</div>
                      <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                        {item.reason}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="font-semibold text-slate-800 mb-1">Mathematical / Empirical Evidence:</div>
                        <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                          {JSON.stringify(item.evidence, null, 2)}
                        </pre>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-slate-800 mb-1">Recommended Verification Action:</div>
                          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 leading-relaxed">
                            {item.suggested_action}
                          </div>
                        </div>

                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                          <strong>Integrity Notice:</strong> This anomaly indicates an administrative outlier or record ambiguity deserving examination; it does not constitute proof of fraud or wrongdoing.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
