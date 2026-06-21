import React, { useEffect, useRef } from 'react';
import { Incident } from '../data/mockDatabase';
import { AlertTriangle, Truck, CloudRain, TreePine, Hammer, Users, ChevronRight, ExternalLink, Flame, Clock } from 'lucide-react';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

const getTypeIcon = (type: Incident['incident_type']) => {
  switch (type) {
    case 'vehicle_breakdown': return <Truck className="w-3.5 h-3.5 text-amber-400" />;
    case 'tree_fall': return <TreePine className="w-3.5 h-3.5 text-emerald-400" />;
    case 'accident': return <Flame className="w-3.5 h-3.5 text-red-500" />;
    case 'water_logging': return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
    case 'road_work': return <Hammer className="w-3.5 h-3.5 text-orange-400" />;
    case 'public_event': return <Users className="w-3.5 h-3.5 text-purple-400" />;
    default: return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
  }
};

const getTimeAgo = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const isSlaBreached = (inc: Incident): boolean => {
  if (inc.status !== 'active') return false;
  const elapsedHours = (Date.now() - new Date(inc.created_at).getTime()) / (1000 * 60 * 60);
  return elapsedHours > (inc.duration_sla_hours || 4);
};

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(incidents.length);

  // Flash effect on new incidents
  useEffect(() => {
    if (incidents.length > prevCount.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevCount.current = incidents.length;
  }, [incidents.length]);

  const activeIncidents = incidents.filter((i) => i.status === 'active');
  const recentResolved = incidents.filter((i) => i.status === 'resolved').slice(0, 3);
  const newCount = activeIncidents.filter((i) => {
    const age = Date.now() - new Date(i.created_at).getTime();
    return age < 30000; // Less than 30 seconds old
  }).length;
  const breachedCount = activeIncidents.filter(isSlaBreached).length;

  return (
    <div className="glass-panel p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Incident Triage Queue</span>
          </h2>
          <p className="text-[10px] text-slate-400">Live feed of all active incidents — click to inspect</p>
        </div>
        <div className="flex items-center space-x-2">
          {newCount > 0 && (
            <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {newCount} NEW
            </span>
          )}
          {breachedCount > 0 && (
            <span className="bg-orange-950 border border-orange-800 text-orange-400 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>{breachedCount} SLA</span>
            </span>
          )}
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
            {activeIncidents.length} active
          </span>
          <button
            onClick={() => window.open('/feed', '_blank')}
            title="Open in new tab"
            className="p-1 hover:bg-slate-900 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
        {activeIncidents.map((inc, idx) => {
          const isNew = (Date.now() - new Date(inc.created_at).getTime()) < 30000;
          const isSelected = inc.id === selectedIncidentId;
          const breached = isSlaBreached(inc);

          return (
            <button
              key={inc.id}
              onClick={() => onSelectIncident(inc.id)}
              className={`w-full text-left flex items-center space-x-2.5 px-3 py-2 rounded-lg border transition cursor-pointer group ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-800'
                  : breached
                  ? 'bg-red-950/15 border-red-900/50'
                  : isNew
                  ? 'bg-amber-950/20 border-amber-900/40 animate-pulse'
                  : 'bg-slate-950/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30'
              }`}
              style={isNew ? { animationDuration: '3s', animationIterationCount: '3' } : undefined}
            >
              {/* Severity indicator */}
              <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${breached ? 'bg-red-500 animate-pulse' : inc.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'}`} />

              {/* Type Icon */}
              <div className="flex-shrink-0">{getTypeIcon(inc.incident_type)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{inc.id}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900 px-1 rounded">
                    {inc.incident_type.replace(/_/g, ' ')}
                  </span>
                  {breached && (
                    <span className="text-[7px] font-black uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-900/40 px-1 py-px rounded flex items-center space-x-0.5">
                      <Clock className="w-2 h-2" />
                      <span>SLA BREACH</span>
                    </span>
                  )}
                </div>
                <p className="text-[9.5px] text-slate-300 truncate mt-0.5">{inc.locality} — {inc.corridor}</p>
              </div>

              {/* Time */}
              <div className="flex-shrink-0 text-right">
                <p className="text-[9px] text-slate-500 font-bold">{getTimeAgo(inc.created_at)}</p>
                <p className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${breached ? 'text-red-400' : inc.priority === 'High' ? 'text-red-400' : 'text-amber-400'}`}>
                  {breached ? 'OVERDUE' : inc.priority}
                </p>
              </div>

              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition" />
            </button>
          );
        })}

        {/* Recently resolved */}
        {recentResolved.length > 0 && (
          <>
            <div className="flex items-center space-x-2 pt-2 pb-1">
              <div className="h-px flex-1 bg-slate-900"></div>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Recently Resolved</span>
              <div className="h-px flex-1 bg-slate-900"></div>
            </div>
            {recentResolved.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-950/20 border border-slate-900/50 opacity-60"
              >
                <div className="w-1.5 h-6 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="flex-shrink-0">{getTypeIcon(inc.incident_type)}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{inc.id}</span>
                  <p className="text-[9px] text-slate-500 truncate">{inc.locality}</p>
                </div>
                <span className="text-[8px] text-emerald-400 font-black uppercase tracking-wider">Cleared</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
