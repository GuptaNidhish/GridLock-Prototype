'use client';

import React, { useState, useEffect } from 'react';
import { CitizenPulse } from '../../components/CitizenPulse';
import { initialIncidents, Incident } from '../../data/mockDatabase';
import { Home, MessageSquare, Heart, Volume2, Search, AlertCircle, BarChart3, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

interface SentimentMetric {
  category: string;
  count: number;
  percentage: number;
  colorClass: string;
}

function PulseDashboardContent() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [activeTab, setActiveTab] = useState<'analytics' | 'keywords'>('analytics');
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState<SentimentMetric[]>([
    { category: 'Frustrated / High Delay', count: 48, percentage: 65, colorClass: 'bg-red-500 text-red-400' },
    { category: 'Informational / Queries', count: 18, percentage: 24, colorClass: 'bg-yellow-500 text-yellow-400' },
    { category: 'Positive / Support', count: 8, percentage: 11, colorClass: 'bg-emerald-500 text-emerald-400' }
  ]);

  const [keywords, setKeywords] = useState([
    { text: 'Waterlogged', weight: 'High', count: 14 },
    { text: 'Hebbal', weight: 'High', count: 11 },
    { text: 'Underpass stuck', weight: 'Critical', count: 9 },
    { text: 'Bellary Road', weight: 'Medium', count: 8 },
    { text: 'Signal delay', weight: 'Medium', count: 6 }
  ]);

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
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1 text-rose-400" />
                <span>Citizen Pulse & Social Sentiment intelligence center</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">NLP-Driven Social Signal Ingestion & Dispatch</p>
          </div>
        </div>
        <div className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
          Sentiment Index: 38% Positive
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: CitizenPulse Widget */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <CitizenPulse
            activeIncidents={incidents}
            onAddIncidentFromPulse={(title, desc, location, lat, lon, type) => {
              showToast(`INCIDENT DIGESTED: "${title}" created at ${location}`, 'success');
              // Prepend to simulated incidents list
              const newInc = {
                id: `FKID${Math.floor(Math.random() * 900000) + 100000}`,
                event_type: 'unplanned',
                incident_type: type as any,
                start_lat: lat,
                start_lon: lon,
                start_address: location,
                description: desc,
                status: 'active',
                priority: 'High',
                corridor: 'Non-corridor',
                created_at: new Date().toISOString(),
                commuter_impact_score: 45,
                duration_sla_hours: 4
              } as Incident;
              setIncidents((prev) => [newInc, ...prev]);
            }}
          />
        </div>

        {/* Right Side: Sentiment Analytics, NLP Classifier & Alerts */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          <div>
            {/* Tab header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3.5">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`text-[10px] font-black uppercase tracking-wider pb-1 transition cursor-pointer ${activeTab === 'analytics' ? 'border-b-2 border-rose-500 text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  Sentiment Index Metrics
                </button>
                <button
                  onClick={() => setActiveTab('keywords')}
                  className={`text-[10px] font-black uppercase tracking-wider pb-1 transition cursor-pointer ${activeTab === 'keywords' ? 'border-b-2 border-rose-500 text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  Ingested Keyword Ledger
                </button>
              </div>
              <span className="text-[8px] bg-slate-950 border border-slate-900 px-2 py-0.5 rounded text-rose-500 font-mono">
                Listening: 8 channels
              </span>
            </div>

            {/* Tab Content */}
            {activeTab === 'analytics' ? (
              <div className="space-y-3.5">
                {metrics.map((m, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>{m.category}</span>
                      <span className="font-mono">{m.percentage}% ({m.count} posts)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full ${m.colorClass.split(' ')[0]}`}
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Cognitive Summary card */}
                <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex flex-col space-y-1.5 mt-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Metropolitan Sentiment Digest</span>
                  <p className="text-[9.5px] text-slate-400 leading-normal">
                    Rain conditions have escalated frustrated social metrics by <span className="text-red-400 font-bold">18%</span> in the past hour. Underpass mentions remain the highest vector of commuter complaints.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {keywords.map((kw, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-between text-[10px]">
                    <div>
                      <span className="font-bold text-slate-200">#{kw.text}</span>
                      <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Frequency: {kw.count} reports</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      kw.weight === 'Critical' ? 'bg-red-950/40 text-red-400 border border-red-950' : 
                      kw.weight === 'High' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-950' :
                      'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {kw.weight}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Ingestion Protocol */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg space-y-1.5 text-[9.5px] font-mono">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Real-time NLP Parser Logs</span>
            <div className="flex items-start space-x-1.5 text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-bold block">NLP Classification Active</span>
                <span>Automatic entity matching extracted location "Outer Ring Road" with confidence 0.98. Suggesting pump dispatch.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenPulse() {
  return (
    <ToastProvider { ...{ } }>
      <PulseDashboardContent />
    </ToastProvider>
  );
}
