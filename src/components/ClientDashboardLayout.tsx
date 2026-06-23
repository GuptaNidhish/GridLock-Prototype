'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState, SidebarType } from '../context/AppContext';
import { AiCopilot } from './AiCopilot';
import { WhatsAppBot } from './WhatsAppBot';
import { LiveFeed } from './LiveFeed';
import {
  Shield,
  Sparkles,
  AlertCircle,
  Clock,
  Power,
  Activity,
  MessageSquare,
  Cpu,
  Map,
  ClipboardList,
  Sliders,
  BarChart3,
  X,
} from 'lucide-react';

export const ClientDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const {
    engine,
    weather,
    incidents,
    alternativePlanActive,
    emergencyCorridorActive,
    activeSidebar,
    setActiveSidebar,
    showLiveFeed,
    setShowLiveFeed,
    handleAddIncident,
    handleExecuteAiAction,
    setAlternativePlanActive,
  } = useAppState();

  const activeCount = incidents.filter((i) => i.status === 'active').length;

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleSidebar = (type: SidebarType) => {
    setActiveSidebar((prev) => (prev === type ? null : type));
  };

  // Nav Items configuration
  const navItems = [
    { name: 'Map Control', path: '/', icon: Map },
    { name: 'Incident Center', path: '/tracker', icon: ClipboardList },
    { name: 'Orchestration', path: '/orchestration', icon: Sliders },
    { name: 'Performance Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans select-none overflow-hidden h-screen">
      {/* ═══════════════════════════════════════════════════════════
           HEADER / NAVBAR
         ═══════════════════════════════════════════════════════════ */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-2.5 flex justify-between items-center z-50 flex-shrink-0">
        <div className="flex items-center space-x-6">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-sky-500/10 border border-sky-500/30 rounded">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
              <h1 className="text-sm font-black tracking-wider uppercase text-slate-200">
                ASTRAM Command Center
              </h1>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Bengaluru City Police
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer border ${
                    isActive
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Live Status Indicators & Sidebar Toggles */}
        <div className="flex items-center space-x-3 text-[10px]">
          {/* Uptime */}
          <div className="bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded flex items-center space-x-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400 font-mono font-bold text-[9px]">{formatUptime(engine.uptime)}</span>
          </div>

          {/* System Clock */}
          <div className="bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <p className="text-sky-400 font-black font-mono text-xs tracking-wider">
              {engine.clock || '--:--:--'}
            </p>
          </div>

          {/* Active Alerts Count */}
          <div className="bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded flex items-center space-x-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <p className="text-red-400 font-black font-mono">{activeCount} Events</p>
          </div>

          {/* Mitigation */}
          <div className="hidden sm:flex bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <p className="text-emerald-400 font-black uppercase text-[8px]">
              {alternativePlanActive ? 'Rerouting Active' : 'Normal Ops'}
            </p>
          </div>

          {/* Simulation status */}
          <button
            onClick={engine.toggleSimulation}
            className={`px-2.5 py-1 rounded font-extrabold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer border ${
              engine.simulationActive
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/40'
                : 'bg-red-950/40 border-red-800/50 text-red-400 hover:bg-red-900/40'
            }`}
          >
            <Power className="w-3 h-3" />
            <span className="text-[9px]">Sim: {engine.simulationActive ? 'LIVE' : 'OFF'}</span>
          </button>

          <div className="w-px h-5 bg-slate-900" />

          {/* Sidebar Drawer Toggles */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-900">
            {/* AI Copilot Toggle */}
            <button
              onClick={() => toggleSidebar('copilot')}
              className={`p-1.5 rounded transition cursor-pointer flex items-center space-x-1 border ${
                activeSidebar === 'copilot'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle AI Co-pilot Drawer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="text-[8px] uppercase font-bold tracking-wider px-0.5">Co-Pilot</span>
            </button>

            {/* WhatsApp Bot Toggle */}
            <button
              onClick={() => toggleSidebar('whatsapp')}
              className={`p-1.5 rounded transition cursor-pointer flex items-center space-x-1 border ${
                activeSidebar === 'whatsapp'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle WhatsApp Responder Drawer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[8px] uppercase font-bold tracking-wider px-0.5">WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation links overlay */}
      <div className="lg:hidden bg-slate-950 px-4 py-2 border-b border-slate-900 flex justify-around flex-shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition ${
                isActive ? 'text-sky-400 bg-sky-950/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
           MAIN BODY SPLIT (CONTENT + SIDEBAR)
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Area: Main Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#05070f] p-4 lg:p-6 transition-all duration-300">
          {children}
        </main>

        {/* Right Area: Dynamic Drawer Sidebar (slides in/out or sits side-by-side) */}
        <aside
          className={`h-full border-l border-slate-900 bg-slate-950/90 backdrop-blur-md transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 relative ${
            activeSidebar ? 'w-[400px] opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'
          }`}
        >
          {activeSidebar && (
            <div className="flex-1 flex flex-col min-h-0 relative p-4 h-full">
              {/* Close Sidebar button */}
              <button
                onClick={() => setActiveSidebar(null)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Sidebar Content Switcher */}
              <div className="flex-1 min-h-0 h-full">
                {activeSidebar === 'copilot' && (
                  <AiCopilot
                    weather={weather}
                    activeIncidentsCount={activeCount}
                    alternativePlanActive={alternativePlanActive}
                    emergencyCorridorActive={emergencyCorridorActive}
                    onExecuteAction={handleExecuteAiAction}
                  />
                )}
                {activeSidebar === 'whatsapp' && (
                  <WhatsAppBot
                    onAddIncidentFromBot={(type, location, lat, lon, desc) =>
                      handleAddIncident(type, location, lat, lon, desc)
                    }
                    onActivateDiversion={(corridor) => setAlternativePlanActive(true)}
                  />
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           FLOATING LIVE FEED OVERLAY
         ═══════════════════════════════════════════════════════════ */}
      <LiveFeed
        entries={engine.feedEntries}
        visible={showLiveFeed}
        onToggle={() => setShowLiveFeed(!showLiveFeed)}
      />
    </div>
  );
};
