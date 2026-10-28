import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CompanyLogo from './CompanyLogo'
import StatusBadge from './StatusBadge'
import { extractSalary } from '../utils/MatchEngine'
import { extractLogoUrl, extractCompanyName, extractMatchScore } from '../utils/jobHelpers'

export default function JobCard({ job }) {
  const { saveJob, likeJob, applyToJob, applications, savedJobs, likedJobs } = useApp()
  const navigate = useNavigate()
  
  // Determine statuses
  let status = 'New';
  if (savedJobs.some(s => s.jobId?._id === job.id || s.jobId === job.id)) status = 'Saved';
  const app = applications.find(a => a.jobId?._id === job.id || a.jobId === job.id);
  if (app) status = app.status;

  const isLiked = likedJobs.some(l => l.jobId?._id === job.id || l.jobId === job.id);
  const isApplied = status === 'APPLIED' || status === 'INTERVIEW' || status === 'OFFER' || status === 'REJECTED' || status === 'Applied';

  const handleApplyClick = async () => {
    // Open URL in new tab
    const url = job.apply_link || job.applyUrl || job.url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Mark as PENDING_SUBMISSION and store in local storage for return modal
    if (!isApplied && status !== 'PENDING_SUBMISSION') {
      await applyToJob(job, 'Manual');
    }
    localStorage.setItem('pendingApplyJob', JSON.stringify(job));
  };

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const md = job.matchDetails || { 
    score: extractMatchScore(job), 
    reasons: [], 
    category: 'Fair Match',
    roleMatchPct: 0,
    skillMatchPct: 0,
    locationMatchPct: 0,
    experienceMatchPct: 0
  };
  const safeScore = extractMatchScore(job);
  const safeCategory = typeof md.category === 'object' ? (md.category?.text || md.category?.label || 'Fair Match') : (md.category || 'Fair Match');

  const sStr = (val, fallback = '') => typeof val === 'object' && val !== null ? (val.text || val.label || val.name || fallback) : (val || fallback);

  // SVG Ring calculations
  const radius = 42;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const extractedSalary = extractSalary(job);

  // Use brand primary color for all scores or simple gradient
  const getScoreColors = (score) => {
    return { from: 'var(--primary)', to: 'var(--primary-dk)' };
  };

  const scoreData = getScoreColors(safeScore);
  const displayLabel = typeof safeCategory === 'string' 
    ? safeCategory.replace(/\s*\(.*?\)\s*/g, '').trim() 
    : safeCategory;

  const gradientId = `ringGrad-${job.id}`;

  return (
    <div 
      className="card hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden md:h-[160px] w-full" 
      onClick={handleCardClick}
      style={{ border: '1px solid var(--border)' }}
    >
      {/* 🔴 LEFT: Main Job Info 🔴 */}
      <div className="flex-1 p-5 flex flex-col min-w-0 justify-center h-full">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <CompanyLogo 
              logoUrl={extractLogoUrl(job)} 
              companyName={extractCompanyName(job)} 
              textLogo={job.logo} 
              logoColor={job.logoColor} 
              size={56} 
            />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                {sStr(job.postedDate) || sStr(job.deadline) || 'Recently'}
              </span>
              {status !== 'New' && (
                <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider" style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>
                  {sStr(status)}
                </span>
              )}
            </div>
            
            <h3 className="font-bold text-[1.1rem] leading-tight text-slate-900 mb-1 truncate">{sStr(job.title, 'Job Title')}</h3>
            <p className="text-[0.85rem] text-slate-500 truncate mb-2.5">
              <span className="font-semibold text-slate-700">{sStr(extractCompanyName(job), 'Company')}</span>
              {job.industry && ` / ${sStr(job.industry)}`}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.75rem] text-slate-600 font-medium">
              {job.location && (
                <div className="flex items-center gap-1.5 truncate">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {sStr(job.location)}
                </div>
              )}
              {(job.employmentType || job.jobType) && (
                <div className="flex items-center gap-1.5 truncate">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {sStr(job.employmentType || job.jobType)}
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex items-center gap-1.5 truncate">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                  {sStr(job.experienceLevel)}
                </div>
              )}
              {extractedSalary && extractedSalary !== 'Not Disclosed' && (
                <div className="flex items-center gap-1.5 truncate text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {sStr(extractedSalary)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 MIDDLE: Redesigned Match Panel 🔴 */}
      <div className="w-full md:w-[160px] flex-shrink-0 p-4 flex flex-col items-center justify-center relative border-t md:border-t-0 md:border-l border-slate-100 h-full" style={{ background: '#f8fafc' }}>
         <div className="relative flex items-center justify-center mb-3">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor={scoreData.from} />
                   <stop offset="100%" stopColor={scoreData.to} />
                </linearGradient>
              </defs>
              <circle stroke="#e2e8f0" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
              <circle stroke={`url(#${gradientId})`} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }} r={normalizedRadius} cx={radius} cy={radius} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
              <span className="text-slate-800 font-extrabold text-xl leading-none flex items-baseline">
                {safeScore}<span className="text-xs font-bold text-slate-500 ml-[1px]">%</span>
              </span>
            </div>
         </div>
         
         <span className="text-[0.65rem] font-bold tracking-wider uppercase text-center mt-2" style={{ color: 'var(--primary-dk)' }}>{displayLabel}</span>
      </div>

      {/* 🔴 RIGHT: Actions 🔴 */}
      <div 
        className="w-full md:w-[160px] min-w-[160px] flex-shrink-0 p-4 flex flex-row md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 bg-white h-full" 
        onClick={e => e.stopPropagation()}
      >
        {!isApplied ? (
          <button onClick={handleApplyClick} className="w-full px-3 py-2 rounded-xl font-bold text-sm text-white shadow-sm transition-transform hover:-translate-y-0.5 whitespace-nowrap flex-shrink-0" style={{ background: 'var(--primary)' }}>
             Apply Now
          </button>
        ) : (
          <span className="w-full text-center px-3 py-2 rounded-xl font-bold text-sm cursor-default whitespace-nowrap flex-shrink-0" style={{ background: 'var(--primary-lt)', color: 'var(--primary-dk)' }}>
             ✓ Applied
          </span>
        )}

        <button onClick={() => likeJob(job.id, isLiked)} className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl font-semibold text-xs border transition-colors hover:bg-slate-50 whitespace-nowrap flex-shrink-0" style={{ borderColor: 'var(--border)', color: isLiked ? '#ef4444' : '#64748b' }}>
          {isLiked ? '❤️ Saved' : (
             <><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> Save</>
          )}
        </button>
      </div>
    </div>
  )
}
