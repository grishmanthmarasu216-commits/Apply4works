import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function ProfessionPage() {
  const { profession } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../data/seo/professions.json')
      .then(module => {
        setData(module.default || module);
        setLoading(false);
      })
      .catch(e => {
        console.log('Professions not generated yet.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-20 text-center"><span className="loading loading-spinner text-primary"></span></div>;
  }

  const profData = data.find(p => p.slug === profession);

  if (!profData && data.length > 0) {
    return <Navigate to="/resources" replace />;
  }

  if (!profData) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SEO 
        title={`Top Resume Keywords & Skills for ${profData.profession} in 2026`} 
        description={`Discover the top ATS keywords, skills, and resume recommendations for a ${profData.profession} to land more interviews.`}
        canonical={`/resume-keywords/${profession}`}
      />
      
      <div className="mb-8">
        <Link to="/resources" className="text-sm font-bold text-primary hover:underline mb-8 inline-block">&larr; Back to Resources</Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Resume Keywords & ATS Guide for <span className="text-primary">{profData.profession}</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          {profData.description}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-primary">🔑</span> Top ATS Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {profData.topKeywords?.map(kw => (
              <span key={kw} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-md text-sm font-semibold">
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-green-500">🎯</span> Skills to Highlight
          </h2>
          <div className="flex flex-wrap gap-2">
            {profData.skillsToHighlight?.map(skill => (
              <span key={skill} className="bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-md text-sm font-semibold">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-orange-500">📋</span> Expert ATS Recommendations
        </h2>
        <ul className="space-y-4">
          {profData.atsRecommendations?.map((rec, i) => (
            <li key={i} className="flex gap-3 text-gray-700">
              <span className="text-orange-500 font-bold mt-0.5">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center bg-gray-50 rounded-3xl p-12 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Build your {profData.profession} resume now</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">Stop guessing which keywords to use. Let Apply4Works automatically optimize your resume for your target job description.</p>
        <Link to="/register" className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/30">
          Optimize My Resume
        </Link>
      </div>
    </div>
  );
}
