import React from 'react';
import { SignalPhase } from '../hooks/useRealtimeEngine';
import { Zap, Signal } from 'lucide-react';

interface SignalTimingCardProps {
  signalPhases: SignalPhase[];
  onOverrideSignal?: (junctionId: string) => void;
}

export const SignalTimingCard: React.FC<SignalTimingCardProps> = ({
  signalPhases,
  onOverrideSignal,
}) => {
  const getPhaseColor = (phase: SignalPhase['phase']) => {
    switch (phase) {
      case 'green': return { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-500' };
      case 'amber': return { bg: 'bg-amber-500', glow: 'shadow-amber-500/30', text: 'text-amber-400', bar: 'bg-amber-500' };
      case 'red': return { bg: 'bg-red-500', glow: 'shadow-red-500/30', text: 'text-red-400', bar: 'bg-red-500' };
    }
  };

  const getPhaseDuration = (sp: SignalPhase) => {
    switch (sp.phase) {
      case 'green': return sp.greenDuration;
      case 'amber': return sp.amberDuration;
      case 'red': return sp.redDuration;
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full min-h-[320px]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center space-x-1.5">
            <Signal className="w-4 h-4 text-emerald-400" />
            <span>Signal Phase Monitor</span>
          </h2>
          <p className="text-[10px] text-slate-400">Live junction signal cycles with Webster override</p>
        </div>
        <span className="flex items-center space-x-1 text-[9px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">Synced</span>
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {signalPhases.map((sp) => {
          const colors = getPhaseColor(sp.phase);
          const totalDuration = getPhaseDuration(sp);
          const progressPct = ((totalDuration - sp.remaining) / totalDuration) * 100;

          return (
            <div
              key={sp.junctionId}
              className="bg-slate-950/50 border border-slate-900 rounded-lg p-3 flex flex-col space-y-2"
            >
              {/* Junction info row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Traffic light indicator */}
                  <div className="flex flex-col space-y-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${sp.phase === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/40' : 'bg-slate-800'}`} />
                    <div className={`w-2.5 h-2.5 rounded-full ${sp.phase === 'amber' ? 'bg-amber-500 shadow-lg shadow-amber-500/40' : 'bg-slate-800'}`} />
                    <div className={`w-2.5 h-2.5 rounded-full ${sp.phase === 'green' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-slate-800'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">{sp.junctionName}</p>
                    <p className="text-[8px] text-slate-500 font-mono">Cycle: {sp.cycleDuration}s</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className={`text-sm font-black font-mono ${colors.text}`}>
                      {sp.remaining}s
                    </p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">
                      {sp.phase} phase
                    </p>
                  </div>

                  <button
                    onClick={() => onOverrideSignal?.(sp.junctionId)}
                    title="Force green wave override"
                    className="p-1.5 bg-slate-900 hover:bg-sky-950 border border-slate-800 hover:border-sky-800 rounded text-slate-400 hover:text-sky-400 transition cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-linear`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Phase breakdown mini-row */}
              <div className="flex space-x-1 text-[7.5px] font-bold uppercase tracking-wider">
                <span className={`px-1.5 py-0.5 rounded ${sp.phase === 'green' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'text-slate-600'}`}>
                  G:{sp.greenDuration}s
                </span>
                <span className={`px-1.5 py-0.5 rounded ${sp.phase === 'amber' ? 'bg-amber-950 text-amber-400 border border-amber-900' : 'text-slate-600'}`}>
                  A:{sp.amberDuration}s
                </span>
                <span className={`px-1.5 py-0.5 rounded ${sp.phase === 'red' ? 'bg-red-950 text-red-400 border border-red-900' : 'text-slate-600'}`}>
                  R:{sp.redDuration}s
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
