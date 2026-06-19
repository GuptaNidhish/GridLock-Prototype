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
import {
  initialIncidents,
  initialOfficers,
  initialBarricadePoints,
  Incident,
  BarricadePoint,
} from '../data/mockDatabase';
import { Shield, Sparkles, AlertCircle, Cpu, Eye, EyeOff, Save, RefreshCw, LayoutGrid } from 'lucide-react';

export default function Home() {
  const [weather, setWeather] = useState<'clear' | 'light_rain' | 'heavy_rain'>('clear');
  const [replayTime, setReplayTime] = useState<number>(1020); // 17:00 PM (Peak Entry)
  const [alternativePlanActive, setAlternativePlanActive] = useState<boolean>(false);
  const [pumpTeamsDeployed, setPumpTeamsDeployed] = useState<boolean>(false);
  const [emergencyCorridorActive, setEmergencyCorridorActive] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('FKID000012'); // default active underpass
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [barricadePoints, setBarricadePoints] = useState<BarricadePoint[]>(initialBarricadePoints);

  // Workspace Layout Customizations & Persistence
  const [layoutPreset, setLayoutPreset] = useState<'standard' | 'focus' | 'compact'>('standard');
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    cis: true,
    replay: true,
    map: true,
    weather: true,
    tracker: true,
    copilot: true,
    orchestration: true,
    pulse: true,
    whatsapp: true,
    manpower: true,
    analytics: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  // Load layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('astram_layout_config');
    const savedPreset = localStorage.getItem('astram_layout_preset');
    if (savedLayout) {
      try {
        setVisibleWidgets(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to parse layout config', e);
      }
    }
    if (savedPreset) {
      setLayoutPreset(savedPreset as any);
    }
  }, []);

  const saveWorkspaceConfig = () => {
    localStorage.setItem('astram_layout_config', JSON.stringify(visibleWidgets));
    localStorage.setItem('astram_layout_preset', layoutPreset);
    alert('Workspace layout configuration saved successfully to local browser storage.');
  };

  const refitWorkspace = () => {
    setLayoutPreset('standard');
    setVisibleWidgets({
      cis: true,
      replay: true,
      map: true,
      weather: true,
      tracker: true,
      copilot: true,
      orchestration: true,
      pulse: true,
      whatsapp: true,
      manpower: true,
      analytics: true,
    });
    localStorage.removeItem('astram_layout_config');
    localStorage.removeItem('astram_layout_preset');
    alert('Workspace refitted to default standard grid aspect ratio.');
  };

  // Compute dynamic Commuter Impact Score (CIS)
  const calculateCis = () => {
    let score = 12; // Base flow

    if (weather === 'light_rain') score += 16;
    if (weather === 'heavy_rain') score += 42;

    const activeList = incidents.filter((i) => i.status === 'active');
    score += activeList.length * 10;

    const hasBreach = activeList.some((i) => {
      const createdDate = new Date(i.created_at);
      const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 1;
    });
    if (hasBreach) score += 12;

    if (alternativePlanActive) score -= 18;
    if (emergencyCorridorActive) score += 5;

    const hour = replayTime / 60;
    if (hour >= 17 && hour <= 20) {
      score += 15;
    }

    return Math.max(10, Math.min(100, score));
  };

  const currentCis = calculateCis();

  // Handlers
  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
  };

  const handleUpdateIncidentStatus = (
    id: string,
    newStatus: 'active' | 'resolved' | 'closed',
    extraFields?: Partial<Incident>
  ) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus, ...extraFields } : inc))
    );
  };

  const handleAddIncident = (
    type: string,
    location: string,
    lat: number,
    lon: number,
    desc: string,
    event_type: 'planned' | 'unplanned' = 'unplanned'
  ) => {
    const newInc: Incident = {
      id: `FKID${(incidents.length + 1000).toString().substring(1)}`,
      event_type,
      incident_type: type as any,
      start_lat: lat,
      start_lon: lon,
      end_lat: lat,
      end_lon: lon,
      start_address: `${location}, Bengaluru`,
      description: desc,
      corridor: location.toLowerCase().includes('tumkur')
        ? 'Tumkur Road'
        : location.toLowerCase().includes('orr')
        ? 'ORR East 2'
        : 'Non-corridor',
      priority: 'High',
      status: 'active',
      is_verified: true,
      is_diversion: false,
      locality: location.split(' ')[0],
      division: 'Bengaluru Central Corporation',
      zone: 'Central Zone 2',
      junction: location.replace(/\s+/g, ''),
      kg_id: `FKKG000${incidents.length}`,
      created_at: new Date().toISOString(),
      reported_by: 'FKUSR00011',
      created_by: 'FKUSR00001',
      commuter_impact_score: 45,
      duration_sla_hours: 4,
    };

    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncidentId(newInc.id);
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
    alert(`Barricade deployed at coordinates: (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
  };

  // Map clicks override junction signals
  const handleToggleJunctionSignal = (juncId: string) => {
    setEmergencyCorridorActive(!emergencyCorridorActive);
    alert(`Webster Override triggered at junction: ${juncId.toUpperCase()}. Green Wave cycle calibrated.`);
  };

  // Map clicks toggles corridor diversions
  const handleToggleCorridorStatus = (corridorId: string) => {
    setAlternativePlanActive(!alternativePlanActive);
    alert(`Corridor Diversion toggled for: ${corridorId.toUpperCase()}`);
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
      alert('AI Execution: Cycle green phases calibrated. CBD 2 corridor cleared.');
    } else if (actionType === 'escalate_wilson') {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === 'FKID000002' ? { ...inc, escalated_to: 'ACP Traffic' } : inc
        )
      );
      setSelectedIncidentId('FKID000002');
      alert('AI Execution: Chronic ticket FKID000002 escalated to ACP Traffic.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans">
      {/* Top Main Command Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 sticky top-0 z-50">
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
            Bengaluru City Police • Event-Driven Congestion Intelligence System
          </p>
        </div>

        {/* Live Counters and Layout settings button */}
        <div className="flex flex-wrap items-center gap-4 text-[10px]">
          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-slate-500 font-bold uppercase">Active Alerts</p>
              <p className="text-slate-200 font-black font-mono">
                {incidents.filter((i) => i.status === 'active').length} Incidents
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <p className="text-slate-500 font-bold uppercase">Mitigation Status</p>
              <p className="text-emerald-400 font-black uppercase">
                {alternativePlanActive ? 'ASTRAM Rerouting Active' : 'Normal Operations'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-sky-400 px-3 py-2 rounded font-extrabold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Refit Workspace</span>
          </button>
        </div>
      </header>

      {/* Grid Settings Config Panel */}
      {showSettings && (
        <div className="bg-[#0b0f1a] border-b border-sky-950/60 p-5 animate-fade-in text-[10px]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <p className="font-extrabold text-sky-400 uppercase tracking-widest mb-1">Workspace Layout Settings</p>
              <p className="text-slate-400">Toggle panel visibility and refit screen configurations.</p>
            </div>

            {/* Presets and Actions */}
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-slate-950/80 rounded border border-slate-800 p-0.5">
                {(['standard', 'focus', 'compact'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setLayoutPreset(preset);
                      if (preset === 'compact') {
                        setVisibleWidgets({
                          cis: false,
                          replay: true,
                          map: true,
                          weather: false,
                          tracker: true,
                          copilot: true,
                          orchestration: false,
                          pulse: false,
                          whatsapp: true,
                          manpower: false,
                          analytics: false,
                        });
                      } else if (preset === 'focus') {
                        setVisibleWidgets({
                          cis: true,
                          replay: true,
                          map: true,
                          weather: true,
                          tracker: true,
                          copilot: true,
                          orchestration: true,
                          pulse: false,
                          whatsapp: false,
                          manpower: false,
                          analytics: true,
                        });
                      } else {
                        setVisibleWidgets({
                          cis: true,
                          replay: true,
                          map: true,
                          weather: true,
                          tracker: true,
                          copilot: true,
                          orchestration: true,
                          pulse: true,
                          whatsapp: true,
                          manpower: true,
                          analytics: true,
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded font-black uppercase text-[9px] cursor-pointer transition ${
                      layoutPreset === preset ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset} view
                  </button>
                ))}
              </div>

              <button
                onClick={saveWorkspaceConfig}
                className="bg-sky-500 hover:bg-sky-450 text-slate-950 px-3.5 py-1.5 rounded font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Layout</span>
              </button>

              <button
                onClick={refitWorkspace}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 px-3.5 py-1.5 rounded font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Grid</span>
              </button>
            </div>
          </div>

          {/* Visibility Checkboxes */}
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 border-t border-slate-900/60 pt-4">
            {Object.keys(visibleWidgets).map((widgetKey) => (
              <label
                key={widgetKey}
                className="flex items-center space-x-2 bg-slate-950/40 border border-slate-900 rounded p-2 cursor-pointer hover:border-slate-800 transition"
              >
                <input
                  type="checkbox"
                  checked={visibleWidgets[widgetKey]}
                  onChange={() =>
                    setVisibleWidgets((prev) => ({ ...prev, [widgetKey]: !prev[widgetKey] }))
                  }
                  className="rounded text-sky-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer"
                />
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[8.5px]">
                  {widgetKey === 'cis' ? 'CIS Gauge' : widgetKey === 'replay' ? 'What-If Replay' : widgetKey === 'copilot' ? 'AI Co-Pilot' : widgetKey}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Layout Grid */}
      <main className="flex-1 p-6 flex flex-col space-y-6">
        {/* Row 1: CIS Indicator + Chrono Replay */}
        {(visibleWidgets.cis || visibleWidgets.replay) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleWidgets.cis && (
              <div className="md:col-span-1">
                <CisDial score={currentCis} />
              </div>
            )}
            {visibleWidgets.replay && (
              <div className={visibleWidgets.cis ? 'md:col-span-2' : 'md:col-span-3'}>
                <ChronoReplay
                  replayTime={replayTime}
                  onChangeReplayTime={setReplayTime}
                  alternativePlanActive={alternativePlanActive}
                  onChangeAlternativePlan={setAlternativePlanActive}
                />
              </div>
            )}
          </div>
        )}

        {/* Row 2: Digital Twin Map vs AI Copilot/Tracker */}
        <div className={`grid grid-cols-1 ${layoutPreset === 'focus' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-6`}>
          {/* Digital Twin Map Column */}
          {visibleWidgets.map && (
            <div className={`${layoutPreset === 'focus' ? 'xl:col-span-3' : 'xl:col-span-2'} flex flex-col h-[520px]`}>
              <DigitalTwinMap
                weather={weather}
                barricadePoints={barricadePoints}
                emergencyCorridorActive={emergencyCorridorActive}
                activeIncidents={incidents}
                onSelectIncident={handleSelectIncident}
                onMapCoordinatesClick={handleMapCoordinatesClick}
                onToggleJunctionSignal={handleToggleJunctionSignal}
                onToggleCorridorStatus={handleToggleCorridorStatus}
              />
            </div>
          )}

          {/* AI Copilot / Weather Fusion Column */}
          <div className="flex flex-col space-y-6 h-[520px]">
            {visibleWidgets.copilot && (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <AiCopilot
                  weather={weather}
                  activeIncidentsCount={incidents.filter((i) => i.status === 'active').length}
                  alternativePlanActive={alternativePlanActive}
                  emergencyCorridorActive={emergencyCorridorActive}
                  onExecuteAction={handleExecuteAiAction}
                />
              </div>
            )}

            {visibleWidgets.weather && !visibleWidgets.copilot && (
              <WeatherFusion
                weather={weather}
                onChangeWeather={setWeather}
                pumpTeamsDeployed={pumpTeamsDeployed}
                onTogglePumpTeams={() => setPumpTeamsDeployed(!pumpTeamsDeployed)}
                onTriggerFloodIncident={handleTriggerFlood}
              />
            )}
          </div>
        </div>

        {/* Row 3: SLA Tracker, Weather Fusion & Orchestration Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {visibleWidgets.tracker && (
            <IncidentTracker
              selectedIncident={incidents.find((i) => i.id === selectedIncidentId) || null}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              officers={initialOfficers}
            />
          )}

          {visibleWidgets.orchestration && (
            <OrchestrationPanels
              barricadePoints={barricadePoints}
              onDeployBarricade={handleDeployBarricade}
              emergencyCorridorActive={emergencyCorridorActive}
              onToggleEmergencyCorridor={() => setEmergencyCorridorActive(!emergencyCorridorActive)}
              weather={weather}
              onTriggerAnomalyTicket={(title, desc, location, lat, lon, type) =>
                handleAddIncident(type, location, lat, lon, desc)
              }
            />
          )}

          {visibleWidgets.weather && visibleWidgets.copilot && (
            <WeatherFusion
              weather={weather}
              onChangeWeather={setWeather}
              pumpTeamsDeployed={pumpTeamsDeployed}
              onTogglePumpTeams={() => setPumpTeamsDeployed(!pumpTeamsDeployed)}
              onTriggerFloodIncident={handleTriggerFlood}
            />
          )}
        </div>

        {/* Row 4: Citizen Pulse & WhatsApp Bot Simulators */}
        {(visibleWidgets.pulse || visibleWidgets.whatsapp) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleWidgets.pulse && (
              <CitizenPulse
                onAddIncidentFromPulse={(title, desc, location, lat, lon, type) =>
                  handleAddIncident(type, location, lat, lon, desc)
                }
                activeIncidents={incidents}
              />
            )}
            {visibleWidgets.whatsapp && (
              <WhatsAppBot
                onAddIncidentFromBot={(type, location, lat, lon, desc) =>
                  handleAddIncident(type, location, lat, lon, desc)
                }
                onActivateDiversion={(corridor) => {
                  setAlternativePlanActive(true);
                  alert(`WhatsApp command: Route vaccination activated for ${corridor}`);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Area: Resource scheduling & Performance dashboard */}
      {(visibleWidgets.manpower || visibleWidgets.analytics) && (
        <footer className="bg-slate-950/60 border-t border-slate-900 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleWidgets.manpower && <ManpowerLeaderboard officers={initialOfficers} />}
          {visibleWidgets.analytics && <PerformanceDashboard />}
        </footer>
      )}
    </div>
  );
}
