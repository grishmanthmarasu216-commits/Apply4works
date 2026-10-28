import React from 'react';
import SEO from '../../components/SEO';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SEO 
        title="About Us" 
        description="Learn about the mission and team behind Jobright AI." 
        canonical="/about"
      />
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">About Jobright AI</h1>
      
      <div className="prose prose-lg max-w-none text-gray-700">
        <p className="mb-6">
          At Jobright AI, our mission is to level the playing field for job seekers around the world. We believe that your talent and experience should speak louder than algorithms and keyword filters.
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-900">The ATS Problem</h2>
        <p className="mb-6">
          Did you know that over 75% of resumes are rejected by Applicant Tracking Systems (ATS) before a human ever reads them? It's not because the candidates aren't qualified; it's because their resumes aren't perfectly aligned with the rigid keyword requirements of the job description.
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-900">Our Solution</h2>
        <p className="mb-6">
          We built an intelligent platform that acts as your personal AI recruiter. We analyze your target job descriptions, compare them against your experience, and generate highly tailored, ATS-friendly resumes in seconds. 
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-900">Our Vision</h2>
        <p className="mb-6">
          We envision a future where applying for jobs is no longer a numbers game, but a highly targeted, strategic process that results in higher interview rates and better career outcomes for everyone.
        </p>
      </div>
    </div>
  );
}
