import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface HeaderProps {
  currentTab: NavigationTab;
  isCustomData: boolean;
  totalFlights: number;
  onResetData: () => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  isCustomData,
  totalFlights,
  onResetData,
  onSelectTab,
}) => {
  const [zuluTime, setZuluTime] = useState<string>('');
  const [localTime, setLocalTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState<number[]>([]);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      // Zulu time (UTC)
      const hoursZ = String(now.getUTCHours()).padStart(2, '0');
      const minsZ = String(now.getUTCMinutes()).padStart(2, '0');
      const secsZ = String(now.getUTCSeconds()).padStart(2, '0');
      setZuluTime(`${hoursZ}:${minsZ}:${secsZ}Z`);

      // Local time
      const hoursL = String(now.getHours()).padStart(2, '0');
      const minsL = String(now.getMinutes()).padStart(2, '0');
      setLocalTime(`${hoursL}:${minsL}`);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Operations Overview',
      subtitle: 'Fleet performance KPIs, delay distribution, and digital solution opportunities (Synthetic Model)',
    },
    operations: {
      title: 'Operations Intelligence & Flight Records',
      subtitle: 'Flight performance profiling, CSV ingestion, route analysis, and missing-value diagnostics',
    },
    copilot: {
      title: 'AI Business Solutions Copilot',
      subtitle: 'Grounded airline intelligence, root-cause diagnostics, and executive brief synthesis',
    },
    automation: {
      title: 'Process Automation Studio',
      subtitle: 'Airline operational opportunity evaluation, workflow modeling, and transparent ROI calculation',
    },
    requirements: {
      title: 'Process Mapping & Business Requirements',
      subtitle: 'As-Is vs To-Be operational specifications, User Stories, and functional requirements',
    },
    tracker: {
      title: 'Solutions Performance Tracker',
      subtitle: 'Pipeline progression, estimated vs measured hours saved, and adoption metrics',
    },
    reports: {
      title: 'Documentation & Executive Reports',
      subtitle: 'Standardized operational audits, business requirement packages, and exportable digests',
    },
    settings: {
      title: 'System Settings & Configuration',
      subtitle: 'On-time performance buffers, data resets, hourly rate benchmarks, and API health',
    },
  };

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'ATC Ground Delay Program (GDP)',
      desc: 'SFO inbound flow constrained due to low ceiling. Average delay +35 min.',
      time: '12m ago',
      targetTab: 'operations' as NavigationTab,
    },
    {
      id: 2,
      type: 'success',
      title: 'Baggage Reconciliation RPA',
      desc: 'Automated 110 widebody departures this week. Zero misconnects reported.',
      time: '1h ago',
      targetTab: 'tracker' as NavigationTab,
    },
    {
      id: 3,
      type: 'info',
      title: 'Crew Duty Alert on SK-802',
      desc: 'Cumulative duty margin under 45 minutes on JFK-SFO rotation. Standby notified.',
      time: '2h ago',
      targetTab: 'automation' as NavigationTab,
    },
  ];

  const unreadCount = notifications.filter((n) => !readNotifications.includes(n.id)).length;

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          {titles[currentTab]?.title || 'AirOps Intelligence'}
        </h1>
        <p className="text-xs text-slate-400 font-normal hidden sm:block">
          {titles[currentTab]?.subtitle || ''}
        </p>
      </div>

      {/* Right Utility Bar */}
      <div className="flex items-center gap-3">
        {/* Zulu / Local Clocks */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono font-semibold text-blue-300">{zuluTime || '00:00:00Z'}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 font-mono text-[11px]">{localTime} Local</span>
        </div>

        {/* Dataset Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isCustomData ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'
            }`}
          />
          <span className="text-slate-300 font-medium text-[11px]">
            {isCustomData ? 'Custom CSV Data' : 'Synthetic Fleet (Sample)'}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">({totalFlights} flights)</span>
          {isCustomData && (
            <button
              onClick={onResetData}
              title="Reset to default synthetic fleet"
              className="ml-1 text-slate-400 hover:text-blue-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Simulated Scenario Alerts</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const isRead = readNotifications.includes(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setReadNotifications((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));
                        onSelectTab(n.targetTab);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isRead
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-950/80 border-slate-800 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'warning' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'success' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {n.type === 'info' && (
                          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 truncate">{n.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.desc}</p>
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400">
                            <span>View in module</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Placeholder */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-semibold text-blue-300 text-xs shadow-inner">
            SG
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200">Salil Gokhale</div>
            <div className="text-[10px] text-slate-400">Business Analyst (Portfolio Demo)</div>
          </div>
        </div>
      </div>
    </header>
  );
};
