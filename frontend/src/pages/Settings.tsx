import React from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Sliders, 
  Cpu, 
  Database, 
  Info,
  Server
} from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          System Configuration & Detection Parameters
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Review priority score calibration, machine learning hyper-parameters, and platform runtime settings.
        </p>
      </div>

      {/* Review Priority Calibration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Review Priority Thresholds (0 - 100 Scale)</h3>
        </div>
        <p className="text-xs text-slate-500">
          Demonstration operational tiers configured in accordance with audit guidelines.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-900 text-sm">Critical Priority</span>
              <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px]">80 - 100</span>
            </div>
            <p className="text-red-700 text-[11px] mt-1">
              Duplicate constituency representation, unassigned allocations, extreme statistical outliers (&gt; ₹22 Cr).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-900 text-sm">High Priority</span>
              <span className="font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded text-[11px]">60 - 79</span>
            </div>
            <p className="text-orange-700 text-[11px] mt-1">
              High Isolation Forest outlier scores, severe sub-baseline allocations (&lt; ₹10 Cr), substantial variance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-sm">Medium Priority</span>
              <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">30 - 59</span>
            </div>
            <p className="text-amber-700 text-[11px] mt-1">
              Moderate allocations exceeding standard upper inner quartile fence (₹17.50 Cr - ₹22 Cr).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 text-sm">Low / Baseline</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">0 - 29</span>
            </div>
            <p className="text-emerald-700 text-[11px] mt-1">
              Standard statutory allocations aligned with 3-year ₹14.70 Cr baseline quota.
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Model Specifications */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Isolation Forest Hyper-Parameters</h3>
        </div>
        <p className="text-xs text-slate-500">
          Unsupervised tree-based anomaly isolation for continuous multi-feature financial representations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 text-[11px] font-sans">Number of Estimators</div>
            <div className="text-base font-bold text-slate-900 mt-1">n_estimators = 100</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Ensemble forest depth</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 text-[11px] font-sans">Contamination Factor</div>
            <div className="text-base font-bold text-slate-900 mt-1">contamination = 0.04</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Expected anomaly density (4%)</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 text-[11px] font-sans">Random Seed</div>
            <div className="text-base font-bold text-emerald-600 mt-1">random_state = 42</div>
            <div className="text-[10px] text-emerald-700 font-sans mt-0.5">Deterministic & Reproducible</div>
          </div>
        </div>
      </div>

      {/* Governance & Anti-Accusatory Protocol */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          Governance Principles & Ethical Sentinel Architecture
        </div>
        <p className="text-slate-300">
          MPLADS AI Sentinel is engineered to assist administrative auditing and data reconciliation for parliamentary authorities.
          Findings identify record discrepancies, unassigned allocations, duplicate entries, and statistical variances deserving examination.
          The platform does <strong>not</strong> claim wrongdoing, fraud, or intentional irregularities by any Hon'ble Member of Parliament, district official, or implementing agency without independent documentary corroboration.
        </p>
      </div>
    </div>
  );
};
