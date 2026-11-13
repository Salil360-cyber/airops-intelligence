import React, { useState, useEffect } from 'react';
import {
  Plane,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { OperationalMetrics, ProcessOpportunity, NavigationTab } from '../../types';

interface OverviewDashboardProps {
  metrics: OperationalMetrics;
  opportunities: ProcessOpportunity[];
  onSelectTab: (tab: NavigationTab) => void;
  isCustomData: boolean;
  otpThreshold?: number;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  opportunities,
  onSelectTab,
  isCustomData,
  otpThreshold = 15,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Real calculations
  const totalOpportunities = opportunities.length;
  const approvedOrHigher = opportunities.filter((o) =>
    ['Approved', 'In Progress', 'Implemented'].includes(o.status)
  ).length;
  const estimatedAnnualHoursSaved = opportunities.reduce(
    (acc, o) => acc + (o.estimatedHoursSavedAnnual || 0),
    0
  );

  // Status donut data
  const statusPieData = [
    { name: 'On-Time', value: metrics.onTimeFlights, color: '#10B981' }, // emerald-500
    { name: 'Delayed', value: metrics.delayedFlights, color: '#F59E0B' }, // amber-500
    { name: 'Cancelled', value: metrics.cancelledFlights, color: '#EF4444' }, // red-500
  ].filter((d) => d.value > 0);

  // Delay causes data
  const delayCauseData = metrics.topDelayCauses.slice(0, 5).map((c) => ({
    name: c.cause,
    count: c.count,
    minutes: c.totalMinutes,
  }));

  // Top delayed routes data
  const routeDelayData = metrics.topDelayedRoutes
    .filter((r) => r.delayedCount > 0)
    .slice(0, 5)
    .map((r) => ({
      route: r.route,
      avgDelay: r.avgDelay,
      delayedCount: r.delayedCount,
      total: r.totalFlights,
      otp: r.otp,
    }));

  // Hourly volume and delay trend data
  const hourlyData = metrics.hourlyDistribution.map((h) => ({
    hour: h.hour,
    flights: h.total,
    delayed: h.delayed,
    avgDelay: h.avgDelay,
  }));

  return (
    <div className="space-y-6">
      {/* Executive Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Operations Intelligence Console
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {isCustomData ? 'Custom Fleet Dataset (User Uploaded)' : 'Synthetic Demonstration Fleet (Sample Data)'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Network On-Time Performance:{' '}
              <span
                className={
                  metrics.onTimePerformance >= 80
                    ? 'text-emerald-400'
                    : metrics.onTimePerformance >= 70
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {metrics.onTimePerformance}%
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Analyzing {metrics.totalFlights} {isCustomData ? 'user-provided' : 'synthetic simulated'} flight legs across the network. All metrics, delay distributions, and route statistics are deterministically calculated from this dataset.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectTab('copilot')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/40 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Copilot</span>
            </button>
            <button
              onClick={() => onSelectTab('operations')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <span>Inspect Flights</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Flights */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Flights</span>
            <Plane className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{metrics.totalFlights}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Operated Legs</div>
          </div>
        </div>

        {/* On-Time Performance */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">OTP-{otpThreshold}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {metrics.onTimePerformance}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{metrics.onTimeFlights} on-time legs</div>
          </div>
        </div>

        {/* Delayed Flights */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Delayed Flights</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {metrics.delayedFlights}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics.totalFlights > 0
                ? `${metrics.delayPercentage}% of operated flights`
                : '0% of operated flights'}
            </div>
          </div>
        </div>

        {/* Cancelled Flights */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {metrics.cancelledFlights}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics.totalFlights > 0
                ? `${((metrics.cancelledFlights / metrics.totalFlights) * 100).toFixed(1)}% rate`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Avg Delay Duration */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg Delay</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400 font-mono">
              {metrics.avgDelayMinutes}
              <span className="text-sm font-sans font-normal text-slate-400 ml-1">min</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Per delayed flight</div>
          </div>
        </div>

        {/* Automation Opportunities */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Automation</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 font-mono">
              {totalOpportunities}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {approvedOrHigher} active in pipeline
            </div>
          </div>
        </div>

        {/* Estimated Time Savings */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Est. Savings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {estimatedAnnualHoursSaved.toLocaleString()}
              <span className="text-sm font-sans font-normal text-slate-400 ml-1">hr/yr</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Formula-derived impact</div>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Flight Status Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Flight Status Breakdown</h3>
              <p className="text-[11px] text-slate-400">On-time, delayed, and cancelled proportions (Synthetic)</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{metrics.totalFlights} Legs</span>
          </div>

          <div className="w-full h-56 min-h-[224px] min-w-0 relative flex items-center justify-center">
            {isMounted && statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded shadow-lg text-xs">
                            <span className="font-semibold text-slate-200">{data.name}: </span>
                            <span className="font-mono text-blue-400">{data.value} flights</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-medium">Measuring chart dimensions...</div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">On-Time ({metrics.onTimeFlights})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Delayed ({metrics.delayedFlights})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Cancelled ({metrics.cancelledFlights})</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Root-Cause Delay Distribution */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Root-Cause Delay Drivers</h3>
              <p className="text-[11px] text-slate-400">Total delayed flights and delay duration by category (Synthetic)</p>
            </div>
            <span className="text-xs font-mono text-amber-400">{metrics.totalDelayMinutes} Total Delay Mins</span>
          </div>

          <div className="w-full h-56 min-h-[224px] min-w-0 relative">
            {delayCauseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No delays recorded in current dataset.
              </div>
            ) : isMounted ? (
              <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                <BarChart data={delayCauseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-semibold text-slate-100">{d.name}</div>
                            <div className="text-slate-400">
                              Flights Affected: <span className="text-amber-400 font-mono">{d.count}</span>
                            </div>
                            <div className="text-slate-400">
                              Total Minutes: <span className="text-rose-400 font-mono">{d.minutes}m</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">Measuring chart dimensions...</div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {metrics.hasDelayCauses && metrics.topDelayCauses.length > 0
                ? `Primary operational friction: ${metrics.topDelayCauses.slice(0, 2).map((c) => c.cause).join(' and ')}`
                : 'Operational delay breakdown'}
            </span>
            <button
              onClick={() => onSelectTab('automation')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>Explore Automation Solutions</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Volume & Delay Trend */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Hourly Flight Volume & Delay Trend</h3>
              <p className="text-[11px] text-slate-400">Scheduled departure distribution throughout the day (Synthetic)</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">24h Cycle</span>
          </div>

          <div className="w-full h-56 min-h-[224px] min-w-0 relative">
            {isMounted && hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFlights" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDelayed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-semibold text-slate-100">Hour: {d.hour}</div>
                            <div className="text-blue-400">Scheduled Flights: {d.flights}</div>
                            <div className="text-amber-400">Delayed: {d.delayed}</div>
                            <div className="text-orange-400">Avg Delay: {d.avgDelay} min</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="flights" stroke="#3B82F6" fillOpacity={1} fill="url(#colorFlights)" />
                  <Area type="monotone" dataKey="delayed" stroke="#F59E0B" fillOpacity={1} fill="url(#colorDelayed)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">Measuring chart dimensions...</div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-300">Scheduled Volume</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Delayed Legs</span>
            </div>
          </div>
        </div>

        {/* Top Delay-Prone Routes */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Top Delay-Prone Routes</h3>
              <p className="text-[11px] text-slate-400">Sorted by frequency of delay and average duration</p>
            </div>
            <button
              onClick={() => onSelectTab('operations')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              All Routes
            </button>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-around">
            {routeDelayData.map((r) => (
              <div key={r.route} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{r.route}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">{r.delayedCount} of {r.total} delayed</span>
                    <span className="font-semibold text-amber-400 font-mono">{r.avgDelay}m avg</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                    style={{
                      width: `${Math.min(100, (r.delayedCount / r.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Sorted by delay count and duration</span>
            <span className="font-mono text-[11px]">OTP-{otpThreshold} Standard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
