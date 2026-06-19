'use client';

import React, { useState } from 'react';
import { IncidentTracker } from '../../components/IncidentTracker';
import { initialIncidents, initialOfficers, Incident } from '../../data/mockDatabase';
import { Home, ShieldAlert, ListFilter } from 'lucide-react';
import Link from 'next/link';

export default function FullscreenTracker() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('FKID000012');

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || null;

  const handleUpdateStatus = (
    id: string,
    newStatus: 'active' | 'resolved' | 'closed',
    extraFields?: Partial<Incident>
  ) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus, ...extraFields } : inc))
    );
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-6 justify-center items-center">
      <div className="w-full max-w-2xl mb-4 flex justify-between items-center bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Link href="/" className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-red-400" />
              <span>Incident SLA Console</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Fullscreen Dispatch Queue</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {incidents.slice(0, 3).map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedIncidentId(inc.id)}
              className={`px-2 py-1 rounded text-[8.5px] font-bold border transition cursor-pointer ${selectedIncidentId === inc.id ? 'bg-sky-500 text-slate-950 border-sky-400 font-black' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            >
              {inc.id}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl min-h-[500px] border border-slate-900 rounded-xl overflow-hidden shadow-2xl bg-[#090d1a]">
        <IncidentTracker
          selectedIncident={selectedIncident}
          onUpdateIncidentStatus={handleUpdateStatus}
          officers={initialOfficers}
        />
      </div>
    </div>
  );
}
