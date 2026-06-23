import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Info, Shuffle, ExternalLink } from 'lucide-react';

interface ChronoReplayProps {
  replayTime: number; // in minutes (e.g., 1020 = 17:00)
  onChangeReplayTime: React.Dispatch<React.SetStateAction<number>>;
  alternativePlanActive: boolean;
  onChangeAlternativePlan: (active: boolean) => void;
}

export const ChronoReplay: React.FC<ChronoReplayProps> = ({
  replayTime,
  onChangeReplayTime,
  alternativePlanActive,
  onChangeAlternativePlan,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convert minutes to readable HH:MM AM/PM
  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onChangeReplayTime((prevTime) => {
          const nextTime = prevTime + 10 * playbackSpeed; // Increment by 10m * speed
          if (nextTime >= 1440) {
            setIsPlaying(false);
            return 1440;
          }
          return nextTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, onChangeReplayTime]);

  // Compute simulated stats based on time of day and alternative plan
  const getSimulatedStats = () => {
    const hr = replayTime / 60;

    // Peak hours around 17:30 to 19:30 (IPL match starts at 19:30)
    let peakFactor = 0;
    if (hr >= 16 && hr <= 20) {
      peakFactor = Math.sin(((hr - 16) / 4) * Math.PI); // Smooth curve peaking at 18:00 (6 PM)
    } else if (hr > 20 && hr <= 23.5) {
      // Dispersal peak at 11 PM
      peakFactor = Math.sin(((hr - 20) / 3.5) * Math.PI) * 0.8;
    }

    const actualDelay = Math.round(15 + peakFactor * 52); // Delays peak at 67 mins
    const actualSpeed = Math.max(4, Math.round(38 - peakFactor * 32)); // Speed drops to 6 km/h

    // Alternative plan saves about 50-60% of peak delay
    const altDelay = alternativePlanActive
      ? Math.round(15 + peakFactor * 22) // Delays peak at 37 mins instead
      : actualDelay;

    const altSpeed = alternativePlanActive
      ? Math.max(12, Math.round(38 - peakFactor * 14)) // Speed stays at 24 km/h
      : actualSpeed;

    const vehicleHoursSaved = alternativePlanActive
      ? Math.round(peakFactor * 14200)
      : 0;

    return {
      actualDelay,
      actualSpeed,
      altDelay,
      altSpeed,
      vehicleHoursSaved,
    };
  };

  const stats = getSimulatedStats();

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Chrono-Replay & What-If Simulator
          </h2>
          <p className="text-[10px] text-slate-400">Reconstruct past traffic cascades and simulate counterfactual plans</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 border border-slate-800 text-[10px] px-2.5 py-1 rounded font-bold text-sky-400 tracking-wider">
            EVENT: IPL CRICKET MATCH
          </div>
          <button
            onClick={() => window.open('/replay', '_blank')}
            title="Open in new tab"
            className="p-1 hover:bg-slate-900 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Replay Time Controls */}
      <div className="bg-slate-950/60 border border-slate-900/60 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 my-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center transition shadow-lg shadow-sky-500/10 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
          </button>

          <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => setPlaybackSpeed(1)}
              className={`text-[9px] px-2 py-1 rounded font-bold ${playbackSpeed === 1 ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >
              1X
            </button>
            <button
              onClick={() => setPlaybackSpeed(2)}
              className={`text-[9px] px-2 py-1 rounded font-bold ${playbackSpeed === 2 ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >
              2X
            </button>
            <button
              onClick={() => setPlaybackSpeed(5)}
              className={`text-[9px] px-2 py-1 rounded font-bold ${playbackSpeed === 5 ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >
              5X
            </button>
          </div>
        </div>

        {/* Current Replay Time */}
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Replay Time</p>
          <p className="text-2xl font-black text-slate-200 tracking-tight font-mono">
            {formatTime(replayTime)}
          </p>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="px-2 mb-4">
        <input
          type="range"
          min="0" // 12:00 AM (Midnight)
          max="1440" // 12:00 AM (Midnight next day)
          value={replayTime}
          onChange={(e) => {
            setIsPlaying(false);
            onChangeReplayTime(parseInt(e.target.value));
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-bold tracking-wider mt-1.5 uppercase">
          <span>12:00 AM</span>
          <span>6:00 AM</span>
          <span>12:00 PM</span>
          <span>6:00 PM (Peak Entry)</span>
          <span>12:00 AM</span>
        </div>
      </div>

      {/* Side-by-Side Simulator Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* What Happened Card */}
        <div className="border border-red-950/40 bg-red-950/10 p-4 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] bg-red-900/40 text-red-400 font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
              Actual Conditions
            </span>
            <span className="text-[10px] text-slate-500">Traditional response</span>
          </div>

          <div className="space-y-2 mt-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Peak Link Delay:</span>
              <span className="text-xl font-bold text-red-500 font-mono">{stats.actualDelay} min</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Average Speed:</span>
              <span className="text-sm font-semibold text-slate-300 font-mono">{stats.actualSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* What If Card */}
        <div
          onClick={() => onChangeAlternativePlan(!alternativePlanActive)}
          className={`border cursor-pointer transition p-4 rounded-lg flex flex-col justify-between ${alternativePlanActive ? 'border-sky-500/40 bg-sky-950/20' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase ${alternativePlanActive ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              ASTRAM Alternative Plan
            </span>
            <span className="text-[10px] text-slate-500 flex items-center">
              <Shuffle className="w-3 h-3 mr-1" />
              {alternativePlanActive ? 'Active' : 'Click to test'}
            </span>
          </div>

          <div className="space-y-2 mt-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Projected Delay:</span>
              <span className={`text-xl font-bold font-mono ${alternativePlanActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {stats.altDelay} min
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Projected Speed:</span>
              <span className="text-sm font-semibold text-slate-300 font-mono">
                {stats.altSpeed} km/h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Summary Banner */}
      {alternativePlanActive && stats.vehicleHoursSaved > 0 && (
        <div className="mt-4 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-slate-300">
              Simulation saves <span className="text-emerald-400 font-extrabold">{stats.actualDelay - stats.altDelay} mins</span> delay per commuter.
            </span>
          </div>
          <span className="text-emerald-400 font-bold font-mono">
            +{stats.vehicleHoursSaved.toLocaleString()} veh-hrs saved
          </span>
        </div>
      )}
    </div>
  );
};
