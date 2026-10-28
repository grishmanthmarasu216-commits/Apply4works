import React from 'react';
import { Link } from 'react-router-dom';

export default function UpgradePrompt() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px] bg-[#f4f7f9] p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl p-10 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#0B1E36]/10 rounded-full blur-3xl"></div>
        
        <div className="w-20 h-20 bg-[#0B1E36] rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg transform -rotate-3">
          <svg className="w-10 h-10 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-extrabold text-[#0B1E36] mb-2 relative z-10">Upgrade to Pro</h2>
        <p className="text-slate-500 mb-8 relative z-10 text-[15px]">Supercharge your career with our most powerful AI features.</p>
        
        <div className="bg-slate-50 rounded-xl p-6 text-left mb-8 relative z-10 border border-slate-100">
          <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4">Unlock Premium Features:</h4>
          <ul className="flex flex-col gap-3">
            {[
              'AI Resume Optimization',
              'Knowledge Hub',
              'LinkedIn Growth Studio',
              'Advanced Career Insights'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <Link to="/pricing" className="block w-full py-4 bg-[#0B1E36] hover:bg-[#0f2a4a] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative z-10">
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
