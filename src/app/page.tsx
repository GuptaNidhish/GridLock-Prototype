'use client';

import React, { useState, useEffect } from 'react';
import { CisDial } from '../components/CisDial';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { ChronoReplay } from '../components/ChronoReplay';
import { WeatherFusion } from '../components/WeatherFusion';
import { useAppState } from '../context/AppContext';
import {
  Compass,
  LayoutGrid,
  Shield,
  Activity,
  Cpu,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export default function OperationsMapPage() {
  const {
    weather,
    setWeather,
    replayTime,
    setReplayTime,
    alternativePlanActive,
    setAlternativePlanActive,
    pumpTeamsDeployed,
    setPumpTeamsDeployed,
    emergencyCorridorActive,
    incidents,
    barricadePoints,
    engine,
    currentCis,
    selectedIncidentId,
    setSelectedIncidentId,
    handleMapCoordinatesClick,
    handleToggleJunctionSignal,
    handleToggleCorridorStatus,
    handleTriggerFlood,
  } = useAppState();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Auto-trigger onboarding tour if not completed
  useEffect(() => {
    const tourCompleted = localStorage.getItem('astram_tour_completed');
    if (!tourCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="flex flex-col space-y-6 select-none h-full">
      
      {/* Page Title & Status Header */}
      <div className="flex justify-between items-center bg-slate-950/80 border border-slate-900/60 p-4 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <Compass className="w-4 h-4 mr-1 text-sky-400" />
              <span>operations control room & digital twin map</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">
              Live spatial telemetry & green-wave junction routing
            </p>
          </div>
        </div>
        
        {/* Onboarding Tour Button */}
        <button
          onClick={() => {
            setOnboardingStep(0);
            setShowOnboarding(true);
          }}
          className="bg-sky-950 hover:bg-sky-900 border border-sky-850 text-sky-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Control Room Tour</span>
        </button>
      </div>

      {/* Row 1: CIS Score Dial + Chrono Replay Control */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <CisDial score={currentCis} />
        </div>
        <div className="md:col-span-2">
          <ChronoReplay
            replayTime={replayTime}
            onChangeReplayTime={setReplayTime}
            alternativePlanActive={alternativePlanActive}
            onChangeAlternativePlan={setAlternativePlanActive}
          />
        </div>
      </div>

      {/* Row 2: Digital Twin Map + Weather Simulation Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        {/* Map Panel */}
        <div className="xl:col-span-2 flex flex-col h-full bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl relative min-h-[500px]">
          <DigitalTwinMap
            weather={weather}
            barricadePoints={barricadePoints}
            emergencyCorridorActive={emergencyCorridorActive}
            activeIncidents={incidents}
            corridorSpeeds={engine.corridorSpeeds}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => setSelectedIncidentId(id)}
            onMapCoordinatesClick={handleMapCoordinatesClick}
            onToggleJunctionSignal={handleToggleJunctionSignal}
            onToggleCorridorStatus={handleToggleCorridorStatus}
          />
        </div>

        {/* Weather Controls */}
        <div className="xl:col-span-1 flex flex-col h-full bg-[#090d1a] border border-slate-900 rounded-xl p-5 shadow-2xl justify-between">
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
      </div>

      {/* Onboarding Tour Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-xl p-8 flex flex-col justify-between relative overflow-hidden border border-sky-500/20 shadow-sky-500/5 shadow-2xl">
            
            {/* Close Button */}
            <button
              onClick={() => {
                localStorage.setItem('astram_tour_completed', 'true');
                setShowOnboarding(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-905 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
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
                    : 'text-slate-400 hover:text-slate-250 hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setOnboardingStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      onboardingStep === idx ? 'bg-sky-500 w-4' : 'bg-slate-850 border border-slate-850'
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
