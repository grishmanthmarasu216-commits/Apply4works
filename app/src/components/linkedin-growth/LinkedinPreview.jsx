import React from 'react';

export default function LinkedinPreview({ content, name = "Alex Developer", headline = "Software Engineer | Building SaaS Products", timeAgo = "Just now" }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative">
      {/* Top stripe */}
      <div className="h-1 bg-[#0a66c2]"></div>
      
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
            <svg className="w-8 h-8 mt-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-[14px] leading-tight hover:text-[#0a66c2] hover:underline cursor-pointer">{name}</h4>
            <p className="text-xs text-slate-500 line-clamp-1">{headline}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">{timeAgo} • <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" /></svg></p>
          </div>
        </div>
        
        <div className="text-[13px] text-slate-800 whitespace-pre-wrap leading-snug font-sans break-words">
          {content || "Your generated content will appear here exactly as it would look on LinkedIn."}
        </div>
      </div>

      {/* Fake Engagement Bar */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-500">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center shadow-sm"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg></div>
            <div className="w-4 h-4 bg-red-500 rounded-full border border-white flex items-center justify-center shadow-sm"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg></div>
          </div>
          <span className="text-[11px] ml-1 hover:text-blue-600 hover:underline cursor-pointer">42</span>
        </div>
        <div className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline cursor-pointer">
          12 comments • 3 reposts
        </div>
      </div>

      {/* Fake Action Bar */}
      <div className="px-2 py-1.5 border-t border-slate-100 flex items-center justify-around">
        {['Like', 'Comment', 'Repost', 'Send'].map(action => (
          <button key={action} className="flex flex-col md:flex-row items-center gap-1.5 px-3 py-2 rounded-md hover:bg-slate-100 text-slate-500 font-semibold text-[11px] transition-colors">
            <div className="w-3.5 h-3.5 bg-slate-300 rounded-sm"></div>
            <span className="hidden sm:inline">{action}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

