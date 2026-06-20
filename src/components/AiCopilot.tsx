import React, { useState } from 'react';
import { Sparkles, Send, CheckCircle, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { queryCopilotRAG } from '../data/copilotRagEvaluator';

interface AiRecommendation {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'deploy_pumps' | 'recalibrate_signals' | 'escalate_wilson';
  severity: 'high' | 'medium' | 'low';
  executed: boolean;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
  actionType?: 'deploy_pumps' | 'recalibrate_signals' | 'escalate_wilson';
  actionLabel?: string;
  actionExecuted?: boolean;
}

interface AiCopilotProps {
  weather: string;
  activeIncidentsCount: number;
  alternativePlanActive: boolean;
  emergencyCorridorActive: boolean;
  onExecuteAction: (type: string) => void;
}

export const AiCopilot: React.FC<AiCopilotProps> = ({
  weather,
  activeIncidentsCount,
  alternativePlanActive,
  emergencyCorridorActive,
  onExecuteAction,
}) => {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: '🤖 ASTRAM Traffic Brain initialized.\nSystem diagnostics nominal. Monitoring 4 corridors for event-driven delay patterns.\n\nAsk me for "Monsoon Plan", "IPL Crowd Nudge", or search incidents: "Accident peenya".',
      time: '17:00',
    },
  ]);

  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([
    {
      id: 'rec_1',
      title: 'Monsoon Flood Mitigation',
      description: 'Underpass sensors at ORR show rising water level risk. Preemptively deploy suction pumps.',
      actionLabel: 'Deploy Pumps',
      actionType: 'deploy_pumps',
      severity: 'high',
      executed: false,
    },
    {
      id: 'rec_2',
      title: 'IPL Crowd Flow Optimization',
      description: 'Commuter entry wave peaks shortly. Recalibrate Queens Statue cycle timing via Webster equations.',
      actionLabel: 'Tweak Signals',
      actionType: 'recalibrate_signals',
      severity: 'medium',
      executed: false,
    },
    {
      id: 'rec_3',
      title: 'Wilson Garden Chronic SLA Violation',
      description: 'Lalbagh Road digging has been active for 80 days. Escalate command level to ACP Traffic.',
      actionLabel: 'Escalate Command',
      actionType: 'escalate_wilson',
      severity: 'high',
      executed: false,
    },
  ]);

  const handleExecute = (id: string, type: string) => {
    onExecuteAction(type);
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, executed: true } : rec))
    );

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: `⚡ Executed Action: ${type.replace('_', ' ').toUpperCase()}. Commands pushed to field officers and signboards.`,
        time,
      },
    ]);
  };

  const handleAsk = (textToAsk = query) => {
    if (!textToAsk.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { sender: 'user', text: textToAsk, time };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuery('');

    setTimeout(() => {
      const response = queryCopilotRAG(textToAsk, activeIncidentsCount);
      const timeResp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.text,
          time: timeResp,
          actionType: response.actionType,
          actionLabel: response.actionLabel,
          actionExecuted: false,
        },
      ]);
    }, 1000);
  };

  const handleChatActionExecute = (actionType: 'deploy_pumps' | 'recalibrate_signals' | 'escalate_wilson', msgIdx: number) => {
    onExecuteAction(actionType);

    // Update the message in chat history to mark action as executed
    setChatHistory((prev) =>
      prev.map((msg, i) => (i === msgIdx ? { ...msg, actionExecuted: true } : msg))
    );

    // Synchronize checklists
    const mappedRecId =
      actionType === 'deploy_pumps' ? 'rec_1' :
      actionType === 'recalibrate_signals' ? 'rec_2' :
      actionType === 'escalate_wilson' ? 'rec_3' : null;

    if (mappedRecId) {
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === mappedRecId ? { ...rec, executed: true } : rec))
      );
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: `⚡ Executed Action: ${actionType.replace('_', ' ').toUpperCase()}. Commands pushed to field officers and signboards.`,
        time,
      },
    ]);
  };

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[350px]">
      <div>
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center space-x-1.5">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>ASTRAM AI Traffic Brain</span>
        </h2>
        <p className="text-[10px] text-slate-400">Deep learning telemetry analysis and recommendation dispatch</p>
      </div>

      {/* Recommendations Checklist */}
      <div className="space-y-2.5 my-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border p-2.5 rounded-lg text-[10px] flex items-center justify-between transition ${
              rec.executed
                ? 'border-emerald-950 bg-emerald-950/10'
                : rec.severity === 'high'
                ? 'border-red-950/40 bg-red-950/5'
                : 'border-slate-900 bg-slate-950/20'
            }`}
          >
            <div className="flex-1 pr-3">
              <div className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 rounded-full ${rec.executed ? 'bg-emerald-400' : rec.severity === 'high' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                <p className="font-bold text-slate-200">{rec.title}</p>
              </div>
              <p className="text-slate-400 mt-1 leading-normal">{rec.description}</p>
            </div>

            {rec.executed ? (
              <span className="flex items-center space-x-1 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            ) : (
              <button
                onClick={() => handleExecute(rec.id, rec.actionType)}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-2.5 py-1.5 rounded font-black text-[9px] uppercase tracking-wider transition cursor-pointer"
              >
                {rec.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* NLP Prompt Chat Panel */}
      <div className="flex-1 bg-slate-950/50 rounded-lg border border-slate-900 flex flex-col h-[180px] overflow-hidden mb-3">
        {/* Chat Stream */}
        <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded p-2.5 text-[10px] leading-relaxed relative flex flex-col ${
                msg.sender === 'user'
                  ? 'bg-sky-950 text-slate-100 ml-auto'
                  : 'bg-slate-900/60 text-slate-200 border border-slate-900/60'
              }`}
            >
              {msg.text.split('\n').map((line, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-0.5' : ''}>{line}</p>
              ))}

              {msg.actionType && (
                <div className="mt-2.5 border-t border-slate-800/80 pt-2 flex justify-end">
                  {msg.actionExecuted ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-extrabold text-[8.5px] uppercase tracking-wider bg-emerald-950/20 px-2 py-1 rounded border border-emerald-950">
                      <CheckCircle className="w-3 h-3" />
                      <span>Executed</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleChatActionExecute(msg.actionType!, i)}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-2 py-1 rounded font-black text-[8.5px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition animate-pulse"
                    >
                      <span>Execute Action: {msg.actionLabel}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}

              <span className="text-[7.5px] text-slate-500 text-right block mt-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Suggestion Chips */}
        <div className="px-2.5 py-1 border-t border-slate-900 flex space-x-1.5 overflow-x-auto">
          {['Monsoon Plan', 'IPL Crowd Nudge', 'Wilson Garden SLA'].map((chip) => (
            <button
              key={chip}
              onClick={() => handleAsk(chip)}
              className="text-[8.5px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded transition cursor-pointer whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input field */}
        <div className="p-1 border-t border-slate-900 bg-slate-900/40 flex items-center space-x-1">
          <input
            type="text"
            placeholder="Ask ASTRAM Co-Pilot..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1 bg-[#1e293b]/40 border-none text-[10px] text-slate-200 rounded px-2 py-1.5 focus:outline-none placeholder-slate-500"
          />
          <button
            onClick={() => handleAsk()}
            className="p-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded transition cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

