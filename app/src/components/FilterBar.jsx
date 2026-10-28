import React from 'react';

const FILTER_OPTIONS = {
  location: ['All', 'United States', 'Remote', 'California', 'New York', 'Texas', 'London', 'India'],
  role: ['All', 'Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack', 'Data Scientist', 'Product Manager'],
  experience: ['All', 'Intern', 'New Grad', 'Entry Level', 'Mid Level', 'Senior', 'Staff', 'Principal'],
  employmentType: ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'],
  workMode: ['All', 'Remote', 'Hybrid', 'On-site'],
  datePosted: ['All', 'Past 24 hours', 'Past Week', 'Past Month'],
  industry: ['All', 'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education'],
  h1b: ['All', 'Sponsors H1B', 'No Sponsorship']
};

export default function FilterBar({ filters, onFilterChange, prefMatchCount }) {
  const handleChange = (key, value) => {
    onFilterChange(key, value === 'All' ? '' : value);
  };

  const renderSelect = (key) => {
    const options = FILTER_OPTIONS[key];
    const currentValue = filters[key] || 'All';
    const isActive = currentValue !== 'All';
    
    return (
      <div key={key} className="relative flex-shrink-0">
        <select
          value={currentValue}
          onChange={(e) => handleChange(key, e.target.value)}
          className={`appearance-none outline-none cursor-pointer px-3 py-1 pr-7 rounded-full text-[0.75rem] font-semibold transition-colors shadow-sm`}
          style={{ 
            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
            background: isActive ? 'var(--primary-lt)' : 'var(--bg-card)',
            color: isActive ? 'var(--primary-dk)' : 'var(--text-m)'
          }}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>
              {key === 'datePosted' && opt === 'All' ? 'Date Posted' : 
               key === 'location' && opt === 'All' ? 'Location' : 
               key === 'role' && opt === 'All' ? 'Role' : 
               key === 'experience' && opt === 'All' ? 'Experience' : 
               key === 'employmentType' && opt === 'All' ? 'Employment' : 
               key === 'workMode' && opt === 'All' ? 'Work Mode' : 
               key === 'industry' && opt === 'All' ? 'Industry' : 
               key === 'h1b' && opt === 'All' ? 'H1B Sponsorship' : opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5" style={{ color: isActive ? 'var(--primary)' : 'var(--text-f)' }}>
          <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    );
  };

  return (
    <div className="sticky top-[60px] z-20 px-5 py-2 -mx-5 mb-4" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          {/* Row 1 */}
          <div className="flex flex-wrap items-center gap-2">
            {['location', 'role', 'experience', 'employmentType', 'workMode'].map(renderSelect)}
          </div>
          
          {/* Row 2 */}
          <div className="flex flex-wrap items-center gap-2">
            {['datePosted', 'industry', 'h1b'].map(renderSelect)}
            
            <button 
              onClick={() => {
                Object.keys(FILTER_OPTIONS).forEach(k => onFilterChange(k, ''));
              }}
              className="px-3 py-1 rounded-full text-[0.75rem] font-bold flex-shrink-0 flex items-center gap-1 shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-b)', border: '1px solid var(--border)' }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {prefMatchCount !== undefined && (
          <div className="flex items-center justify-center gap-2 px-4 flex-shrink-0 rounded-full" 
               style={{ background: 'var(--primary-lt)', border: '1px solid rgba(31,122,108,.2)', height: '34px' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>★ {prefMatchCount} Pref Matches</span>
          </div>
        )}
      </div>
    </div>
  );
}
