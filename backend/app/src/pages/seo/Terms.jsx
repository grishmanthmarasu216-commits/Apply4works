import React from 'react';
import SEO from '../../components/SEO';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SEO 
        title="Terms of Service" 
        description="Terms and conditions for using Jobright AI." 
        canonical="/terms"
      />
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
        <h2 className="text-2xl font-bold mt-8 text-gray-900">1. Terms</h2>
        <p>By accessing the website at Jobright AI, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
        
        <h2 className="text-2xl font-bold mt-8 text-gray-900">2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on Jobright AI's website for personal, non-commercial transitory viewing only.</p>
        
        <h2 className="text-2xl font-bold mt-8 text-gray-900">3. Disclaimer</h2>
        <p>The materials on Jobright AI's website are provided on an 'as is' basis. Jobright AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      </div>
    </div>
  );
}
