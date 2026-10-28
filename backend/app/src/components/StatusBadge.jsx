import React from 'react';

const STATUS_CONFIG = {
  'Pending Submission': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'PENDING_SUBMISSION': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'New': { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  'Saved': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'Applied': { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
  'APPLIED': { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
  'Interview': { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
  'INTERVIEW': { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
  'Offer': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  'OFFER': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  'Rejected': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  'REJECTED': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  'WITHDRAWN': { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['New'];
  
  // Format display text (e.g., PENDING_SUBMISSION -> Pending Submission)
  let displayStatus = status;
  if (status === 'PENDING_SUBMISSION') displayStatus = 'Pending Submission';
  else if (status === 'APPLIED') displayStatus = 'Applied';
  else if (status === 'INTERVIEW') displayStatus = 'Interview';
  else if (status === 'OFFER') displayStatus = 'Offer';
  else if (status === 'REJECTED') displayStatus = 'Rejected';
  else if (status === 'WITHDRAWN') displayStatus = 'Withdrawn';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider ${config.bg} ${config.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {displayStatus}
    </span>
  );
}
