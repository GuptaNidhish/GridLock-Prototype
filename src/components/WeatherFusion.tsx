import React, { useState, useEffect } from 'react';
import { Sun, CloudRain, Shield, AlertTriangle, CheckCircle, Navigation, Loader2 } from 'lucide-react';

interface WeatherWarning {
  title: string;
  address: string;
  description: string;
  lat: number;
  lon: number;
  severity: 'high' | 'medium' | 'low';
  timeFactor: string;
}

interface WeatherFusionProps {
  weather: 'clear' | 'light_rain' | 'heavy_rain';
  onChangeWeather: (weather: 'clear' | 'light_rain' | 'heavy_rain') => void;
  pumpTeamsDeployed: boolean;
  onTogglePumpTeams: () => void;
  onTriggerFloodIncident: () => void;
  hour?: number;
  month?: number;
}

export const WeatherFusion: React.FC<WeatherFusionProps> = ({
  weather,
  onChangeWeather,
  pumpTeamsDeployed,
  onTogglePumpTeams,
  onTriggerFloodIncident,
  hour = 17,
  month = 6,
}) => {
  const [multiplier, setMultiplier] = useState<string>('Nominal');
  const [probability, setProbability] = useState<string>('0%');
  const [warnings, setWarnings] = useState<WeatherWarning[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather-fusion?weather=${weather}&hour=${hour}&month=${month}`);
        const data = await res.json();
        if (active && data.success) {
          setMultiplier(data.congestion_multiplier);
          setProbability(data.incident_risk_spike);
          setWarnings(data.warnings);
        }
      } catch (err) {
        console.error('Failed to fetch weather ML prediction:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPrediction();
    return () => {
      active = false;
    };
  }, [weather, hour, month]);

  const getAlertStyle = () => {
    switch (weather) {
      case 'heavy_rain':
        return {
          level: 'ML CRITICAL RISK',
          colorClass: 'text-red-405 border-red-900 bg-red-950/20 text-red-400',
        };
      case 'light_rain':
        return {
          level: 'ML MODERATE RISK',
          colorClass: 'text-yellow-405 border-yellow-900 bg-yellow-950/15 text-yellow-500',
        };
      default:
        return {
          level: 'ML NOMINAL RISK',
          colorClass: 'text-emerald-405 border-emerald-950 bg-emerald-950/10 text-emerald-500',
        };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center">
            Weather-Traffic Fusion Engine
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-2 text-sky-400" />}
          </h2>
          <p className="text-[10px] text-slate-400">Sync meteorological data to predict flood cascades</p>
        </div>
        <span className={`text-[9px] font-black border px-2 py-0.5 rounded uppercase tracking-wider ${alertStyle.colorClass}`}>
          {alertStyle.level}
        </span>
      </div>

      {/* Weather Selector */}
      <div className="grid grid-cols-3 gap-2.5 my-2">
        <button
          onClick={() => onChangeWeather('clear')}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${weather === 'clear' ? 'bg-amber-950/20 border-amber-500 text-amber-400' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <Sun className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Clear</span>
        </button>

        <button
          onClick={() => onChangeWeather('light_rain')}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${weather === 'light_rain' ? 'bg-sky-950/25 border-sky-500 text-sky-400' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <CloudRain className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Drizzle</span>
        </button>

        <button
          onClick={() => onChangeWeather('heavy_rain')}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${weather === 'heavy_rain' ? 'bg-red-950/25 border-red-500 text-red-400' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <div className="relative">
            <CloudRain className="w-5 h-5 mb-1" />
            <span className="absolute -top-1 -right-2 text-[8px] bg-red-600 text-white px-0.5 rounded font-black animate-pulse">!</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Downpour</span>
        </button>
      </div>

      {/* Impact Indicators */}
      <div className="grid grid-cols-2 gap-4 my-2.5">
        <div className="bg-slate-950/60 p-3 rounded border border-slate-900 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Congestion Multiplier</p>
          <p className={`text-xl font-black font-mono ${weather === 'heavy_rain' ? 'text-red-400 glow-red' : weather === 'light_rain' ? 'text-yellow-400' : 'text-slate-300'}`}>
            {multiplier}
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded border border-slate-900 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Incident Risk Spike</p>
          <p className={`text-xl font-black font-mono ${weather === 'heavy_rain' ? 'text-red-400 glow-red' : weather === 'light_rain' ? 'text-yellow-400' : 'text-slate-300'}`}>
            {probability}
          </p>
        </div>
      </div>

      {/* Warnings Feed */}
      <div className="space-y-1.5 bg-slate-950/30 p-3 rounded border border-slate-900/60 max-h-[85px] overflow-y-auto">
        {warnings.map((warn, i) => (
          <div key={i} className="flex items-start space-x-2 text-[10px] border-b border-slate-900/50 pb-1.5 last:border-b-0 last:pb-0">
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${warn.severity === 'high' ? 'text-red-400' : 'text-yellow-500'}`} />
            <div className="flex-1">
              <p className="font-bold text-slate-200">{warn.title}</p>
              <p className="text-[8.5px] text-slate-400 mt-0.5 leading-normal">{warn.description}</p>
              <p className="text-[7.5px] text-sky-400/80 mt-1 font-mono">{warn.timeFactor} | {warn.address}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Protocol Actions */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={onTogglePumpTeams}
          disabled={weather === 'clear'}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded font-bold text-xs border transition cursor-pointer ${
            pumpTeamsDeployed
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {pumpTeamsDeployed ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>PUMPS DEPLOYED</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              <span>DEPLOY PUMPS</span>
            </>
          )}
        </button>

        {weather === 'heavy_rain' && (
          <button
            onClick={onTriggerFloodIncident}
            className="bg-red-950/30 border border-red-900/60 hover:bg-red-900/20 text-red-400 hover:text-red-300 flex items-center justify-center space-x-1 py-2 px-3 rounded font-bold text-xs transition cursor-pointer"
          >
            <Navigation className="w-4 h-4 animate-pulse" />
            <span>TRIGGER FLOOD</span>
          </button>
        )}
      </div>
    </div>
  );
};
