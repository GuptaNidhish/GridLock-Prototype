import React from 'react';
import { ArrowDown, ArrowUp, BarChart2, ShieldAlert, Download, Mail, ExternalLink } from 'lucide-react';

export const PerformanceDashboard: React.FC = () => {
  const metrics = [
    { name: 'Avg Response Time', before: '18 min', after: '4 min', change: '↓ 78%', isPositive: true },
    { name: 'Avg Resolution Time', before: '4.2 hrs', after: '1.8 hrs', change: '↓ 57%', isPositive: true },
    { name: 'SLA Compliance Rate', before: '34%', after: '87%', change: '↑ 156%', isPositive: true },
    { name: 'Cascade Events / mo', before: '12', after: '3', change: '↓ 75%', isPositive: true },
  ];

  const topZones = [
    { rank: '🥇', name: 'Central Zone 2', score: '94% SLA Compliance' },
    { rank: '🥈', name: 'North Zone 1', score: '89% SLA Compliance' },
    { rank: '🥉', name: 'Peenya Layout', score: '85% SLA Compliance' },
  ];

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Performance Analytics Hub
          </h2>
          <p className="text-[10px] text-slate-400">Commissioner scorecard tracking response time efficiency</p>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => window.open('/analytics', '_blank')}
            title="Open in new tab"
            className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button title="Download PDF Report" className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button title="Email Report to Team" className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer">
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3.5 my-2.5">
        {metrics.map((m, i) => (
          <div key={i} className="bg-slate-950/40 border border-slate-900 p-2.5 rounded-lg">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{m.name}</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-sm font-black text-slate-200">{m.after}</span>
              <span className="text-[8px] text-slate-500 line-through">{m.before}</span>
              <span className={`text-[9px] font-bold ${m.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: SVG Trend Chart vs Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2 flex-1">
        {/* SVG Sparkline chart */}
        <div className="border border-slate-900 bg-slate-950/20 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Response Time Trend</span>
            <span className="text-slate-500">ASTRAM Deployed →</span>
          </div>

          <div className="h-20 w-full relative flex items-end">
            {/* Draw simple grid lines */}
            <div className="absolute inset-x-0 top-0 h-px border-t border-slate-900"></div>
            <div className="absolute inset-x-0 top-1/2 h-px border-t border-slate-900/60"></div>
            <div className="absolute inset-x-0 bottom-0 h-px border-t border-slate-900"></div>

            {/* Sparkline curve */}
            <svg viewBox="0 0 200 80" className="w-full h-full">
              {/* Shading area */}
              <path
                d="M 10 70 L 40 68 L 80 62 L 120 20 L 160 15 L 190 12 L 190 80 L 10 80 Z"
                fill="rgba(14, 165, 233, 0.05)"
              />
              {/* Curve path */}
              <path
                d="M 10 70 L 40 68 L 80 62 L 120 20 L 160 15 L 190 12"
                fill="transparent"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Interactive nodes */}
              <circle cx="10" cy="70" r="2.5" fill="#ef4444" />
              <circle cx="120" cy="20" r="2.5" fill="#10b981" />
              <circle cx="190" cy="12" r="2.5" fill="#10b981" />
            </svg>
          </div>

          <div className="flex justify-between text-[8px] text-slate-500 font-bold tracking-wider uppercase mt-1">
            <span>Nov</span>
            <span>Dec</span>
            <span>Jan (ASTRAM Launch)</span>
            <span>Feb</span>
            <span>Mar</span>
          </div>
        </div>

        {/* Top Performing Zones */}
        <div className="border border-slate-900 bg-slate-950/20 p-3 rounded-lg flex flex-col justify-between">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Top Performing Zones</p>
          <div className="space-y-1.5 flex-1 flex flex-col justify-center">
            {topZones.map((z, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9.5px]">
                <span className="text-slate-300 font-medium">
                  {z.rank} <span className="ml-1 text-slate-200">{z.name}</span>
                </span>
                <span className="font-bold text-sky-400">{z.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Needs Attention Warning */}
      <div className="mt-3.5 bg-red-950/25 border border-red-900/60 p-2.5 rounded-lg text-[9.5px] leading-normal flex items-start space-x-1.5 text-slate-300">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold text-red-400 uppercase">Attention Required:</span> ORR East 2 underpass averages 72 hrs resolution time. Root cause identified: drain blockage. Recommend capital funding request to BBMP.
        </div>
      </div>
    </div>
  );
};
