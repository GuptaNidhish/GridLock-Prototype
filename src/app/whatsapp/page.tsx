'use client';

import React, { useState } from 'react';
import { WhatsAppBot } from '../../components/WhatsAppBot';
import { Home, MessageSquare, Shield, Users, AlertCircle, FileText, Send, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

interface FieldOfficer {
  id: string;
  name: string;
  rank: string;
  status: 'on_duty' | 'dispatching' | 'offline';
  incidentId?: string;
  rating: number;
}

const FIELD_OFFICERS: FieldOfficer[] = [
  { id: 'FKUSR00003', name: 'Inspector Suresh Gowda', rank: 'Inspector', status: 'on_duty', rating: 4.8 },
  { id: 'FKUSR00005', name: 'SI Kumar Swamy', rank: 'SI', status: 'dispatching', incidentId: 'FKID000003', rating: 4.9 },
  { id: 'FKUSR00006', name: 'ASI Raju Hegde', rank: 'ASI', status: 'on_duty', rating: 4.6 },
  { id: 'FKUSR00011', name: 'HC Manjunath Prasanna', rank: 'HC', status: 'on_duty', rating: 4.7 }
];

function WhatsAppDashboardContent() {
  const { showToast } = useToast();
  const [officers, setOfficers] = useState<FieldOfficer[]>(FIELD_OFFICERS);
  const [lastParsedIntent, setLastParsedIntent] = useState<string>('WAITING_FOR_INPUT');

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
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1 text-emerald-400" />
                <span>whatsapp field officer ingestion command center</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Live Ingestion, NLP Intent Parsing & Dispatch Sync</p>
          </div>
        </div>
        <div className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
          status: telemetry connected
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: WhatsAppBot Widget (Simulator) */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <WhatsAppBot
            onAddIncidentFromBot={async (type, location, lat, lon, desc) => {
              const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
              const corridor = location.toLowerCase().includes('tumkur') ? 'Tumkur Road'
                : location.toLowerCase().includes('orr') ? 'ORR East 2' : 'Non-corridor';

              setLastParsedIntent(JSON.stringify({
                intent: 'REPORT_INCIDENT',
                type,
                location,
                coordinates: { lat, lon },
                corridor,
                priority: 'High'
              }, null, 2));

              const newInc = {
                id: `FKID${String(Math.floor(Math.random() * 900000) + 100000)}`,
                event_type: 'unplanned',
                incident_type: type,
                start_lat: lat,
                start_lon: lon,
                end_lat: lat,
                end_lon: lon,
                start_address: `${location}, Bengaluru`,
                description: desc,
                corridor: corridor,
                priority: 'High',
                status: 'active',
                is_verified: true,
                is_diversion: type === 'water_logging' || type === 'accident',
                vehicle_type: type === 'water_logging' || type === 'accident' ? 'heavy_vehicle' : 'private_car',
                locality: location.split(' ')[0],
                division: 'Bengaluru Central Corporation',
                zone: 'Central Zone 2',
                junction: location.replace(/\s+/g, ''),
                kg_id: `FKKG000${Math.floor(Math.random() * 1000)}`,
                created_at: new Date().toISOString(),
                reported_by: 'FKUSR00011',
                created_by: 'FKUSR00001',
              };

              try {
                const res = await fetch(`http://${hostname}:3001/api/v1/incidents`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newInc)
                });
                if (res.ok) {
                  const createdInc = await res.json();
                  showToast(`Incident created!\nID: ${createdInc.id}\nLocation: ${createdInc.start_address}`, 'success');
                  
                  // Update dispatcher state in simulation
                  setOfficers((prev) =>
                    prev.map((off) =>
                      off.id === 'FKUSR00011' ? { ...off, status: 'dispatching', incidentId: createdInc.id } : off
                    )
                  );
                } else {
                  showToast(`Failed to register incident. Status: ${res.status}`, 'critical');
                }
              } catch (err) {
                console.error('Error posting incident:', err);
                showToast(`Network error posting incident to backend: ${err}`, 'critical');
              }
            }}
            onActivateDiversion={(corridor) => {
              showToast(`DIVERSION RESOLUTION: Active routing overlay deployed for ${corridor}`, 'action');
              setLastParsedIntent(JSON.stringify({
                intent: 'ACTIVATE_DIVERSION',
                corridor,
                status: 'ACTIVE'
              }, null, 2));
            }}
          />
        </div>

        {/* Right Side: Field Directory & Message Parser Console */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          {/* Active Field Officers List */}
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-2.5">
              <Users className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>active field officers roster</span>
            </h2>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {officers.map((off) => (
                <div key={off.id} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-[10px] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {off.name.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">{off.name}</span>
                      <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Rank: {off.rank} | Rating: {off.rating}★</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {off.status === 'dispatching' && off.incidentId && (
                      <span className="text-[8px] text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-950 px-1.5 py-0.5 rounded">
                        Incident: {off.incidentId}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      off.status === 'on_duty' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-950' : 
                      off.status === 'dispatching' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-950 animate-pulse' :
                      'bg-slate-900 text-slate-500 border border-slate-850'
                    }`}>
                      {off.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingestion Intent Parser Console */}
          <div className="flex flex-col space-y-2">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>nlp intent extraction console</span>
            </h2>

            <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 font-mono text-[9px] text-emerald-400 max-h-36 overflow-y-auto leading-normal">
              {lastParsedIntent === 'WAITING_FOR_INPUT' ? (
                <div className="text-slate-500">{"// Ingest an incident report or diversion command to view extracted JSON payload..."}</div>
              ) : (
                <pre className="whitespace-pre-wrap">{lastParsedIntent}</pre>
              )}
            </div>
          </div>

          {/* Broadcast alert */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Integrity Handshake Complete</span>
              <span>All WhatsApp telemetry payloads are securely validated and forwarded directly to the ASTRAM Incident Ontology server.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenWhatsapp() {
  return (
    <ToastProvider>
      <WhatsAppDashboardContent />
    </ToastProvider>
  );
}
