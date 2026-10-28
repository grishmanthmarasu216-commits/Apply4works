import React, { useState, useEffect } from 'react';
import LinkedinPreview from './LinkedinPreview';

import { API_BASE } from '../../config/api';

export default function StudioRightPanel({ editorContent, drafts, onSelectDraft }) {
  const [localDrafts, setLocalDrafts] = useState([]);

  useEffect(() => {
    // If parent passed drafts, use those, else fetch locally
    if (drafts && drafts.length > 0) {
      setLocalDrafts(drafts);
    } else {
      fetchDrafts();
    }
  }, [drafts]);

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`${API_BASE}/linkedin/drafts`, { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setLocalDrafts(data);
      }
    } catch (err) {}
  };

  const charCount = editorContent?.length || 0;
  const hashCount = (editorContent?.match(/#/g) || []).length;
  
  // Basic optimization logic for UI feedback
  const charColor = charCount < 100 ? 'text-orange-500' : charCount > 3000 ? 'text-red-500' : 'text-green-500';
  const hashColor = hashCount === 0 ? 'text-orange-500' : hashCount > 5 ? 'text-orange-500' : 'text-green-500';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Stats Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Post Analytics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Characters</div>
            <div className={`text-lg font-bold ${charColor}`}>{charCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Optimal: 150-1300</div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-xs text-slate-500 mb-1">Hashtags</div>
            <div className={`text-lg font-bold ${hashColor}`}>{hashCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Optimal: 3-5</div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-heading overflow-hidden flex flex-col">
        <div className="bg-brand-heading px-4 py-3 text-white font-bold text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          Live LinkedIn Preview
        </div>
        <div className="bg-slate-100">
          <LinkedinPreview content={editorContent} />
        </div>
      </div>

      {/* Recent Drafts */}
      {localDrafts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Recent Drafts
          </h3>
          <div className="space-y-3">
            {localDrafts.slice(0, 3).map(draft => {
              const saveDate = new Date(draft.updatedAt || draft.createdAt);
              const formattedDate = `${saveDate.toLocaleDateString()} at ${saveDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
              
              return (
                <div 
                  key={draft._id} 
                  onClick={() => onSelectDraft && onSelectDraft(draft)}
                  className="p-3 bg-slate-50 hover:bg-brand-light rounded-xl border border-slate-100 hover:border-brand-primary/30 text-sm cursor-pointer transition-all group"
                  title="Click to load this draft"
                >
                  <div className="font-semibold text-slate-700 group-hover:text-brand-primary truncate transition-colors">{draft.topic || 'Untitled'}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Saved on {formattedDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

