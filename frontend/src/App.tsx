import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { WorksRegistry } from './pages/WorksRegistry';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { RiskAlerts } from './pages/RiskAlerts';
import { FinancialAnalytics } from './pages/FinancialAnalytics';
import { RegionalAnalytics } from './pages/RegionalAnalytics';
import { Reports } from './pages/Reports';
import { DataManagement } from './pages/DataManagement';
import { Settings } from './pages/Settings';
import { fetchSummary, fetchAnomalies, fetchAlerts, fetchRegionalAnalytics } from './api';
import { DashboardSummary, AnomalyItem, AlertItem, RegionalMetric } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [regional, setRegional] = useState<RegionalMetric[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setIsRefreshing(true);
      setBackendError(null);
      const [sumRes, anomRes, alertRes, regRes] = await Promise.all([
        fetchSummary(),
        fetchAnomalies(),
        fetchAlerts(),
        fetchRegionalAnalytics(),
      ]);
      setSummary(sumRes);
      setAnomalies(anomRes);
      setAlerts(alertRes);
      setRegional(regRes);
    } catch (err: any) {
      console.error(err);
      setBackendError(err.message || 'Unable to connect to MPLADS Sentinel Backend API (http://localhost:8000).');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const pendingAlerts = alerts.filter(a => a.status === 'New' || a.status === 'Under Review').length;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingAlertsCount={pendingAlerts}
        totalAnomaliesCount={anomalies.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          totalWorks={summary?.total_works || 543}
          totalAnomalies={summary?.total_anomalies || anomalies.length}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {backendError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
                <div>
                  <strong>Backend Connection Alert:</strong> {backendError} Ensure FastAPI backend is active on port 8000.
                </div>
                <button
                  onClick={loadAllData}
                  className="px-3 py-1 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {currentTab === 'overview' && (
              <Overview
                summary={summary}
                regional={regional}
                anomalies={anomalies}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'works' && (
              <WorksRegistry regional={regional} />
            )}

            {currentTab === 'anomalies' && (
              <AnomalyDetection
                anomalies={anomalies}
                onRefresh={loadAllData}
                isRefreshing={isRefreshing}
              />
            )}

            {currentTab === 'alerts' && (
              <RiskAlerts
                alerts={alerts}
                onRefresh={loadAllData}
                isRefreshing={isRefreshing}
              />
            )}

            {currentTab === 'financial' && (
              <FinancialAnalytics />
            )}

            {currentTab === 'regional' && (
              <RegionalAnalytics
                regional={regional}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'reports' && (
              <Reports />
            )}

            {currentTab === 'data' && (
              <DataManagement
                onRefresh={loadAllData}
                isRefreshing={isRefreshing}
              />
            )}

            {currentTab === 'settings' && (
              <Settings />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
