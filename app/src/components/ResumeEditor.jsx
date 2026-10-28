import React, { useState } from 'react';

export default function ResumeEditor({ form, setForm, missingKeywords, jobTitle }) {
  const [loadingSection, setLoadingSection] = useState(null);

  const handleAiImprove = async (sectionName, sectionData) => {
    setLoadingSection(sectionName);
    try {
      const response = await fetch('/api/resume/optimize-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sectionName,
          sectionData,
          context: { targetRole: jobTitle, keywords: missingKeywords }
        })
      });
      const data = await response.json();
      if (data.success && data.improvedSection) {
        setForm(prev => ({ ...prev, [sectionName]: data.improvedSection }));
      } else {
        alert(data.message || 'Failed to optimize section');
      }
    } catch (err) {
      console.error(err);
      alert('Error optimizing section.');
    } finally {
      setLoadingSection(null);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (index, field, key, value) => {
    const newArr = [...form[field]];
    newArr[index] = { ...newArr[index], [key]: value };
    setForm({ ...form, [field]: newArr });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
      <h2 className="text-xl font-bold border-b pb-2">Edit Resume</h2>
      
      {/* Basics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Personal Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <input className="input input-bordered w-full" name="name" value={form.name || form.fullName || ''} onChange={handleChange} placeholder="Full Name" />
          <input className="input input-bordered w-full" name="email" value={form.email || ''} onChange={handleChange} placeholder="Email" />
          <input className="input input-bordered w-full" name="phone" value={form.phone || ''} onChange={handleChange} placeholder="Phone" />
          <input className="input input-bordered w-full" name="location" value={form.location || ''} onChange={handleChange} placeholder="Location" />
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Summary</h3>
          <button 
            className="btn btn-sm btn-outline btn-primary"
            onClick={() => handleAiImprove('summary', form.summary)}
            disabled={loadingSection === 'summary'}
          >
            {loadingSection === 'summary' ? 'Improving...' : '✨ Improve this section'}
          </button>
        </div>
        <textarea className="textarea textarea-bordered w-full h-32" name="summary" value={form.summary || ''} onChange={handleChange} placeholder="Professional summary..."></textarea>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Skills</h3>
          <button 
            className="btn btn-sm btn-outline btn-primary"
            onClick={() => handleAiImprove('skills', form.skills)}
            disabled={loadingSection === 'skills'}
          >
            {loadingSection === 'skills' ? 'Improving...' : '✨ Improve this section'}
          </button>
        </div>
        <textarea className="textarea textarea-bordered w-full" name="skills" value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills || '')} onChange={(e) => setForm({...form, skills: e.target.value.split(',').map(s=>s.trim())})} placeholder="Comma separated skills"></textarea>
      </div>

      {/* Experience */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Experience</h3>
          <button 
            className="btn btn-sm btn-outline btn-primary"
            onClick={() => handleAiImprove('experience', form.experience)}
            disabled={loadingSection === 'experience'}
          >
            {loadingSection === 'experience' ? 'Improving...' : '✨ Improve all experience'}
          </button>
        </div>
        {(form.experience || []).map((exp, idx) => (
          <div key={idx} className="border p-4 rounded bg-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="input input-bordered input-sm" value={exp.title || ''} onChange={(e) => handleArrayChange(idx, 'experience', 'title', e.target.value)} placeholder="Job Title" />
              <input className="input input-bordered input-sm" value={exp.company || ''} onChange={(e) => handleArrayChange(idx, 'experience', 'company', e.target.value)} placeholder="Company" />
              <input className="input input-bordered input-sm" value={exp.startDate || ''} onChange={(e) => handleArrayChange(idx, 'experience', 'startDate', e.target.value)} placeholder="Start Date" />
              <input className="input input-bordered input-sm" value={exp.endDate || ''} onChange={(e) => handleArrayChange(idx, 'experience', 'endDate', e.target.value)} placeholder="End Date" />
            </div>
            <textarea className="textarea textarea-bordered w-full h-24" value={exp.responsibilities || ''} onChange={(e) => handleArrayChange(idx, 'experience', 'responsibilities', e.target.value)} placeholder="Bullet points..."></textarea>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Projects</h3>
          <button 
            className="btn btn-sm btn-outline btn-primary"
            onClick={() => handleAiImprove('projects', form.projects)}
            disabled={loadingSection === 'projects'}
          >
            {loadingSection === 'projects' ? 'Improving...' : '✨ Improve all projects'}
          </button>
        </div>
        {(form.projects || []).map((proj, idx) => (
          <div key={idx} className="border p-4 rounded bg-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="input input-bordered input-sm" value={proj.title || ''} onChange={(e) => handleArrayChange(idx, 'projects', 'title', e.target.value)} placeholder="Project Title" />
              <input className="input input-bordered input-sm" value={proj.techStack || ''} onChange={(e) => handleArrayChange(idx, 'projects', 'techStack', e.target.value)} placeholder="Tech Stack" />
            </div>
            <textarea className="textarea textarea-bordered w-full h-24" value={proj.description || ''} onChange={(e) => handleArrayChange(idx, 'projects', 'description', e.target.value)} placeholder="Project details..."></textarea>
          </div>
        ))}
      </div>

    </div>
  );
}
