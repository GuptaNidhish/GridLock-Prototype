'use client';

import React, { useState } from 'react';
import { OrchestrationPanels } from '../../components/OrchestrationPanels';
import { initialBarricadePoints, initialIncidents } from '../../data/mockDatabase';
import { Home, Shield, MapPin, Calendar, Compass, ShieldAlert, Cpu } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

function OrchestrationDashboardContent() {
  const [barricadePoints, setBarricadePoints] = useState(initialBarricadePoints);
  const [emergencyCorridorActive, setEmergencyCorridorActive] = useState(false);
  const { showToast } = useToast();

  const handleDeployBarricade = (id: string) => {
    setBarricadePoints((prev) =>
      prev.map((bp) => {
        if (bp.id === id) {
          const nextStatus = bp.status === 'deployed' ? 'pending' : 'deployed';
          showToast(`BARRICADE UPDATE: ${bp.road_name} marked as ${nextStatus.toUpperCase()}`, nextStatus === 'deployed' ? 'success' : 'info');
          return { ...bp, status: nextStatus };
        }
        return bp;
      })
    );
  };

  const handleToggleEmergencyCorridor = () => {
    const nextState = !emergencyCorridorActive;
    setEmergencyCorridorActive(nextState);
    showToast(nextState ? 'EMERGENCY OVERRIDE: North-South Green Wave Active!' : 'EMERGENCY OVERRIDE: Green Wave deactivated.', nextState ? 'critical' : 'info');
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-4 select-none">
      
      {/* Header */}
      <header className="w-full flex justify-between items-center bg-slate-950/90 border border-slate-900/60 p-4 rounded-xl shadow-2xl mb-4">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <Shield className="w-4 h-4 mr-1 text-cyan-400" />
                <span>astram tactical playbook orchestration suite dashboard</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Barricade Plan Deployments & Anomaly Resolution</p>
          </div>
        </div>
        <div className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
          Active Deployments: {barricadePoints.filter(b => b.status === 'deployed').length}
        </div>
      </header>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: OrchestrationPanels controller */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <OrchestrationPanels
            barricadePoints={barricadePoints}
            onDeployBarricade={handleDeployBarricade}
            emergencyCorridorActive={emergencyCorridorActive}
            onToggleEmergencyCorridor={handleToggleEmergencyCorridor}
            weather="clear"
            onTriggerAnomalyTicket={(title, desc, location, lat, lon, type) => {
              showToast(`ANOMALY TICKET REGISTERED: ${title} at ${location}`, 'warning');
            }}
            replayTime={1020}
            activeIncidents={initialIncidents}
          />
        </div>

        {/* Right Side: Map Coordinates & Strategy Ledgers */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          {/* Barricades coordinate visualizer */}
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-2.5">
              <Compass className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>barricade point placement maps</span>
            </h2>

            <div className="h-64 bg-slate-950/40 rounded-lg border border-slate-900/60 p-2 relative flex items-center justify-center">
              <svg viewBox="0 0 300 200" className="w-full h-full">
                {/* Grid backdrop */}
                <defs>
                  <pattern id="orch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e172a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="300" height="200" fill="url(#orch-grid)" />

                {/* Major cross intersections */}
                <path d="M 50 100 L 250 100 M 150 30 L 150 170" fill="none" stroke="#334155" strokeWidth="3" />

                {/* Barricade nodes */}
                {barricadePoints.map((bp) => {
                  let cx = 150;
                  let cy = 100;

                  if (bp.id === 'BP001') { cx = 110; cy = 100; }
                  else if (bp.id === 'BP002') { cx = 190; cy = 100; }
                  else if (bp.id === 'BP003') { cx = 150; cy = 60; }
                  else if (bp.id === 'BP004') { cx = 150; cy = 140; }

                  const color = bp.status === 'deployed' ? '#ef4444' : '#eab308'; // red if deployed, yellow if pending

                  return (
                    <g key={bp.id} className="cursor-pointer">
                      <circle cx={cx} cy={cy} r="10" fill={color} fillOpacity="0.2" className={bp.status === 'deployed' ? 'animate-pulse' : ''} />
                      <rect x={cx - 4} y={cy - 4} width="8" height="8" fill={color} stroke="#ffffff" strokeWidth="1" />
                      <text x={cx + 8} y={cy + 3} fill="#94a3b8" className="text-[7.5px] font-black font-mono uppercase">{bp.road_name.split(' ')[0]}</text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-900 p-2 rounded text-[7.5px] font-mono text-slate-400 space-y-1">
                <div>Green Wave: {emergencyCorridorActive ? 'ACTIVE (NS Axis)' : 'STANDBY'}</div>
                <div>Barricades Block: {barricadePoints.filter(b => b.status === 'deployed').length} Active</div>
              </div>
            </div>
          </div>

          {/* Tactical advisory logs */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-auto">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Orchestrator Execution Ledger</span>
              <span>All barrier positions are mapped against active physical coordinates to maintain safety clearance index scores.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenOrchestration() {
  return (
    <ToastProvider>
      <OrchestrationDashboardContent />
    </ToastProvider>
  );
}
