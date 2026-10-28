import React, { useRef, useEffect } from 'react';

// Auto-resizing textarea to feel like a seamless document editor
const AutoTextarea = ({ value, onChange, className, placeholder, ...props }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      placeholder={placeholder}
      className={`resize-none overflow-hidden bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded transition-all w-full outline-none p-1 -ml-1 ${className}`}
      {...props}
    />
  );
};

const AutoInput = ({ value, onChange, className, placeholder, ...props }) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded transition-all outline-none p-1 -ml-1 ${className}`}
    {...props}
  />
);

export default function DocumentResumeEditor({ form, set, updateArrayItem, addArrayItem, removeArrayItem }) {
  const safeExperience = Array.isArray(form.experience) ? form.experience : [];
  const safeProjects = Array.isArray(form.projects) ? form.projects : [];
  const safeEducation = Array.isArray(form.education) ? form.education : [];
  
  const displaySkills = typeof form.skills === 'string' ? form.skills : (Array.isArray(form.skills) ? form.skills.join(', ') : '');
  const displayCertifications = typeof form.certifications === 'string' ? form.certifications : (Array.isArray(form.certifications) ? form.certifications.join('\n') : '');

  return (
    <div className="w-full bg-white shadow-md rounded-sm border border-gray-200 mx-auto" style={{ maxWidth: '8.5in', minHeight: '11in', padding: '1in 0.75in' }}>
      
      {/* Header / Contact Info */}
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
        <AutoInput 
          className="text-4xl font-extrabold text-center text-gray-900 w-full mb-2" 
          value={form.name || ''} 
          onChange={e => set('name', e.target.value)} 
          placeholder="Your Full Name"
        />
        <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-gray-600">
          <AutoInput className="text-center w-40" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="Phone" />
          <span>•</span>
          <AutoInput className="text-center w-56" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="Email" />
          <span>•</span>
          <AutoInput className="text-center w-40" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Location" />
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 relative group">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Professional Summary</h2>
        <AutoTextarea 
          className="text-sm text-gray-700 leading-relaxed" 
          value={form.summary || ''} 
          onChange={e => set('summary', e.target.value)} 
          placeholder="Write a compelling professional summary..."
        />
      </div>

      {/* Experience */}
      <div className="mb-6">
        <div className="flex justify-between items-end border-b border-gray-300 mb-3 pb-1 group">
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Experience</h2>
          <button onClick={() => addArrayItem('experience', { company: '', title: '', duration: '', responsibilities: '' })} className="opacity-0 group-hover:opacity-100 text-emerald-600 font-bold text-xs uppercase hover:bg-emerald-50 px-2 py-1 rounded transition-opacity">+ Add Role</button>
        </div>
        
        {safeExperience.map((exp, idx) => (
          <div key={idx} className="mb-5 relative group/item">
            <div className="flex justify-between items-baseline mb-1">
              <div className="flex items-center gap-2 w-2/3">
                <AutoInput className="font-bold text-gray-900 text-base flex-1" value={exp?.title || ''} onChange={e => updateArrayItem('experience', idx, 'title', e.target.value)} placeholder="Job Title" />
                <span className="text-gray-400 font-bold">at</span>
                <AutoInput className="font-bold text-emerald-700 text-base flex-1" value={exp?.company || ''} onChange={e => updateArrayItem('experience', idx, 'company', e.target.value)} placeholder="Company Name" />
              </div>
              <AutoInput className="text-sm text-gray-500 font-semibold text-right w-1/3" value={exp?.duration || ''} onChange={e => updateArrayItem('experience', idx, 'duration', e.target.value)} placeholder="Jan 2020 - Present" />
            </div>
            <AutoTextarea 
              className="text-sm text-gray-700 leading-relaxed mt-1" 
              value={exp?.responsibilities || ''} 
              onChange={e => updateArrayItem('experience', idx, 'responsibilities', e.target.value)} 
              placeholder="- Bullet point 1&#10;- Bullet point 2"
            />
            <button onClick={() => removeArrayItem('experience', idx)} className="absolute -left-8 top-2 opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="Remove Experience">✕</button>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="mb-6">
        <div className="flex justify-between items-end border-b border-gray-300 mb-3 pb-1 group">
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Projects</h2>
          <button onClick={() => addArrayItem('projects', { title: '', techStack: '', description: '' })} className="opacity-0 group-hover:opacity-100 text-emerald-600 font-bold text-xs uppercase hover:bg-emerald-50 px-2 py-1 rounded transition-opacity">+ Add Project</button>
        </div>
        
        {safeProjects.map((proj, idx) => (
          <div key={idx} className="mb-5 relative group/item">
            <div className="flex items-center gap-2 mb-1">
              <AutoInput className="font-bold text-gray-900 text-base w-1/3" value={proj?.title || ''} onChange={e => updateArrayItem('projects', idx, 'title', e.target.value)} placeholder="Project Name" />
              <span className="text-gray-400">|</span>
              <AutoInput className="text-sm font-semibold text-indigo-600 flex-1 italic" value={proj?.techStack || ''} onChange={e => updateArrayItem('projects', idx, 'techStack', e.target.value)} placeholder="Tech Stack (e.g., React, Node.js)" />
            </div>
            <AutoTextarea 
              className="text-sm text-gray-700 leading-relaxed mt-1" 
              value={proj?.description || ''} 
              onChange={e => updateArrayItem('projects', idx, 'description', e.target.value)} 
              placeholder="Project description and impact..."
            />
            <button onClick={() => removeArrayItem('projects', idx)} className="absolute -left-8 top-2 opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="Remove Project">✕</button>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Skills & Technologies</h2>
        <AutoTextarea 
          className="text-sm font-medium text-gray-800 leading-relaxed" 
          value={displaySkills} 
          onChange={e => set('skills', e.target.value)} 
          placeholder="Comma separated skills..."
        />
      </div>

      {/* Education & Certifications */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-end border-b border-gray-300 mb-3 pb-1 group">
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Education</h2>
            <button onClick={() => addArrayItem('education', { institution: '', degree: '', year: '' })} className="opacity-0 group-hover:opacity-100 text-emerald-600 font-bold text-xs uppercase hover:bg-emerald-50 px-2 py-1 rounded transition-opacity">+ Add Ed</button>
          </div>
          {safeEducation.map((edu, idx) => (
            <div key={idx} className="mb-3 relative group/item">
              <AutoInput className="font-bold text-gray-900 text-sm w-full mb-0.5" value={edu?.institution || ''} onChange={e => updateArrayItem('education', idx, 'institution', e.target.value)} placeholder="University Name" />
              <div className="flex justify-between items-center">
                 <AutoInput className="text-sm text-gray-700 flex-1" value={edu?.degree || ''} onChange={e => updateArrayItem('education', idx, 'degree', e.target.value)} placeholder="Degree (e.g. BS Computer Science)" />
                 <AutoInput className="text-sm text-gray-500 font-semibold w-20 text-right" value={edu?.year || ''} onChange={e => updateArrayItem('education', idx, 'year', e.target.value)} placeholder="Year" />
              </div>
              <button onClick={() => removeArrayItem('education', idx)} className="absolute -left-8 top-1 opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="Remove Education">✕</button>
            </div>
          ))}
        </div>
        
        <div>
           <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Certifications</h2>
           <AutoTextarea 
             className="text-sm text-gray-700 leading-relaxed" 
             value={displayCertifications} 
             onChange={e => set('certifications', e.target.value)} 
             placeholder="List certifications (one per line)..."
           />
        </div>
      </div>

    </div>
  );
}
