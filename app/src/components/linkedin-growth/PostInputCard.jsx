import React from 'react';

const WRITING_STYLES = ['Professional', 'Storytelling', 'Thought Leadership', 'Technical Expert', 'Recruiter Friendly', 'Career Growth'];
const PROMPT_EXAMPLES = [
  'Completed a new project',
  'Earned a certification',
  'Learned a new technology',
  'Career milestone',
  'Industry insight'
];

export default function PostInputCard({ 
  topic, 
  setTopic, 
  writingStyle, 
  setWritingStyle, 
  isGenerating, 
  handleGenerate,
  usageAllowed
}) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-6">
      <h2 className="text-2xl font-extrabold text-[#0B1E36] mb-2">What would you like to post about?</h2>
      <p className="text-sm text-slate-500 mb-6">Enter a topic and let our AI generate 3 highly engaging variations.</p>

      <div className="mb-6">
        <textarea 
          className="w-full border border-slate-300 rounded-xl p-5 text-[15px] focus:ring-2 focus:ring-[#0B1E36] focus:border-[#0B1E36] outline-none resize-none transition-all leading-relaxed"
          rows="5"
          placeholder="e.g. I just deployed my first full-stack application using React and Node.js..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        ></textarea>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {PROMPT_EXAMPLES.map((ex, i) => (
            <span 
              key={i} 
              onClick={() => setTopic(ex)} 
              className="text-[13px] bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full cursor-pointer hover:bg-[#0B1E36] hover:text-white transition-colors border border-slate-200 font-medium"
            >
              {ex}
            </span>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 mb-2">Writing Style Focus</label>
        <div className="relative">
          <select 
            className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#0B1E36] appearance-none bg-slate-50 hover:bg-white transition-colors" 
            value={writingStyle} 
            onChange={(e) => setWritingStyle(e.target.value)}
          >
            {WRITING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Generate CTA */}
      <button 
        onClick={handleGenerate}
        disabled={isGenerating || !topic.trim() || !usageAllowed}
        className={`w-full py-4 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-3 text-lg
          ${isGenerating || !topic.trim() || !usageAllowed ? 'bg-[#0B1E36]/60 cursor-not-allowed' : 'bg-[#0B1E36] hover:bg-[#0f2a4a] hover:-translate-y-0.5 hover:shadow-xl'}
        `}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Generating AI Posts...
          </>
        ) : (
          <>
            <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Generate 3 Posts
          </>
        )}
      </button>
    </div>
  );
}
