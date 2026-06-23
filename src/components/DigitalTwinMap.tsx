import React, { useState, useEffect, useRef } from 'react';
import { Incident, BarricadePoint } from '../data/mockDatabase';
import { CorridorSpeed } from '../hooks/useRealtimeEngine';
import { ExternalLink, AlertTriangle, CloudRain, Shield, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import { useToast } from './ToastProvider';

interface DigitalTwinMapProps {
  weather: 'clear' | 'light_rain' | 'heavy_rain';
  barricadePoints: BarricadePoint[];
  emergencyCorridorActive: boolean;
  activeIncidents: Incident[];
  corridorSpeeds?: CorridorSpeed[];
  selectedIncidentId?: string | null;
  onSelectIncident: (id: string | null) => void;
  onMapCoordinatesClick?: (lat: number, lon: number) => void;
  onToggleJunctionSignal?: (junctionId: string) => void;
  onToggleCorridorStatus?: (corridorId: string) => void;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  weather,
  barricadePoints,
  emergencyCorridorActive,
  activeIncidents,
  corridorSpeeds,
  selectedIncidentId,
  onSelectIncident,
  onMapCoordinatesClick,
  onToggleJunctionSignal,
  onToggleCorridorStatus,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const { showToast } = useToast();
  const layersRef = useRef<{
    incidents: any;
    junctions: any;
    corridors: any;
    barricades: any;
  } | null>(null);

  // Keep track of clicked items for custom overlay fallback
  const [clickedItem, setClickedItem] = useState<{
    type: 'corridor' | 'junction' | 'coordinate';
    id: string;
    name: string;
    lat: number;
    lon: number;
  } | null>(null);

  const selectedIncident = activeIncidents.find((inc) => inc.id === selectedIncidentId);

  const getRoadColor = (roadName: string) => {
    const isHeavyRain = weather === 'heavy_rain';
    const hasIncident = activeIncidents.some(
      (inc) => inc.corridor === roadName && inc.status === 'active'
    );

    if (emergencyCorridorActive && roadName === 'CBD 2') return '#06b6d4';
    if (hasIncident) return isHeavyRain ? '#ef4444' : '#f59e0b';
    if (isHeavyRain) return '#f59e0b';
    if (weather !== 'clear') return '#eab308';
    return '#10b981';
  };

  const junctions = [
    { id: 'hebbal', name: 'Hebbal Flyover', coords: [13.0350, 77.5970] as [number, number], desc: '92% Capacity' },
    { id: 'mekhri', name: 'Mekhri Circle', coords: [13.0130, 77.5900] as [number, number], desc: 'Wait time: ~8 min' },
    { id: 'silkboard', name: 'Silk Board Junction', coords: [12.9176, 77.6244] as [number, number], desc: 'Queue: 340m' },
    { id: 'stadium', name: 'Chinnaswamy Stadium', coords: [12.9780, 77.5990] as [number, number], desc: 'IPL Venue - Crowded' },
    { id: 'underpass', name: 'BSNL CACT Underpass', coords: [12.9995, 77.6827] as [number, number], desc: 'Flood Prone Segment' },
  ];

  const corridors = [
    { id: 'tumkur', name: 'Tumkur Road', path: [[13.0280, 77.5180], [13.0350, 77.5970]] as [number, number][] },
    { id: 'bellary', name: 'Bellary Road', path: [[13.0350, 77.5970], [13.0130, 77.5900], [12.9780, 77.5990]] as [number, number][] },
    { id: 'orr_east_1', name: 'ORR East 1', path: [[13.0350, 77.5970], [12.9995, 77.6827]] as [number, number][] },
    { id: 'orr_east_2', name: 'ORR East 2', path: [[12.9995, 77.6827], [12.9176, 77.6244]] as [number, number][] },
    { id: 'hosur', name: 'Hosur Road', path: [[12.9176, 77.6244], [12.9780, 77.5990]] as [number, number][] },
    { id: 'cbd_2', name: 'CBD 2', path: [[12.9780, 77.5990], [12.9716, 77.5946], [12.9650, 77.6010], [12.9780, 77.5990]] as [number, number][] },
  ];

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let L: any;
    const init = async () => {
      L = await import('leaflet');

      if (leafletMapRef.current) return; // Prevent multiple initializations

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([12.9716, 77.5946], 12);

      leafletMapRef.current = map;

      // Dark style OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Create Layer Groups
      layersRef.current = {
        corridors: L.layerGroup().addTo(map),
        junctions: L.layerGroup().addTo(map),
        incidents: L.layerGroup().addTo(map),
        barricades: L.layerGroup().addTo(map),
      };

      // Add Map Background click handler for placing temporary checkpoints
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setClickedItem({
          type: 'coordinate',
          id: `coord_${lat.toFixed(4)}_${lng.toFixed(4)}`,
          name: `Manual Coordinate Selection`,
          lat,
          lon: lng,
        });

        // Auto trigger callback
        if (onMapCoordinatesClick) {
          onMapCoordinatesClick(lat, lng);
        }
      });
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []);

  // Update Map Components (Corridors, Junctions, Incidents, Barricades)
  useEffect(() => {
    if (!leafletMapRef.current || !layersRef.current) return;

    const map = leafletMapRef.current;
    const layers = layersRef.current;
    const L = (window as any).L;

    if (!L) return; // Ensure Leaflet is loaded in window scope

    // Clear Previous Layers
    layers.corridors.clearLayers();
    layers.junctions.clearLayers();
    layers.incidents.clearLayers();
    layers.barricades.clearLayers();

    // 1. Draw Corridors with Speed Labels
    corridors.forEach((corr) => {
      const color = getRoadColor(corr.name);
      const isEmergency = emergencyCorridorActive && corr.id === 'cbd_2';

      const polyline = L.polyline(corr.path, {
        color: color,
        weight: isEmergency ? 7 : 5,
        opacity: 0.85,
        dashArray: isEmergency ? '10, 10' : undefined,
      }).addTo(layers.corridors);

      // Click event for corridor
      polyline.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        setClickedItem({
          type: 'corridor',
          id: corr.id,
          name: corr.name,
          lat: e.latlng.lat,
          lon: e.latlng.lng,
        });
      });

      // Speed label at corridor midpoint
      const speedData = corridorSpeeds?.find((cs) => cs.id === corr.id);
      if (speedData && corr.path.length >= 2) {
        const midIdx = Math.floor(corr.path.length / 2);
        const midPoint: [number, number] = [
          (corr.path[midIdx - 1][0] + corr.path[midIdx][0]) / 2,
          (corr.path[midIdx - 1][1] + corr.path[midIdx][1]) / 2,
        ];
        const trendArrow = speedData.trend === 'up' ? '↑' : speedData.trend === 'down' ? '↓' : '';
        const speedColor = speedData.speed < 15 ? '#ef4444' : speedData.speed < 25 ? '#f59e0b' : '#10b981';

        const speedIcon = L.divIcon({
          className: 'speed-label-icon',
          html: `<div style="background:rgba(2,4,10,0.85);border:1px solid ${speedColor};color:${speedColor};padding:1px 5px;border-radius:4px;font-size:9px;font-weight:900;font-family:monospace;white-space:nowrap;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);">${speedData.speed} km/h ${trendArrow}</div>`,
          iconSize: [60, 16],
          iconAnchor: [30, 8],
        });

        L.marker(midPoint, { icon: speedIcon, interactive: false }).addTo(layers.corridors);
      }
    });

    // 2. Draw Junction Nodes
    junctions.forEach((junc) => {
      const isStadium = junc.id === 'stadium';

      const juncIcon = L.divIcon({
        className: 'custom-junc-icon',
        html: `<div class="relative flex items-center justify-center">
                 ${isStadium ? `<div class="absolute w-8 h-8 rounded-full bg-sky-500/10 border border-sky-400 animate-ping"></div>` : ''}
                 <div class="w-4 h-4 rounded-full bg-slate-900 border-2 border-sky-400 flex items-center justify-center shadow-lg">
                   <div class="w-1.5 h-1.5 rounded-full ${isStadium ? 'bg-sky-400' : 'bg-slate-300'}"></div>
                 </div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(junc.coords, { icon: juncIcon }).addTo(layers.junctions);

      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        setClickedItem({
          type: 'junction',
          id: junc.id,
          name: junc.name,
          lat: junc.coords[0],
          lon: junc.coords[1],
        });
      });
    });

    // 3. Draw Active Incidents
    activeIncidents
      .filter((inc) => inc.status === 'active')
      .forEach((inc) => {
        const coords: [number, number] = [inc.start_lat, inc.start_lon];

        const incIcon = L.divIcon({
          className: 'custom-inc-icon',
          html: `<div class="relative flex items-center justify-center cursor-pointer">
                   <div class="absolute w-8 h-8 rounded-full bg-red-500/30 border border-red-500 animate-ping"></div>
                   <div class="relative w-5 h-5 bg-red-950 border border-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-red-400 shadow-md">
                     ⚠️
                   </div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(coords, { icon: incIcon }).addTo(layers.incidents);

        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          onSelectIncident(inc.id);
        });
      });

    // 4. Draw Barricades
    barricadePoints.forEach((bp) => {
      const coords: [number, number] = [bp.lat, bp.lon];

      const bpIcon = L.divIcon({
        className: 'custom-bp-icon',
        html: `<div class="relative flex items-center justify-center cursor-pointer">
                 <div class="w-5 h-3 bg-amber-500 border border-slate-950 rounded flex items-center justify-center shadow-lg">
                   <div class="w-full h-px bg-slate-950"></div>
                 </div>
               </div>`,
        iconSize: [20, 12],
        iconAnchor: [10, 6],
      });

      L.marker(coords, { icon: bpIcon }).addTo(layers.barricades);
    });
  }, [weather, emergencyCorridorActive, activeIncidents, barricadePoints, corridorSpeeds]);

  // Center or Fly to selected incident on map when selectedIncidentId changes
  useEffect(() => {
    if (!leafletMapRef.current || !selectedIncidentId) return;

    const incident = activeIncidents.find((inc) => inc.id === selectedIncidentId && inc.status === 'active');
    if (incident) {
      const targetCoords: [number, number] = [incident.start_lat, incident.start_lon];
      // Fly to the coordinates for a premium, smooth zoom and transition effect
      leafletMapRef.current.flyTo(targetCoords, 14, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedIncidentId, activeIncidents]);

  return (
    <div className="glass-panel p-6 flex flex-col h-full relative overflow-hidden dark-map-container">
      <div className="flex justify-between items-center mb-4 z-10 relative">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Digital Twin City Live View
          </h2>
          <p className="text-[10px] text-slate-400">Interactive live geographic map of traffic network controls.</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => window.open('/map', '_blank')}
            title="Open in new tab"
            className="p-1 hover:bg-slate-900 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Real-Time Map
          </span>
        </div>
      </div>

      {/* Map Element Container */}
      <div className="flex-1 bg-slate-950 rounded-lg relative border border-slate-900 overflow-hidden min-h-[300px]">
        <div ref={mapRef} className="w-full h-full min-h-[300px] z-0" />

        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-slate-950/90 px-2.5 py-1.5 rounded border border-slate-850 text-[9px] flex space-x-3 z-10">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-1 bg-[#10b981]"></div>
            <span className="text-slate-400 font-medium">Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-1 bg-[#f59e0b]"></div>
            <span className="text-slate-400 font-medium">Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-1 bg-[#ef4444]"></div>
            <span className="text-slate-400 font-medium">Jammed</span>
          </div>
          {emergencyCorridorActive && (
            <div className="flex items-center space-x-1">
              <div className="w-2.5 h-1 bg-[#06b6d4] animate-pulse"></div>
              <span className="text-[#06b6d4] font-bold">Green Wave</span>
            </div>
          )}
        </div>

        {/* Map Click Actions Overlay Popup Panel */}
        {clickedItem && (
          <div className="absolute top-2 left-2 right-2 bg-slate-950/95 border border-sky-900/80 p-3 rounded-lg shadow-2xl text-[10px] min-w-[200px] z-20 flex flex-col justify-between animate-fade-in">
            <div className="flex justify-between items-center mb-1.5">
              <p className="font-extrabold uppercase text-sky-400 tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>Map Console: {clickedItem.name}</span>
              </p>
              <button
                onClick={() => setClickedItem(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400 mb-2 font-mono">Location coordinates: ({clickedItem.lat.toFixed(5)}, {clickedItem.lon.toFixed(5)})</p>

            <div className="flex flex-wrap gap-2 mt-1">
              {clickedItem.type === 'corridor' && (
                <>
                  <button
                    onClick={() => {
                      onToggleCorridorStatus?.(clickedItem.id);
                      setClickedItem(null);
                    }}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-2.5 py-1 rounded font-black uppercase text-[8.5px] cursor-pointer"
                  >
                    Toggle Diversion Flow
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Manual breakdown reported on ${clickedItem.name}. Dispatching officers.`, 'warning');
                      setClickedItem(null);
                    }}
                    className="bg-red-950 border border-red-800 text-red-400 px-2.5 py-1 rounded font-bold uppercase text-[8.5px] cursor-pointer"
                  >
                    Report Breakdown Here
                  </button>
                </>
              )}

              {clickedItem.type === 'junction' && (
                <>
                  <button
                    onClick={() => {
                      onToggleJunctionSignal?.(clickedItem.id);
                      setClickedItem(null);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded font-black uppercase text-[8.5px] cursor-pointer"
                  >
                    Trigger Green Wave Override
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Stationing auxiliary traffic warden at ${clickedItem.name}.`, 'success');
                      setClickedItem(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded font-bold uppercase text-[8.5px] cursor-pointer border border-slate-800"
                  >
                    Deploy Warden
                  </button>
                </>
              )}

              {clickedItem.type === 'coordinate' && (
                <>
                  <button
                    onClick={() => {
                      showToast(`Spawning smart barricade at coordinate.`, 'success');
                      setClickedItem(null);
                    }}
                    className="bg-amber-500 hover:bg-amber-450 text-slate-950 px-2.5 py-1 rounded font-black uppercase text-[8.5px] cursor-pointer"
                  >
                    Place Temporary Barricade
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Patrol dispatch sent to coordinates.`, 'action');
                      setClickedItem(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-200 px-2.5 py-1 rounded font-bold uppercase text-[8.5px] cursor-pointer border border-slate-800"
                  >
                    Dispatch Patrol Unit
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Incident Detail Floating Popup */}
        {selectedIncident && (
          <div className="absolute top-2 right-2 bg-slate-950/95 border border-red-900/40 backdrop-blur-md p-4 rounded-lg shadow-2xl text-[10px] w-[310px] z-20 flex flex-col justify-between animate-fade-in">
            <div className="flex justify-between items-start mb-2 border-b border-slate-900 pb-2">
              <div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  selectedIncident.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedIncident.priority} PRIORITY
                </span>
                <h3 className="font-extrabold uppercase text-slate-200 mt-1.5 text-xs tracking-wider flex items-center">
                  <span className="mr-1">⚠️</span>
                  <span>{selectedIncident.incident_type.replace(/_/g, ' ')}</span>
                </h3>
              </div>
              <button
                onClick={() => onSelectIncident(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold p-1 cursor-pointer transition"
                title="Dismiss Popup"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col space-y-2 font-sans mb-3 text-slate-300">
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>CASE ID: {selectedIncident.id}</span>
                <span>STATUS: <span className={selectedIncident.status === 'active' ? 'text-red-400 font-bold uppercase' : 'text-emerald-400 font-bold uppercase'}>{selectedIncident.status}</span></span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Location / Address</span>
                <span className="text-slate-200 font-medium text-[9px]">{selectedIncident.start_address}</span>
              </div>

              {selectedIncident.corridor && selectedIncident.corridor !== 'Non-corridor' && (
                <div>
                  <span className="text-slate-555 text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Affected Corridor</span>
                  <span className="text-slate-200 font-bold text-[9px]">{selectedIncident.corridor}</span>
                </div>
              )}

              <div>
                <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Description</span>
                <p className="text-slate-300 text-[9px] leading-relaxed mt-0.5 bg-slate-900/60 p-2 rounded border border-slate-900">{selectedIncident.description}</p>
              </div>

              <div className="flex justify-between items-center text-[8.5px] border-t border-slate-900 pt-2 text-slate-400">
                <span suppressHydrationWarning>Logged: {new Date(selectedIncident.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-mono text-amber-500">SLA: {selectedIncident.duration_sla_hours} hrs</span>
              </div>
            </div>

            <div className="flex space-x-2 border-t border-slate-900 pt-3">
              <button
                onClick={() => onSelectIncident(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1.5 rounded font-bold uppercase text-[8.5px] text-center cursor-pointer transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  window.open('/tracker', '_blank');
                  onSelectIncident(null);
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 py-1.5 rounded font-black uppercase text-[8.5px] text-center cursor-pointer transition flex items-center justify-center space-x-1"
              >
                <span>Audit File</span>
                <span className="text-[10px]">➜</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mini Active Incident Alert Banner */}
      {activeIncidents.some((inc) => inc.status === 'active' && inc.priority === 'High') && (
        <div className="mt-3 bg-red-950/40 border border-red-900/60 p-2.5 rounded flex items-center justify-between text-[11px] animate-pulse z-10 relative">
          <div className="flex items-center space-x-2 text-red-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>CRITICAL INCIDENT ACTIVE: {activeIncidents.find((i) => i.status === 'active' && i.priority === 'High')?.id}</span>
          </div>
          <button
            onClick={() => {
              const activeHigh = activeIncidents.find((i) => i.status === 'active' && i.priority === 'High');
              if (activeHigh) onSelectIncident(activeHigh.id);
            }}
            className="text-[10px] bg-red-900 hover:bg-red-800 text-white font-semibold px-2 py-0.5 rounded transition cursor-pointer"
          >
            Locate
          </button>
        </div>
      )}
    </div>
  );
};
