import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import ReactMarkdown from 'react-markdown';

export default function IndustryLanding() {
  const { industry } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../data/seo/industries.json')
      .then(module => {
        setData(module.default || module);
        setLoading(false);
      })
      .catch(e => {
        console.log('Industries not generated yet.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner text-primary"></span></div>;
  }

  const industryData = data.find(i => i.industrySlug === industry);

  if (!industryData && data.length > 0) {
    return <Navigate to="/" replace />;
  }

  if (!industryData) return null;

  return (
    <div className="bg-white">
      <SEO 
        title={`${industryData.title} | Apply4Works`} 
        description={industryData.heroSubtitle}
        canonical={`/resume-builder-for-${industry}`}
      />
      
      {/* Hero Section */}
      <section className="bg-primary/5 py-20 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            {industryData.title}
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            {industryData.heroSubtitle}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/30">
              Build Your Resume Now
            </Link>
            <Link to="/features" className="btn btn-outline btn-lg px-8 rounded-full bg-white">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">The Challenge</h2>
          <ul className="space-y-4">
            {industryData.painPoints?.map((point, i) => (
              <li key={i} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-1 text-sm font-bold">!</div>
                <p className="text-gray-700">{point}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How Apply4Works Helps</h2>
          <ul className="space-y-4">
            {industryData.howApply4WorksHelps?.map((point, i) => (
              <li key={i} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-1 text-sm font-bold">✓</div>
                <p className="text-gray-700">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
          <ReactMarkdown>{industryData.seoContent}</ReactMarkdown>
        </div>
      </section>
    </div>
  );
}
