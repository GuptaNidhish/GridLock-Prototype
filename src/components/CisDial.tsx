import React from 'react';

interface CisDialProps {
  score: number;
}

export const CisDial: React.FC<CisDialProps> = ({ score }) => {
  // Determine color and status text based on score
  let statusText = 'MINIMAL';
  let glowClass = 'glow-green';
  let strokeColor = '#10b981'; // Green
  let interpretation = 'Negligible impact. Flow is nominal.';

  if (score >= 80) {
    statusText = 'SEVERE';
    glowClass = 'glow-red';
    strokeColor = '#ef4444'; // Red
    interpretation = 'Citywide impact. Activate emergency rerouting.';
  } else if (score >= 60) {
    statusText = 'HIGH';
    glowClass = 'glow-red';
    strokeColor = '#f59e0b'; // Amber/Red glow
    interpretation = 'Major corridor delays. Heavy intervention needed.';
  } else if (score >= 40) {
    statusText = 'MODERATE';
    glowClass = 'glow-yellow';
    strokeColor = '#f59e0b'; // Orange
    interpretation = 'Localized congestion. standard diversions active.';
  } else if (score >= 20) {
    statusText = 'LOW';
    glowClass = 'glow-blue';
    strokeColor = '#0ea5e9'; // Blue
    interpretation = 'Minor delay on select links. Standard monitoring.';
  }

  // Circle path calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel p-6 flex flex-col items-center justify-between h-full min-h-[220px]">
      <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
        Commuter Impact Score (CIS)
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* SVG Gauge */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.8s ease',
              filter: `drop-shadow(0 0 6px ${strokeColor}aa)`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute text-center flex flex-col items-center">
          <span className={`text-4xl font-extrabold tracking-tight ${glowClass}`} style={{ color: strokeColor }}>
            {score}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 mt-1 uppercase">
            {statusText}
          </span>
        </div>
      </div>

      <div className="text-center mt-3">
        <p className="text-xs text-slate-300 font-medium px-2">{interpretation}</p>
      </div>
    </div>
  );
};
