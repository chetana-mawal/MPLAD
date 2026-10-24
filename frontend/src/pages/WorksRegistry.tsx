import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  FileText,
  User,
  MapPin,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { fetchWorks, fetchWorkDetail } from '../api';
import { MPLADItem, RegionalMetric } from '../types';

interface WorksRegistryProps {
  regional: RegionalMetric[];
}

export const WorksRegistry: React.FC<WorksRegistryProps> = ({ regional }) => {
  const [works, setWorks] = useState<MPLADItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('sr_no');
  const [sortDir, setSortDir] = useState<string>('asc');
  const [loading, setLoading] = useState<boolean>(true);

  // Selected work for detail modal
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWorks({
        page,
        pageSize,
        search: search.trim() || undefined,
        state: selectedState,
        category: selectedCategory,
        riskLevel: selectedRisk,
        sortBy,
        sortDir
      });
      setWorks(res.items);
      setTotalPages(res.total_pages);
      setTotalItems(res.total_items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, selectedState, selectedCategory, selectedRisk, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenDetail = async (id: number) => {
    setSelectedWorkId(id);
    try {
      setLoadingDetail(true);
      const detail = await fetchWorkDetail(id);
      setDetailData(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedWorkId(null);
    setDetailData(null);
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Works Registry & Constituency Ledger</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Full constituency-level inventory showing official allocations, categories, and anomaly linkages.
          </p>
        </div>
        <div className="text-xs text-slate-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs">
          Showing <strong>{works.length}</strong> of <strong>{totalItems}</strong> records
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Constituency, MP Name, State, or Sr No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
          >
            <option value="All">All States ({regional.length})</option>
            {regional.map((r) => (
              <option key={r.state} value={r.state}>
                {r.state} ({r.mp_count})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="SC">SC (Scheduled Caste)</option>
            <option value="ST">ST (Scheduled Tribe)</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
          >
            <option value="All">All Risk Tiers</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Page Size */}
          <div className="ml-auto flex items-center gap-1 text-slate-500">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Works Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th 
                  onClick={() => toggleSort('sr_no')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-1">
                    <span>Sr. No.</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('constituency')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-1">
                    <span>Constituency</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('state')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-1">
                    <span>State</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('mp_name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-1">
                    <span>Hon'ble Member of Parliament</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Category</th>
                <th 
                  onClick={() => toggleSort('allocated_amount')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Allocated Limit (₹)</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Review Priority</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading records from database...
                  </td>
                </tr>
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching MPLADS records found.
                  </td>
                </tr>
              ) : (
                works.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDetail(item.id)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{item.sr_no}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.constituency}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.state}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{item.mp_name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.category === 'SC' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : item.category === 'ST'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-semibold">
                      {item.allocated_amount !== null ? (
                        <span>₹ {(item.allocated_amount / 10000000).toFixed(2)} Cr</span>
                      ) : (
                        <span className="text-red-600 italic">Unassigned (NaN)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.highest_risk_level !== 'None' ? (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.highest_risk_level === 'Critical' 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : item.highest_risk_level === 'High'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : item.highest_risk_level === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.highest_risk_level} ({item.highest_risk_score})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(item.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Work Modal */}
      {selectedWorkId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Constituency Audit Record #{detailData?.record?.sr_no}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official MPLADS Allocation Profile & Traceability Matrix
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading audit record...</div>
            ) : detailData ? (
              <div className="p-6 space-y-6">
                {/* Core Record Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Constituency & Jurisdiction
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {detailData.record.constituency}
                    </div>
                    <div className="text-slate-600">
                      State/UT: <strong className="text-slate-800">{detailData.record.state}</strong>
                    </div>
                    <div className="text-slate-600">
                      Category: <span className="font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">{detailData.record.category}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="text-slate-500 font-medium flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Elected Representative
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {detailData.record.mp_name}
                    </div>
                    <div className="text-slate-600">
                      Sequence ID: <span className="font-mono">{detailData.record.sr_no}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Imported: {new Date(detailData.record.import_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Financial Allocation Box */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-blue-600" />
                      Allocated Limit in Source Record
                    </span>
                    <span className="text-[11px] text-blue-700 font-mono">
                      Raw: "{detailData.record.raw_amount}"
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-blue-950">
                    {detailData.record.allocated_amount !== null ? (
                      `₹ ${(detailData.record.allocated_amount / 10000000).toFixed(2)} Crore`
                    ) : (
                      <span className="text-red-600">Unassigned / Missing (NaN)</span>
                    )}
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Standard baseline quota: ₹14.70 Cr. Variance: {
                      detailData.record.allocated_amount !== null
                        ? `${(((detailData.record.allocated_amount - 147000000) / 147000000) * 100).toFixed(1)}%`
                        : 'N/A'
                    }
                  </div>
                </div>

                {/* Peer / Duplicate Constituency Comparison (e.g., Nanded) */}
                {detailData.peer_constituency_records && detailData.peer_constituency_records.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-xs space-y-2.5">
                    <div className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Duplicate Constituency Records Found ({detailData.peer_constituency_records.length + 1} Entries)
                    </div>
                    <p className="text-red-800 text-[11px]">
                      This constituency appears in multiple rows with different representatives or statuses in the dataset:
                    </p>
                    <div className="space-y-1.5">
                      <div className="p-2 bg-white rounded border border-red-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">Current Row (#{detailData.record.sr_no}):</span>{' '}
                          <span className="text-slate-700">{detailData.record.mp_name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {detailData.record.allocated_amount ? `₹ ${(detailData.record.allocated_amount / 10000000).toFixed(2)} Cr` : 'NaN'}
                        </span>
                      </div>
                      {detailData.peer_constituency_records.map((peer: any, i: number) => (
                        <div key={i} className="p-2 bg-white rounded border border-red-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">Peer Row (#{peer.sr_no}):</span>{' '}
                            <span className="text-slate-700">{peer.mp_name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {peer.allocated_amount ? `₹ ${(peer.allocated_amount / 10000000).toFixed(2)} Cr` : 'NaN'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated Findings */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>Sentinel Risk Findings ({detailData.findings.length})</span>
                  </h4>
                  {detailData.findings.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      No risk flags or data quality anomalies detected for this constituency. Allocation is standard.
                    </div>
                  ) : (
                    detailData.findings.map((f: any) => (
                      <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-mono">
                              {f.anomaly_type}
                            </span>
                            <span>{f.anomaly_category}</span>
                          </span>
                          <span className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                            f.risk_level === 'Critical' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : f.risk_level === 'High'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            Score: {f.risk_score} ({f.risk_level})
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{f.reason}</p>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 space-y-1">
                          <div className="font-semibold text-slate-800 text-[11px]">Recommended Verification Action:</div>
                          <div className="text-[11px] text-slate-600">{f.suggested_action}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Audit & Data Quality Notice */}
                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <span>Source: {detailData.record.source_filename}</span>
                  <span>Non-accusatory administrative alert</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
