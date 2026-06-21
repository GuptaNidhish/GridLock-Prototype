'use client';

import React, { useState } from 'react';
import { PerformanceDashboard } from '../../components/PerformanceDashboard';
import { Home, BarChart2, Shield, Calendar, Download, Mail, PieChart, FileText } from 'lucide-react';
import Link from 'next/link';
import { ToastProvider, useToast } from '../../components/ToastProvider';

function AnalyticsDashboardContent() {
  const { showToast } = useToast();
  const [selectedReportFormat, setSelectedReportFormat] = useState<'pdf' | 'csv'>('pdf');

  const handleDownloadReport = () => {
    showToast(`REPORT DOWNLOADED: Executed compile for ASTRAM Monthly Executive Briefing (Format: ${selectedReportFormat.toUpperCase()})`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans p-4 select-none">
      
      {/* Header */}
      <header className="w-full flex justify-between items-center bg-slate-950/90 border border-slate-900/60 p-4 rounded-xl shadow-2xl mb-4">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded hover:border-slate-700 transition cursor-pointer">
            <Home className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
              <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
                <BarChart2 className="w-4 h-4 mr-1 text-indigo-400" />
                <span>executive performance analytics & commissioner briefing dashboard</span>
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">Metropolitan Efficiency Metrics & Audit Compliance Reporting</p>
          </div>
        </div>
        <div className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded font-bold uppercase tracking-wider">
          Compliance Index: 87.2%
        </div>
      </header>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-grow">
        
        {/* Left Side: PerformanceDashboard Component */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <PerformanceDashboard />
        </div>

        {/* Right Side: Incident breakdown Charts & Compliance Logs */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
          
          {/* Incident SLA breakdown chart */}
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-3">
              <PieChart className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>incident type SLA breach distribution</span>
            </h2>

            <div className="h-60 bg-slate-950/40 rounded-lg border border-slate-900/60 p-4 flex flex-col justify-between">
              
              {/* SVG Bar chart representation */}
              <div className="flex-grow flex items-end justify-between px-6 pt-4">
                {/* 1. Accident */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-red-500/80 rounded-t border border-red-400/30 h-32 flex items-end justify-center">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">14</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Accident</span>
                </div>

                {/* 2. Waterlogging */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-cyan-500/80 rounded-t border border-cyan-400/30 h-40 flex items-end justify-center">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">18</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Waterlog</span>
                </div>

                {/* 3. Breakdown */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-yellow-500/80 rounded-t border border-yellow-400/30 h-20 flex items-end justify-center">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">8</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Breakdown</span>
                </div>

                {/* 4. Signals */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-indigo-500/80 rounded-t border border-indigo-400/30 h-12 flex items-end justify-center">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">4</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Signal</span>
                </div>
              </div>

            </div>
          </div>

          {/* Download Center Selector */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex flex-col space-y-2">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">Executive Export center</span>
            
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                <button
                  onClick={() => setSelectedReportFormat('pdf')}
                  className={`px-3 py-1 rounded transition cursor-pointer font-bold uppercase ${selectedReportFormat === 'pdf' ? 'bg-indigo-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  PDF Briefing
                </button>
                <button
                  onClick={() => setSelectedReportFormat('csv')}
                  className={`px-3 py-1 rounded transition cursor-pointer font-bold uppercase ${selectedReportFormat === 'csv' ? 'bg-indigo-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  CSV Dataset
                </button>
              </div>

              <button
                onClick={handleDownloadReport}
                className="bg-indigo-500 hover:bg-indigo-450 text-slate-950 font-black px-4 py-1.5 rounded uppercase tracking-wider text-[9.5px] flex items-center space-x-1 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5 mr-0.5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Security ledger */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-auto">
            <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Audit Compliance Check</span>
              <span>All compliance scoring is calculated daily at 00:00 using weighted corridor travel times and SLA violation rates.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function FullscreenAnalytics() {
  return (
    <ToastProvider>
      <AnalyticsDashboardContent />
    </ToastProvider>
  );
}
