import React, { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy debounced search for UI purposes. Real implementation would pass to parent
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className={`relative flex items-center w-full max-w-3xl bg-white rounded-2xl transition-all duration-300 ${isFocused ? 'shadow-lg ring-2 ring-teal-500/50' : 'shadow-md border border-slate-200'}`}>
      <div className="pl-5 text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
      <input 
        type="text" 
        className="w-full bg-transparent border-none py-4 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 text-base font-medium"
        placeholder="Search jobs, companies or skills..."
        value={searchTerm}
        onChange={handleSearch}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm('')} 
          className="pr-5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
