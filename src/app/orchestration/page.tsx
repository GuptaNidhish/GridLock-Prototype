'use client';

import React from 'react';
import { OrchestrationPanels } from '../../components/OrchestrationPanels';
import { ManpowerLeaderboard } from '../../components/ManpowerLeaderboard';
import { useAppState } from '../../context/AppContext';
import { initialOfficers } from '../../data/mockDatabase';
import { Shield, Compass, Cpu, Sliders, Users } from 'lucide-react';

export default function TrafficOrchestrationPage() {
  const {
    weather,
    replayTime,
    emergencyCorridorActive,
    setEmergencyCorridorActive,
    barricadePoints,
    handleDeployBarricade,
    handleAddIncident,
    incidents,
  } = useAppState();

  const handleToggleEmergencyCorridor = () => {
    setEmergencyCorridorActive((prev) => !prev);
  };

  return (
    <div className="flex flex-col space-y-6 select-none h-full">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-slate-950/80 border border-slate-900/60 p-4 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <Sliders className="w-4 h-4 mr-1 text-cyan-400" />
              <span>astram tactical orchestration suite & signal optimization</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">
              Webster junctions overrides, barricade placements & manpower deployment
            </p>
          </div>
        </div>
        
        {/* Quick status */}
        <div className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">
          Active Barricades: {barricadePoints.filter(b => b.status === 'deployed').length}
        </div>
      </div>

      {/* Row 1: Orchestration Panel + SVG Intersections Coordinate Map */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Orchestration Panels */}
        <div className="xl:col-span-2 bg-[#090d1a] border border-[#0e1324] rounded-xl overflow-hidden shadow-2xl min-h-[500px]">
          <OrchestrationPanels
            barricadePoints={barricadePoints}
            onDeployBarricade={handleDeployBarricade}
            emergencyCorridorActive={emergencyCorridorActive}
            onToggleEmergencyCorridor={handleToggleEmergencyCorridor}
            weather={weather}
            onTriggerAnomalyTicket={(title, desc, location, lat, lon, type) =>
              handleAddIncident(type, location, lat, lon, desc)
            }
            replayTime={replayTime}
            activeIncidents={incidents}
          />
        </div>

        {/* Right: SVG Barricade Mapping visualizer & Strategy Info */}
        <div className="xl:col-span-1 bg-[#090d1a] border border-[#0e1324] rounded-xl p-5 shadow-2xl flex flex-col justify-between h-full min-h-[500px]">
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-3">
              <Compass className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>Active Barricade Node Mapping</span>
            </h2>

            <div className="h-64 bg-slate-950/40 rounded-lg border border-slate-900/60 p-2.5 relative flex items-center justify-center">
              <svg viewBox="0 0 300 200" className="w-full h-full">
                {/* Grid pattern backdrop */}
                <defs>
                  <pattern id="orch-grid-svg" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e172a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="300" height="200" fill="url(#orch-grid-svg)" />

                {/* Major street grid lines */}
                <path d="M 50 100 L 250 100 M 150 30 L 150 170" fill="none" stroke="#334155" strokeWidth="2.5" />

                {/* Barricade nodes dynamically plotted */}
                {barricadePoints.map((bp) => {
                  let cx = 150;
                  let cy = 100;

                  if (bp.id === 'BP001') { cx = 115; cy = 100; }
                  else if (bp.id === 'BP002') { cx = 185; cy = 100; }
                  else if (bp.id === 'BP003') { cx = 150; cy = 65; }
                  else if (bp.id === 'BP004') { cx = 150; cy = 135; }

                  const isManual = bp.id.startsWith('BP_MANUAL_');
                  if (isManual) {
                    // Random placement coordinates for manually selected locations
                    const hash = bp.id.charCodeAt(bp.id.length - 1) + bp.id.charCodeAt(bp.id.length - 2);
                    cx = 80 + (hash % 140);
                    cy = 50 + (hash % 100);
                  }

                  const color = bp.status === 'deployed' ? '#ef4444' : '#eab308'; // red if deployed, yellow if pending

                  return (
                    <g key={bp.id} className="cursor-pointer" onClick={() => handleDeployBarricade(bp.id)}>
                      <circle cx={cx} cy={cy} r="10" fill={color} fillOpacity="0.2" className={bp.status === 'deployed' ? 'animate-pulse' : ''} />
                      <rect x={cx - 4} y={cy - 4} width="8" height="8" fill={color} stroke="#ffffff" strokeWidth="1" />
                      <text x={cx + 8} y={cy + 3} fill="#94a3b8" className="text-[7px] font-black font-mono uppercase">
                        {bp.road_name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-900 p-2 rounded text-[7.5px] font-mono text-slate-400 space-y-1">
                <div>Webster Override: {emergencyCorridorActive ? 'ACTIVE (NS Corridor)' : 'STANDBY'}</div>
                <div>Barricades Block: {barricadePoints.filter(b => b.status === 'deployed').length} Active</div>
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-4">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Orchestrator Strategy Ledger</span>
              <span>All barrier positions are mapped against active physical coordinates to maintain safety clearance index scores. Click nodes to toggle deployment state.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Manpower Leaderboard */}
      <div className="bg-[#090d1a] border border-[#0e1324] rounded-xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-200">
            On-Duty Manpower & Police Deployment Leaderboard
          </h2>
        </div>
        <ManpowerLeaderboard
          officers={initialOfficers}
          weather={weather}
          replayTime={replayTime}
          activeIncidents={incidents}
        />
      </div>
    </div>
  );
}
