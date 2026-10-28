import React, { useState, useEffect } from 'react';
import ResumeEditor from './ResumeEditor';
import { calculateRealTimeAts } from '../utils/frontendAtsEngine';

export default function ResumeWorkspace({ 
  form, 
  job, 
  set, 
  updateArrayItem, 
  addArrayItem, 
  removeArrayItem, 
  onOptimize, 
  isOptimizing,
  children
}) {
  const [atsData, setAtsData] = useState({ atsScore: 0, scoreBreakdown: {}, matchedSkills: [], missingSkills: [], suggestions: [] });
  const [showEditorModal, setShowEditorModal] = useState(false);

  // Real-time ATS Calculation
  useEffect(() => {
    if (job) {
      const result = calculateRealTimeAts(form, job);
      setAtsData(result);
    }
  }, [form, job]);

  const { atsScore, scoreBreakdown, missingSkills, matchedSkills, suggestions } = atsData;
  const isExcellent = atsScore >= 80;
  const scoreColor = isExcellent ? '#22c55e' : (atsScore >= 60 ? '#eab308' : '#ef4444');
  const scoreBg = isExcellent ? '#f0fdf4' : (atsScore >= 60 ? '#fefce8' : '#fef2f2');

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-20">
      
      {/* SECTION 1: ATS Analysis Dashboard */}
      <section className="card p-8 border shadow-sm flex flex-col md:flex-row gap-10 items-center bg-white" style={{ borderColor: 'var(--border)' }}>
        {/* Score Ring */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-36 h-36 flex items-center justify-center rounded-full shadow-inner" style={{ background: scoreBg, border: `8px solid ${scoreColor}` }}>
            <span className="font-extrabold text-5xl tracking-tight" style={{ color: scoreColor }}>{atsScore}</span>
            <span className="absolute bottom-3 text-[11px] uppercase font-bold text-gray-500 tracking-wider">Out of 100</span>
          </div>
          <p className="mt-4 font-bold text-gray-800 text-sm uppercase tracking-wide">ATS Match Score</p>
        </div>
        
        {/* Breakdown */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          {[
            { label: 'Skills Match', val: scoreBreakdown.skillsMatch || 0, color: 'var(--primary)' },
            { label: 'Keyword Match', val: scoreBreakdown.keywordMatch || 0, color: '#3b82f6' },
            { label: 'Completeness', val: scoreBreakdown.completeness || 0, color: 'var(--accent-dk)' },
            { label: 'Formatting', val: 95, color: '#10b981' }
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-gray-600 uppercase tracking-wide">{stat.label}</span>
                <span className="font-bold text-gray-900">{stat.val}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${stat.val}%`, background: stat.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: Keyword Optimization */}
      <section className="card p-8 border shadow-sm bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>Keyword Optimization</h2>
          <span className="px-4 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
            {matchedSkills.length} Keywords Matched
          </span>
        </div>

        {missingSkills.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Missing Keywords ({missingSkills.length})</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {missingSkills.map(s => (
                <span key={s} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 shadow-sm transition-colors hover:bg-red-100">
                  {s}
                </span>
              ))}
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div>
                <h3 className="font-bold text-sm text-gray-800">One-Click AI Optimization</h3>
                <p className="text-sm text-gray-600 mt-1">Intelligently incorporate these missing keywords into your experience and skills naturally while maintaining readability.</p>
              </div>
              <button 
                onClick={onOptimize} 
                disabled={isOptimizing}
                className="btn btn-primary px-8 py-3 whitespace-nowrap text-sm shadow-md hover:shadow-lg transition-all"
              >
                {isOptimizing ? 'Optimizing with AI...' : '✨ Add Recommended Keywords'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-sm">✓</div>
            <h3 className="font-bold text-green-800 text-lg">Perfect Keyword Match!</h3>
            <p className="text-sm text-green-700 mt-1 max-w-md">You have successfully included all critical ATS keywords for this role. Your resume is highly optimized.</p>
          </div>
        )}
      </section>

      {/* SECTION 3: Smart Recommendations */}
      {suggestions.length > 0 && (
        <section className="card p-8 border shadow-sm" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-indigo-800">
            <span>💡</span> AI Recommendations
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                <span className="text-indigo-500 mt-0.5 text-lg">✦</span>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{s}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4 & 5: Generated Resume Status & Edit Action */}
      <section className="card p-8 border shadow-sm bg-white flex flex-col md:flex-row justify-between items-center gap-6" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Tailored Resume is Ready</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">Review your generated content below or manually adjust specific sections to fine-tune your messaging and improve your ATS score further.</p>
        </div>
        <button 
          onClick={() => setShowEditorModal(true)}
          className="btn px-8 py-3 bg-gray-900 text-white hover:bg-gray-800 whitespace-nowrap font-semibold shadow-md text-sm transition-all hover:scale-105"
        >
          📝 Edit Resume
        </button>
      </section>

      {/* Editor Modal (Section 5) */}
      {showEditorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 md:p-10">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <h2 className="font-bold text-lg text-gray-800">Edit Resume Sections</h2>
              <div className="flex items-center gap-6">
                <div className="text-xs font-bold px-4 py-1.5 rounded-full shadow-sm" style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreColor}` }}>
                  Live ATS Score: {atsScore}
                </div>
                <button onClick={() => setShowEditorModal(false)} className="text-gray-400 hover:text-gray-900 font-bold p-2 transition-colors flex items-center gap-1 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
              <div className="max-w-3xl mx-auto">
                <p className="text-sm text-gray-500 mb-6 text-center">Changes made here are saved automatically and immediately reflected in your ATS Score.</p>
                <ResumeEditor 
                  form={form} 
                  set={set} 
                  updateArrayItem={updateArrayItem} 
                  addArrayItem={addArrayItem} 
                  removeArrayItem={removeArrayItem} 
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button onClick={() => setShowEditorModal(false)} className="btn btn-primary px-10 py-2.5 font-bold shadow-md">Done Editing</button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6 & 7: Live Preview */}
      <section className="mt-8 flex flex-col gap-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px bg-gray-300 flex-1"></div>
          <h2 className="text-xl font-bold text-gray-800 tracking-wide uppercase text-sm">Live Document Preview</h2>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>
        
        {/* We wrap children (the preview) in a neat container */}
        <div className="bg-gray-200 p-2 md:p-6 rounded-2xl shadow-inner border border-gray-300 min-h-[800px] overflow-hidden">
          {children}
        </div>
      </section>
    </div>
  );
}
