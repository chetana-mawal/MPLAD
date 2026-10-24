export interface DashboardSummary {
  total_works: number;
  total_allocated_amount: number;
  total_allocated_formatted: string;
  mean_allocation: number;
  missing_allocation_records: number;
  standard_baseline_amount: number;
  expenditure_field_available: boolean;
  expenditure_field_notice: string;
  project_status_available: boolean;
  project_status_notice: string;
  funds_released: number | null;
  remaining_funds: number | null;
  fund_utilization_pct: number | null;
  total_anomalies: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  total_alerts: number;
  pending_alerts: number;
  resolved_alerts: number;
  source_file: string;
  last_updated: string;
}

export interface MPLADItem {
  id: number;
  sr_no: string;
  state: string;
  mp_name: string;
  constituency: string;
  allocated_amount: number | null;
  raw_amount: string;
  category: string;
  source_filename: string;
  import_date: string;
  data_quality_issues: string | null;
  anomalies_count: number;
  highest_risk_level: string;
  highest_risk_score: number;
  anomalies: {
    id: number;
    anomaly_type: string;
    risk_score: number;
    risk_level: string;
    reason: string;
  }[];
}

export interface AnomalyItem {
  id: number;
  record_id: number;
  sr_no: string;
  constituency: string;
  state: string;
  mp_name: string;
  allocated_amount: number | null;
  anomaly_type: string;
  anomaly_category: string;
  risk_score: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
  evidence: Record<string, any>;
  suggested_action: string;
  created_at: string;
}

export interface AlertItem {
  id: number;
  finding_id: number;
  record_id: number;
  title: string;
  constituency: string;
  state: string;
  mp_name: string;
  anomaly_type: string;
  risk_score: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Under Review' | 'Verified Issue' | 'No Issue Found' | 'Escalated';
  reviewer_notes: string;
  assigned_to: string;
  audit_history: {
    timestamp: string;
    action: string;
    details: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface RegionalMetric {
  state: string;
  mp_count: number;
  total_allocated: number;
  total_allocated_cr: number;
  average_allocated: number;
  average_allocated_cr: number;
  missing_allocations: number;
  anomalies_count: number;
  critical_anomalies: number;
  high_anomalies: number;
}

export interface DatasetProfile {
  source_filename: string;
  source_filepath: string;
  encoding_used: string;
  total_rows_in_file: number;
  total_constituency_records: number;
  valid_financial_records: number;
  missing_financial_records: number;
  total_allocated_amount_sum: number;
  grand_total_in_file: number;
  reconciliation_variance: number;
  unique_states: number;
  unique_constituencies: number;
  duplicate_constituencies_count: number;
  duplicate_constituencies: {
    constituency: string;
    occurrences: number;
    records: any[];
  }[];
  amount_stats: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    mode: number;
  };
}
