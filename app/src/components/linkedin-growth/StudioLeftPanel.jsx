import React from 'react';

export default function StudioLeftPanel({ 
  topic, setTopic, 
  category, setCategory, 
  userFocus, setUserFocus, 
  urlContext, setUrlContext,
  useResume, setUseResume,
  relevantLink, setRelevantLink,
  imageFile, setImageFile,
  imagePreview, setImagePreview,
  isGenerating, handleGenerate
}) {
  
  const SUGGESTIONS = [
    '🏆 Earned a Certification',
    '💼 Started an Internship',
    '🚀 Got a New Job',
    '📚 Learned a New Technology',
    '🛠 Completed a Project',
    '🎯 Career Achievement',
    '🤝 Networking Success',
    '📈 Industry Insight',
    '🏅 Award or Recognition'
  ];

  const STYLES = [
    { id: 'Professional', title: 'Professional', desc: 'Corporate tone' },
    { id: 'Storytelling', title: 'Storytelling', desc: 'Journey-focused' },
    { id: 'Friendly', title: 'Friendly', desc: 'Casual engaging tone' }
  ];

  // Map suggestion chips to categories internally to keep backend happy
  const handleSuggestionClick = (suggestion) => {
    setTopic(suggestion);
    let mappedCategory = 'Achievement';
    if (suggestion.includes('Certification')) mappedCategory = 'Certification Achievement';
    else if (suggestion.includes('Internship')) mappedCategory = 'Internship Completion';
    else if (suggestion.includes('New Job')) mappedCategory = 'New Job Update';
    else if (suggestion.includes('Project')) mappedCategory = 'Project Completion';
    else if (suggestion.includes('Technology')) mappedCategory = 'Learning New Technology';
    else if (suggestion.includes('Career') || suggestion.includes('Award')) mappedCategory = 'Promotion / Career Milestone';
    setCategory(mappedCategory);
  };

  const [selectedStyle, setSelectedStyle] = React.useState('Professional');

  return (
    <div className="flex flex-col gap-6">
      
      


      <div className="bg-white rounded-2xl shadow-lg shadow-brand-primary/10 border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Create Your LinkedIn Post
          </h2>
          <p className="text-xs text-slate-500 mt-1">Describe your achievement, update, milestone, project, certification, internship, or career story.</p>
        </div>
        
        <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Topic */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">What would you like to post about?</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3 py-1.5 bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary/20 rounded-full text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none h-28"
              placeholder="e.g. I just completed a huge React migration for my company, reducing load times by 40%..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            ></textarea>
          </div>

          <div className="h-px bg-slate-100 my-1"></div>

          {/* Advanced Context: URL & Resume */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Extract context from (Optional)</label>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                placeholder="Paste an article or project URL..."
                value={urlContext}
                onChange={(e) => setUrlContext(e.target.value)}
              />
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
                  checked={useResume}
                  onChange={(e) => setUseResume(e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Include my Resume achievements
                </span>
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1"></div>

          {/* Attachments: Link & Image */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Attachments (Optional)</label>
            <div className="flex flex-col gap-3">
              <input 
                type="url" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                placeholder="Relevant Link (e.g. https://github.com/...)"
                value={relevantLink}
                onChange={(e) => setRelevantLink(e.target.value)}
              />
              
              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center hover:bg-slate-100 transition-colors">
                {!imagePreview ? (
                  <>
                    <input 
                      type="file" 
                      id="image-upload" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-sm text-slate-600 font-medium">Upload Certificate / Image</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</span>
                    </label>
                  </>
                ) : (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg object-contain border border-slate-200" />
                    <button 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                      title="Remove Image"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category & Focus -> Replaced with Style Cards */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Writing Style</label>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              {STYLES.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`flex-1 min-w-[30%] p-2 rounded-xl border cursor-pointer transition-all ${selectedStyle === s.id ? 'bg-brand-light border-brand-primary ring-1 ring-brand-primary shadow-sm' : 'bg-white border-slate-200 hover:border-brand-primary/50 hover:bg-slate-50'}`}
                >
                  <div className={`text-xs font-bold truncate ${selectedStyle === s.id ? 'text-brand-primary' : 'text-slate-700'}`}>{s.title}</div>
                  <div className="text-[10px] leading-tight text-slate-500 mt-0.5 break-words">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
              ${isGenerating ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-brand-primary hover:bg-brand-dark hover:shadow-brand-primary/30 hover:-translate-y-0.5'}`}
          >
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Posts...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate LinkedIn Posts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

