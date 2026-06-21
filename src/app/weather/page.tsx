'use client';

import React, { useState, useEffect } from 'react';
import { WeatherFusion } from '../../components/WeatherFusion';
import { Home, CloudRain, Shield, AlertTriangle, Thermometer, MapPin, Wind, Sun, Clock } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

interface FloodRiskPoint {
  id: number;
  road_name: string;
  locality: string;
  risk_level: 'High' | 'Medium' | 'Low';
  incident_count: number;
  avg_resolution_hours: number;
  responsible_agency: string;
  lat: number;
  lon: number;
  status: 'nominal' | 'alert' | 'critical';
}

const INITIAL_RISK_POINTS: FloodRiskPoint[] = [
  { id: 1, road_name: 'BSNL CACT Underpass', locality: 'Outer Ring Road', risk_level: 'High', incident_count: 5, avg_resolution_hours: 6.5, responsible_agency: 'BBMP', lat: 12.9995, lon: 77.6827, status: 'nominal' },
  { id: 2, road_name: 'Whitefield Road Underpass', locality: 'Whitefield', risk_level: 'High', incident_count: 3, avg_resolution_hours: 4.2, responsible_agency: 'BBMP', lat: 13.0008, lon: 77.6813, status: 'nominal' },
  { id: 3, road_name: 'Koramangala 80ft Road Underpass', locality: 'Koramangala', risk_level: 'Medium', incident_count: 2, avg_resolution_hours: 3.0, responsible_agency: 'BBMP', lat: 12.9345, lon: 77.6101, status: 'nominal' },
  { id: 4, road_name: 'Hebbal Flyover Loop', locality: 'Hebbal', risk_level: 'Medium', incident_count: 4, avg_resolution_hours: 2.8, responsible_agency: 'BBMP', lat: 13.0358, lon: 77.5971, status: 'nominal' }
];

function WeatherDashboardContent() {
  const [weather, setWeather] = useState<'clear' | 'light_rain' | 'heavy_rain'>('clear');
  const [pumpTeamsDeployed, setPumpTeamsDeployed] = useState(false);
  const [riskPoints, setRiskPoints] = useState<FloodRiskPoint[]>(INITIAL_RISK_POINTS);
  const { showToast } = useToast();

  // Dynamic simulation of water levels based on rain state
  useEffect(() => {
    setRiskPoints((prev) =>
      prev.map((pt) => {
        let status: 'nominal' | 'alert' | 'critical' = 'nominal';
        if (weather === 'heavy_rain') {
          status = pt.risk_level === 'High' ? 'critical' : 'alert';
        } else if (weather === 'light_rain') {
          status = pt.risk_level === 'High' ? 'alert' : 'nominal';
        }
        // If pumps are deployed, we mitigate the severity
        if (pumpTeamsDeployed && status === 'critical') status = 'alert';
        else if (pumpTeamsDeployed && status === 'alert') status = 'nominal';
        
        return { ...pt, status };
      })
    );
  }, [weather, pumpTeamsDeployed]);

  const handleTriggerFlood = () => {
    showToast('ALERT: Simulated 3-foot waterlogging at BSNL CACT Underpass!', 'critical');
    setRiskPoints((prev) =>
      prev.map((pt) =>
        pt.id === 1 ? { ...pt, status: 'critical' } : pt
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-4 select-none">
      
      {/* Cyber Header */}
      <header className="w-full flex justify-between items-center bg-slate-950/90 border border-slate-900/60 p-4 rounded-xl shadow-2xl mb-4">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${weather === 'heavy_rain' ? 'bg-red-500' : 'bg-sky-400'}`}></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <CloudRain className="w-4 h-4 mr-1 text-sky-400" />
                <span>Weather-Traffic Fusion & Monsoon Response Control</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Real-time Flood Risk Prediction Engine</p>
          </div>
        </div>
        <div className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
          System: {weather.replace('_', ' ')}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-grow">
        
        {/* Left Panel: WeatherFusion Controller */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl h-full">
            <WeatherFusion
              weather={weather}
              onChangeWeather={setWeather}
              pumpTeamsDeployed={pumpTeamsDeployed}
              onTogglePumpTeams={() => {
                setPumpTeamsDeployed(!pumpTeamsDeployed);
                showToast(pumpTeamsDeployed ? 'Recalling pump response teams...' : 'Pumping crews deployed to active underpass channels.', 'success');
              }}
              onTriggerFloodIncident={handleTriggerFlood}
            />
          </div>
        </div>

        {/* Center Panel: SVG Hydrology & Waterlog Map */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col shadow-2xl h-full justify-between">
            <div>
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-2.5">
                <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                <span>monsoon flood risk telemetry map</span>
              </h2>
            </div>

            {/* SVG Map of Risk Points */}
            <div className="flex-grow flex items-center justify-center relative bg-slate-950/40 rounded-lg border border-slate-900/60 p-4">
              <svg viewBox="0 0 300 250" className="w-full max-h-[220px]">
                {/* Background grid */}
                <defs>
                  <pattern id="weather-grid" width="15" height="15" patternUnits="userSpaceOnUse">
                    <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#0e172a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="300" height="250" fill="url(#weather-grid)" />

                {/* Simulated Road Lines */}
                <line x1="20" y1="125" x2="280" y2="125" stroke="#1e293b" strokeWidth="3" />
                <line x1="150" y1="20" x2="150" y2="230" stroke="#1e293b" strokeWidth="3" />

                {/* Risk Point Nodes */}
                {riskPoints.map((pt) => {
                  // Coordinate scaling
                  const cx = 50 + (pt.id * 50);
                  const cy = 40 + (pt.id * 35);
                  let color = '#10b981'; // nominal green
                  if (pt.status === 'alert') color = '#eab308'; // warning yellow
                  if (pt.status === 'critical') color = '#ef4444'; // critical red

                  return (
                    <g key={pt.id} className="cursor-pointer">
                      <circle cx={cx} cy={cy} r="14" fill={color} fillOpacity="0.15" className="animate-pulse" />
                      <circle cx={cx} cy={cy} r="6" fill={color} stroke="#ffffff" strokeWidth="1" />
                      <text x={cx + 10} y={cy + 3} fill="#94a3b8" className="text-[7.5px] font-black font-mono uppercase">{pt.locality}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Water Level overlay during downpour */}
              {weather === 'heavy_rain' && (
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none border border-blue-500/20 animate-pulse" />
              )}
            </div>

            {/* Meteorological Sensors readout */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900">
                <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider block">precip. rate</span>
                <span className="text-xs font-black font-mono text-slate-300">
                  {weather === 'heavy_rain' ? '32.4 mm/h' : weather === 'light_rain' ? '4.8 mm/h' : '0.0 mm/h'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900">
                <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider block">wind velocity</span>
                <span className="text-xs font-black font-mono text-slate-300">
                  {weather === 'heavy_rain' ? '28 km/h' : weather === 'light_rain' ? '12 km/h' : '4 km/h'}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900">
                <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider block">saturation index</span>
                <span className="text-xs font-black font-mono text-slate-300">
                  {weather === 'heavy_rain' ? '96%' : weather === 'light_rain' ? '74%' : '21%'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel: Flood Risk Points List */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col shadow-2xl h-full justify-between space-y-4">
            <div>
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-2.5 border-b border-slate-900 pb-2">
                <Shield className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span>drainage node status directory</span>
              </h2>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {riskPoints.map((pt) => (
                  <div key={pt.id} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-[10px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block">{pt.road_name}</span>
                      <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Agency: {pt.responsible_agency} | Risk: {pt.risk_level}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      pt.status === 'nominal' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-950' : 
                      pt.status === 'alert' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-950 animate-pulse' :
                      'bg-red-950/40 text-red-400 border border-red-950 animate-pulse'
                    }`}>
                      {pt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pump Response metrics */}
            <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg text-[9px] font-mono space-y-1.5">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">pump response metrics</span>
              <div className="flex justify-between">
                <span>Active pump teams en-route:</span>
                <span className="text-cyan-400 font-bold">{pumpTeamsDeployed ? '4 Crews' : '0 Crews'}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated drain clearance:</span>
                <span className="text-cyan-400 font-bold">{pumpTeamsDeployed ? '35 mins' : 'N/A'}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default function FullscreenWeather() {
  return (
    <ToastProvider>
      <WeatherDashboardContent />
    </ToastProvider>
  );
}
