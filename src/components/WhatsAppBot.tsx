import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, Check, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { predictIncidentType, extractIncidentLocation } from '../data/whatsappNlpEvaluator';

interface Message {
  id: string;
  sender: 'officer' | 'bot';
  text: string;
  timestamp: string;
  image?: string;
}

interface WhatsAppBotProps {
  onAddIncidentFromBot: (type: string, location: string, lat: number, lon: number, desc: string) => void;
  onActivateDiversion: (corridor: string) => void;
}

export const WhatsAppBot: React.FC<WhatsAppBotProps> = ({
  onAddIncidentFromBot,
  onActivateDiversion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'officer',
      text: 'Tree fall Sankey Road',
      timestamp: '17:42',
    },
    {
      id: 'm2',
      sender: 'bot',
      text: '🤖 I\'ve detected a tree fall incident.\n📍 Location: Sankey Road, Sadashivanagar\n🆔 Created: FKID-NEW-003\n\nIs a traffic diversion needed?\nReply: 1️⃣ Yes  2️⃣ No',
      timestamp: '17:42',
    },
    {
      id: 'm3',
      sender: 'officer',
      text: '1',
      timestamp: '17:43',
    },
    {
      id: 'm4',
      sender: 'bot',
      text: '🤖 Diversion activated ✅.\nSuggested routing: Palace Road → Jayamahal Road → Race Course Road.\n\nBBMP Horticulture has been notified. Expected arrival: 40 min.\n\n📸 Please share a photo of the tree fall.',
      timestamp: '17:43',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend = inputValue) => {
    if (!textToSend.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const officerMsg: Message = {
      id: `m_${Date.now()}`,
      sender: 'officer',
      text: textToSend,
      timestamp: time,
    };

    setMessages((prev) => [...prev, officerMsg]);
    setInputValue('');

    // Simulated Bot ML NLP Response logic
    setTimeout(() => {
      let botResponse = '';
      const normText = textToSend.toLowerCase();

      if (normText.includes('diversion') || normText === '1') {
        const geoDetails = extractIncidentLocation(textToSend);
        botResponse = `🤖 Confirmed. Road diversion rules pushed to MapMyIndia APIs. Commuters are being dynamically rerouted around ${geoDetails.location.split(',')[0]}.`;
        onActivateDiversion(geoDetails.corridor);
      } else if (normText.includes('clear') || normText.includes('resolved') || normText === 'ack') {
        botResponse = '🤖 Understood. Acknowledging and updating system status. Thank you for the update, officer!';
      } else {
        // Evaluate incoming text using our trained ML models
        const predictedType = predictIncidentType(textToSend);
        const geoDetails = extractIncidentLocation(textToSend);

        botResponse = `🤖 ML CLASSIFIER LOGGED: ${predictedType.toUpperCase().replace('_', ' ')}\n📍 Location: ${geoDetails.location}\n🛣️ Corridor: ${geoDetails.corridor}\n\nTriggering recovery playbook. Is a diversion needed? (Reply: 1 for Yes)`;
        
        onAddIncidentFromBot(
          predictedType,
          geoDetails.location,
          geoDetails.lat,
          geoDetails.lon,
          `Officer report: "${textToSend}"`
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now() + 1}`,
          sender: 'bot',
          text: botResponse,
          timestamp: time,
        },
      ]);
    }, 1000);
  };

  const handleSimulatePhotoUpload = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const officerPhoto: Message = {
      id: `m_${Date.now()}`,
      sender: 'officer',
      text: '📸 Sent a photo',
      timestamp: time,
      image: '/api/placeholder/400/300', // standard visual indicator placeholder
    };

    setMessages((prev) => [...prev, officerPhoto]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now() + 1}`,
          sender: 'bot',
          text: '🤖 Photo received.\n⚡ AI analysis of image:\n- Obstruction: Heavy wood debris (Tree trunk)\n- Severity: HIGH\n\nUpdated estimated clearance time: 3 hours.\nDiversion signage coordinates updated.',
          timestamp: time,
        },
      ]);
    }, 1200);
  };

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full min-h-[350px]">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
            WhatsApp Field Officer Bot
          </h2>
          <p className="text-[10px] text-slate-400">Mock mobile integration with on-field responders</p>
        </div>
        <button
          onClick={() => window.open('/whatsapp', '_blank')}
          title="Open in new tab"
          className="p-1 hover:bg-slate-900 border border-slate-800 rounded transition text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Screen Wrapper */}
      <div className="flex-1 bg-[#0b141a] rounded-lg border border-slate-900 flex flex-col h-[230px] my-3 overflow-hidden shadow-inner">
        {/* Header */}
        <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between border-b border-[#2d3a42]">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white">
              A
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-200">ASTRAM Command Bot</p>
              <p className="text-[8px] text-emerald-400">online</p>
            </div>
          </div>
          <div className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1 rounded flex items-center space-x-0.5">
            <Sparkles className="w-2 h-2 text-emerald-400" />
            <span>AI Powered</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[80%] rounded p-2 text-[10px] leading-relaxed shadow-sm ${
                msg.sender === 'officer'
                  ? 'self-end bg-[#005c4b] text-slate-100 ml-auto'
                  : 'bg-[#202c33] text-slate-100'
              }`}
            >
              {msg.text.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}

              {msg.image && (
                <div className="mt-1.5 border border-[#2d3a42] rounded overflow-hidden relative bg-slate-900/60 p-2 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] text-slate-400">tree_fall_incident.jpg</span>
                </div>
              )}

              <div className="text-[8px] text-slate-400 text-right mt-1 flex items-center justify-end space-x-0.5">
                <span>{msg.timestamp}</span>
                {msg.sender === 'officer' && <Check className="w-2.5 h-2.5 text-emerald-400" />}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-2 py-1 bg-[#111b21] border-t border-[#2d3a42] flex space-x-1.5 overflow-x-auto">
          {[
            { label: '🌲 Tree Fall', text: 'Tree fall Sankey Road' },
            { label: '🚗 Accident', text: 'Accident Silk Board' },
            { label: '🌊 Waterlogging', text: 'Water logging ORR' },
            { label: '🔀 Divert', text: '1' },
            { label: '✅ Clear', text: 'ack' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.text)}
              className="text-[8px] bg-[#202c33] hover:bg-[#2a3942] border border-[#2d3a42] text-slate-350 hover:text-slate-200 px-2 py-0.5 rounded transition cursor-pointer whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="bg-[#202c33] p-1.5 flex items-center space-x-1 border-t border-[#2d3a42]">
          <button
            onClick={handleSimulatePhotoUpload}
            title="Upload simulated incident photo"
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Type command..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-[#2a3942] border-none text-[10px] text-slate-200 rounded px-2.5 py-1.5 focus:outline-none placeholder-slate-500"
          />
          <button
            onClick={() => handleSend()}
            className="p-1.5 bg-[#00a884] hover:bg-[#008f72] text-white rounded-full flex items-center justify-center transition cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
