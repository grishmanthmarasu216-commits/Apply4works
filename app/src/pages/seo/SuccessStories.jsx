import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import { Link } from 'react-router-dom';

export default function SuccessStories() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    import('../../data/seo/success-stories.json')
      .then(module => setStories(module.default || module))
      .catch(e => console.log('Success stories not generated yet.'));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SEO 
        title="Success Stories | Apply4Works" 
        description="Read how job seekers beat the ATS and landed their dream jobs using Apply4Works."
        canonical="/success-stories"
      />
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">Real Success Stories</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">See how Apply4Works is helping thousands of candidates double their interview rates.</p>
      </div>

      {stories.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {stories.map((story, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6 border-b pb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{story.name}</h3>
                  <p className="text-sm font-semibold text-primary">{story.role}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ATS Score</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-500 line-through">{story.beforeScore}%</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-lg font-extrabold text-green-500">{story.afterScore}%</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic leading-relaxed flex-1">"{story.story}"</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center bg-primary/5 rounded-3xl p-12 border border-primary/10">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Write Your Own Success Story</h2>
        <Link to="/register" className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/30">
          Get Started For Free
        </Link>
      </div>
    </div>
  );
}
