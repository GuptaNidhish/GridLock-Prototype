'use client';

import React, { useState } from 'react';
import { ManpowerLeaderboard } from '../../components/ManpowerLeaderboard';
import { initialOfficers, initialIncidents } from '../../data/mockDatabase';
import { Home, Users, Shield, Calendar, BarChart3, CloudRain, Sun, Award, Info } from 'lucide-react';
import Link from 'next/link';

export default function FullscreenManpower() {
  const [weather, setWeather] = useState<'clear' | 'light_rain' | 'heavy_rain'>('clear');
  const [replayTime, setReplayTime] = useState<number>(1020); // 17:00 (5:00 PM)

  const hour = Math.floor(replayTime / 60) % 24;

  const getSpotLocationCoords = (position: string) => {
    if (position.includes('Peenya')) return { x: 70, y: 80 };
    if (position.includes('Outer Ring')) return { x: 230, y: 160 };
    if (position.includes('Sadashivanagar') || position.includes('Sankey')) return { x: 130, y: 90 };
    if (position.includes('Lalbagh') || position.includes('Wilson')) return { x: 160, y: 190 };
    return { x: 150, y: 130 }; // CBD
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
              <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <Users className="w-4 h-4 mr-1 text-sky-400" />
                <span>manpower resource orchestration shift planner dashboard</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">ML-Driven Staff Allocation & Performance Board</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 border border-slate-800 rounded-lg">
          <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800 text-[9px] font-bold mr-3">
            {(['clear', 'light_rain', 'heavy_rain'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWeather(w)}
                className={`px-2 py-0.5 rounded transition cursor-pointer uppercase ${weather === w ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {w === 'clear' ? 'Clear' : w === 'light_rain' ? 'Drizzle' : 'Rain'}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="1439"
            value={replayTime}
            onChange={(e) => setReplayTime(parseInt(e.target.value))}
            className="w-24 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-slate-850"
          />
          <span className="text-[10px] font-mono text-sky-400 font-black min-w-[55px] text-right">
            {String(hour).padStart(2, '0')}:00
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: ManpowerLeaderboard component */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <ManpowerLeaderboard
            officers={initialOfficers}
            weather={weather}
            replayTime={replayTime}
            activeIncidents={initialIncidents}
          />
        </div>

        {/* Right Side: Duty Station Map & Risk Allocations */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          {/* Duty stations map */}
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-2.5">
              <Calendar className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>officer deployment coordinates map</span>
            </h2>

            <div className="h-60 bg-slate-950/40 rounded-lg border border-slate-900/60 p-2 relative flex items-center justify-center">
              <svg viewBox="0 0 300 200" className="w-full h-full">
                {/* Background grid */}
                <defs>
                  <pattern id="manpower-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e172a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="300" height="200" fill="url(#manpower-grid)" />

                {/* Duty spots */}
                {['Peenya Traffic Circle', 'Outer Ring Road BSNL', 'Sankey Road Sadashivanagar', 'Lalbagh Road Wilson'].map((spot, idx) => {
                  const coords = getSpotLocationCoords(spot);
                  return (
                    <g key={idx}>
                      <circle cx={coords.x} cy={coords.y} r="8" fill="#0284c7" fillOpacity="0.2" className="animate-pulse" />
                      <circle cx={coords.x} cy={coords.y} r="3" fill="#0ea5e9" />
                      <text x={coords.x + 8} y={coords.y + 3} fill="#64748b" className="text-[7px] font-black font-mono uppercase">{spot.split(' ')[0]}</text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute top-2 left-2 bg-slate-950/90 border border-slate-900 p-2 rounded text-[7.5px] font-mono text-slate-400 space-y-1">
                <div>Shift Active: {hour >= 6 && hour < 14 ? 'MORNING SHIFT (A)' : hour >= 14 && hour < 22 ? 'EVENING SHIFT (B)' : 'NIGHT SHIFT (C)'}</div>
                <div>Met State: {weather.toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Allocation ledger logs */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-auto">
            <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Manpower Optimization Integrity</span>
              <span>Roster requirements are computed via the local Random Forest predictive scale array to match active incident volumes.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
