'use client';

import React, { useState } from 'react';
import { IncidentFeed } from '../../components/IncidentFeed';
import { initialIncidents, Incident } from '../../data/mockDatabase';
import { Home, AlertTriangle, Shield, Clock, MapPin, User, ChevronRight, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

function FeedDashboardContent() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(initialIncidents[0]?.id || null);
  const { showToast } = useToast();

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  const handleEscalate = () => {
    if (!selectedIncident) return;
    showToast(`ESCALATED: Incident ${selectedIncident.id} flagged to ACP Traffic Control!`, 'critical');
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncidentId ? { ...inc, priority: 'High' } : inc
      )
    );
  };

  const handleResolve = () => {
    if (!selectedIncident) return;
    showToast(`RESOLVED: Incident ${selectedIncident.id} marked as cleared.`, 'success');
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncidentId ? { ...inc, status: 'closed' } : inc
      )
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
                <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                <span>metropolitan incident triage queue feed dashboard</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Real-time SLA Analytics & Tactical Dispatches</p>
          </div>
        </div>
        <div className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
          active queue size: {incidents.filter(i => i.status === 'active').length}
        </div>
      </header>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: IncidentFeed list widget */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <IncidentFeed
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => {
              setSelectedIncidentId(id);
              const inc = incidents.find((i) => i.id === id);
              if (inc) {
                showToast(`Queue Focus: ${inc.id} | ${inc.incident_type.replace(/_/g, ' ').toUpperCase()}`, 'info');
              }
            }}
          />
        </div>

        {/* Right Side: Triage details and Actions */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          {selectedIncident ? (
            <div className="space-y-4 flex-grow flex flex-col justify-between">
              
              {/* Incident Header Details */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">incident details card</span>
                    <h3 className="text-sm font-black text-slate-200 mt-1">{selectedIncident.id} — {selectedIncident.incident_type.replace(/_/g, ' ').toUpperCase()}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    selectedIncident.status === 'active' ? 'bg-red-950/40 text-red-400 border border-red-950 animate-pulse' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-950'
                  }`}>
                    {selectedIncident.status}
                  </span>
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3 text-[10px] bg-slate-950/50 p-3 rounded-lg border border-slate-900/60 font-mono">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold">locality</span>
                    <span className="text-slate-300">{selectedIncident.locality}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold">corridor</span>
                    <span className="text-slate-300">{selectedIncident.corridor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold">gps coordinates</span>
                    <span className="text-slate-300">{selectedIncident.start_lat.toFixed(4)}, {selectedIncident.start_lon.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold">priority rank</span>
                    <span className={`font-bold ${selectedIncident.priority === 'High' ? 'text-red-400' : 'text-slate-400'}`}>{selectedIncident.priority}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider block">incident description</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-2.5 rounded border border-slate-900/40">{selectedIncident.description}</p>
                </div>

                {/* SLA details */}
                <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold">Duration SLA Bound</span>
                      <span className="text-slate-500 text-[8.5px] font-mono">Dynamic ML prediction</span>
                    </div>
                  </div>
                  <span className="font-mono text-cyan-400 font-black">{selectedIncident.duration_sla_hours} hours</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 mt-4">
                {selectedIncident.status === 'active' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEscalate}
                      className="flex-1 bg-red-950/40 hover:bg-red-900/20 text-red-400 border border-red-900/50 py-2.5 rounded font-black text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      escalate priority
                    </button>
                    <button
                      onClick={handleResolve}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded font-black text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      mark resolved
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-950/10 border border-emerald-900/40 p-3 rounded-lg text-center text-emerald-400 text-xs font-bold flex items-center justify-center space-x-1.5">
                    <CheckSquare className="w-4 h-4" />
                    <span>Incident successfully cleared and closed</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select an incident from the queue feed to view details
            </div>
          )}

          {/* Security details bottom */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-auto">
            <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Triage Queue Synchronization</span>
              <span>All queue indices are continuously synched with the SQLite backend forensic storage system.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenFeed() {
  return (
    <ToastProvider>
      <FeedDashboardContent />
    </ToastProvider>
  );
}
