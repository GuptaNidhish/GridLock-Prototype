'use client';

import React from 'react';
import { IncidentFeed } from '../../components/IncidentFeed';
import { IncidentTracker } from '../../components/IncidentTracker';
import { CitizenPulse } from '../../components/CitizenPulse';
import { GeminiStrategyPanel } from '../../components/GeminiStrategyPanel';
import { useAppState } from '../../context/AppContext';
import { initialOfficers } from '../../data/mockDatabase';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export default function IncidentCenterPage() {
  const {
    incidents,
    selectedIncidentId,
    setSelectedIncidentId,
    handleUpdateIncidentStatus,
    handleAddIncident,
  } = useAppState();

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || null;

  return (
    <div className="flex flex-col space-y-6 select-none h-full">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-slate-950/80 border border-slate-900/60 p-4 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1 text-red-400" />
              <span>astram incident forensics & citizen dispatch portal</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">
              Live feeds, forensic cctv linkups & SLA tracking
            </p>
          </div>
        </div>
        
        {/* Quick info chip */}
        <div className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">
          Active Events: {incidents.filter((i) => i.status === 'active').length}
        </div>
      </div>

      {/* Row 1: Split between Incident list and detailed forensics tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Incident list feed */}
        <div className="xl:col-span-1 flex flex-col bg-[#090d1a] border border-[#0e1324] rounded-xl overflow-hidden shadow-2xl h-[520px]">
          <IncidentFeed
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => setSelectedIncidentId(id)}
          />
        </div>

        {/* Detailed Forensic Tracker and CCTV */}
        <div className="xl:col-span-2 flex flex-col bg-[#090d1a] border border-[#0e1324] rounded-xl overflow-hidden shadow-2xl h-[520px]">
          <IncidentTracker
            selectedIncident={selectedIncident}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            officers={initialOfficers}
          />
        </div>
      </div>

      {/* Row 2: Gemini Strategy Panel and Citizen Sentiment Pulse Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Gemini AI traffic strategy panel */}
        <div className="xl:col-span-2 flex flex-col h-full bg-[#090d1a] border border-[#0e1324] rounded-xl overflow-hidden shadow-2xl">
          <GeminiStrategyPanel />
        </div>

        {/* Citizen sentiment feed */}
        <div className="xl:col-span-1 bg-[#090d1a] border border-[#0e1324] rounded-xl p-5 shadow-2xl h-full min-h-[300px]">
          <CitizenPulse
            onAddIncidentFromPulse={(title, desc, location, lat, lon, type) =>
              handleAddIncident(type, location, lat, lon, desc)
            }
            activeIncidents={incidents}
          />
        </div>
      </div>
    </div>
  );
}
