'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Home, Clock, Play, Pause, FastForward, RotateCcw, Shuffle, ShieldAlert, Zap, Thermometer, MapPin, Sliders, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

interface Scenario {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  startTime: number; // in minutes
  baseCis: number;
  incidents: Array<{
    time: number; // in minutes
    type: string;
    location: string;
    lat: number;
    lon: number;
    description: string;
  }>;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'ipl_match',
    name: 'IPL Match: Chinnaswamy Stadium',
    type: 'Planned Event',
    icon: '🏏',
    description: 'High-density commuter influx combined with evening peak rush. Heavy pressure on CBD corridors.',
    startTime: 1020, // 5:00 PM
    baseCis: 55,
    incidents: [
      { time: 1050, type: 'congestion', location: 'Queens Statue Circle', lat: 12.978, lon: 77.595, description: 'VIP vehicle convoy arrival causing temporary hold-ups.' },
      { time: 1110, type: 'vehicle_breakdown', location: 'MG Road Link', lat: 12.975, lon: 77.594, description: 'Private car broke down on narrow section.' },
      { time: 1170, type: 'congestion', location: 'Chinnaswamy Gate 5', lat: 12.980, lon: 77.597, description: 'Crowd crossing causing traffic halts.' }
    ]
  },
  {
    id: 'flash_flood',
    name: 'Monsoon Flash Flood: ORR Underpass',
    type: 'Weather Anomaly',
    icon: '🌧️',
    description: 'Heavy precipitation causing severe waterlogging at low-lying underpasses and arterial links.',
    startTime: 960, // 4:00 PM
    baseCis: 72,
    incidents: [
      { time: 990, type: 'water_logging', location: 'BSNL Underpass', lat: 12.999, lon: 77.682, description: '3-feet water levels accumulated. Service road blocked.' },
      { time: 1030, type: 'tree_fall', location: 'Sankey Road', lat: 13.003, lon: 77.579, description: 'Uprooted tree blocking 2 out of 3 lanes.' },
      { time: 1080, type: 'accident', location: 'Hosur Road near Madiwala', lat: 12.922, lon: 77.620, description: 'Two-wheeler skidded on wet asphalt.' }
    ]
  },
  {
    id: 'monday_rush',
    name: 'Monday Morning Peak Congestion',
    type: 'Routine Peak',
    icon: '💼',
    description: 'Commuter peak flow across primary highway links (Tumkur Road, Bellary Road, Hebbal Flyover).',
    startTime: 480, // 8:00 AM
    baseCis: 48,
    incidents: [
      { time: 510, type: 'vehicle_breakdown', location: 'Hebbal Flyover Service Rd', lat: 13.035, lon: 77.597, description: 'LCV stalled on flyover climb.' },
      { time: 540, type: 'road_work', location: 'Yeshwanthpur Circle', lat: 13.022, lon: 77.543, description: 'Metro pipeline excavation lane restriction.' }
    ]
  }
];

function ReplayDashboardContent() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [replayTime, setReplayTime] = useState(SCENARIOS[0].startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  
  // What-If Tactical Controls
  const [alternativePlanActive, setAlternativePlanActive] = useState(false);
  const [emergencyCorridorActive, setEmergencyCorridorActive] = useState(false);
  const [websterSignalsActive, setWebsterSignalsActive] = useState(false);
  const [pumpTeamsDeployed, setPumpTeamsDeployed] = useState(false);
  
  const { showToast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync replay time when scenario changes
  useEffect(() => {
    setReplayTime(selectedScenario.startTime);
    setIsPlaying(false);
    setAlternativePlanActive(false);
    setEmergencyCorridorActive(false);
    setWebsterSignalsActive(false);
    setPumpTeamsDeployed(false);
  }, [selectedScenario]);

  // Clock ticker logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setReplayTime((prev) => {
          const next = prev + 5 * playbackSpeed;
          if (next >= 1440) {
            setIsPlaying(false);
            showToast('Replay timeline completed.', 'success');
            return 1440;
          }
          return next;
        });
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, showToast]);

  const formatMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Evaluate simulated live metrics
  const getMetrics = () => {
    const hr = replayTime / 60;
    const scenario = selectedScenario;
    
    // Peak hour curves
    let peakMultiplier = 0.1;
    if (scenario.id === 'ipl_match') {
      // Peaks from 6:00 PM to 8:30 PM
      if (hr >= 17 && hr <= 21) {
        peakMultiplier = Math.sin(((hr - 17) / 4) * Math.PI) * 0.9;
      }
    } else if (scenario.id === 'flash_flood') {
      // Rain starts at 4:30 PM, floods persist
      if (hr >= 16.5 && hr <= 22) {
        peakMultiplier = Math.sin(((hr - 16.5) / 5.5) * Math.PI) * 0.95;
      }
    } else {
      // Morning peak 8:30 AM to 10:30 AM
      if (hr >= 8 && hr <= 11) {
        peakMultiplier = Math.sin(((hr - 8) / 3) * Math.PI) * 0.8;
      }
    }
    
    // Evaluate base values
    const actualCis = Math.round(scenario.baseCis + peakMultiplier * 38);
    const actualSpeed = Math.max(5, Math.round(34 - peakMultiplier * 26));
    const activeIncidentCount = scenario.incidents.filter(inc => replayTime >= inc.time).length;
    
    // Compute mitigated scores based on active What-If variables
    let mitigationRatio = 0;
    if (alternativePlanActive) mitigationRatio += 0.25;
    if (emergencyCorridorActive) mitigationRatio += 0.15;
    if (websterSignalsActive) mitigationRatio += 0.20;
    if (pumpTeamsDeployed && scenario.id === 'flash_flood') mitigationRatio += 0.30;
    
    const altCis = Math.max(10, Math.round(actualCis - (actualCis * mitigationRatio * 0.8)));
    const altSpeed = Math.min(45, Math.round(actualSpeed + (35 - actualSpeed) * mitigationRatio));
    
    const vehicleHoursSaved = Math.round(peakMultiplier * mitigationRatio * 8500);

    return {
      actualCis,
      actualSpeed,
      altCis,
      altSpeed,
      vehicleHoursSaved,
      activeIncidentCount
    };
  };

  const metrics = getMetrics();

  // Active simulated incidents at current replay time
  const currentIncidents = selectedScenario.incidents.filter(inc => replayTime >= inc.time);

  // Triggering visual toasts for simulated event checkpoints
  const triggeredEventsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    currentIncidents.forEach(inc => {
      const eventKey = `${selectedScenario.id}_${inc.time}`;
      if (!triggeredEventsRef.current.has(eventKey)) {
        triggeredEventsRef.current.add(eventKey);
        showToast(`ALERT: [${inc.type.toUpperCase()}] at ${inc.location} - ${inc.description}`, 'critical');
      }
    });
  }, [currentIncidents, selectedScenario, showToast]);

  // Reset triggered alerts if rewinding
  useEffect(() => {
    triggeredEventsRef.current = new Set(
      Array.from(triggeredEventsRef.current).filter(key => {
        const timePart = parseInt(key.split('_')[2] || '0', 10);
        return replayTime >= timePart;
      })
    );
  }, [replayTime]);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-4 select-none">
      
      {/* Top Cyber Command Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center bg-slate-950/90 border border-slate-900/60 p-4 rounded-xl shadow-2xl mb-4 space-y-3 md:space-y-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-cyan-400" />
                <span>Chrono-Replay & Counterfactual Dashboard</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">ASTRAM Forensics & Simulation Sandbox</p>
          </div>
        </div>

        {/* Playback Controls and Timeline Slider */}
        <div className="flex flex-wrap items-center bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-lg space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />}
            </button>
            
            <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800 text-[9px] font-bold">
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${playbackSpeed === s ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {s}X
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setReplayTime(selectedScenario.startTime);
                setIsPlaying(false);
                triggeredEventsRef.current.clear();
                showToast('Timeline rewound to scenario start.', 'info');
              }}
              title="Reset Scenario Timeline"
              className="p-2 hover:bg-slate-800 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

          {/* Direct Slider */}
          <div className="flex items-center space-x-2 w-48 sm:w-64">
            <input
              type="range"
              min={selectedScenario.startTime}
              max={Math.min(1440, selectedScenario.startTime + 240)}
              value={replayTime}
              onChange={(e) => {
                setIsPlaying(false);
                setReplayTime(parseInt(e.target.value, 10));
              }}
              className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[10px] text-cyan-400 font-mono font-black uppercase tracking-wider min-w-[70px] text-right">
              {formatMinutes(replayTime)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Body */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-grow">
        
        {/* Left Col: Scenario Selector & Dynamic Analytics */}
        <div className="xl:col-span-1 flex flex-col space-y-4">
          
          {/* Scenario Picker */}
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col shadow-xl">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5 flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-cyan-500" />
              <span>Select Replay Scenario</span>
            </h2>
            <div className="space-y-2">
              {SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-3 rounded-lg border transition cursor-pointer flex items-start space-x-2.5 ${selectedScenario.id === sc.id ? 'bg-[#0e162d] border-cyan-500/80 shadow-lg shadow-cyan-950/20' : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'}`}
                >
                  <span className="text-xl mt-0.5">{sc.icon}</span>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{sc.name}</span>
                      <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-800 px-1 rounded uppercase font-black">
                        {sc.type}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal">{sc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Comparative Meters */}
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col shadow-xl flex-grow space-y-4">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center border-b border-slate-900 pb-2">
              <Thermometer className="w-3.5 h-3.5 mr-1 text-red-500" />
              <span>Live Scenario Telemetry</span>
            </h2>

            {/* Commuter Impact Score Gauge */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Commuter Impact Score</span>
                <span className="font-mono font-bold text-slate-200">
                  {alternativePlanActive ? (
                    <>
                      <span className="text-red-500 line-through mr-1.5">{metrics.actualCis}</span>
                      <span className="text-emerald-400 font-black">{metrics.altCis}</span>
                    </>
                  ) : (
                    <span className="text-red-500">{metrics.actualCis}</span>
                  )}
                  <span className="text-[9px] text-slate-500 ml-0.5">/100</span>
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900 relative">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${metrics.actualCis}%` }}
                />
                {alternativePlanActive && (
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${metrics.altCis}%` }}
                  />
                )}
              </div>
            </div>

            {/* Speed Gauge */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Arterial Speed Index</span>
                <span className="font-mono font-bold text-slate-200">
                  {alternativePlanActive ? (
                    <>
                      <span className="text-red-500 line-through mr-1.5">{metrics.actualSpeed}</span>
                      <span className="text-emerald-400 font-black">{metrics.altSpeed}</span>
                    </>
                  ) : (
                    <span className="text-yellow-500">{metrics.actualSpeed}</span>
                  )}
                  <span className="text-[9px] text-slate-500 ml-0.5">km/h</span>
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900 relative">
                <div 
                  className="h-full bg-yellow-600 transition-all duration-300"
                  style={{ width: `${(metrics.actualSpeed / 50) * 100}%` }}
                />
                {alternativePlanActive && (
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(metrics.altSpeed / 50) * 100}%` }}
                  />
                )}
              </div>
            </div>

            {/* Performance Impact Summary */}
            <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex flex-col justify-center space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Projected Optimization Payoff</span>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Delay Reduction:</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {alternativePlanActive ? `${metrics.actualCis - metrics.altCis}% Lower` : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Commuter Hours Saved:</span>
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  {alternativePlanActive ? `${metrics.vehicleHoursSaved.toLocaleString()} hr` : '0 hr'}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Center Cols: SVG Cyber Map Interface */}
        <div className="xl:col-span-2 flex flex-col space-y-4">
          
          {/* Cyber Map Visualizer */}
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col shadow-xl flex-grow min-h-[400px] relative overflow-hidden justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
                <div>
                  <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                    <span>Dynamic Corridor Incident Tracker</span>
                  </h2>
                  <p className="text-[8px] text-slate-500 uppercase mt-0.5">Interactive SVG Corridor Visualizer</p>
                </div>
                <div className="bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-[9px] font-mono text-cyan-500">
                  Active Events: {metrics.activeIncidentCount}
                </div>
              </div>
            </div>

            {/* SVG Interactive Map */}
            <div className="flex-grow flex items-center justify-center p-2 relative bg-slate-950/40 rounded-lg border border-slate-900/60">
              <svg viewBox="0 0 500 400" className="w-full max-h-[350px]">
                {/* Background Grid Accent */}
                <defs>
                  <pattern id="replay-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e172a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="500" height="400" fill="url(#replay-grid)" />

                {/* Major Corridors - colored dynamically based on peakFactor/alternativePlan */}
                {/* 1. Tumkur Road (Top Left to Center) */}
                <path
                  d="M 50 80 Q 150 120 250 200"
                  fill="none"
                  stroke={selectedScenario.id === 'monday_rush' && replayTime >= 510 ? '#ef4444' : '#10b981'}
                  strokeWidth="3.5"
                  strokeDasharray={selectedScenario.id === 'monday_rush' ? '5 3' : 'none'}
                  className="transition-all duration-500"
                />
                <text x="70" y="85" fill="#64748b" className="text-[8px] font-bold uppercase tracking-widest font-mono">Tumkur Rd</text>

                {/* 2. Bellary Road (Top Middle to Center) */}
                <path
                  d="M 250 50 L 250 200"
                  fill="none"
                  stroke={selectedScenario.id === 'monday_rush' && replayTime >= 540 ? '#f59e0b' : '#10b981'}
                  strokeWidth="3.5"
                  className="transition-all duration-500"
                />
                <text x="260" y="80" fill="#64748b" className="text-[8px] font-bold uppercase tracking-widest font-mono">Bellary Rd</text>

                {/* 3. Outer Ring Road East 1 & 2 (Right Side Loop) */}
                <path
                  d="M 250 200 Q 420 180 430 320"
                  fill="none"
                  stroke={selectedScenario.id === 'flash_flood' && replayTime >= 990 && !pumpTeamsDeployed ? '#ef4444' : (selectedScenario.id === 'flash_flood' && pumpTeamsDeployed ? '#f59e0b' : '#10b981')}
                  strokeWidth="4"
                  className="transition-all duration-500"
                />
                <text x="390" y="240" fill="#64748b" className="text-[8px] font-bold uppercase tracking-widest font-mono" transform="rotate(45 390 240)">ORR East</text>

                {/* 4. Hosur Road (Bottom Right) */}
                <path
                  d="M 250 200 Q 300 280 380 370"
                  fill="none"
                  stroke={selectedScenario.id === 'flash_flood' && replayTime >= 1080 ? '#f59e0b' : '#10b981'}
                  strokeWidth="3.5"
                  className="transition-all duration-500"
                />
                <text x="320" y="320" fill="#64748b" className="text-[8px] font-bold uppercase tracking-widest font-mono">Hosur Rd</text>

                {/* CBD Central Hub */}
                <circle cx="250" cy="200" r="14" fill="#090d1a" stroke={emergencyCorridorActive ? '#06b6d4' : '#334155'} strokeWidth="2.5" className={emergencyCorridorActive ? 'animate-pulse' : ''} />
                <circle cx="250" cy="200" r="4" fill={emergencyCorridorActive ? '#06b6d4' : '#475569'} />
                <text x="225" y="180" fill="#cbd5e1" className="text-[9px] font-black uppercase tracking-wider font-mono">CBD Hub</text>

                {/* Dynamic Incident Markers on Map */}
                {currentIncidents.map((inc, i) => {
                  let cx = 250;
                  let cy = 200;
                  let color = '#ef4444'; // red

                  if (inc.location.includes('Underpass') || inc.location.includes('BSNL')) { cx = 390; cy = 210; color = '#3b82f6'; } // blue for water logging
                  else if (inc.location.includes('Sankey')) { cx = 220; cy = 130; color = '#10b981'; } 
                  else if (inc.location.includes('MG')) { cx = 270; cy = 215; color = '#f59e0b'; }
                  else if (inc.location.includes('Hebbal')) { cx = 250; cy = 110; color = '#f97316'; }
                  else if (inc.location.includes('Yeshwanthpur')) { cx = 130; cy = 112; color = '#eab308'; }
                  else if (inc.location.includes('Madiwala')) { cx = 310; cy = 295; color = '#ef4444'; }

                  return (
                    <g key={i} className="cursor-pointer transition-all duration-300 hover:scale-125">
                      <circle cx={cx} cy={cy} r="10" fill={color} fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '2s' }} />
                      <circle cx={cx} cy={cy} r="5" fill={color} stroke="#ffffff" strokeWidth="1" />
                      {/* Tooltip hint on hover */}
                      <title>{inc.location}: {inc.description}</title>
                    </g>
                  );
                })}

                {/* Emergency Corridor Green Wave Highlight */}
                {emergencyCorridorActive && (
                  <path
                    d="M 250 50 L 250 200 Q 300 280 380 370"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                    className="animate-pulse"
                  />
                )}
              </svg>

              {/* Map Legend */}
              <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 border border-slate-900 p-2 rounded text-[8px] font-bold uppercase tracking-wider space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1 bg-emerald-500 rounded"></span>
                  <span className="text-slate-400">Normal Flow</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1 bg-yellow-500 rounded"></span>
                  <span className="text-slate-400">Moderate Delay</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1 bg-red-500 rounded"></span>
                  <span className="text-slate-400">Severe Gridlock</span>
                </div>
                {emergencyCorridorActive && (
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-1 bg-cyan-400 rounded"></span>
                    <span className="text-cyan-400">Green Wave Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Logs Feed */}
            <div className="mt-3 bg-slate-950 border border-slate-900 p-3 rounded-lg h-24 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1">
              <div className="text-slate-500 font-bold uppercase border-b border-slate-900 pb-1 mb-1.5 flex justify-between">
                <span>SIMULATION SEQUENCE ENGINE LOGS</span>
                <span>TIME: {formatMinutes(replayTime)}</span>
              </div>
              <div className="text-slate-500">[{formatMinutes(selectedScenario.startTime)}] Starting scenario playback: "{selectedScenario.name}"</div>
              {currentIncidents.map((inc, i) => (
                <div key={i} className="text-red-400">
                  [{formatMinutes(inc.time)}] INCIDENT LOGGED: {inc.type.replace(/_/g, ' ').toUpperCase()} at {inc.location} - {inc.description.substring(0, 50)}...
                </div>
              ))}
              {alternativePlanActive && (
                <div className="text-emerald-400">
                  [{formatMinutes(replayTime)}] WHAT-IF: ASTRAM Alternative Diverting Plan deployed. Optimizing corridor limits.
                </div>
              )}
              {emergencyCorridorActive && (
                <div className="text-cyan-400">
                  [{formatMinutes(replayTime)}] COMMAND: Emergency Corridor (Green Wave override) deployed from North-South Axis.
                </div>
              )}
              {websterSignalsActive && (
                <div className="text-cyan-400">
                  [{formatMinutes(replayTime)}] SIGNAL: Webster Adaptive signal plan tuning applied to key junctions.
                </div>
              )}
              {pumpTeamsDeployed && selectedScenario.id === 'flash_flood' && (
                <div className="text-cyan-400">
                  [{formatMinutes(replayTime)}] FLOOD: Pump teams deployed at BSNL Underpass. Mitigating road pool risk.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Col: What-If Tactical Playbook Command Panel */}
        <div className="xl:col-span-1 flex flex-col space-y-4">
          
          <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col shadow-xl h-full justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-900 pb-2">
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center">
                  <Shuffle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>What-If Counterfactual Sandbox</span>
                </h2>
                <p className="text-[8px] text-slate-500 uppercase mt-0.5">Toggle tactical interventions to test outcomes</p>
              </div>

              {/* Master Counterfactual Toggle */}
              <div 
                onClick={() => {
                  setAlternativePlanActive(!alternativePlanActive);
                  showToast(alternativePlanActive ? 'Alternative plan deactivated.' : 'Alternative plan activated.', 'info');
                }}
                className={`p-3 rounded-lg border transition cursor-pointer flex justify-between items-center ${alternativePlanActive ? 'bg-emerald-950/20 border-emerald-500/80 text-emerald-300' : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'}`}
              >
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">Deploy Alternative Plan</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">Applies dynamic re-routing & diversions</span>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${alternativePlanActive ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700'}`}></div>
              </div>

              {/* Sub-Toggles (Interventions) */}
              <div className="space-y-2.5 bg-slate-950/40 border border-slate-900 p-3 rounded-lg">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-1">Detailed Interventions</span>

                {/* 1. Webster Signals */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">Webster Signal Tuning</span>
                    <span className="text-[8.5px] text-slate-500">Adaptive cycle Split tuning</span>
                  </div>
                  <button
                    onClick={() => {
                      setWebsterSignalsActive(!websterSignalsActive);
                      showToast(websterSignalsActive ? 'Webster Signal tuning deactivated.' : 'Webster Signal tuning activated.', 'success');
                    }}
                    className={`w-9 h-5 rounded-full transition relative cursor-pointer ${websterSignalsActive ? 'bg-cyan-500' : 'bg-slate-800'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${websterSignalsActive ? 'left-4.5' : 'left-1'}`}></span>
                  </button>
                </div>

                {/* 2. Emergency Green Wave */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">Emergency Corridor Wave</span>
                    <span className="text-[8.5px] text-slate-500">Continuous green phase override</span>
                  </div>
                  <button
                    onClick={() => {
                      setEmergencyCorridorActive(!emergencyCorridorActive);
                      showToast(emergencyCorridorActive ? 'Emergency Corridor deactivated.' : 'Emergency Corridor green wave active.', 'success');
                    }}
                    className={`w-9 h-5 rounded-full transition relative cursor-pointer ${emergencyCorridorActive ? 'bg-cyan-500' : 'bg-slate-800'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${emergencyCorridorActive ? 'left-4.5' : 'left-1'}`}></span>
                  </button>
                </div>

                {/* 3. Pump Deployments */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">SWD Suction Pump Crew</span>
                    <span className="text-[8.5px] text-slate-500">Available during Monsoon flood</span>
                  </div>
                  <button
                    disabled={selectedScenario.id !== 'flash_flood'}
                    onClick={() => {
                      setPumpTeamsDeployed(!pumpTeamsDeployed);
                      showToast(pumpTeamsDeployed ? 'Pump teams recalled.' : 'Monsoon SWD pumps deployed to BSNL Underpass.', 'success');
                    }}
                    className={`w-9 h-5 rounded-full transition relative cursor-pointer ${pumpTeamsDeployed ? 'bg-cyan-500' : 'bg-slate-800'} ${selectedScenario.id !== 'flash_flood' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${pumpTeamsDeployed ? 'left-4.5' : 'left-1'}`}></span>
                  </button>
                </div>

              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="mt-4 bg-slate-950/80 border border-slate-900 p-3 rounded-lg flex flex-col space-y-2 text-[10px]">
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Historical Incident List</span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {selectedScenario.incidents.map((inc, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      <span>{inc.location}</span>
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 font-bold">{formatMinutes(inc.time)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenReplay() {
  return (
    <ToastProvider>
      <ReplayDashboardContent />
    </ToastProvider>
  );
}
