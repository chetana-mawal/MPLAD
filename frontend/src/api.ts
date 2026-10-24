import { DashboardSummary, MPLADItem, AnomalyItem, AlertItem, RegionalMetric, DatasetProfile } from './types';

const API_BASE = 'http://localhost:8000/api';

export async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to load dashboard summary');
  return res.json();
}

export async function fetchWorks(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  state?: string;
  category?: string;
  riskLevel?: string;
  sortBy?: string;
  sortDir?: string;
}): Promise<{ items: MPLADItem[]; page: number; page_size: number; total_items: number; total_pages: number }> {
  const url = new URL(`${API_BASE}/works`);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.pageSize) url.searchParams.set('page_size', String(params.pageSize));
  if (params.search) url.searchParams.set('search', params.search);
  if (params.state) url.searchParams.set('state', params.state);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.riskLevel) url.searchParams.set('risk_level', params.riskLevel);
  if (params.sortBy) url.searchParams.set('sort_by', params.sortBy);
  if (params.sortDir) url.searchParams.set('sort_dir', params.sortDir);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to load works');
  return res.json();
}

export async function fetchWorkDetail(id: number) {
  const res = await fetch(`${API_BASE}/works/${id}`);
  if (!res.ok) throw new Error('Failed to load work details');
  return res.json();
}

export async function fetchAnomalies(params?: {
  riskLevel?: string;
  anomalyCategory?: string;
  state?: string;
  search?: string;
}): Promise<AnomalyItem[]> {
  const url = new URL(`${API_BASE}/anomalies`);
  if (params?.riskLevel) url.searchParams.set('risk_level', params.riskLevel);
  if (params?.anomalyCategory) url.searchParams.set('anomaly_category', params.anomalyCategory);
  if (params?.state) url.searchParams.set('state', params.state);
  if (params?.search) url.searchParams.set('search', params.search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to load anomalies');
  return res.json();
}

export async function triggerAnomalyDetection(): Promise<any> {
  const res = await fetch(`${API_BASE}/anomalies/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run anomaly detection');
  return res.json();
}

export async function fetchAlerts(params?: {
  status?: string;
  riskLevel?: string;
  state?: string;
  search?: string;
}): Promise<AlertItem[]> {
  const url = new URL(`${API_BASE}/alerts`);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.riskLevel) url.searchParams.set('risk_level', params.riskLevel);
  if (params?.state) url.searchParams.set('state', params.state);
  if (params?.search) url.searchParams.set('search', params.search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to load alerts');
  return res.json();
}

export async function updateAlert(alertId: number, data: {
  status?: string;
  reviewer_notes?: string;
  assigned_to?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update alert');
  return res.json();
}

export async function fetchFinancialAnalytics(): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/financial`);
  if (!res.ok) throw new Error('Failed to load financial analytics');
  return res.json();
}

export async function fetchRegionalAnalytics(): Promise<RegionalMetric[]> {
  const res = await fetch(`${API_BASE}/analytics/regional`);
  if (!res.ok) throw new Error('Failed to load regional analytics');
  return res.json();
}

export async function fetchDatasetProfile(): Promise<DatasetProfile> {
  const res = await fetch(`${API_BASE}/datasets/profile`);
  if (!res.ok) throw new Error('Failed to load dataset profile');
  return res.json();
}

export async function fetchReportSummary(): Promise<any> {
  const res = await fetch(`${API_BASE}/reports/summary`);
  if (!res.ok) throw new Error('Failed to load report summary');
  return res.json();
}

export async function reloadDataset(filePath?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path: filePath }),
  });
  if (!res.ok) throw new Error('Failed to reload dataset');
  return res.json();
}
