import React from 'react';

export default function MatchScore({ score }) {
  const normalizedScore = score ?? 0;
  
  let color = '#94A3B8'; // < 50 Gray
  if (normalizedScore >= 90) color = '#10B981'; // Green
  else if (normalizedScore >= 70) color = '#3B82F6'; // Blue
  else if (normalizedScore >= 50) color = '#F59E0B'; // Orange

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0" title={`${normalizedScore}% Match`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[0.65rem] font-bold" style={{ color: color }}>
        {normalizedScore}
      </span>
    </div>
  );
}
