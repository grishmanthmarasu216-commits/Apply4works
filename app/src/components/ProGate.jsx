import React from 'react';
import { useProAccess } from '../hooks/useProAccess';
import { Link } from 'react-router-dom';

export default function ProGate({ children, featureName = "This feature", inline = false, description, features }) {
  const isPro = useProAccess();

  if (isPro) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
        <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center mb-2 z-10 relative">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="font-bold text-lg text-slate-800 z-10 relative">{featureName} is a Pro Feature</h3>
        <p className="text-sm text-slate-600 mb-2 z-10 relative">Upgrade to the Pro Plan to unlock this capability and supercharge your job search.</p>
        <Link to="/payment" className="btn btn-primary btn-sm z-10 relative shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all">
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 min-h-[400px]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-lg relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-3 relative z-10">{featureName}</h2>
        <p className="text-slate-600 mb-6 relative z-10">
          {description || `${featureName} is exclusively available in our Pro Plan. Upgrade today to access advanced tools and get hired faster.`}
        </p>
        
        {features && features.length > 0 && (
          <ul className="text-left text-sm text-slate-700 mb-8 space-y-2 relative z-10 w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <Link to="/payment" className="btn btn-primary btn-lg w-full relative z-10 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center">
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
