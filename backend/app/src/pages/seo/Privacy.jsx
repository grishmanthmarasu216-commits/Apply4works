import React from 'react';
import SEO from '../../components/SEO';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <SEO 
        title="Privacy Policy" 
        description="Learn how Jobright AI protects your data and privacy." 
        canonical="/privacy"
      />
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
        <p>Your privacy is important to us. It is Jobright AI's policy to respect your privacy and comply with any applicable law and regulation regarding any personal information we may collect about you.</p>
        
        <h2 className="text-2xl font-bold mt-8 text-gray-900">Information We Collect</h2>
        <p>Information we collect includes both information you knowingly and actively provide us when using or participating in any of our services and promotions, and any information automatically sent by your devices in the course of accessing our products and services.</p>
        
        <h2 className="text-2xl font-bold mt-8 text-gray-900">Log Data</h2>
        <p>When you visit our website, our servers may automatically log the standard data provided by your web browser. It may include your device’s Internet Protocol (IP) address, your browser type and version, the pages you visit, the time and date of your visit, the time spent on each page, other details about your visit, and technical details that occur in conjunction with any errors you may encounter.</p>
        
        <h2 className="text-2xl font-bold mt-8 text-gray-900">Personal Information</h2>
        <p>We may ask for personal information which may include one or more of the following: Name, Email, Resume Data, Employment History.</p>
      </div>
    </div>
  );
}
