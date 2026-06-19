import React, { useState } from 'react';
import { Incident, Officer } from '../data/mockDatabase';
import { AlertCircle, Clock, ShieldCheck, UserCheck, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

interface IncidentTrackerProps {
  selectedIncident: Incident | null;
  onUpdateIncidentStatus: (id: string, newStatus: 'active' | 'resolved' | 'closed', extraFields?: Partial<Incident>) => void;
  officers: Officer[];
}

export const IncidentTracker: React.FC<IncidentTrackerProps> = ({
  selectedIncident,
  onUpdateIncidentStatus,
  officers,
}) => {
  const [escalationLevel, setEscalationLevel] = useState<string>('');

  if (!selectedIncident) {
    return (
      <div className="glass-panel p-6 flex flex-col justify-center items-center h-full min-h-[300px] text-center">
        <AlertCircle className="w-10 h-10 text-slate-500 mb-2.5" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">No Incident Selected</h3>
        <p className="text-[10px] text-slate-500 max-w-[200px] mt-1.5 leading-normal">
          Select an incident marker from the live map or list to track SLA timelines and trigger dispatcher logs.
        </p>
      </div>
    );
  }

  // Calculate age/duration
  const createdDate = new Date(selectedIncident.created_at);
  const timeDiffMs = Date.now() - createdDate.getTime();
  const daysDiff = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
  const hoursDiff = Math.floor((timeDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const isViolated = selectedIncident.status === 'active' && daysDiff >= 1; // Over 24 hours is a violation

  const escalationChain = ['Field Officer', 'Station Inspector', 'ACP Traffic', 'DCP East/West', 'Commissioner of Police'];

  const handleEscalate = () => {
    let nextIndex = 0;
    if (selectedIncident.escalated_to) {
      nextIndex = escalationChain.indexOf(selectedIncident.escalated_to) + 1;
    } else if (selectedIncident.assigned_to) {
      nextIndex = 1; // Inspector
    }

    const nextRole = escalationChain[Math.min(nextIndex, escalationChain.length - 1)];
    onUpdateIncidentStatus(selectedIncident.id, 'active', {
      escalated_to: nextRole,
    });
  };

  const handleAcknowledge = () => {
    onUpdateIncidentStatus(selectedIncident.id, 'active', {
      first_response_at: new Date().toISOString(),
    });
  };

  const handleAssign = (officerId: string) => {
    onUpdateIncidentStatus(selectedIncident.id, 'active', {
      assigned_to: officerId,
    });
  };

  const handleResolve = () => {
    onUpdateIncidentStatus(selectedIncident.id, 'resolved', {
      resolved_at: new Date().toISOString(),
      resolved_by: selectedIncident.assigned_to || 'FKUSR00005',
    });
  };

  const handleClose = () => {
    onUpdateIncidentStatus(selectedIncident.id, 'closed', {
      closed_at: new Date().toISOString(),
      closed_by: 'FKUSR00001',
    });
  };

  // Timeline progress steps
  const steps = [
    { label: 'Reported', active: true },
    { label: 'Acknowledged', active: !!selectedIncident.first_response_at },
    { label: 'Dispatched', active: !!selectedIncident.assigned_to },
    { label: 'Resolving', active: selectedIncident.status === 'active' && !!selectedIncident.assigned_to },
    { label: 'Resolved', active: selectedIncident.status === 'resolved' || selectedIncident.status === 'closed' },
    { label: 'Closed', active: selectedIncident.status === 'closed' },
  ];

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <div className="flex justify-between items-start mb-2.5">
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
              SLA LifeCycle Command
            </h2>
            <p className="text-[10px] text-slate-400">Incident status enforcement and dispatcher action logs</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open('/tracker', '_blank')}
              title="Open in new tab"
              className="p-1 hover:bg-slate-900 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              {selectedIncident.id}
            </span>
          </div>
        </div>

        {/* Incident Details Summary Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-lg mb-3 text-[10px]">
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider">Sub-Type</p>
            <p className="text-slate-200 font-black uppercase mt-0.5">{selectedIncident.incident_type.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider">Corridor / Priority</p>
            <p className="text-slate-200 font-black mt-0.5">
              {selectedIncident.corridor} /{' '}
              <span className={selectedIncident.priority === 'High' ? 'text-red-400' : 'text-slate-400'}>
                {selectedIncident.priority}
              </span>
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500 font-bold uppercase tracking-wider">Geocoded Address</p>
            <p className="text-slate-300 mt-0.5 leading-normal">{selectedIncident.start_address}</p>
          </div>
        </div>

        {/* SLA Breach Alert Card */}
        {isViolated && (
          <div className="bg-red-950/30 border border-red-900/60 p-3 rounded-lg flex items-center justify-between mb-3 text-[10px] animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <div>
                <p className="font-extrabold text-red-400 uppercase">SLA CRITICAL BREACH WARNING</p>
                <p className="text-slate-300 mt-0.5">
                  Active for <span className="font-bold text-red-400">{daysDiff} days, {hoursDiff} hours</span>! (Target: {selectedIncident.duration_sla_hours} hrs)
                </p>
              </div>
            </div>
            {selectedIncident.escalated_to && (
              <span className="bg-red-900 text-white font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                Escalated to: {selectedIncident.escalated_to}
              </span>
            )}
          </div>
        )}

        {/* Timeline Stepper */}
        <div className="my-4 flex items-center justify-between px-1">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all ${
                    step.active
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-[8.5px] mt-1 font-semibold uppercase tracking-wider ${step.active ? 'text-slate-200' : 'text-slate-500'}`}>
                  {step.label.substring(0, 5)}..
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${steps[idx + 1].active ? 'bg-emerald-500' : 'bg-slate-850'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Dispatch Actions Bar */}
      <div className="border-t border-slate-900/80 pt-3 flex flex-wrap gap-2">
        {!selectedIncident.first_response_at && (
          <button
            onClick={handleAcknowledge}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 flex-1 py-2 rounded font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
          >
            Acknowledge Receipt
          </button>
        )}

        {selectedIncident.first_response_at && !selectedIncident.assigned_to && (
          <div className="w-full flex flex-col space-y-1.5">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assign Officer</label>
            <div className="flex flex-wrap gap-1.5">
              {officers.map((off) => (
                <button
                  key={off.id}
                  onClick={() => handleAssign(off.name)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-[9.5px] font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-0.5" />
                  <span>{off.name.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedIncident.status === 'active' && selectedIncident.assigned_to && (
          <button
            onClick={handleResolve}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex-1 py-2 rounded font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
          >
            Mark Resolved
          </button>
        )}

        {selectedIncident.status === 'resolved' && (
          <button
            onClick={handleClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1 py-2 rounded font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
          >
            Close Incident Case
          </button>
        )}

        {selectedIncident.status === 'active' && (
          <button
            onClick={handleEscalate}
            className="bg-red-950/40 hover:bg-red-950/60 border border-red-900/60 text-red-400 py-2 px-3 rounded font-black text-[10px] uppercase tracking-wider transition flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Escalate Alert</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
