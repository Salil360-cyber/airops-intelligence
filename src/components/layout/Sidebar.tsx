import React from 'react';
import {
  LayoutDashboard,
  PlaneTakeoff,
  Sparkles,
  Workflow,
  FileSpreadsheet,
  LineChart,
  Files,
  Settings,
  Compass,
  Radio,
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  flightCount: number;
  opportunityCount: number;
  isCustomData: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  flightCount,
  opportunityCount,
  isCustomData,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.FC<any>; badge?: number | string }[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'operations', label: 'Operations Intelligence', icon: PlaneTakeoff, badge: flightCount },
    { id: 'copilot', label: 'AI Business Copilot', icon: Sparkles, badge: 'AI' },
    { id: 'automation', label: 'Process Automation Studio', icon: Workflow, badge: opportunityCount },
    { id: 'requirements', label: 'Process Mapping & Req.', icon: FileSpreadsheet },
    { id: 'tracker', label: 'Performance Tracker', icon: LineChart },
    { id: 'reports', label: 'Documentation & Reports', icon: Files },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-68 bg-slate-900/95 border-r border-slate-800/80 flex flex-col shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
          <Compass className="w-5 h-5 text-blue-100" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-100 tracking-tight text-base">AirOps</span>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/60">
              Intel
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Aviation Business Solutions</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Operations & Intelligence
        </div>
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Solutions & Engineering
        </div>
        {navItems.slice(3, 6).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Management & Governance
        </div>
        {navItems.slice(6).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Dataset Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isCustomData ? 'bg-amber-400' : 'bg-blue-400'}`} />
            <span className="text-slate-300 font-medium">Dataset Status</span>
          </span>
          <span className={`font-mono text-[10px] ${isCustomData ? 'text-amber-400' : 'text-blue-400'}`}>
            {isCustomData ? 'Custom CSV' : 'Synthetic Demo'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {isCustomData ? 'User-Uploaded CSV Dataset' : 'Simulated Benchmark Model (Non-Live)'}
        </div>
      </div>
    </aside>
  );
};
