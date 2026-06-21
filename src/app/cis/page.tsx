'use client';

import React, { useState, useEffect } from 'react';
import { CisDial } from '../../components/CisDial';
import { evaluateIncidentCis } from '../../data/cisMlEvaluator';
import { Incident } from '../../data/mockDatabase';
import { Home, Activity, Sliders, Play, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FullscreenCis() {
  // ML feature state variables
  const [corridor, setCorridor] = useState<string>('Tumkur Road');
  const [vehicleType, setVehicleType] = useState<string>('private_car');
  const [incidentType, setIncidentType] = useState<string>('vehicle_breakdown');
  const [isDiversion, setIsDiversion] = useState<boolean>(false);
  const [hour, setHour] = useState<number>(17); // 5:00 PM

  const [score, setScore] = useState<number>(45);

  // Recalculate CIS dynamically using the ML Decision Tree evaluator
  useEffect(() => {
    const mockIncident: Partial<Incident> = {
      corridor: corridor as any,
      vehicle_type: vehicleType as any,
      incident_type: incidentType as any,
      is_diversion: isDiversion,
      locality: 'Unknown',
      priority: 'High',
      status: 'active',
      start_lat: 12.9716,
      start_lon: 77.5946,
      start_address: 'Simulated Point, Bengaluru',
      description: 'Dynamic ML test'
    };

    const calculatedScore = evaluateIncidentCis(mockIncident as Incident, hour);
    // Keep it clamped between 10 and 100 for dial representation
    setScore(Math.max(10, Math.min(100, calculatedScore)));
  }, [corridor, vehicleType, incidentType, isDiversion, hour]);

  const getImpactSeverity = (s: number) => {
    if (s >= 70) return { label: 'CRITICAL IMPACT', color: 'text-red-500 bg-red-950/20 border-red-900/60' };
    if (s >= 40) return { label: 'MODERATE IMPACT', color: 'text-yellow-500 bg-yellow-950/15 border-yellow-900/40' };
    return { label: 'LOW IMPACT', color: 'text-emerald-500 bg-emerald-950/10 border-emerald-950' };
  };

  const severity = getImpactSeverity(score);

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
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <Activity className="w-4 h-4 mr-1 text-emerald-400" />
                <span>commuter impact score (cis) simulation lab</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Real-time ML Tree Inference playground</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[8.5px] bg-cyan-950/50 text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            Model: DecisionTreeRegressor
          </span>
        </div>
      </header>

      {/* Main split grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left column: CisDial and dynamic severity */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-6 flex flex-col justify-center items-center shadow-2xl">
          <div className="max-w-xs w-full flex flex-col items-center">
            <CisDial score={score} />
            
            <div className={`mt-6 text-center border px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${severity.color}`}>
              {severity.label}
            </div>
          </div>
        </div>

        {/* Right column: ML Feature inputs */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-6 flex flex-col justify-between shadow-2xl space-y-4">
          
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center border-b border-slate-900 pb-2.5">
              <Sliders className="w-4 h-4 mr-1 text-cyan-400" />
              <span>ml input feature variables</span>
            </h2>

            {/* Corridor */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">corridor link</label>
              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none"
              >
                {['Tumkur Road', 'Bellary Road', 'Hosur Road', 'ORR East 2', 'CBD 2', 'Non-corridor'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">vehicle class</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none"
              >
                {['private_car', 'lcv', 'heavy_vehicle'].map((v) => (
                  <option key={v} value={v}>{v.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Incident Type */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">incident category</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded px-2.5 py-1.5 text-xs text-slate-350 focus:outline-none"
              >
                {['vehicle_breakdown', 'road_work', 'tree_fall', 'water_logging', 'accident', 'others'].map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Diversion switch */}
            <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-900">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300">Requires Diversion closure</span>
                <span className="text-[8.5px] text-slate-500">Triggers road blocks in simulation</span>
              </div>
              <button
                onClick={() => setIsDiversion(!isDiversion)}
                className={`w-9 h-5 rounded-full transition relative cursor-pointer ${isDiversion ? 'bg-cyan-500' : 'bg-slate-800'}`}
              >
                <span className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${isDiversion ? 'left-4.5' : 'left-1'}`}></span>
              </button>
            </div>

            {/* Hour Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">
                <span>hour of day (0-23)</span>
                <span className="text-cyan-400 font-mono font-black">{hour}:00</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-slate-900"
              />
            </div>
          </div>

          {/* Model outputs summary */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-auto">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Edge ML Tree Inference</span>
              <span>All calculations are executed directly on the client utilizing pre-compiled category mapping weight maps.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
