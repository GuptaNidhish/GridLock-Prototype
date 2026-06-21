'use client';

import React, { useState } from 'react';
import { AiCopilot } from '../../components/AiCopilot';
import { Home, Cpu, Sparkles, Server, Zap, CheckCircle, ShieldAlert, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

interface AgentSkill {
  name: string;
  category: string;
  status: 'active' | 'standby';
  confidence: number;
}

const AGENT_SKILLS: AgentSkill[] = [
  { name: 'RAG Incident Query', category: 'Information Retrieval', status: 'active', confidence: 0.94 },
  { name: 'Webster Junction Cycle Tuning', category: 'Optimization', status: 'active', confidence: 0.88 },
  { name: 'Commuter Routing Divert Plan', category: 'Remedies Dispatch', status: 'active', confidence: 0.91 },
  { name: 'Monsoon SWD Pump Deployment', category: 'Emergency Services', status: 'standby', confidence: 0.85 }
];

function CopilotDashboardContent() {
  const [alternativePlanActive, setAlternativePlanActive] = useState(false);
  const [emergencyCorridorActive, setEmergencyCorridorActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'skills'>('diagnostics');
  const { showToast } = useToast();

  const handleAction = (type: string) => {
    showToast(`AI RECOMMENDATION DEPLOYED: Pushed action command "${type.replace('_', ' ').toUpperCase()}"`, 'action');
    if (type === 'deploy_pumps') {
      showToast('Crews dispatched to ORR BSNL Underpass.', 'success');
    } else if (type === 'recalibrate_signals') {
      setAlternativePlanActive(true);
      showToast('Webster signal split override loaded into city controllers.', 'success');
    } else if (type === 'escalate_wilson') {
      setEmergencyCorridorActive(true);
      showToast('ACP level priority flagged for Lalbagh Road repairs.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-4 select-none">
      
      {/* Top Header */}
      <header className="w-full flex justify-between items-center bg-slate-950/90 border border-slate-900/60 p-4 rounded-xl shadow-2xl mb-4">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <Cpu className="w-4 h-4 mr-1 text-cyan-400" />
                <span>ASTRAM AI Cognitive Agent Command Center</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">RAG-Augmented Semantic Traffic Controller</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[8px] bg-cyan-950/50 text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            Agent: ASTRAM-Core-v4
          </span>
          <span className="text-[8px] bg-slate-900 text-slate-400 px-2 py-0.5 border border-slate-800 rounded font-black">
            TEMP: 0.15
          </span>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: Dynamic Chat and Recommended Actions list */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <AiCopilot
            weather="clear"
            activeIncidentsCount={3}
            alternativePlanActive={alternativePlanActive}
            emergencyCorridorActive={emergencyCorridorActive}
            onExecuteAction={handleAction}
          />
        </div>

        {/* Right Side: Diagnostics, Knowledge retrieval maps and telemetry */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          <div>
            {/* Tab selector */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3.5">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`text-[10px] font-black uppercase tracking-wider pb-1 transition cursor-pointer ${activeTab === 'diagnostics' ? 'border-b-2 border-cyan-400 text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  Model Diagnostics
                </button>
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`text-[10px] font-black uppercase tracking-wider pb-1 transition cursor-pointer ${activeTab === 'skills' ? 'border-b-2 border-cyan-400 text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  Agent Skills Registry
                </button>
              </div>
              <span className="text-[8px] bg-slate-950 border border-slate-900 px-2 py-0.5 rounded text-slate-500 font-mono">
                Lat: 280ms
              </span>
            </div>

            {/* Tab Contents */}
            {activeTab === 'diagnostics' ? (
              <div className="space-y-4">
                {/* 1. Resource Monitor */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                    <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block mb-1">RAG Context Size</span>
                    <span className="text-sm font-black font-mono text-slate-300">12,482 Tokens</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                    <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block mb-1">Knowledge Retrievs</span>
                    <span className="text-sm font-black font-mono text-slate-300">4 Database Vectors</span>
                  </div>
                </div>

                {/* 2. Vector Search Logs */}
                <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex flex-col space-y-1.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Semantic Retrieval Matches</span>
                  <div className="space-y-2 text-[9px] font-mono text-slate-400">
                    <div className="flex justify-between items-center text-cyan-400">
                      <span>1. monsoon_underpass_guidelines.md</span>
                      <span>Score: 0.96</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>2. chinnaswamy_stadium_event_playbook.md</span>
                      <span>Score: 0.89</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>3. incident_escalation_protocol.md</span>
                      <span>Score: 0.81</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {AGENT_SKILLS.map((sk, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-between text-[10px]">
                    <div>
                      <span className="font-bold text-slate-200 block">{sk.name}</span>
                      <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Category: {sk.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[8.5px] font-mono text-cyan-400 font-bold">Conf: {Math.round(sk.confidence * 100)}%</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        sk.status === 'active' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-950' : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}>
                        {sk.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Network Optimization Stats */}
          <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-lg space-y-2">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">Agentic Decision Ledger</span>
            <div className="flex items-start space-x-2 text-[9px] text-slate-400 font-mono">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-bold block">Intervention Recalibrated</span>
                <span>The system automatically recalculated dynamic corridor priorities for Tumkur road when a vehicle breakdown was analyzed by the RAG model.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenCopilot() {
  return (
    <ToastProvider>
      <CopilotDashboardContent />
    </ToastProvider>
  );
}
