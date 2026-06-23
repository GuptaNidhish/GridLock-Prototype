import { useState, useEffect, useRef, useCallback } from 'react';
import { Incident } from '../data/mockDatabase';

export interface FeedEntry {
  id: string;
  timestamp: string;
  icon: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface CorridorSpeed {
  id: string;
  name: string;
  speed: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SignalPhase {
  junctionId: string;
  junctionName: string;
  phase: 'green' | 'amber' | 'red';
  remaining: number;
  cycleDuration: number;
  greenDuration: number;
  amberDuration: number;
  redDuration: number;
}

export interface RealtimeEngineState {
  clock: string;
  uptime: number;
  simulationActive: boolean;
  toggleSimulation: () => void;
  feedEntries: FeedEntry[];
  corridorSpeeds: CorridorSpeed[];
  signalPhases: SignalPhase[];
}

export function useRealtimeEngine(
  incidents: Incident[],
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>,
  weather: string,
  setWeather: React.Dispatch<React.SetStateAction<'clear' | 'light_rain' | 'heavy_rain'>>,
  setSelectedIncidentId: React.Dispatch<React.SetStateAction<string | null>>,
): RealtimeEngineState {
  const [clock, setClock] = useState('00:00:00');
  const [uptime, setUptime] = useState(0);
  const [simulationActive, setSimulationActive] = useState(true);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const [corridorSpeeds, setCorridorSpeeds] = useState<CorridorSpeed[]>([
    { id: 'tumkur', name: 'Tumkur Road', speed: 35, trend: 'stable' },
    { id: 'bellary', name: 'Bellary Road', speed: 28, trend: 'stable' },
    { id: 'orr_east_1', name: 'ORR East 1', speed: 42, trend: 'stable' },
    { id: 'orr_east_2', name: 'ORR East 2', speed: 15, trend: 'down' },
    { id: 'hosur', name: 'Hosur Road', speed: 22, trend: 'stable' },
    { id: 'cbd_2', name: 'CBD 2', speed: 12, trend: 'down' },
  ]);

  const [signalPhases, setSignalPhases] = useState<SignalPhase[]>([
    { junctionId: 'hebbal', junctionName: 'Hebbal Flyover', phase: 'green', remaining: 45, cycleDuration: 120, greenDuration: 45, amberDuration: 5, redDuration: 70 },
    { junctionId: 'mekhri', junctionName: 'Mekhri Circle', phase: 'red', remaining: 30, cycleDuration: 90, greenDuration: 35, amberDuration: 5, redDuration: 50 },
    { junctionId: 'silkboard', junctionName: 'Silk Board', phase: 'green', remaining: 60, cycleDuration: 180, greenDuration: 60, amberDuration: 8, redDuration: 112 },
    { junctionId: 'stadium', junctionName: 'Chinnaswamy', phase: 'amber', remaining: 3, cycleDuration: 100, greenDuration: 40, amberDuration: 5, redDuration: 55 },
    { junctionId: 'underpass', junctionName: 'BSNL Underpass', phase: 'red', remaining: 55, cycleDuration: 110, greenDuration: 40, amberDuration: 5, redDuration: 65 },
  ]);

  // Fetch initial incidents from the backend
  const fetchIncidents = useCallback(async () => {
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:3001/api/v1/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error('Failed to fetch initial incidents:', err);
    }
  }, [setIncidents]);

  // Toggle simulation active state
  const toggleSimulation = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TOGGLE_SIMULATION' }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (!mounted) return;

      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const wsUrl = `ws://${hostname}:3001`;
      console.log('Connecting to ASTRAM WebSocket Server:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'INIT_STATE':
              setClock(message.data.clock || '00:00:00');
              setUptime(message.data.uptime || 0);
              setSimulationActive(message.data.simulationActive);
              setWeather(message.data.weather || 'clear');
              if (message.data.feedEntries && message.data.feedEntries.length > 0) {
                setFeedEntries(message.data.feedEntries);
              }
              if (message.data.corridorSpeeds) setCorridorSpeeds(message.data.corridorSpeeds);
              if (message.data.signalPhases) setSignalPhases(message.data.signalPhases);
              break;

            case 'CLOCK_TICK':
              setClock(message.data.clock);
              setUptime(message.data.uptime);
              break;

            case 'SIGNALS_TICK':
              setSignalPhases(message.data);
              break;

            case 'SPEEDS_TICK':
              setCorridorSpeeds(message.data);
              break;

            case 'WEATHER_TICK':
              setWeather(message.data.weather);
              break;

            case 'FEED_UPDATE':
              setFeedEntries((prev) => [message.data, ...prev].slice(0, 50));
              break;

            case 'NEW_INCIDENT':
              setIncidents((prev) => [message.data, ...prev]);
              setSelectedIncidentId(message.data.id);
              break;

            case 'INCIDENT_UPDATED':
              setIncidents((prev) =>
                prev.map((inc) => (inc.id === message.data.id ? message.data : inc))
              );
              break;

            case 'INCIDENT_DELETED':
              setIncidents((prev) => prev.filter((inc) => inc.id !== message.id));
              break;

            case 'SIMULATION_STATE_CHANGE':
              setSimulationActive(message.data.simulationActive);
              break;

            default:
              break;
          }
        } catch (err) {
          console.warn('Error parsing WS message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket Connection Error:', err);
      };

      ws.onclose = () => {
        if (!mounted) return;
        console.log('WebSocket Connection Closed. Retrying in 5 seconds...');
        fetchIncidents();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    // Initial fetch and connect
    fetchIncidents();
    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchIncidents, setWeather, setSelectedIncidentId, setIncidents]);

  return {
    clock,
    uptime,
    simulationActive,
    toggleSimulation,
    feedEntries,
    corridorSpeeds,
    signalPhases,
  };
}
