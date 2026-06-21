'use client';

import React, { useState } from 'react';
import { IncidentTracker } from '../../components/IncidentTracker';
import { initialIncidents, initialOfficers, Incident } from '../../data/mockDatabase';
import { Home, ShieldAlert, Users, Video, BarChart2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

function TrackerDashboardContent() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('FKID000012');
  const { showToast } = useToast();

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || null;

  const handleUpdateStatus = (
    id: string,
    newStatus: 'active' | 'resolved' | 'closed',
    extraFields?: Partial<Incident>
  ) => {
    showToast(`TRACKER COMPLETED: Incident ${id} marked as ${newStatus.toUpperCase()}`, 'success');
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus, ...extraFields } : inc))
    );
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
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1 text-red-400" />
                <span>astram incident forensic tracker & sla dashboard</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Junction CCTV Feed Aggregation & Audit Bridge</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {incidents.slice(0, 3).map((inc) => (
            <button
              key={inc.id}
              onClick={() => {
                setSelectedIncidentId(inc.id);
                showToast(`Tracker Focus: ${inc.id}`, 'info');
              }}
              className={`px-2.5 py-1 rounded text-[8.5px] font-mono font-bold border transition cursor-pointer ${selectedIncidentId === inc.id ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-350'}`}
            >
              {inc.id}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: IncidentTracker widget */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <IncidentTracker
            selectedIncident={selectedIncident}
            onUpdateIncidentStatus={handleUpdateStatus}
            officers={initialOfficers}
          />
        </div>

        {/* Right Side: CCTV Feeds & SLA Analytics */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          {/* CCTV Feed Matrix */}
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-2.5">
              <Video className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>Junction CCTV Video-Feed matrix</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {['CAM-01: Peenya Circle', 'CAM-02: BSNL Underpass', 'CAM-03: Sankey Gate', 'CAM-04: MG Road Link'].map((cam, idx) => {
                let status = 'LIVE - CLEAR';
                let colorClass = 'text-emerald-400';
                if (idx === 1 && selectedIncidentId === 'FKID000012') {
                  status = 'LIVE - WATERLOGGED';
                  colorClass = 'text-red-400 animate-pulse';
                }

                return (
                  <div key={idx} className="bg-slate-950/80 border border-slate-900 p-2 rounded-lg h-28 relative overflow-hidden flex flex-col justify-between">
                    {/* Simulated Static overlay */}
                    <div className="absolute inset-0 bg-blue-500/5 opacity-10 pointer-events-none" />
                    
                    <div className="flex justify-between items-start text-[7.5px] font-mono text-slate-500">
                      <span>{cam}</span>
                      <span className={colorClass}>{status}</span>
                    </div>

                    {/* Camera Grid Center symbol */}
                    <div className="flex justify-center items-center h-full">
                      <div className="w-2.5 h-2.5 border border-slate-800 rounded-full flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-slate-850 rounded-full" />
                      </div>
                    </div>

                    <div className="flex justify-between items-end text-[7px] font-mono text-slate-600">
                      <span>ISO 800 | 30 FPS</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident resolution SLA diagnostics */}
          <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-lg space-y-2">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">Audit Compliance Check</span>
            <div className="flex items-start space-x-2 text-[9px] text-slate-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-bold block">SLA Metrics Confirmed</span>
                <span>Average resolution rate currently stands at 94.2% compliance. Standard breach penalties auto-forwarded to BBMP agency ledger.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenTracker() {
  return (
    <ToastProvider>
      <TrackerDashboardContent />
    </ToastProvider>
  );
}
