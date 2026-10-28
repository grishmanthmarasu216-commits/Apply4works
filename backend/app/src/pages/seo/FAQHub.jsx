import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';

export default function FAQHub() {
  const [faqs, setFaqs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    import('../../data/seo/faqs.json')
      .then(module => setFaqs(module.default || module))
      .catch(e => console.log('FAQs not generated yet.'));
  }, []);

  const categories = ['All', ...new Set(faqs.map(f => f.category))];
  const filteredFaqs = activeCategory === 'All' ? faqs : faqs.filter(f => f.category === activeCategory);

  // Generate FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": filteredFaqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SEO 
        title="Frequently Asked Questions - Apply4Works" 
        description="Find answers to all your questions about ATS optimization, resume tailoring, and our AI job search tools." 
        canonical="/faq"
        structuredData={faqSchema}
      />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 text-gray-900">Frequently Asked Questions</h1>
        <p className="text-xl text-gray-600">Everything you need to know about navigating the ATS.</p>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl">
          <span className="loading loading-spinner text-primary"></span>
          <p className="mt-4 text-gray-500 font-medium">Generating FAQ database...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="collapse collapse-arrow bg-white border border-gray-100 shadow-sm rounded-xl">
                <input type="radio" name="faq-accordion" defaultChecked={i === 0} /> 
                <div className="collapse-title text-lg font-bold text-gray-900">
                  {faq.question}
                </div>
                <div className="collapse-content text-gray-600 prose max-w-none">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
