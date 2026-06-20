import React, { useEffect, useRef } from 'react';
import { FeedEntry } from '../hooks/useRealtimeEngine';
import { Radio, X, ChevronDown } from 'lucide-react';

interface LiveFeedProps {
  entries: FeedEntry[];
  visible: boolean;
  onToggle: () => void;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ entries, visible, onToggle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  const getSeverityColor = (severity: FeedEntry['severity']) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-950/20';
      case 'warning': return 'border-l-amber-500 bg-amber-950/15';
      case 'success': return 'border-l-emerald-500 bg-emerald-950/15';
      default: return 'border-l-sky-500 bg-sky-950/10';
    }
  };

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-full p-3 flex items-center space-x-2 shadow-2xl hover:border-sky-800 transition cursor-pointer group"
      >
        <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 group-hover:text-sky-400 transition">
          Live Feed
        </span>
        {entries.length > 0 && (
          <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
            {Math.min(entries.length, 99)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[420px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-900 bg-slate-900/40">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Live Activity Feed
          </span>
          <span className="text-[8px] bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-bold animate-pulse">
            LIVE
          </span>
        </div>
        <button onClick={onToggle} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer transition">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[340px] p-2 space-y-1.5">
        {entries.slice(0, 20).map((entry, idx) => (
          <div
            key={entry.id}
            className={`border-l-2 px-2.5 py-1.5 rounded-r text-[10px] leading-relaxed transition-all ${getSeverityColor(entry.severity)} ${idx === 0 ? 'animate-pulse' : ''}`}
            style={{ animationDuration: idx === 0 ? '2s' : undefined, animationIterationCount: idx === 0 ? '1' : undefined }}
          >
            <div className="flex items-start space-x-1.5">
              <span className="flex-shrink-0">{entry.icon}</span>
              <div className="flex-1">
                <p className="text-slate-200 font-medium">{entry.message}</p>
                <p className="text-[8px] text-slate-500 font-mono mt-0.5">{entry.timestamp}</p>
              </div>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-[10px]">
            <Radio className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="font-bold uppercase tracking-wider">Awaiting telemetry…</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-slate-900 bg-slate-900/30 flex items-center justify-between text-[8px]">
        <span className="text-slate-500 font-bold uppercase tracking-wider">{entries.length} events logged</span>
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">Connected</span>
        </span>
      </div>
    </div>
  );
};
