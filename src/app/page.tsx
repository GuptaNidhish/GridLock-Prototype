'use client';

import React, { useState, useEffect } from 'react';
import { CisDial } from '../components/CisDial';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { ChronoReplay } from '../components/ChronoReplay';
import { WeatherFusion } from '../components/WeatherFusion';
import { CitizenPulse } from '../components/CitizenPulse';
import { WhatsAppBot } from '../components/WhatsAppBot';
import { ManpowerLeaderboard } from '../components/ManpowerLeaderboard';
import { IncidentTracker } from '../components/IncidentTracker';
import { OrchestrationPanels } from '../components/OrchestrationPanels';
import { PerformanceDashboard } from '../components/PerformanceDashboard';
import { AiCopilot } from '../components/AiCopilot';
import { LiveFeed } from '../components/LiveFeed';
import { IncidentFeed } from '../components/IncidentFeed';
import { useRealtimeEngine } from '../hooks/useRealtimeEngine';
import { ToastProvider, useToast } from '../components/ToastProvider';
import {
  initialIncidents,
  initialOfficers,
  initialBarricadePoints,
  Incident,
  BarricadePoint,
} from '../data/mockDatabase';

import {
  Shield,
  Sparkles,
  AlertCircle,
  Cpu,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  LayoutGrid,
  Clock,
  Power,
  Activity,
  Radio,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

import { evaluateIncidentCis } from '../data/cisMlEvaluator';
import { evaluateIncidentTtr } from '../data/ttrMlEvaluator';

function HomeContent() {
  const { showToast } = useToast();
  const [weather, setWeather] = useState<'clear' | 'light_rain' | 'heavy_rain'>('clear');
  const [replayTime, setReplayTime] = useState<number>(1020);
  const [alternativePlanActive, setAlternativePlanActive] = useState<boolean>(false);
  const [pumpTeamsDeployed, setPumpTeamsDeployed] = useState<boolean>(false);
  const [emergencyCorridorActive, setEmergencyCorridorActive] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('FKID000012'); // default active underpass
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    return initialIncidents.map((inc) => ({
      ...inc,
      duration_sla_hours: evaluateIncidentTtr(inc),
    }));
  });
  const [barricadePoints, setBarricadePoints] = useState<BarricadePoint[]>(initialBarricadePoints);
  const [mlCongestionMultiplier, setMlCongestionMultiplier] = useState<string>('Nominal');

  // Workspace Layout
  const [layoutPreset, setLayoutPreset] = useState<'standard' | 'focus' | 'compact'>('standard');
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    cis: true, replay: true, map: true, weather: true, tracker: true,
    copilot: true, orchestration: true, pulse: true, whatsapp: true,
    manpower: true, analytics: true, incidentFeed: true, signals: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(false); // Collapsed by default to avoid overlapping cards
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // ── Real-Time Engine ──────────────────────────────────────────
  const engine = useRealtimeEngine(
    incidents, setIncidents, weather, setWeather, setSelectedIncidentId,
  );

  // Load layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('astram_layout_config');
    const savedPreset = localStorage.getItem('astram_layout_preset');
    if (savedLayout) {
      try { setVisibleWidgets(JSON.parse(savedLayout)); } catch (e) {}
    }
    if (savedPreset) setLayoutPreset(savedPreset as any);

    // Auto-trigger onboarding tour if not completed
    const tourCompleted = localStorage.getItem('astram_tour_completed');
    if (!tourCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  // Fetch ML Congestion Multiplier whenever weather or time changes
  useEffect(() => {
    let active = true;
    const updateMlMultiplier = async () => {
      try {
        const hour = Math.floor(replayTime / 60);
        const res = await fetch(`/api/weather-fusion?weather=${weather}&hour=${hour}&month=6`);
        const data = await res.json();
        if (active && data.success) {
          setMlCongestionMultiplier(data.congestion_multiplier);
        }
      } catch (err) {
        console.error('Failed to fetch weather ML multiplier for CIS calculation:', err);
      }
    };
    updateMlMultiplier();
    return () => {
      active = false;
    };
  }, [weather, replayTime]);

  const saveWorkspaceConfig = () => {
    localStorage.setItem('astram_layout_config', JSON.stringify(visibleWidgets));
    localStorage.setItem('astram_layout_preset', layoutPreset);
  };

  const refitWorkspace = () => {
    setLayoutPreset('standard');
    setVisibleWidgets({
      cis: true, replay: true, map: true, weather: true, tracker: true,
      copilot: true, orchestration: true, pulse: true, whatsapp: true,
      manpower: true, analytics: true, incidentFeed: true, signals: true,
    });
    localStorage.removeItem('astram_layout_config');
    localStorage.removeItem('astram_layout_preset');
  };

  // Compute dynamic Commuter Impact Score (CIS) using ML Decision Tree Regressor
  const calculateCis = () => {
    const activeList = incidents.filter((i) => i.status === 'active');
    const hour = Math.floor(replayTime / 60);

    // If no active incidents, baseline citywide load based on time and weather
    if (activeList.length === 0) {
      let baseline = 10;
      if (mlCongestionMultiplier.startsWith('+')) {
        const pct = parseInt(mlCongestionMultiplier.replace('+', '').replace('%', ''), 10);
        baseline += Math.round(pct * 0.25);
      }
      // Add general peak hour baseline load
      if (hour >= 17 && hour <= 20) {
        baseline += 15;
      }
      return Math.max(10, Math.min(100, baseline));
    }

    // Evaluate ML score for each active incident
    let maxIncidentScore = 0;
    activeList.forEach((inc) => {
      const incScore = evaluateIncidentCis(inc, hour);
      if (incScore > maxIncidentScore) {
        maxIncidentScore = incScore;
      }
    });

    // Combine incident score with weather and queue multipliers
    let totalScore = maxIncidentScore;
    
    // Scale up for multiple simultaneous blockages
    if (activeList.length > 1) {
      totalScore += (activeList.length - 1) * 5;
    }

    // Apply weather disruption penalty from dynamic ML multiplier
    if (mlCongestionMultiplier.startsWith('+')) {
      const pct = parseInt(mlCongestionMultiplier.replace('+', '').replace('%', ''), 10);
      totalScore += Math.round(pct * 0.2); // Weather factor
    }

    // Check for SLA breach penalties
    const hasBreach = activeList.some((i) => {
      const daysDiff = Math.floor((Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 1;
    });
    if (hasBreach) totalScore += 12;

    // Apply active mitigation benefits
    if (alternativePlanActive) totalScore -= 18; // dynamic diversions help
    if (emergencyCorridorActive) totalScore += 5; // green wave causes slight cross-street lag

    return Math.max(10, Math.min(100, totalScore));
  };

  // ── Handlers ──────────────────────────────────────────────────
  const handleSelectIncident = (id: string) => setSelectedIncidentId(id);

  const handleUpdateIncidentStatus = async (
    id: string, newStatus: 'active' | 'resolved' | 'closed', extraFields?: Partial<Incident>
  ) => {
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:3001/api/v1/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraFields })
      });
      if (res.ok) {
        const updatedInc = await res.json();
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === id ? updatedInc : inc))
        );
      }
    } catch (err) {
      console.error('Error updating incident status:', err);
    }
  };

  const handleAddIncident = async (
    type: string, location: string, lat: number, lon: number, desc: string,
    event_type: 'planned' | 'unplanned' = 'unplanned'
  ) => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const corridor = location.toLowerCase().includes('tumkur') ? 'Tumkur Road'
      : location.toLowerCase().includes('orr') ? 'ORR East 2' : 'Non-corridor';

    const newInc: Incident = {
      id: `FKID${String(Math.floor(Math.random() * 900000) + 100000)}`,
      event_type,
      incident_type: type as any,
      start_lat: lat,
      start_lon: lon,
      end_lat: lat,
      end_lon: lon,
      start_address: `${location}, Bengaluru`,
      description: desc,
      corridor: corridor as any,
      priority: 'High',
      status: 'active',
      is_verified: true,
      is_diversion: type === 'water_logging' || type === 'accident',
      vehicle_type: type === 'water_logging' || type === 'accident' ? 'heavy_vehicle' : 'private_car',
      locality: location.split(' ')[0],
      division: 'Bengaluru Central Corporation',
      zone: 'Central Zone 2',
      junction: location.replace(/\s+/g, ''),
      commuter_impact_score: 45,
      duration_sla_hours: 4,
      kg_id: `FKKG000${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      reported_by: 'FKUSR00011',
      created_by: 'FKUSR00001',
    };

    newInc.duration_sla_hours = evaluateIncidentTtr(newInc);

    try {
      const res = await fetch(`http://${hostname}:3001/api/v1/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInc)
      });
      if (res.ok) {
        const createdInc = await res.json();
        setIncidents((prev) => {
          if (prev.some((i) => i.id === createdInc.id)) return prev;
          return [createdInc, ...prev];
        });
        setSelectedIncidentId(createdInc.id);
      } else {
        setIncidents((prev) => [newInc, ...prev]);
        setSelectedIncidentId(newInc.id);
      }
    } catch (err) {
      console.error('Error adding incident, falling back to local state:', err);
      setIncidents((prev) => [newInc, ...prev]);
      setSelectedIncidentId(newInc.id);
    }
  };

  const handleDeployBarricade = (id: string) => {
    setBarricadePoints((prev) =>
      prev.map((bp) =>
        bp.id === id ? { ...bp, status: bp.status === 'deployed' ? 'pending' : 'deployed' } : bp
      )
    );
  };

  // Map click spawns temporary barricade point
  const handleMapCoordinatesClick = (lat: number, lon: number) => {
    const newBpId = `BP_MANUAL_${Math.round(lat * 10000)}`;
    const newBp: BarricadePoint = {
      id: newBpId,
      lat,
      lon,
      road_name: 'Manual Coordinate Selection',
      type: 'checkpoint',
      officers_assigned: 2,
      setup_time_minutes: 10,
      status: 'deployed',
    };
    setBarricadePoints((prev) => [newBp, ...prev]);
    showToast(`Barricade deployed at coordinates: (${lat.toFixed(4)}, ${lon.toFixed(4)})`, 'success');
  };

  // Map clicks override junction signals
  const handleToggleJunctionSignal = (juncId: string) => {
    setEmergencyCorridorActive(!emergencyCorridorActive);
    showToast(`Webster Override triggered at junction: ${juncId.toUpperCase()}. Green Wave cycle calibrated.`, 'action');
  };

  // Map clicks toggles corridor diversions
  const handleToggleCorridorStatus = (corridorId: string) => {
    setAlternativePlanActive(!alternativePlanActive);
    showToast(`Corridor Diversion toggled for: ${corridorId.toUpperCase()}`, 'action');
  };

  // Trigger flood incident at BSNL CACT underpass (Feature 5 monsoon protocol)
  const handleTriggerFlood = () => {
    setWeather('heavy_rain');
    handleAddIncident(
      'water_logging',
      'BSNL CACT Underpass, Outer Ring Road',
      12.9995,
      77.6827,
      'Monsoon Protocol: Automated sensor reported 3-feet water logging at BSNL CACT underpass.'
    );
  };

  // AI Co-Pilot advisory action dispatcher
  const handleExecuteAiAction = (actionType: string) => {
    if (actionType === 'deploy_pumps') {
      setWeather('heavy_rain');
      setPumpTeamsDeployed(true);
      handleTriggerFlood();
    } else if (actionType === 'recalibrate_signals') {
      setAlternativePlanActive(true);
      setEmergencyCorridorActive(true);
      showToast('AI Execution: Cycle green phases calibrated. CBD 2 corridor cleared.', 'action');
    } else if (actionType === 'escalate_wilson') {
      handleUpdateIncidentStatus('FKID000002', 'active', { escalated_to: 'ACP Traffic' });
      setSelectedIncidentId('FKID000002');
      showToast('AI Execution: Chronic ticket FKID000002 escalated to ACP Traffic.', 'critical');
    }
  };

  const handleOverrideSignal = (junctionId: string) => {
    setEmergencyCorridorActive(true);
  };

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const activeCount = incidents.filter((i) => i.status === 'active').length;
  const currentCis = calculateCis();

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans">
      {/* ═══════════════════════════════════════════════════════════
           HEADER — Live Clock, Simulation Toggle, System Status
         ═══════════════════════════════════════════════════════════ */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0 sticky top-0 z-50">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-sky-500/10 border border-sky-500/30 rounded">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <h1 className="text-base font-black tracking-wider uppercase text-slate-200">
              ASTRAM Traffic Orchestration Command
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Bengaluru City Police • Real-Time Event-Driven Intelligence
          </p>
        </div>

        {/* ── Live Status Chips ── */}
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          {/* Live Clock */}
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <p className="text-slate-500 font-bold uppercase text-[8px]">System Clock</p>
              <p className="text-sky-400 font-black font-mono text-sm tracking-wider">
                {engine.clock || '--:--:--'}
              </p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <div>
              <p className="text-slate-500 font-bold uppercase text-[8px]">Active Alerts</p>
              <p className="text-red-400 font-black font-mono">{activeCount} Incidents</p>
            </div>
          </div>

          {/* Mitigation Status */}
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div>
              <p className="text-slate-500 font-bold uppercase text-[8px]">Mitigation</p>
              <p className="text-emerald-400 font-black uppercase">
                {alternativePlanActive ? 'Rerouting Active' : 'Normal Ops'}
              </p>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-slate-900/60 border border-slate-800 px-2.5 py-1.5 rounded flex items-center space-x-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400 font-mono font-bold text-[9px]">{formatUptime(engine.uptime)}</span>
          </div>

          {/* Simulation Toggle */}
          <button
            onClick={engine.toggleSimulation}
            className={`px-3 py-2 rounded font-extrabold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer border ${
              engine.simulationActive
                ? 'bg-emerald-950 border-emerald-800 text-emerald-400 hover:bg-emerald-900'
                : 'bg-red-950 border-red-800 text-red-400 hover:bg-red-900'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Sim: {engine.simulationActive ? 'LIVE' : 'OFF'}</span>
          </button>

          {/* Quick Onboarding Tour */}
          <button
            onClick={() => {
              setOnboardingStep(0);
              setShowOnboarding(true);
            }}
            className="bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-400 px-3 py-2 rounded font-extrabold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer animate-pulse-glow"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Quick Tour</span>
          </button>

          {/* Workspace */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-sky-400 px-3 py-2 rounded font-extrabold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Refit</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
           SETTINGS PANEL
         ═══════════════════════════════════════════════════════════ */}
      {showSettings && (
        <div className="bg-[#0b0f1a] border-b border-sky-950/60 p-5 text-[10px]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <p className="font-extrabold text-sky-400 uppercase tracking-widest mb-1">Workspace Layout Settings</p>
              <p className="text-slate-400">Toggle panel visibility and refit screen configurations.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-slate-950/80 rounded border border-slate-800 p-0.5">
                {(['standard', 'focus', 'compact'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setLayoutPreset(preset);
                      if (preset === 'compact') {
                        setVisibleWidgets({ cis: false, replay: false, map: true, weather: false, tracker: true,
                          copilot: true, orchestration: false, pulse: false, whatsapp: false,
                          manpower: false, analytics: false, incidentFeed: true, signals: false });
                      } else if (preset === 'focus') {
                        setVisibleWidgets({ cis: true, replay: true, map: true, weather: true, tracker: true,
                          copilot: true, orchestration: true, pulse: false, whatsapp: false,
                          manpower: false, analytics: true, incidentFeed: true, signals: true });
                      } else {
                        setVisibleWidgets({ cis: true, replay: true, map: true, weather: true, tracker: true,
                          copilot: true, orchestration: true, pulse: true, whatsapp: true,
                          manpower: true, analytics: true, incidentFeed: true, signals: true });
                      }
                    }}
                    className={`px-3 py-1 rounded font-black uppercase text-[9px] cursor-pointer transition ${
                      layoutPreset === preset ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <button onClick={saveWorkspaceConfig}
                className="bg-sky-500 text-slate-950 px-3.5 py-1.5 rounded font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer">
                <Save className="w-3.5 h-3.5" /><span>Save</span>
              </button>
              <button onClick={refitWorkspace}
                className="bg-slate-900 border border-slate-800 text-slate-350 px-3.5 py-1.5 rounded font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /><span>Reset</span>
              </button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4 border-t border-slate-900/60 pt-3">
            {Object.keys(visibleWidgets).map((k) => (
              <label key={k} className="flex items-center space-x-1.5 bg-slate-950/40 border border-slate-900 rounded p-1.5 cursor-pointer hover:border-slate-800 transition">
                <input type="checkbox" checked={visibleWidgets[k]} onChange={() =>
                  setVisibleWidgets((prev) => ({ ...prev, [k]: !prev[k] }))}
                  className="rounded text-sky-500 bg-slate-900 border-slate-800 cursor-pointer w-3 h-3" />
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[7.5px]">{k}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           MAIN GRID
         ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-6 flex flex-col space-y-6">
        {/* Row 1: CIS + Chrono Replay */}
        {(visibleWidgets.cis || visibleWidgets.replay) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleWidgets.cis && (
              <div className="md:col-span-1"><CisDial score={currentCis} /></div>
            )}
            {visibleWidgets.replay && (
              <div className={visibleWidgets.cis ? 'md:col-span-2' : 'md:col-span-3'}>
                <ChronoReplay replayTime={replayTime} onChangeReplayTime={setReplayTime}
                  alternativePlanActive={alternativePlanActive} onChangeAlternativePlan={setAlternativePlanActive} />
              </div>
            )}
          </div>
        )}

        {/* Row 2: Map + AI Copilot */}
        <div className={`grid grid-cols-1 ${layoutPreset === 'focus' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-6`}>
          {visibleWidgets.map && (
            <div className={`${layoutPreset === 'focus' ? 'xl:col-span-3' : 'xl:col-span-2'} flex flex-col h-[520px]`}>
              <DigitalTwinMap
                weather={weather} barricadePoints={barricadePoints}
                emergencyCorridorActive={emergencyCorridorActive}
                activeIncidents={incidents} corridorSpeeds={engine.corridorSpeeds}
                onSelectIncident={handleSelectIncident}
                onMapCoordinatesClick={handleMapCoordinatesClick}
                onToggleJunctionSignal={handleToggleJunctionSignal}
                onToggleCorridorStatus={handleToggleCorridorStatus}
              />
            </div>
          )}
          <div className="flex flex-col space-y-6 h-[520px]">
            {visibleWidgets.copilot && (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <AiCopilot weather={weather}
                  activeIncidentsCount={activeCount}
                  alternativePlanActive={alternativePlanActive}
                  emergencyCorridorActive={emergencyCorridorActive}
                  onExecuteAction={handleExecuteAiAction} />
              </div>
            )}
            {visibleWidgets.weather && !visibleWidgets.copilot && (
              <WeatherFusion weather={weather} onChangeWeather={setWeather}
                pumpTeamsDeployed={pumpTeamsDeployed}
                onTogglePumpTeams={() => setPumpTeamsDeployed(!pumpTeamsDeployed)}
                onTriggerFloodIncident={handleTriggerFlood}
                hour={Math.floor(replayTime / 60)}
                month={6}
              />
            )}
          </div>
        </div>

        {/* Row 3: Incident Feed + Tracker + Orchestration — uniform height */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{ gridAutoRows: '1fr' }}>
          {visibleWidgets.incidentFeed && (
            <div className="flex flex-col min-h-[420px]">
              <IncidentFeed incidents={incidents} selectedIncidentId={selectedIncidentId}
                onSelectIncident={handleSelectIncident} />
            </div>
          )}
          {visibleWidgets.tracker && (
            <div className="flex flex-col min-h-[420px]">
              <IncidentTracker selectedIncident={incidents.find((i) => i.id === selectedIncidentId) || null}
                onUpdateIncidentStatus={handleUpdateIncidentStatus} officers={initialOfficers} />
            </div>
          )}

          {(visibleWidgets.orchestration || visibleWidgets.signals) && (
            <div className="flex flex-col min-h-[420px]">
              <OrchestrationPanels
                barricadePoints={barricadePoints}
                onDeployBarricade={handleDeployBarricade}
                emergencyCorridorActive={emergencyCorridorActive}
                onToggleEmergencyCorridor={() => setEmergencyCorridorActive(!emergencyCorridorActive)}
                weather={weather}
                onTriggerAnomalyTicket={(title, desc, location, lat, lon, type) =>
                  handleAddIncident(type, location, lat, lon, desc)
                }
                replayTime={replayTime}
                activeIncidents={incidents}
              />
            </div>
          )}
        </div>

        {/* Row 3b: Weather Fusion (when copilot also visible) */}
        {visibleWidgets.weather && visibleWidgets.copilot && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <WeatherFusion
              weather={weather}
              onChangeWeather={setWeather}
              pumpTeamsDeployed={pumpTeamsDeployed}
              onTogglePumpTeams={() => setPumpTeamsDeployed(!pumpTeamsDeployed)}
              onTriggerFloodIncident={handleTriggerFlood}
              hour={Math.floor(replayTime / 60)}
              month={6}
            />
          </div>
        )}

        {/* Row 5: Citizen Pulse & WhatsApp */}
        {(visibleWidgets.pulse || visibleWidgets.whatsapp) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleWidgets.pulse && (
              <CitizenPulse onAddIncidentFromPulse={(title, desc, location, lat, lon, type) =>
                handleAddIncident(type, location, lat, lon, desc)} activeIncidents={incidents} />
            )}
            {visibleWidgets.whatsapp && (
              <WhatsAppBot onAddIncidentFromBot={(type, location, lat, lon, desc) =>
                handleAddIncident(type, location, lat, lon, desc)}
                onActivateDiversion={(corridor) => setAlternativePlanActive(true)} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {(visibleWidgets.manpower || visibleWidgets.analytics) && (
        <footer className="bg-slate-950/60 border-t border-slate-900 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleWidgets.manpower && (
            <ManpowerLeaderboard
              officers={initialOfficers}
              weather={weather}
              replayTime={replayTime}
              activeIncidents={incidents}
            />
          )}
          {visibleWidgets.analytics && <PerformanceDashboard />}
        </footer>
      )}

      {/* ═══════════════════════════════════════════════════════════
           FLOATING LIVE FEED OVERLAY
         ═══════════════════════════════════════════════════════════ */}
      <LiveFeed entries={engine.feedEntries} visible={showLiveFeed}
        onToggle={() => setShowLiveFeed(!showLiveFeed)} />

      {/* ═══════════════════════════════════════════════════════════
           ONBOARDING TOUR MODAL
         ═══════════════════════════════════════════════════════════ */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-xl p-8 flex flex-col justify-between relative overflow-hidden border border-sky-500/20 shadow-sky-500/5 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => {
                localStorage.setItem('astram_tour_completed', 'true');
                setShowOnboarding(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Slider */}
            <div className="flex flex-col items-center text-center my-6 min-h-[300px] justify-center">
              <div className="mb-4">
                {onboardingStep === 0 && <Shield className="w-12 h-12 text-sky-400 mb-2" />}
                {onboardingStep === 1 && <Activity className="w-12 h-12 text-emerald-400 mb-2 animate-pulse" />}
                {onboardingStep === 2 && <LayoutGrid className="w-12 h-12 text-blue-400 mb-2" />}
                {onboardingStep === 3 && <Cpu className="w-12 h-12 text-indigo-400 mb-2 animate-spin" style={{ animationDuration: '6s' }} />}
                {onboardingStep === 4 && <Sparkles className="w-12 h-12 text-amber-400 mb-2" />}
              </div>
              <h2 className="text-xl font-black tracking-wider uppercase text-sky-400 mb-3">
                {onboardingStep === 0 && "Welcome to ASTRAM Command"}
                {onboardingStep === 1 && "Real-Time Simulation Engine"}
                {onboardingStep === 2 && "Interactive Map Operations"}
                {onboardingStep === 3 && "Machine Learning Intelligence"}
                {onboardingStep === 4 && "NLP Co-Pilot & WhatsApp Bot"}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 max-w-md">
                {onboardingStep === 0 && "ASTRAM (Event-Driven Congestion Intelligence Platform) transitions Bengaluru's traffic network from reactive policing to active, data-driven city orchestration."}
                {onboardingStep === 1 && "ASTRAM simulates Bengaluru's streets in real-time. In the header, you will see a 'Sim: LIVE' indicator. When active, it runs background schedules to emulate live traffic conditions."}
                {onboardingStep === 2 && "The digital twin map isn't just for viewing. As a dispatcher, you can interact directly with the city network."}
                {onboardingStep === 3 && "Heuristics have been replaced by trained ML predictors integrated into the backend API. When active, they feed predictions into the client widgets."}
                {onboardingStep === 4 && "Communication channels are integrated directly into the dashboard so dispatchers and field officers stay synchronized."}
              </p>

              {/* Highlights Checklist */}
              <div className="w-full text-left space-y-2.5 max-w-md bg-slate-950/40 p-4 rounded-lg border border-slate-900">
                {onboardingStep === 0 && [
                  "Digital Twin Map: Interactive live city traffic corridors, status of signals, and real-time speeds.",
                  "Commuter Impact Score (CIS): Real-time ML-derived congestion index mapping citywide load.",
                  "Real-Time Simulation Engine: Dynamically updates speeds, signal phases, and spawns/resolves incidents."
                ].map((highlight, idx) => {
                  const [title, desc] = highlight.split(':');
                  return (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-200">{title}</span>
                        {desc && <span className="text-slate-400">{desc}</span>}
                      </div>
                    </div>
                  );
                })}

                {onboardingStep === 1 && [
                  "System Clock: A ticking digital timestamp driving the city's schedule.",
                  "Auto-Incident Spawner: Dynamically registers events (e.g. waterlogging, breakdowns) every 15-25 seconds.",
                  "Live Activity Feed: Real-time telemetry feed in the bottom-right corner. It is collapsed by default; click it to expand!"
                ].map((highlight, idx) => {
                  const [title, desc] = highlight.split(':');
                  return (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-200">{title}</span>
                        {desc && <span className="text-slate-400">{desc}</span>}
                      </div>
                    </div>
                  );
                })}

                {onboardingStep === 2 && [
                  "Barricade Planner: Click anywhere on the map grid to deploy instant traffic barricades.",
                  "Webster Signal Override: Override signals at Hebbal, Silk Board, or Chinnaswamy Stadium directly from the map.",
                  "Route Reroutes & Diversions: Activate alternative pathways ahead of time to inoculate corridors from gridlocks."
                ].map((highlight, idx) => {
                  const [title, desc] = highlight.split(':');
                  return (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-200">{title}</span>
                        {desc && <span className="text-slate-400">{desc}</span>}
                      </div>
                    </div>
                  );
                })}

                {onboardingStep === 3 && [
                  "Weather-Traffic Fusion: Naive Bayes predictor for rainfall risk at specific localities.",
                  "Commuter Impact Score: ML Decision Tree scoring congestion (0-100) based on vehicle size & peak hours.",
                  "Dynamic SLA / TTR Predictor: Survival analysis forecasting exact hours to resolve incidents based on historic trends."
                ].map((highlight, idx) => {
                  const [title, desc] = highlight.split(':');
                  return (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-200">{title}</span>
                        {desc && <span className="text-slate-400">{desc}</span>}
                      </div>
                    </div>
                  );
                })}

                {onboardingStep === 4 && [
                  "AI Traffic Co-Pilot: Ask questions in natural language. Try clicking prompt suggestion chips (e.g. 'Monsoon Plan').",
                  "WhatsApp Bot Simulator: Mimics a field officer's chat. Test NLP command chips like 'Accident Silk Board' or send photos to observe AI collision analysis."
                ].map((highlight, idx) => {
                  const [title, desc] = highlight.split(':');
                  return (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-200">{title}</span>
                        {desc && <span className="text-slate-400">{desc}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between border-t border-slate-900/60 pt-5 mt-4">
              <button
                onClick={() => onboardingStep > 0 && setOnboardingStep(onboardingStep - 1)}
                disabled={onboardingStep === 0}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider transition ${
                  onboardingStep === 0
                    ? 'text-slate-600 cursor-not-allowed opacity-40'
                    : 'text-slate-400 hover:text-slate-205 hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {/* Dots */}
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setOnboardingStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      onboardingStep === idx ? 'bg-sky-500 w-4' : 'bg-slate-850 border border-slate-800'
                    }`}
                  />
                ))}
              </div>

              {onboardingStep < 4 ? (
                <button
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center space-x-1 px-4 py-1.5 rounded font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('astram_tour_completed', 'true');
                    setShowOnboarding(false);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1 px-5 py-1.5 rounded font-black text-[10px] uppercase tracking-wider transition cursor-pointer animate-pulse-glow"
                >
                  <span>Get Started</span>
                  <CheckCircle className="w-3.5 h-3.5 text-slate-950" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
