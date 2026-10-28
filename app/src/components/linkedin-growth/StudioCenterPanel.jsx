import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function StudioCenterPanel({ isGenerating, generatedContent, editorContent, setEditorContent, handleGenerate }) {
  const { toast } = useApp();
  const [activeTab, setActiveTab] = useState('Professional');
  
  // Update editor content when switching tabs or when content finishes generating
  useEffect(() => {
    if (generatedContent && typeof generatedContent === 'object') {
      const lowerTab = activeTab.toLowerCase();
      let content = generatedContent[lowerTab];
      if (!content) {
        const firstKey = Object.keys(generatedContent)[0];
        if (firstKey) {
          const capitalized = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);
          setActiveTab(capitalized);
          content = generatedContent[firstKey];
        }
      }
      if (content) {
        setEditorContent(typeof content === 'string' ? content : content.text || content.content || JSON.stringify(content) || '');
      }
    }
  }, [generatedContent, activeTab, setEditorContent]);

  const handleCopy = () => {
    if (!editorContent) return;
    navigator.clipboard.writeText(editorContent);
    toast('Copied to clipboard!', 'success');
  };

  const scoreText = (text) => {
    if (!text) return 0;
    let score = 50;
    if (text.length > 500) score += 10;
    if (text.includes('?')) score += 10; // Question hook
    if ((text.match(/#/g) || []).length >= 3) score += 15; // Hashtags
    if (text.split('\n').length > 3) score += 15; // Good formatting
    return Math.min(score, 98); // AI always scores < 100 perfectly
  };

  const currentScore = scoreText(editorContent);

  if (isGenerating) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-8 flex flex-col h-full min-h-[500px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Grok is analyzing context...</h3>
            <p className="text-slate-500">Crafting personalized, high-engagement posts</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2">
          {['Professional', 'Storytelling', 'Engaging'].map(tab => (
            <div key={tab} className="w-28 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
          ))}
        </div>

        <div className="space-y-4 flex-1">
          <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse mt-8"></div>
        </div>
      </div>
    );
  }

  if (!generatedContent) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-400 mb-2">No Content Generated Yet</h3>
        <p className="text-slate-400 max-w-sm">Provide context on the left and click generate. Grok will create 3 high-performing variations for you.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-full min-h-[600px] overflow-hidden">
      
      {/* Tabs Header */}
      <div className="flex items-end px-6 pt-6 bg-slate-50 border-b border-slate-200">
        <div className="flex gap-1 w-full relative">
          {Object.keys(generatedContent).map(key => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const isActive = activeTab === label;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(label)}
                className={`py-3 px-6 text-sm font-bold rounded-t-xl transition-all relative z-10 
                  ${isActive ? 'bg-white text-brand-primary border border-b-0 border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}
              >
                {label}
                {isActive && <div className="absolute -bottom-px left-0 right-0 h-[2px] bg-white"></div>}
              </button>
            );
          })}
          
          <div className="ml-auto pb-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                <span className="text-xs font-bold font-serif">AI</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Generated by Groq</span>
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs font-bold">AI Quality Score: {currentScore}/100</span>
             </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col p-6 relative">
        <div className="absolute top-8 right-8 flex gap-2 z-10">
          <button 
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
            title="Copy to clipboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button 
            onClick={() => handleGenerate()}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
            title="Regenerate"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        <textarea
          className="w-full flex-1 resize-none bg-transparent outline-none text-slate-800 text-[15px] leading-relaxed custom-scrollbar pt-2"
          value={editorContent}
          onChange={(e) => setEditorContent(e.target.value)}
          placeholder="Your content will appear here..."
        ></textarea>
      </div>

    </div>
  );
}