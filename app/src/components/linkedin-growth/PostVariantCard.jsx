import React from 'react';
import { useApp } from '../../context/AppContext';

export default function PostVariantCard({ post, isSelected, onSelect }) {
  const { toast } = useApp();

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.text);
    toast('Copied Successfully', 'success');
  };

  return (
    <div 
      onClick={() => onSelect(post)}
      className={`bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer flex flex-col h-full relative group
        ${isSelected ? 'border-[#0B1E36] ring-1 ring-[#0B1E36]' : 'border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-md'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 bg-slate-100 text-[#0B1E36] font-bold text-xs rounded-full">{post.type} Version</span>
        <button 
          onClick={handleCopy}
          className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" 
          title="Copy Post"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
      </div>
      
      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[14px] flex-1 mb-6">
        {post.text}
      </div>
      
      <button 
        className={`w-full py-2.5 rounded-lg border-2 font-bold transition-all
          ${isSelected ? 'bg-[#0B1E36] border-[#0B1E36] text-white' : 'border-[#0B1E36] text-[#0B1E36] hover:bg-[#0B1E36] hover:text-white'}
        `}
      >
        {isSelected ? 'Editing...' : 'Select & Edit'}
      </button>
    </div>
  );
}
