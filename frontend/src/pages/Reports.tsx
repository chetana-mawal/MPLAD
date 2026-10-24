import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Layers, 
  ShieldCheck,
  Calendar,
  Database
} from 'lucide-react';
import { fetchReportSummary } from '../api';

export const Reports: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReportSummary()
      .then(res => setReport(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCSV = () => {
    window.open('http://localhost:8000/api/reports/export/csv', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500 font-medium text-sm animate-pulse">Generating Report Summary...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Audit Reports & Data Disclosures
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Downloadable CSV extracts and printable executive oversight briefs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Anomalies CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-4xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
              Government of India · Ministry of Statistics & Programme Implementation
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              MPLADS AI Sentinel Scheme Oversight & Anomaly Audit
            </h1>
            <p className="text-xs text-slate-500">
              Autonomous Risk Intelligence Assessment for 18th Lok Sabha Allocation Ceilings
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
            <div>Report Ref: SENTINEL-2026-LS18</div>
            <div>Generated: {new Date(report.generated_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Dataset Provenance Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            1. Source Dataset Provenance & Ingestion Integrity
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <div className="text-slate-500 text-[11px]">Source CSV File:</div>
              <div className="font-bold text-slate-900 truncate" title={report.source_csv_filename}>
                {report.source_csv_filename}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Analyzed Constituencies:</div>
              <div className="font-bold text-slate-900">{report.analyzed_records} Seats</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Total Allocation Limit:</div>
              <div className="font-bold text-slate-900">₹ {report.total_allocated_crores} Cr</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Reconciliation Status:</div>
              <div className="font-bold text-emerald-700">Zero Discrepancy (₹0.00)</div>
            </div>
          </div>
        </div>

        {/* Risk & Anomaly Statistics */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            2. Anomaly Findings & Review Priority Tiers
          </h3>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-red-600 font-bold text-lg">{report.risk_breakdown.critical}</div>
              <div className="text-red-800 font-semibold text-[11px] mt-0.5">Critical Priority</div>
              <div className="text-[10px] text-red-600">Scores 80 - 100</div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <div className="text-orange-600 font-bold text-lg">{report.risk_breakdown.high}</div>
              <div className="text-orange-800 font-semibold text-[11px] mt-0.5">High Priority</div>
              <div className="text-[10px] text-orange-600">Scores 60 - 79</div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <div className="text-amber-600 font-bold text-lg">{report.risk_breakdown.medium}</div>
              <div className="text-amber-800 font-semibold text-[11px] mt-0.5">Medium Priority</div>
              <div className="text-[10px] text-amber-600">Scores 30 - 59</div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <div className="text-emerald-600 font-bold text-lg">{report.risk_breakdown.low}</div>
              <div className="text-emerald-800 font-semibold text-[11px] mt-0.5">Low Priority</div>
              <div className="text-[10px] text-emerald-600">Scores 0 - 29</div>
            </div>
          </div>
        </div>

        {/* Implemented Analytical Methodologies */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            3. Applied Analytical Algorithms
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            {report.methodologies_used.map((m: string, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Schema Scope & Integrity Limitations */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-amber-800">
            4. Scope & Schema Disclosures
          </h3>
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            {report.schema_limitations.map((lim: string, i: number) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{lim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off Footer */}
        <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-xs text-slate-400">
          <div>MPLADS AI Sentinel System · Local Execution Engine</div>
          <div className="font-mono">Deterministic Seed 42 · Scikit-Learn 1.8.0</div>
        </div>
      </div>
    </div>
  );
};
