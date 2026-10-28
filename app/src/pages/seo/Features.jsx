import React from 'react';
import SEO from '../../components/SEO';
import { Link } from 'react-router-dom';

export default function Features() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <SEO 
        title="Features - AI Resume Optimizer & Job Tracker" 
        description="Discover all the powerful features of Jobright AI. Generate perfect resumes, track applications, and beat the ATS." 
        canonical="/features"
      />
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">Everything you need to land your next job.</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We combine advanced AI models with deterministic ATS analysis to give you the ultimate unfair advantage in your job search.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">🎯</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Domain-Based Job Discovery</h3>
          <p className="text-gray-600 leading-relaxed">
            Stop scrolling through irrelevant jobs. Tell us your industry, domain, and target roles, and our engine will surface only the positions that perfectly match your career trajectory.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6">🤖</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Resume Optimizer</h3>
          <p className="text-gray-600 leading-relaxed">
            Don't guess what the recruiter wants to see. We analyze the job description and instantly rewrite your resume bullets to highlight the exact skills and keywords the ATS is looking for.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Deterministic ATS Scoring</h3>
          <p className="text-gray-600 leading-relaxed">
            See your exact match score before you apply. Our proprietary ATS engine calculates missing skills, title matches, and experience alignment so you know exactly where you stand.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-2xl mb-6">📋</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Visual Application Tracker</h3>
          <p className="text-gray-600 leading-relaxed">
            Ditch the spreadsheets. Track every application through a visual Kanban pipeline from "Applied" to "Interview" to "Offer".
          </p>
        </div>
      </div>

      <div className="text-center bg-gray-50 rounded-3xl p-12 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to upgrade your job search?</h2>
        <Link to="/register" className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/30">
          Get Started for Free
        </Link>
      </div>
    </div>
  );
}
