import React from 'react';

export default function UsageCounter({ used, limit }) {
  const isLimitReached = used >= limit;
  const percentage = Math.min(((used || 0) / (limit || 1)) * 100, 100);

  return (
    <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Usage</span>
        <span className={`text-xs font-bold ${isLimitReached ? 'text-red-600' : 'text-slate-600'}`}>
          {used || 0} / {limit || 3} Generations
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1">
        <div 
          className={`h-1.5 rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-[#D4AF37]'}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {isLimitReached && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100 flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="leading-snug"><strong>Limit Reached:</strong> You have used all 3 LinkedIn post generations. Limit resets next month.</span>
        </div>
      )}
    </div>
  );
}
