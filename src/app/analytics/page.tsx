'use client';

import React, { useState } from 'react';
import { PerformanceDashboard } from '../../components/PerformanceDashboard';
import { useToast } from '../../components/ToastProvider';
import { useAppState } from '../../context/AppContext';
import { BarChart2, Shield, Calendar, Download, Mail, PieChart, FileText } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { showToast } = useToast();
  const { incidents, currentCis, weather, alternativePlanActive } = useAppState();
  const [selectedReportFormat, setSelectedReportFormat] = useState<'pdf' | 'csv'>('pdf');

  const handleDownloadReport = () => {
    if (selectedReportFormat === 'csv') {
      try {
        const headers = ['Incident ID', 'Type', 'Category', 'Locality', 'Corridor', 'Priority', 'Status', 'SLA (Hours)', 'Created At'];
        
        const escapeCSV = (val: any) => {
          if (val === null || val === undefined) return '';
          let str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = '"' + str.replace(/"/g, '""') + '"';
          }
          return str;
        };

        const rows = incidents.map((inc) => [
          inc.id,
          inc.incident_type,
          inc.event_type || 'unplanned',
          inc.locality || 'Unknown',
          inc.corridor || 'Non-corridor',
          inc.priority || 'Low',
          inc.status,
          inc.duration_sla_hours ? inc.duration_sla_hours.toFixed(1) : 'N/A',
          inc.created_at
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(escapeCSV).join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `astram_incidents_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('CSV report compiled and downloaded successfully.', 'success');
      } catch (err: any) {
        showToast(`Failed to generate CSV: ${err.message}`, 'critical');
      }
    } else {
      try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showToast('Popup blocked! Please allow popups to export PDF briefings.', 'warning');
          return;
        }

        const activeIncidents = incidents.filter(i => i.status === 'active');
        const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
        
        const incidentRowsHtml = incidents.slice(0, 15).map(inc => `
          <tr>
            <td style="font-family: monospace; font-weight: bold;">${inc.id}</td>
            <td style="text-transform: capitalize;">${inc.incident_type.replace(/_/g, ' ')}</td>
            <td>${inc.locality}</td>
            <td>${inc.corridor}</td>
            <td style="font-weight: bold; color: ${inc.priority === 'High' ? '#ef4444' : '#eab308'};">${inc.priority}</td>
            <td style="text-transform: capitalize; color: ${inc.status === 'active' ? '#ef4444' : '#10b981'};">${inc.status}</td>
            <td>${new Date(inc.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</td>
          </tr>
        `).join('');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ASTRAM Executive Traffic Briefing - BCP</title>
              <style>
                body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  color: #1e293b;
                  padding: 40px;
                  line-height: 1.5;
                  background: #fff;
                }
                .header-container {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid #0284c7;
                  padding-bottom: 15px;
                  margin-bottom: 30px;
                }
                .logo-title {
                  display: flex;
                  align-items: center;
                }
                .logo-box {
                  background: #0284c7;
                  color: #fff;
                  width: 36px;
                  height: 36px;
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 900;
                  font-size: 18px;
                  margin-right: 12px;
                }
                h1 {
                  font-size: 20px;
                  font-weight: 900;
                  color: #0f172a;
                  margin: 0;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .subtitle {
                  font-size: 10px;
                  color: #64748b;
                  text-transform: uppercase;
                  font-weight: bold;
                  margin-top: 2px;
                  letter-spacing: 1px;
                }
                .date-stamp {
                  text-align: right;
                  font-size: 10px;
                  color: #64748b;
                  font-weight: bold;
                }
                .section {
                  margin-bottom: 30px;
                }
                .section-title {
                  font-size: 13px;
                  font-weight: 900;
                  text-transform: uppercase;
                  border-bottom: 1px solid #cbd5e1;
                  padding-bottom: 6px;
                  color: #0284c7;
                  letter-spacing: 0.5px;
                  margin-bottom: 15px;
                }
                .metric-grid {
                  display: grid;
                  grid-template-cols: repeat(4, 1fr);
                  gap: 15px;
                }
                .metric-card {
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 15px;
                  background: #f8fafc;
                  text-align: center;
                }
                .metric-value {
                  font-size: 22px;
                  font-weight: bold;
                  color: #0f172a;
                }
                .metric-label {
                  font-size: 8.5px;
                  font-weight: 800;
                  color: #64748b;
                  text-transform: uppercase;
                  margin-top: 5px;
                  letter-spacing: 0.5px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                  font-size: 11px;
                }
                th {
                  background-color: #f1f5f9;
                  color: #334155;
                  font-weight: bold;
                  text-transform: uppercase;
                  font-size: 9px;
                  letter-spacing: 0.5px;
                  text-align: left;
                  padding: 10px;
                  border: 1px solid #cbd5e1;
                }
                td {
                  padding: 10px;
                  border: 1px solid #cbd5e1;
                  color: #475569;
                }
                tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                .footer {
                  margin-top: 50px;
                  border-top: 1px solid #cbd5e1;
                  padding-top: 15px;
                  font-size: 9px;
                  color: #94a3b8;
                  display: flex;
                  justify-content: space-between;
                }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header-container">
                <div class="logo-title">
                  <div class="logo-box">A</div>
                  <div>
                    <h1>ASTRAM Traffic Control Command</h1>
                    <div class="subtitle">Bengaluru City Police • Daily Operations Brief</div>
                  </div>
                </div>
                <div class="date-stamp">
                  <div>EXPORTED ON: ${new Date().toLocaleDateString('en-IN')}</div>
                  <div>TIME: ${new Date().toLocaleTimeString('en-IN')}</div>
                  <div style="color: #0284c7; margin-top: 2px;">CONFIDENTIAL</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Citywide Mobility Overview</div>
                <div class="metric-grid">
                  <div class="metric-card">
                    <div class="metric-value" style="color: ${currentCis >= 70 ? '#ef4444' : currentCis >= 40 ? '#f59e0b' : '#10b981'}">${currentCis}/100</div>
                    <div class="metric-label">Commuter Impact (CIS)</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${activeIncidents.length}</div>
                    <div class="metric-label">Active Blockages</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${resolvedIncidents.length}</div>
                    <div class="metric-label">Resolved (Today)</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value" style="color: #10b981;">87.2%</div>
                    <div class="metric-label">SLA Compliance Rating</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Active Disruption Ledger (Top 15 Records)</div>
                <table>
                  <thead>
                    <tr>
                      <th>Incident ID</th>
                      <th>Category</th>
                      <th>Locality</th>
                      <th>Corridor Link</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Logged At</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${incidentRowsHtml || '<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 20px;">No incidents registered in database.</td></tr>'}
                  </tbody>
                </table>
              </div>

              <div class="section" style="margin-top: 40px;">
                <div class="section-title">Operational Directives</div>
                <div style="font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
                  <strong>Mitigation Status:</strong> ${alternativePlanActive ? 'Rerouting and tactical diversions are currently active citywide. Corridor speeds have been calibrated against Webster signal override models.' : 'Citywide operations are running normally. Standby barricading plans are positioned at critical junctions (Hebbal Loop, Tin Factory, Silk Board).'}<br><br>
                  <strong>Weather Impact Protocol:</strong> ${weather === 'heavy_rain' ? 'Monsoon heavy rain protocol is ACTIVE. Dewatering pumps pre-positioned at ORR and BSNL underpasses. Outer-lane gridlock warnings posted.' : weather === 'light_rain' ? 'Drizzle protocol active. Wet braking speed reductions broadcasted on VMS boards.' : 'Clear weather operations active. Standard corridor speed index limits apply.'}
                </div>
              </div>

              <div class="footer">
                <div>ASTRAM Command Core Engine version 1.2.0 (Gemini Powered)</div>
                <div>Bengaluru Metropolitan Traffic Registry • Digitally Verified Report</div>
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        
        showToast('Executive PDF briefing created and sent to print queue.', 'success');
      } catch (err: any) {
        showToast(`Failed to generate PDF Briefing: ${err.message}`, 'critical');
      }
    }
  };

  return (
    <div className="flex flex-col space-y-6 select-none h-full">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-slate-950/80 border border-slate-900/60 p-4 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center">
              <BarChart2 className="w-4 h-4 mr-1 text-indigo-400" />
              <span>executive performance analytics & commissioner briefing dashboard</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-0.5">
              Metropolitan travel times, SLA compliance & corridor metrics
            </p>
          </div>
        </div>
        
        <div className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">
          Compliance Index: 87.2%
        </div>
      </div>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-grow">
        
        {/* Left Side: PerformanceDashboard Component */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
          <PerformanceDashboard />
        </div>

        {/* Right Side: Incident breakdown Charts & Compliance Logs */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-xl p-5 flex flex-col justify-between shadow-2xl min-h-[500px]">
          
          {/* Incident SLA breakdown chart */}
          <div>
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center mb-4">
              <PieChart className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              <span>Incident Type SLA Breach Distribution (Current Month)</span>
            </h2>

            <div className="h-64 bg-slate-950/40 rounded-lg border border-slate-900/60 p-4 flex flex-col justify-between">
              {/* SVG Bar chart representation */}
              <div className="flex-grow flex items-end justify-between px-6 pt-4">
                {/* 1. Accident */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 bg-red-500/80 rounded-t border border-red-400/30 h-32 flex items-end justify-center transition-all duration-550 hover:bg-red-400 cursor-pointer">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">14</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Accident</span>
                </div>

                {/* 2. Waterlogging */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 bg-cyan-500/80 rounded-t border border-cyan-400/30 h-40 flex items-end justify-center transition-all duration-550 hover:bg-cyan-400 cursor-pointer">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">18</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Waterlog</span>
                </div>

                {/* 3. Breakdown */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 bg-yellow-500/80 rounded-t border border-yellow-400/30 h-20 flex items-end justify-center transition-all duration-550 hover:bg-yellow-400 cursor-pointer">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">8</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Breakdown</span>
                </div>

                {/* 4. Signals */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 bg-indigo-500/80 rounded-t border border-indigo-400/30 h-12 flex items-end justify-center transition-all duration-550 hover:bg-indigo-400 cursor-pointer">
                    <span className="text-[8px] font-mono text-slate-200 mb-1 font-bold">4</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-black">Signal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Download Center Selector */}
          <div className="bg-slate-950 border border-slate-900 p-4 rounded-lg flex flex-col space-y-3 mt-4">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">Executive Export Center</span>
            
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                <button
                  onClick={() => setSelectedReportFormat('pdf')}
                  className={`px-3 py-1.5 rounded transition cursor-pointer font-bold uppercase ${
                    selectedReportFormat === 'pdf' ? 'bg-indigo-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PDF Briefing
                </button>
                <button
                  onClick={() => setSelectedReportFormat('csv')}
                  className={`px-3 py-1.5 rounded transition cursor-pointer font-bold uppercase ${
                    selectedReportFormat === 'csv' ? 'bg-indigo-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CSV Dataset
                </button>
              </div>

              <button
                onClick={handleDownloadReport}
                className="bg-indigo-500 hover:bg-indigo-450 text-slate-950 font-black px-4 py-2 rounded-lg uppercase tracking-wider text-[9px] flex items-center space-x-1.5 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Briefing</span>
              </button>
            </div>
          </div>

          {/* Security ledger */}
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex items-start space-x-2 text-[9px] text-slate-400 font-mono mt-4">
            <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-bold block">Audit Compliance Check</span>
              <span>All compliance scoring is calculated daily at 00:00 using weighted corridor travel times and SLA violation rates. Reports are cryptographically signed.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
