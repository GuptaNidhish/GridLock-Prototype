import React, { useState } from 'react';
import { Calendar as CalendarIcon, Users, Car, Train, Navigation, AlertTriangle, ArrowRight } from 'lucide-react';

export const CrowdDynamics: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(7); // Default IPL match day

  const calendarDays = [
    { day: 1, event: null }, { day: 2, event: null }, { day: 3, event: null },
    { day: 4, event: { name: 'IPL Match', type: 'high' } }, { day: 5, event: null },
    { day: 6, event: { name: 'BWSSB Work', type: 'low' } }, { day: 7, event: { name: 'IPL Match', type: 'high' } },
    { day: 8, event: null }, { day: 9, event: null }, { day: 10, event: { name: 'Maha Shivratri', type: 'low' } },
    { day: 11, event: null }, { day: 12, event: null }, { day: 13, event: null },
    { day: 14, event: { name: 'Holi/Metro Clash', type: 'medium' } }, { day: 15, event: { name: 'IPL Match', type: 'high' } },
    { day: 16, event: null }, { day: 17, event: null }, { day: 18, event: { name: 'Metro Work', type: 'low' } },
    { day: 19, event: null }, { day: 20, event: null }, { day: 21, event: { name: 'Concert', type: 'low' } },
    { day: 22, event: { name: 'IPL Match', type: 'high' } }, { day: 23, event: { name: 'Fun Run', type: 'low' } },
    { day: 24, event: null }, { day: 25, event: null }, { day: 26, event: null },
  ];

  const modeSplits = [
    { name: 'Private Cars', pct: 30, count: '10,200 vehicles', icon: <Car className="w-3.5 h-3.5" /> },
    { name: 'Cabs/Rideshare', pct: 25, count: '8,500 trips', icon: <Navigation className="w-3.5 h-3.5" /> },
    { name: 'Namma Metro', pct: 15, count: '5,100 commuters', icon: <Train className="w-3.5 h-3.5" /> },
    { name: 'BMTC Buses', pct: 10, count: '3,400 commuters', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[380px]">
      <div>
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
          Event Calendar & Crowd Dynamics
        </h2>
        <p className="text-[10px] text-slate-400">Scrape bookmyshow/government schedules for transit forecasts</p>
      </div>

      {/* Grid: Calendar vs Estimator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-3.5">
        {/* Calendar Card */}
        <div className="flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span className="flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1 text-sky-400" /> March 2026</span>
            <span className="text-[8px] bg-red-950 text-red-400 border border-red-900 px-1 rounded uppercase">1 Clash Alert</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 bg-slate-950/40 p-2 border border-slate-900 rounded-lg">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[8.5px] font-black text-slate-500 uppercase py-1">{d}</div>
            ))}
            {calendarDays.map((cd, i) => {
              const isSelected = selectedDay === cd.day;
              return (
                <div
                  key={i}
                  onClick={() => cd.event && setSelectedDay(cd.day)}
                  className={`aspect-square rounded flex flex-col items-center justify-center relative text-[9px] font-bold cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10'
                      : cd.event
                      ? cd.event.type === 'high'
                        ? 'bg-red-950/50 border border-red-900/60 text-red-400'
                        : cd.event.type === 'medium'
                        ? 'bg-yellow-950/40 border border-yellow-900/60 text-yellow-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-300'
                      : 'text-slate-500 hover:bg-slate-900/20'
                  }`}
                >
                  <span>{cd.day}</span>
                  {cd.event && !isSelected && (
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${cd.event.type === 'high' ? 'bg-red-500' : cd.event.type === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Clash Notice */}
          <div className="mt-3 bg-yellow-950/20 border border-yellow-900/40 p-2.5 rounded-lg text-[9.5px] leading-normal flex items-start space-x-1.5 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-yellow-400 uppercase">Conflict (Mar 14):</span> Holi Procession matches metro pipeline dig on Mysore Road. Setup diversion early!
            </div>
          </div>
        </div>

        {/* Crowd Dynamics Wave Card */}
        <div className="flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>Crowd Split Forecast</span>
            <span className="text-slate-300 font-bold">IPL Match (34,000 Expected)</span>
          </div>

          {/* Mode split progress items */}
          <div className="space-y-2 bg-slate-950/30 p-3 rounded-lg border border-slate-900/60 flex-1 flex flex-col justify-center">
            {modeSplits.map((mode, i) => (
              <div key={i} className="text-[9.5px]">
                <div className="flex justify-between items-center mb-1 text-slate-300">
                  <span className="flex items-center space-x-1 font-medium">
                    {mode.icon}
                    <span>{mode.name}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-400">
                    {mode.pct}% ({mode.count})
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${mode.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Arrival / Departure Wave Preview */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <div className="bg-slate-950/40 border border-slate-900 p-2 rounded">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Arrival Wave Peak</p>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-sm font-extrabold text-slate-200">T - 1 hour</span>
                <span className="text-slate-500">(18:30 IST)</span>
              </div>
            </div>
            <div className="bg-slate-950/40 border border-slate-900 p-2 rounded">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Departure Wave Peak</p>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-sm font-extrabold text-slate-200">T + 15 min</span>
                <span className="text-slate-500">(23:15 IST)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overflow Recommendations Banner */}
      <div className="bg-sky-950/20 border border-sky-900/40 p-2.5 rounded-lg flex items-center justify-between text-[10px]">
        <span className="text-slate-300 font-medium">
          🚨 <span className="font-bold text-sky-400 uppercase">Transit Deficit Alert:</span> Expected parking deficit: 2,400 spots. Recommend JC Road overflow routing.
        </span>
        <button className="text-sky-400 font-bold uppercase tracking-wider flex items-center hover:text-sky-300 transition text-[9px] cursor-pointer">
          Pushes <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
