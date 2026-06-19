'use client';

import React, { useState } from 'react';
import { DigitalTwinMap } from '../../components/DigitalTwinMap';
import { initialIncidents, initialBarricadePoints } from '../../data/mockDatabase';
import { Home, Compass, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function FullscreenMap() {
  const [weather, setWeather] = useState<'clear' | 'light_rain' | 'heavy_rain'>('clear');
  const [emergencyCorridorActive, setEmergencyCorridorActive] = useState(false);
  const [barricadePoints, setBarricadePoints] = useState(initialBarricadePoints);
  const [activeIncidents, setActiveIncidents] = useState(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-6 relative">
      {/* Absolute Header Overlay */}
      <div className="absolute top-8 left-8 z-10 flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md border border-slate-900 px-4 py-2 rounded-lg shadow-xl">
        <Link href="/" className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
          <Home className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
            <Compass className="w-3.5 h-3.5 mr-1 text-sky-400" />
            <span>Digital Twin Map Viewer</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Fullscreen Dedicated Monitor</p>
        </div>
      </div>

      <div className="absolute top-8 right-8 z-10 flex space-x-2.5 bg-slate-950/80 backdrop-blur-md border border-slate-900 p-2 rounded-lg text-[9.5px]">
        {/* Quick controls */}
        <button
          onClick={() => setWeather(weather === 'clear' ? 'heavy_rain' : 'clear')}
          className={`px-2 py-1 rounded font-bold uppercase border transition cursor-pointer ${weather === 'heavy_rain' ? 'bg-red-950 text-red-400 border-red-900' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          {weather === 'heavy_rain' ? '🌧️ Heavy Rain' : '☀️ Clear Weather'}
        </button>

        <button
          onClick={() => setEmergencyCorridorActive(!emergencyCorridorActive)}
          className={`px-2 py-1 rounded font-bold uppercase border transition cursor-pointer ${emergencyCorridorActive ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          🚦 Emergency Green Wave: {emergencyCorridorActive ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="w-full h-[calc(100vh-48px)] rounded-xl overflow-hidden border border-slate-900 relative">
        <DigitalTwinMap
          weather={weather}
          barricadePoints={barricadePoints}
          emergencyCorridorActive={emergencyCorridorActive}
          activeIncidents={activeIncidents}
          onSelectIncident={(id) => {
            setSelectedIncident(id);
            const inc = activeIncidents.find((i) => i.id === id);
            alert(`Map Selected Incident: ${inc?.id}\n${inc?.description}\nLocality: ${inc?.locality}`);
          }}
        />
      </div>
    </div>
  );
}
