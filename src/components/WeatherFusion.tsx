import React from 'react';
import { Sun, CloudRain, Shield, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

interface WeatherFusionProps {
  weather: 'clear' | 'light_rain' | 'heavy_rain';
  onChangeWeather: (weather: 'clear' | 'light_rain' | 'heavy_rain') => void;
  pumpTeamsDeployed: boolean;
  onTogglePumpTeams: () => void;
  onTriggerFloodIncident: () => void;
}

export const WeatherFusion: React.FC<WeatherFusionProps> = ({
  weather,
  onChangeWeather,
  pumpTeamsDeployed,
  onTogglePumpTeams,
  onTriggerFloodIncident,
}) => {
  const getForecastDetails = () => {
    switch (weather) {
      case 'heavy_rain':
        return {
          multiplier: '+110%',
          probability: '+60%',
          level: 'CRITICAL WARNING',
          colorClass: 'text-red-500 border-red-900 bg-red-950/20',
          warnings: [
            'Severe water logging at ORR East 2 underpasses',
            'Commuter traffic speed expected to drop by 60%',
            'High risk of vehicle stall in low-lying roads',
          ],
        };
      case 'light_rain':
        return {
          multiplier: '+30%',
          probability: '+20%',
          level: 'MODERATE ALERT',
          colorClass: 'text-yellow-500 border-yellow-900 bg-yellow-950/15',
          warnings: [
            'Slippery road surfaces on Hebbal Flyover',
            'Slow moving traffic on major corridors due to reduced visibility',
          ],
        };
      default:
        return {
          multiplier: 'Nominal',
          probability: '0%',
          level: 'CLEAR CONDITIONS',
          colorClass: 'text-emerald-500 border-emerald-950 bg-emerald-950/10',
          warnings: ['No weather-induced disruptions expected.'],
        };
    }
  };

  const details = getForecastDetails();

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Weather-Traffic Fusion Engine
          </h2>
          <p className="text-[10px] text-slate-400">Sync meteorological data to predict flood cascades</p>
        </div>
        <span className={`text-[9px] font-black border px-2 py-0.5 rounded uppercase tracking-wider ${details.colorClass}`}>
          {details.level}
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
            {details.multiplier}
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded border border-slate-900 text-center">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Incident Risk Spike</p>
          <p className={`text-xl font-black font-mono ${weather === 'heavy_rain' ? 'text-red-400 glow-red' : weather === 'light_rain' ? 'text-yellow-400' : 'text-slate-300'}`}>
            {details.probability}
          </p>
        </div>
      </div>

      {/* Warnings Feed */}
      <div className="space-y-1.5 bg-slate-950/30 p-3 rounded border border-slate-900/60 max-h-[85px] overflow-y-auto">
        {details.warnings.map((warn, i) => (
          <div key={i} className="flex items-start space-x-2 text-[10px]">
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${weather === 'heavy_rain' ? 'text-red-400' : 'text-yellow-500'}`} />
            <span className="text-slate-300">{warn}</span>
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
