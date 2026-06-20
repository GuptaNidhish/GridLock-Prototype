import React, { useState } from 'react';
import { Officer } from '../data/mockDatabase';
import { Calendar, Award, UserCheck, Star, Clock, Trophy } from 'lucide-react';
import { evaluateManpowerNeeds } from '../data/manpowerMlEvaluator';

interface ManpowerLeaderboardProps {
  officers: Officer[];
  weather?: string;
  replayTime?: number;
  activeIncidents?: any[];
}

export const ManpowerLeaderboard: React.FC<ManpowerLeaderboardProps> = ({
  officers,
  weather = 'clear',
  replayTime = 1020, // default 17:00 in minutes
  activeIncidents = [],
}) => {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'leaderboard'>('scheduler');

  const hour = Math.floor(replayTime / 60) % 24;
  const evalResult = evaluateManpowerNeeds(hour, weather, activeIncidents);

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Resource Orchestration Center
          </h2>
          <p className="text-[10px] text-slate-400">Shift planning optimizer and field officer achievements</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 p-0.5 rounded border border-slate-800/80 mb-3">
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
            activeTab === 'scheduler' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Shift Scheduler</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
            activeTab === 'leaderboard' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Officer Leaderboard</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 max-h-[220px] overflow-y-auto pr-1">
        {activeTab === 'scheduler' ? (
          <div className="space-y-3">
            {/* Roster overview */}
            <div className="bg-slate-950/40 border border-slate-900 p-2.5 rounded flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                Recommended: <span className="text-slate-200 font-bold">{evalResult.totalRecommended} Officers</span>
              </span>
              <span className="text-slate-400">
                Available: <span className="text-emerald-400 font-bold">{evalResult.availableStaff} Officers</span>
              </span>
              <span className={`font-bold uppercase ${evalResult.statusColorClass}`}>{evalResult.statusText}</span>
            </div>

            {/* Shift Assignments Table */}
            <div className="border border-slate-900 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-400">
                    <th className="p-2 font-bold uppercase">Junction / Spot</th>
                    <th className="p-2 font-bold uppercase text-center">Officers</th>
                    <th className="p-2 font-bold uppercase">Team Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {evalResult.recommendedShifts.map((shift, i) => (
                    <tr key={i} className="hover:bg-slate-900/20 text-slate-300">
                      <td className="p-2 font-medium">
                        {shift.position}
                        <span className="text-[8px] text-slate-500 block">{shift.corridor}</span>
                      </td>
                      <td className="p-2 text-center font-bold text-sky-400">{shift.officersNeeded}</td>
                      <td className="p-2 text-slate-400 font-medium">
                        {shift.lead}
                        <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 px-1 ml-1.5 rounded uppercase">
                          {shift.activeShift}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {officers
              .sort((a, b) => b.performance_score - a.performance_score)
              .map((off, idx) => (
                <div
                  key={off.id}
                  className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    {/* Rank Badge */}
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-200">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-200">
                        {off.name} <span className="text-[8px] text-slate-500 uppercase">({off.rank})</span>
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5 text-[8.5px] text-slate-400 font-medium">
                        <span className="flex items-center text-amber-500">
                          <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-500" /> {off.performance_score} pts
                        </span>
                        <span className="flex items-center text-sky-400">
                          <Clock className="w-2.5 h-2.5 mr-0.5" /> {off.avg_response_time_minutes}m Response
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Achievements Badge */}
                  <div className="flex space-x-1">
                    {off.badges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        title={badge}
                        className="text-[8.5px] bg-slate-900 border border-slate-800 text-sky-400 font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5"
                      >
                        <Award className="w-2.5 h-2.5 text-sky-400" />
                        <span>{badge.split(' ')[0]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
