import React, { useState } from 'react';
import { BarricadePoint } from '../data/mockDatabase';
import { Shield, Settings, Users, AlertTriangle, CheckCircle, Navigation, Radio, ParkingSquare, Train, Eye, ArrowRight } from 'lucide-react';
import { evaluateSignalTimings, generateRouteVaccinationTimeline } from '../data/signalsMlEvaluator';

interface OrchestrationPanelsProps {
  barricadePoints: BarricadePoint[];
  onDeployBarricade: (id: string) => void;
  emergencyCorridorActive: boolean;
  onToggleEmergencyCorridor: () => void;
  weather: string;
  onTriggerAnomalyTicket: (title: string, desc: string, location: string, lat: number, lon: number, type: string) => void;
  replayTime?: number;
  activeIncidents?: any[];
}

export const OrchestrationPanels: React.FC<OrchestrationPanelsProps> = ({
  barricadePoints,
  onDeployBarricade,
  emergencyCorridorActive,
  onToggleEmergencyCorridor,
  weather,
  onTriggerAnomalyTicket,
  replayTime = 1020, // default 17:00 in minutes
  activeIncidents = [],
}) => {
  const [activeTab, setActiveTab] = useState<'tactical' | 'signals' | 'agencies' | 'anomalies'>('tactical');
  const [vipLevel, setVipLevel] = useState<'Z+' | 'Z' | 'Y'>('Z');
  const [anomalyLogged, setAnomalyLogged] = useState(false);
  const [appliedWebsterJunctions, setAppliedWebsterJunctions] = useState<Record<string, boolean>>({});

  const hour = Math.floor(replayTime / 60) % 24;
  const signalRecommendations = evaluateSignalTimings(hour, weather, activeIncidents);
  const vaccinationTimeline = generateRouteVaccinationTimeline(activeIncidents, weather);

  // Track timeline check box clicks locally
  const [timelineChecked, setTimelineChecked] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
    3: false,
  });

  // Re-initialize checkboxes whenever timeline changes dynamically
  React.useEffect(() => {
    setTimelineChecked({
      0: true,
      1: true,
      2: false,
      3: false,
    });
  }, [weather, activeIncidents.filter(i => i.status === 'active').length]);

  const handleApplyRecalibration = (junctionName: string) => {
    setAppliedWebsterJunctions((prev) => ({
      ...prev,
      [junctionName]: true
    }));
    // Toggle green wave system override on the map/telemetries
    onToggleEmergencyCorridor();
    alert(`AI Adaptive Recalibration Applied at ${junctionName}.\nWebster parameters loaded. Cycle timing adjusted.`);
  };

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[380px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            ASTRAM Orchestration Suite
          </h2>
          <p className="text-[10px] text-slate-400">Tactical execution, signal timing, and agency command bridges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 p-0.5 rounded border border-slate-800/80 mb-3.5">
        {['tactical', 'signals', 'agencies', 'anomalies'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase transition cursor-pointer ${
              activeTab === tab ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'tactical'
              ? 'Tactical Dev'
              : tab === 'signals'
              ? 'Signals & VIP'
              : tab === 'agencies'
              ? 'Agencies & P'
              : 'Radar'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 max-h-[220px] overflow-y-auto pr-1">
        {activeTab === 'tactical' && (
          <div className="space-y-3.5">
            {/* Barricade Planner */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                <span>Barricade Planner</span>
                <button
                  onClick={() => alert('Orders printed and assigned to officer devices via ASTRAM Mobile.')}
                  className="text-[8.5px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  Print Orders
                </button>
              </div>

              <div className="space-y-1.5">
                {barricadePoints.map((bp) => (
                  <div
                    key={bp.id}
                    className="bg-slate-950/40 border border-slate-900 rounded p-2 flex items-center justify-between text-[10px]"
                  >
                    <div>
                      <p className="font-bold text-slate-200">{bp.road_name}</p>
                      <p className="text-slate-500 mt-0.5">
                        Type: <span className="text-slate-350">{bp.type}</span> | Officers:{' '}
                        <span className="text-slate-350">{bp.officers_assigned}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => onDeployBarricade(bp.id)}
                      className={`px-2 py-1 rounded font-extrabold text-[8.5px] uppercase tracking-wider transition cursor-pointer ${
                        bp.status === 'deployed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {bp.status === 'deployed' ? 'Deployed' : 'Deploy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Vaccination */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                Route Vaccination Timeline
              </p>
              <div className="space-y-2">
                {vaccinationTimeline.map((vs, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-[9.5px]">
                    <input
                      type="checkbox"
                      checked={timelineChecked[idx] !== undefined ? timelineChecked[idx] : vs.done}
                      onChange={(e) => setTimelineChecked(prev => ({ ...prev, [idx]: e.target.checked }))}
                      className="mt-0.5 w-3 h-3 rounded bg-slate-900 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className={`font-black uppercase flex-shrink-0 w-11 ${(timelineChecked[idx] ?? vs.done) ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {vs.day}:
                    </span>
                    <span className={(timelineChecked[idx] ?? vs.done) ? 'text-slate-400 line-through decoration-slate-650' : 'text-slate-200 font-medium'}>
                      {vs.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="space-y-3.5">
            {/* Webster Signal Optimization */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                Webster Adaptive Signal Tuning
              </p>
              <div className="space-y-2.5">
                {signalRecommendations.map((rec, idx) => {
                  const isApplied = appliedWebsterJunctions[rec.junctionName] || (rec.junctionName === 'Queens Statue Circle' && emergencyCorridorActive);
                  
                  return (
                    <div key={idx} className="bg-slate-950/40 border border-slate-900 p-2.5 rounded-lg text-[9.5px] flex items-center justify-between">
                      <div className="flex-1 pr-3.5">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-slate-200">{rec.junctionName}</span>
                          {isApplied ? (
                            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] flex items-center">
                              <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Recalibrated
                            </span>
                          ) : (
                            <span className="text-sky-400 font-medium text-[8px] uppercase">Webster Recommendation Available</span>
                          )}
                        </div>
                        <div className="flex flex-col space-y-0.5 text-slate-400">
                          <div className="flex justify-between">
                            <span>Base: <span className="font-mono text-slate-300">{rec.currentCycle}s</span></span>
                            <span>Optimal: <span className="font-mono text-slate-200 font-bold">{rec.optimalCycle}s</span></span>
                          </div>
                          <div className="flex justify-between">
                            <span>Split: <span className="font-mono text-slate-350">{rec.mainSplitSec}s (Main) / {rec.crossSplitSec}s (Cross)</span></span>
                            <span className="text-emerald-400 font-extrabold">+{rec.flowEfficiencyGain}% Flow</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyRecalibration(rec.junctionName)}
                        disabled={isApplied}
                        className={`px-2 py-1.5 rounded font-black text-[8.5px] uppercase tracking-wider transition cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-950/20 text-emerald-400/80 border border-emerald-950 cursor-not-allowed'
                            : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold'
                        }`}
                      >
                        {isApplied ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VIP route selector */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                VIP Movement Protocol
              </p>
              <div className="bg-slate-950/40 border border-slate-900 p-2.5 rounded-lg flex flex-col space-y-2.5 text-[9.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Security Level:</span>
                  <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                    {(['Z+', 'Z', 'Y'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setVipLevel(level)}
                        className={`px-2 py-0.5 rounded font-black text-[9px] cursor-pointer ${
                          vipLevel === level ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Routing: <span className="font-bold text-slate-200">HQ → Chinnaswamy</span></span>
                  <span>Impact: <span className={`font-bold ${vipLevel === 'Z+' ? 'text-red-400' : 'text-yellow-400'}`}>{vipLevel === 'Z+' ? 'High (Rolling Blocks)' : 'Moderate (Signal priority)'}</span></span>
                </div>
              </div>
            </div>

            {/* Emergency Corridor Toggle */}
            <button
              onClick={onToggleEmergencyCorridor}
              className={`w-full flex items-center justify-center space-x-1.5 py-2.5 rounded font-black text-xs border transition cursor-pointer ${
                emergencyCorridorActive
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{emergencyCorridorActive ? 'EMERGENCY CORRIDOR ACTIVE (GREEN WAVE)' : 'ACTIVATE EMERGENCY CORRIDOR'}</span>
            </button>
          </div>
        )}

        {activeTab === 'agencies' && (
          <div className="space-y-4">
            {/* Inter Agency Command Bridge */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                Inter-Agency Command Bridge
              </p>
              <div className="space-y-1.5">
                <div className="bg-slate-950/40 border border-slate-900 rounded p-2 flex items-center justify-between text-[9.5px]">
                  <div>
                    <p className="font-bold text-slate-200">🌳 Tree Removal - Sankey Road</p>
                    <p className="text-slate-500 mt-0.5">Agency: BBMP Horticulture department</p>
                  </div>
                  <span className="bg-yellow-950/40 text-yellow-400 border border-yellow-900/60 px-1.5 py-0.5 rounded font-bold uppercase">
                    En Route (35m)
                  </span>
                </div>

                <div className="bg-slate-950/40 border border-slate-900 rounded p-2 flex items-center justify-between text-[9.5px]">
                  <div>
                    <p className="font-bold text-slate-200">🌊 Pump Deployment - ORR East 2</p>
                    <p className="text-slate-500 mt-0.5">Agency: BBMP Storm Water Drain (SWD)</p>
                  </div>
                  <span className="bg-red-950/40 text-red-400 border border-red-900/60 px-1.5 py-0.5 rounded font-bold uppercase">
                    No Resp (72h)
                  </span>
                </div>
              </div>
            </div>

            {/* Parking pressure monitors */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                Predictive Parking Occupancy
              </p>
              <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                <div className="bg-slate-950/40 border border-slate-900 p-2 rounded flex justify-between">
                  <span className="text-slate-400">Chinnaswamy Lot:</span>
                  <span className="text-red-400 font-bold">98% (FULL)</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-900 p-2 rounded flex justify-between">
                  <span className="text-slate-400">UB City Basement:</span>
                  <span className="text-red-400 font-bold">95% (FULL)</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-900 p-2 rounded flex justify-between">
                  <span className="text-slate-400">Cubbon Park Lot:</span>
                  <span className="text-yellow-400 font-bold">67% (MOD)</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-900 p-2 rounded flex justify-between">
                  <span className="text-slate-400">Infantry Road Lot:</span>
                  <span className="text-emerald-400 font-bold">23% (FREE)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-3">
            {/* Anomaly Alerts Feed */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center"><Radio className="w-3.5 h-3.5 mr-1 text-sky-400 animate-pulse" /> Live Anomaly Radar</span>
              <span className="text-slate-500">1 Unresolved Alert</span>
            </div>

            <div className="bg-slate-950/40 border border-red-950 rounded-lg p-3 text-[10px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1 text-red-400 font-bold">
                  <span className="flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> SPEED DROP ALERT</span>
                  <span>Hosur Road (Near Forum)</span>
                </div>
                <p className="text-slate-300 mt-1">
                  Average speed dropped by <span className="font-extrabold text-red-400">86%</span> (4 km/h vs 28 km/h expected). Duration: 23 min.
                </p>
                <p className="text-slate-450 mt-1 italic">
                  Inferred Cause: Accident / stalled vehicle (45% confidence)
                </p>
              </div>

              <div className="mt-3 flex justify-end space-x-2">
                <button
                  onClick={() => alert('CCTV Stream #47 active. View port loaded in overlay.')}
                  className="bg-slate-900 border border-slate-800 text-slate-350 hover:text-slate-200 px-2.5 py-1 rounded font-bold uppercase text-[8.5px] flex items-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3 mr-0.5" />
                  <span>CCTV</span>
                </button>

                {anomalyLogged ? (
                  <span className="text-emerald-400 font-bold uppercase text-[9px] flex items-center px-2">
                    <CheckCircle className="w-3 h-3 mr-1" /> Logged
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onTriggerAnomalyTicket(
                        'Anomaly Alert: Speed Drop at Hosur Road',
                        'Automated sensor alert: speeds dropped to 4 km/h near Forum Mall. CCTV indicates stalled truck.',
                        'Hosur Road near Forum Mall',
                        12.9348,
                        77.6189,
                        'vehicle_breakdown'
                      );
                      setAnomalyLogged(true);
                    }}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-2.5 py-1 rounded font-extrabold uppercase text-[8.5px] cursor-pointer"
                  >
                    Log Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
