'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRealtimeEngine, RealtimeEngineState } from '../hooks/useRealtimeEngine';
import { useToast } from '../components/ToastProvider';
import {
  initialIncidents,
  initialOfficers,
  initialBarricadePoints,
  Incident,
  BarricadePoint,
} from '../data/mockDatabase';
import { evaluateIncidentCis } from '../data/cisMlEvaluator';
import { evaluateIncidentTtr } from '../data/ttrMlEvaluator';

export type SidebarType = 'copilot' | 'whatsapp' | null;

interface AppContextType {
  weather: 'clear' | 'light_rain' | 'heavy_rain';
  setWeather: React.Dispatch<React.SetStateAction<'clear' | 'light_rain' | 'heavy_rain'>>;
  replayTime: number;
  setReplayTime: React.Dispatch<React.SetStateAction<number>>;
  alternativePlanActive: boolean;
  setAlternativePlanActive: React.Dispatch<React.SetStateAction<boolean>>;
  pumpTeamsDeployed: boolean;
  setPumpTeamsDeployed: React.Dispatch<React.SetStateAction<boolean>>;
  emergencyCorridorActive: boolean;
  setEmergencyCorridorActive: React.Dispatch<React.SetStateAction<boolean>>;
  selectedIncidentId: string | null;
  setSelectedIncidentId: React.Dispatch<React.SetStateAction<string | null>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  barricadePoints: BarricadePoint[];
  setBarricadePoints: React.Dispatch<React.SetStateAction<BarricadePoint[]>>;
  mlCongestionMultiplier: string;
  setMlCongestionMultiplier: React.Dispatch<React.SetStateAction<string>>;
  
  // Realtime engine
  engine: RealtimeEngineState;
  currentCis: number;
  activeSidebar: SidebarType;
  setActiveSidebar: React.Dispatch<React.SetStateAction<SidebarType>>;
  showLiveFeed: boolean;
  setShowLiveFeed: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions/handlers
  handleAddIncident: (type: string, location: string, lat: number, lon: number, desc: string, event_type?: 'planned' | 'unplanned') => Promise<void>;
  handleUpdateIncidentStatus: (id: string, newStatus: 'active' | 'resolved' | 'closed', extraFields?: Partial<Incident>) => Promise<void>;
  handleDeployBarricade: (id: string) => void;
  handleMapCoordinatesClick: (lat: number, lon: number) => void;
  handleToggleJunctionSignal: (juncId: string) => void;
  handleToggleCorridorStatus: (corridorId: string) => void;
  handleTriggerFlood: () => void;
  handleExecuteAiAction: (actionType: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  
  // Sidebar state
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  // Live feed overlay
  const [showLiveFeed, setShowLiveFeed] = useState<boolean>(false);

  // ── Real-Time Engine ──────────────────────────────────────────
  const engine = useRealtimeEngine(
    incidents, setIncidents, weather, setWeather, setSelectedIncidentId,
  );

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

  // Compute dynamic Commuter Impact Score (CIS) using ML Decision Tree Regressor
  const calculateCis = useCallback(() => {
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
  }, [incidents, replayTime, mlCongestionMultiplier, alternativePlanActive, emergencyCorridorActive]);

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
        showToast(`Incident ${id} updated to ${newStatus.toUpperCase()}`, 'success');
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
        showToast(`New ${type.replace('_', ' ')} incident reported at ${location}`, 'critical');
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
    showToast(`Barricade ${id} deployment toggled`, 'action');
  };

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

  const handleToggleJunctionSignal = (juncId: string) => {
    setEmergencyCorridorActive(prev => !prev);
    showToast(`Webster Override triggered at junction: ${juncId.toUpperCase()}. Green Wave cycle calibrated.`, 'action');
  };

  const handleToggleCorridorStatus = (corridorId: string) => {
    setAlternativePlanActive(prev => !prev);
    showToast(`Corridor Diversion toggled for: ${corridorId.toUpperCase()}`, 'action');
  };

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

  const currentCis = calculateCis();

  return (
    <AppContext.Provider
      value={{
        weather,
        setWeather,
        replayTime,
        setReplayTime,
        alternativePlanActive,
        setAlternativePlanActive,
        pumpTeamsDeployed,
        setPumpTeamsDeployed,
        emergencyCorridorActive,
        setEmergencyCorridorActive,
        selectedIncidentId,
        setSelectedIncidentId,
        incidents,
        setIncidents,
        barricadePoints,
        setBarricadePoints,
        mlCongestionMultiplier,
        setMlCongestionMultiplier,
        engine,
        currentCis,
        activeSidebar,
        setActiveSidebar,
        showLiveFeed,
        setShowLiveFeed,
        handleAddIncident,
        handleUpdateIncidentStatus,
        handleDeployBarricade,
        handleMapCoordinatesClick,
        handleToggleJunctionSignal,
        handleToggleCorridorStatus,
        handleTriggerFlood,
        handleExecuteAiAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
