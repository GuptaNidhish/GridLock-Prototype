'use client';

import React from 'react';
import { WhatsAppBot } from '../../components/WhatsAppBot';
import { Home, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function FullscreenWhatsapp() {
  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-6 justify-center items-center">
      <div className="w-full max-w-lg mb-4 flex justify-between items-center bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Link href="/" className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>WhatsApp Officer Link</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Fullscreen Field Terminal</p>
          </div>
        </div>
        <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
          Node Connected
        </span>
      </div>

      <div className="w-full max-w-lg h-[650px] border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <WhatsAppBot
          onAddIncidentFromBot={(type, loc, lat, lon, desc) => {
            alert(`WhatsApp Incident Dispatched:\nType: ${type}\nLocation: ${loc}\nDescription: ${desc}`);
          }}
          onActivateDiversion={(corridor) => {
            alert(`WhatsApp Command Executed: Route Vaccination Activated for ${corridor}`);
          }}
        />
      </div>
    </div>
  );
}
