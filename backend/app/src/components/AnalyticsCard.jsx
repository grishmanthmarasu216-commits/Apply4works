import React from 'react';

export default function AnalyticsCard({ title, value, icon, trend, colorClass }) {
  return (
    <div className="card p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-slate-400 font-medium">vs last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${colorClass}`}></div>
    </div>
  );
}
