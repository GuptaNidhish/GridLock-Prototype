'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { useToast } from './ToastProvider';
import {
  Sparkles,
  RefreshCw,
  Construction,
  Users,
  Compass,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

interface BarricadingRec {
  id: string;
  location: string;
  action: string;
  officersRequired: number;
  signageText: string;
  applied?: boolean;
}

interface PoliceRec {
  id: string;
  junction: string;
  officersCount: number;
  role: string;
  priority: 'High' | 'Medium' | 'Low';
  applied?: boolean;
}

interface RouteRec {
  id: string;
  congestedRoute: string;
  suggestedAlternate: string;
  expectedSavings: string;
  vmsMessage: string;
  applied?: boolean;
}

interface GeminiData {
  apiMode: string;
  summary: string;
  barricading: BarricadingRec[];
  policeDeployment: PoliceRec[];
  alternateRoutes: RouteRec[];
}

export const GeminiStrategyPanel: React.FC = () => {
  const { weather, incidents, selectedIncidentId } = useAppState();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'barricading' | 'police' | 'routes'>('barricading');
  const [loading, setLoading] = useState<boolean>(true);
  const [strategyData, setStrategyData] = useState<GeminiData | null>(null);

  // Tracking applied actions
  const [appliedBarricades, setAppliedBarricades] = useState<Record<string, boolean>>({});
  const [appliedPolice, setAppliedPolice] = useState<Record<string, boolean>>({});
  const [appliedRoutes, setAppliedRoutes] = useState<Record<string, boolean>>({});

  const fetchRecommendations = async () => {
    if (!selectedIncidentId) {
      setStrategyData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const url = `http://${hostname}:3001/api/v1/gemini/recommendations?weather=${weather}&incidentId=${selectedIncidentId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStrategyData(data);
      }
    } catch (err) {
      console.error('Failed to fetch Gemini traffic strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch recommendations when weather, incident count, or selectedIncidentId changes
  useEffect(() => {
    fetchRecommendations();
  }, [weather, incidents.length, selectedIncidentId]);

  const handleApplyBarricade = (rec: BarricadingRec) => {
    setAppliedBarricades(prev => ({ ...prev, [rec.id]: true }));
    showToast(`BARRICADING DEPLOYED: Block set up at ${rec.location}. ${rec.officersRequired} officers dispatched.`, 'success');
  };

  const handleApplyPolice = (rec: PoliceRec) => {
    setAppliedPolice(prev => ({ ...prev, [rec.id]: true }));
    showToast(`OFFICERS ASSIGNED: ${rec.officersCount} traffic personnel deployed at ${rec.junction} for ${rec.role}.`, 'success');
  };

  const handleApplyRoute = (rec: RouteRec) => {
    setAppliedRoutes(prev => ({ ...prev, [rec.id]: true }));
    showToast(`VMS BROADCAST: Alt-routing pushed to signs: "${rec.vmsMessage}"`, 'action');
  };

  if (!selectedIncidentId) {
    return (
      <div className="glass-panel p-6 flex flex-col justify-center items-center h-full min-h-[380px] text-center select-none">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-350 flex items-center justify-center">
          <Sparkles className="w-4 h-4 mr-1.5 text-indigo-400" />
          <span>Awaiting Incident Selection</span>
        </h3>
        <p className="text-[10px] text-slate-400 max-w-[280px] mt-2 leading-relaxed">
          Select an active incident from the map or the incident feed to query Gemini AI and compile custom dispatch strategies (barricading, manpower, and detours) for that specific event.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[380px] overflow-hidden select-none">

      {/* Header */}
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-pulse-glow">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-indigo-400 flex items-center">
                <span>gemini ai strategy recommendations</span>
                <span className="ml-2 bg-indigo-950 text-indigo-400 border border-indigo-900 text-[8px] px-2 py-0.5 rounded font-black tracking-widest uppercase">advisory</span>
              </h2>
              <p className="text-[10px] text-slate-400">
                AI-generated advisory strategy proposals. Human dispatcher confirmation required.
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className={`p-1.5 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition flex items-center justify-center cursor-pointer ${loading ? 'animate-spin border-transparent' : ''
              }`}
            title="Recalibrate AI Strategy"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* API Mode Indicator Badge */}
        {strategyData && (
          <div className="mt-3.5 flex items-center space-x-2">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">AI Status:</span>
            {strategyData.apiMode.startsWith('LIVE_GEMINI') ? (
              <span className="bg-sky-950 text-sky-400 border border-sky-900 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Live Gemini 2.5 Flash
              </span>
            ) : (
              <span className="bg-amber-950/40 text-amber-400 border border-amber-900/60 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center space-x-1">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-amber-400 animate-pulse" />
                <span>Simulated Strategy Fallback Mode</span>
              </span>
            )}
          </div>
        )}

        {/* Executive Summary */}
        <div className="my-3 bg-indigo-950/10 border border-indigo-900/30 p-3 rounded-lg text-[10.5px] leading-relaxed text-slate-350 italic relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-900/25 border-l border-b border-indigo-900/40 text-indigo-400 text-[7.5px] font-black uppercase px-2 py-0.5 tracking-wider">
            AI Advisory Summary
          </div>
          {loading ? (
            <div className="flex items-center space-x-2 text-slate-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-ping" />
              <span>Analyzing city traffic grids...</span>
            </div>
          ) : (
            `"${strategyData?.summary || 'No summary compiled.'}"`
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900/60 mt-1">
        {[
          { key: 'barricading', name: '🚧 Recommended Barricades', count: strategyData?.barricading?.length || 0 },
          { key: 'police', name: '👮 Recommended Patrols', count: strategyData?.policeDeployment?.length || 0 },
          { key: 'routes', name: '🔀 Recommended Detours', count: strategyData?.alternateRoutes?.length || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 pb-2 border-b-2 font-black text-[9px] uppercase tracking-wider transition cursor-pointer text-center ${activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
          >
            {tab.name} <span className="text-[8px] opacity-60 font-mono">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 my-4 overflow-y-auto min-h-[140px] max-h-[220px] pr-1.5">
        {loading ? (
          <div className="space-y-2 mt-2">
            {[1, 2].map((i) => (
              <div key={i} className="border border-slate-900/60 p-3 rounded-lg animate-pulse bg-slate-950/20 flex flex-col space-y-2">
                <div className="h-3 w-1/3 bg-slate-800 rounded" />
                <div className="h-2 w-full bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-1.5">
            {/* 1. Barricading Tab */}
            {activeTab === 'barricading' &&
              strategyData?.barricading.map((rec) => {
                const isApplied = appliedBarricades[rec.id];
                return (
                  <div key={rec.id} className={`border p-3 rounded-lg flex items-center justify-between transition relative overflow-hidden ${isApplied ? 'border-emerald-950 bg-emerald-950/10' : 'border-indigo-900/20 bg-slate-950/20 hover:border-indigo-500/30'}`}>
                    <div className="flex-1 pr-3 text-[10px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900/40">AI RECOMMENDED SETUP</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <Construction className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="font-bold text-slate-200">{rec.location}</span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-normal">{rec.action}</p>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-1 uppercase">
                        VMS Message: <span className="text-slate-300">"{rec.signageText}"</span>
                      </p>
                    </div>

                    <button
                      onClick={() => !isApplied && handleApplyBarricade(rec)}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded font-black text-[9px] uppercase tracking-wider transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${isApplied
                          ? 'bg-emerald-950 border border-emerald-900 text-emerald-400'
                          : 'bg-indigo-500 hover:bg-indigo-400 text-slate-950'
                        }`}
                    >
                      {isApplied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : null}
                      <span>{isApplied ? 'Approved & Deployed' : 'Approve & Deploy'}</span>
                    </button>
                  </div>
                );
              })}

            {/* 2. Police Deployment Tab */}
            {activeTab === 'police' &&
              strategyData?.policeDeployment.map((rec) => {
                const isApplied = appliedPolice[rec.id];
                return (
                  <div key={rec.id} className={`border p-3 rounded-lg flex items-center justify-between transition relative overflow-hidden ${isApplied ? 'border-emerald-950 bg-emerald-950/10' : 'border-indigo-900/20 bg-slate-950/20 hover:border-indigo-500/30'}`}>
                    <div className="flex-1 pr-3 text-[10px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900/40">AI RECOMMENDED ACTION</span>
                        <span className={`text-[7.5px] font-black uppercase px-1.5 rounded-full ${rec.priority === 'High' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                          Priority: {rec.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-bold text-slate-200">{rec.junction}</span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-normal">{rec.role}</p>
                      <p className="text-[8.5px] text-slate-500 font-mono mt-1">
                        Officers Needed: <span className="text-slate-350">{rec.officersCount}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => !isApplied && handleApplyPolice(rec)}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded font-black text-[9px] uppercase tracking-wider transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${isApplied
                          ? 'bg-emerald-950 border border-emerald-900 text-emerald-400'
                          : 'bg-indigo-500 hover:bg-indigo-400 text-slate-950'
                        }`}
                    >
                      {isApplied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : null}
                      <span>{isApplied ? 'Approved & Assigned' : 'Accept & Assign'}</span>
                    </button>
                  </div>
                );
              })}

            {/* 3. Alternate Detours Tab */}
            {activeTab === 'routes' &&
              strategyData?.alternateRoutes.map((rec) => {
                const isApplied = appliedRoutes[rec.id];
                return (
                  <div key={rec.id} className={`border p-3 rounded-lg flex items-center justify-between transition relative overflow-hidden ${isApplied ? 'border-emerald-950 bg-emerald-950/10' : 'border-indigo-900/20 bg-slate-950/20 hover:border-indigo-500/30'}`}>
                    <div className="flex-1 pr-3 text-[10px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900/40">AI RECOMMENDED REROUTING</span>
                        <span className="text-[7.5px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1 rounded">
                          Expected Savings: -{rec.expectedSavings}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-bold text-slate-200">{rec.congestedRoute} detour</span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-normal">
                        Suggested Detour: <span className="text-slate-300 font-medium">{rec.suggestedAlternate}</span>
                      </p>
                      <p className="text-[8.5px] text-slate-555 text-slate-500 font-mono mt-1">
                        Sign Message: <span className="text-slate-350">"{rec.vmsMessage}"</span>
                      </p>
                    </div>

                    <button
                      onClick={() => !isApplied && handleApplyRoute(rec)}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded font-black text-[9px] uppercase tracking-wider transition flex items-center space-x-1 cursor-pointer whitespace-nowrap ${isApplied
                          ? 'bg-emerald-950 border border-emerald-900 text-emerald-400'
                          : 'bg-indigo-500 hover:bg-indigo-400 text-slate-950'
                        }`}
                    >
                      {isApplied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : null}
                      <span>{isApplied ? 'Approved & Broadcasted' : 'Approve & Broadcast'}</span>
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Footer Info Ledger */}
      <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg flex items-start space-x-2 text-[8.5px] text-slate-400 font-mono mt-auto">
        <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span>These strategies are generated dynamically via generative AI. Recommending actions does not execute field directives. Dispatchers must manually review and click 'Approve' to deploy.</span>
        </div>
      </div>
    </div>
  );
};
