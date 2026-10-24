import React, { useState } from 'react';
import { 
  BellRing, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  FileEdit, 
  UserCheck, 
  History,
  X
} from 'lucide-react';
import { AlertItem } from '../types';
import { updateAlert } from '../api';

interface RiskAlertsProps {
  alerts: AlertItem[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Verified Issue': 'bg-red-50 text-red-700 border-red-200',
  'No Issue Found': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Escalated': 'bg-purple-50 text-purple-700 border-purple-200',
};

export const RiskAlerts: React.FC<RiskAlertsProps> = ({
  alerts,
  onRefresh,
  isRefreshing
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  // Edit form state
  const [formStatus, setFormStatus] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formAssignee, setFormAssignee] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleOpenEdit = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setFormStatus(alert.status);
    setFormNotes(alert.reviewer_notes || '');
    setFormAssignee(alert.assigned_to || '');
  };

  const handleCloseEdit = () => {
    setSelectedAlert(null);
  };

  const handleSaveAlert = async () => {
    if (!selectedAlert) return;
    try {
      setIsSaving(true);
      await updateAlert(selectedAlert.id, {
        status: formStatus,
        reviewer_notes: formNotes,
        assigned_to: formAssignee,
      });
      handleCloseEdit();
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update alert');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:8000/api/reports/export/csv', '_blank');
  };

  const filtered = alerts.filter((a) => {
    if (selectedStatus !== 'All' && a.status !== selectedStatus) return false;
    if (selectedRisk !== 'All' && a.risk_level !== selectedRisk) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.constituency.toLowerCase().includes(q) ||
        a.mp_name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Risk Alerts & Investigation Queue
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational triage dashboard for reviewing, annotating, and resolving detected anomalies with persistent audit history.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Export Alerts CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search alert by constituency, MP, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified Issue">Verified Issue</option>
              <option value="No Issue Found">No Issue Found</option>
              <option value="Escalated">Escalated</option>
            </select>

            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="All">All Risk Tiers</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> of <strong>{alerts.length}</strong> alerts
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Priority / Score</th>
                <th className="py-3 px-4">Constituency & State</th>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Alert Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Notes Preview</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No risk alerts found.
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] ${
                        alert.risk_level === 'Critical' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : alert.risk_level === 'High'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {alert.risk_score} · {alert.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{alert.constituency}</div>
                      <div className="text-slate-500 text-[11px]">{alert.state}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{alert.mp_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{alert.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[alert.status] || 'bg-slate-100 text-slate-700'}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {alert.assigned_to !== 'Unassigned' ? alert.assigned_to : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate" title={alert.reviewer_notes}>
                      {alert.reviewer_notes ? alert.reviewer_notes : <span className="text-slate-300 italic">No notes</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(alert)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <FileEdit className="h-3 w-3" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation / Status Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Manage Alert: {selectedAlert.constituency}
                  </h3>
                  <p className="text-xs text-slate-500">
                    MP: {selectedAlert.mp_name} · Priority: {selectedAlert.risk_level} ({selectedAlert.risk_score})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Alert Title */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="font-semibold text-slate-800">Alert Title: </span>
                <span className="text-slate-700">{selectedAlert.title}</span>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Investigation Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New">New (Pending Triage)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified Issue">Verified Issue (Administrative Rectification Required)</option>
                  <option value="No Issue Found">No Issue Found (Justified Allocation / Rollover)</option>
                  <option value="Escalated">Escalated to Ministry Nodal Desk</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Assign Officer / Auditor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deputy Secretary (MPLADS), District Nodal Officer"
                  value={formAssignee}
                  onChange={(e) => setFormAssignee(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reviewer Notes */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Audit Findings & Verification Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Document verification findings, correspondence with State Nodal Agency, or justification for closing this alert..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Audit History Timeline */}
              <div>
                <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-slate-400" />
                  Investigation Audit History ({selectedAlert.audit_history.length})
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedAlert.audit_history.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px]">No history recorded yet.</div>
                  ) : (
                    selectedAlert.audit_history.map((h, i) => (
                      <div key={i} className="text-[11px] text-slate-600 border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                        <span className="font-mono text-slate-400">[{new Date(h.timestamp).toLocaleTimeString()}]</span>{' '}
                        <strong className="text-slate-800">{h.action}:</strong> {h.details}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAlert}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
