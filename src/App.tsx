import React, { useState, useMemo } from 'react';
import { NavigationTab, FlightRecord } from './types';
import { SYNTHETIC_AIRLINE_DATASET } from './data/syntheticData';
import { calculateOperationalMetrics } from './utils/calculator';
import {
  ensureSeedVersion,
  getStoredOpportunities,
  saveStoredOpportunities,
  getStoredRequirements,
  saveStoredRequirements,
  getStoredOtpThreshold,
  saveStoredOtpThreshold,
  getStoredHourlyRate,
  saveStoredHourlyRate,
  getStoredCustomFlights,
  saveStoredCustomFlights,
  clearStoredCustomFlights,
  resetToDefaults,
  resetAllApplicationModules,
} from './utils/storage';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/modules/OverviewDashboard';

// Lazy-loaded workspace modules for code-splitting and bundle performance
const OperationsIntelligence = React.lazy(() =>
  import('./components/modules/OperationsIntelligence').then(m => ({ default: m.OperationsIntelligence }))
);
const AICopilot = React.lazy(() =>
  import('./components/modules/AICopilot').then(m => ({ default: m.AICopilot }))
);
const ProcessAutomationStudio = React.lazy(() =>
  import('./components/modules/ProcessAutomationStudio').then(m => ({ default: m.ProcessAutomationStudio }))
);
const ProcessMappingRequirements = React.lazy(() =>
  import('./components/modules/ProcessMappingRequirements').then(m => ({ default: m.ProcessMappingRequirements }))
);
const SolutionsPerformanceTracker = React.lazy(() =>
  import('./components/modules/SolutionsPerformanceTracker').then(m => ({ default: m.SolutionsPerformanceTracker }))
);
const DocumentationReports = React.lazy(() =>
  import('./components/modules/DocumentationReports').then(m => ({ default: m.DocumentationReports }))
);
const SettingsModule = React.lazy(() =>
  import('./components/modules/SettingsModule').then(m => ({ default: m.SettingsModule }))
);

const ModuleLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-400 gap-4">
    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    <div className="text-center">
      <p className="text-sm font-semibold text-slate-200">Loading Workspace...</p>
      <p className="text-xs font-mono text-slate-500 mt-1">Initializing workspace components and flight metrics</p>
    </div>
  </div>
);

export default function App() {
  // Synchronously validate seed version before reading any persisted localStorage state
  useState(() => ensureSeedVersion());

  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [initialFlightState] = useState(() => getStoredCustomFlights());
  const [flights, setFlights] = useState<FlightRecord[]>(
    () => initialFlightState.flights ?? SYNTHETIC_AIRLINE_DATASET
  );
  const [isCustomData, setIsCustomData] = useState<boolean>(() => initialFlightState.isCustom);
  const [csvPersistenceWarning, setCsvPersistenceWarning] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState(() => getStoredOpportunities());
  const [requirements, setRequirements] = useState(() => getStoredRequirements());
  const [hourlyRate, setHourlyRate] = useState<number>(() => getStoredHourlyRate());
  const [otpThreshold, setOtpThreshold] = useState<number>(() => getStoredOtpThreshold());

  // Compute operational metrics deterministically from active flights and OTP threshold
  const metrics = useMemo(() => {
    return calculateOperationalMetrics(flights, otpThreshold);
  }, [flights, otpThreshold]);

  // Handle CSV data upload or sample update with browser storage quota guard
  const handleUpdateFlights = (newFlights: FlightRecord[], isCustom: boolean) => {
    setFlights(newFlights);
    setIsCustomData(isCustom);
    if (isCustom) {
      const result = saveStoredCustomFlights(newFlights);
      setCsvPersistenceWarning(result.persisted ? null : result.warning || 'Uploaded CSV will not survive page refresh.');
    } else {
      clearStoredCustomFlights();
      setCsvPersistenceWarning(null);
    }
  };

  // Reset to default synthetic fleet
  const handleResetToSample = () => {
    clearStoredCustomFlights();
    setCsvPersistenceWarning(null);
    setFlights(SYNTHETIC_AIRLINE_DATASET);
    setIsCustomData(false);
  };

  // Update & persist OTP threshold and hourly rate
  const handleUpdateOtpThreshold = (val: number) => {
    setOtpThreshold(val);
    saveStoredOtpThreshold(val);
  };

  const handleUpdateHourlyRate = (val: number) => {
    setHourlyRate(val);
    saveStoredHourlyRate(val);
  };

  // Update opportunities & persist
  const handleSaveOpportunities = (updated: typeof opportunities) => {
    setOpportunities(updated);
    saveStoredOpportunities(updated);
  };

  // Update requirements & persist
  const handleSaveRequirements = (updated: typeof requirements) => {
    setRequirements(updated);
    saveStoredRequirements(updated);
  };

  // Reset all application data
  const handleResetAllData = () => {
    resetAllApplicationModules();
    resetToDefaults();
    setCsvPersistenceWarning(null);
    setFlights(SYNTHETIC_AIRLINE_DATASET);
    setIsCustomData(false);
    setHourlyRate(85);
    setOtpThreshold(15);
    setOpportunities(getStoredOpportunities());
    setRequirements(getStoredRequirements());
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        flightCount={flights.length}
        opportunityCount={opportunities.length}
        isCustomData={isCustomData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          isCustomData={isCustomData}
          totalFlights={flights.length}
          onResetData={handleResetToSample}
          onSelectTab={setCurrentTab}
        />

        {/* Dynamic Module Canvas */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
          <React.Suspense fallback={<ModuleLoadingFallback />}>
            {currentTab === 'overview' && (
              <OverviewDashboard
                metrics={metrics}
                opportunities={opportunities}
                onSelectTab={setCurrentTab}
                isCustomData={isCustomData}
                otpThreshold={otpThreshold}
              />
            )}

            {currentTab === 'operations' && (
              <OperationsIntelligence
                flights={flights}
                metrics={metrics}
                onUpdateFlights={handleUpdateFlights}
                onResetToSample={handleResetToSample}
                isCustomData={isCustomData}
                otpThreshold={otpThreshold}
                onUpdateOtpThreshold={handleUpdateOtpThreshold}
                csvPersistenceWarning={csvPersistenceWarning}
                onDismissPersistenceWarning={() => setCsvPersistenceWarning(null)}
              />
            )}

            {currentTab === 'copilot' && (
              <AICopilot
                metrics={metrics}
                opportunities={opportunities}
                flights={flights}
                isCustomData={isCustomData}
                otpThreshold={otpThreshold}
                onSelectTab={setCurrentTab}
              />
            )}

            {currentTab === 'automation' && (
              <ProcessAutomationStudio
                opportunities={opportunities}
                onSaveOpportunities={handleSaveOpportunities}
                hourlyRate={hourlyRate}
              />
            )}

            {currentTab === 'requirements' && (
              <ProcessMappingRequirements
                requirements={requirements}
                onSaveRequirements={handleSaveRequirements}
              />
            )}

            {currentTab === 'tracker' && (
              <SolutionsPerformanceTracker opportunities={opportunities} />
            )}

            {currentTab === 'reports' && (
              <DocumentationReports
                metrics={metrics}
                opportunities={opportunities}
                requirements={requirements}
                otpThreshold={otpThreshold}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsModule
                onResetAllData={handleResetAllData}
                hourlyRate={hourlyRate}
                onUpdateHourlyRate={handleUpdateHourlyRate}
                otpThreshold={otpThreshold}
                onUpdateOtpThreshold={handleUpdateOtpThreshold}
              />
            )}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
