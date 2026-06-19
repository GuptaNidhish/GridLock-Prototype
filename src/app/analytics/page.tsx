'use client';

import React from 'react';
import { PerformanceDashboard } from '../../components/PerformanceDashboard';
import { Home, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default function FullscreenAnalytics() {
  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-6 justify-center items-center">
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Link href="/" className="p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <BarChart2 className="w-3.5 h-3.5 mr-1 text-sky-400" />
              <span>Performance Analytics Briefing</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Fullscreen Executive Hub</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl h-[550px] border border-slate-900 rounded-xl overflow-hidden shadow-2xl bg-[#090d1a]">
        <PerformanceDashboard />
      </div>
    </div>
  );
}
