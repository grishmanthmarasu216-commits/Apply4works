import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import KnowledgeLatest from '../components/KnowledgeLatest';
import KnowledgeLearning from '../components/KnowledgeLearning';
import { useAuth } from '../context/AuthContext';
import { Newspaper, GraduationCap } from 'lucide-react';
import ProGateUpgrade from '../components/linkedin-growth/ProGateUpgrade';
import { useProAccess } from '../hooks/useProAccess';

export default function Knowledge() {
  const isProAccess = useProAccess();
  const [activeTab, setActiveTab] = useState('latest');
  const { storedPrefs } = useAuth();
  
  const role = storedPrefs?.roles?.length ? storedPrefs.roles.join(' and ') : 'Software Engineer';

  const renderTab = () => {
    switch(activeTab) {
      case 'latest': return <KnowledgeLatest />;
      case 'learning': return <KnowledgeLearning />;
      default: return <KnowledgeLatest />;
    }
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] w-full md:w-[calc(100%-240px)]">
        <TopBar 
          title="Knowledge Hub" 
          subtitle={`Personalized for ${role}`} 
        />
        <main className="p-7 flex flex-col gap-7 h-full">
          {!isProAccess ? (
            <div className="flex-1">
              <ProGateUpgrade 
                title="Knowledge Hub Pro" 
                description="Knowledge Hub is exclusively available in our Pro Plan. Upgrade today to access advanced learning tools and get hired faster."
                features={[
                  { title: "AI Interview Prep", desc: "Ace your interviews with AI.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                  { title: "DSA Roadmaps", desc: "Master algorithms step-by-step.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                  { title: "HR Interview Guides", desc: "Behavioral question strategies.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                  { title: "System Design", desc: "Architecture notes and tips.", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                  { title: "Resume Tips", desc: "Optimize for ATS software.", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { title: "Premium Content", desc: "Exclusive industry resources.", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }
                ]}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-7">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-[var(--border-color)]">
              <button
                onClick={() => setActiveTab('latest')}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'latest' 
                    ? 'border-[var(--primary)] text-[var(--primary)]' 
                    : 'border-transparent text-gray-500 hover:text-[var(--text-main)]'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                Latest
              </button>
              <button
                onClick={() => setActiveTab('learning')}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'learning' 
                    ? 'border-[var(--primary)] text-[var(--primary)]' 
                    : 'border-transparent text-gray-500 hover:text-[var(--text-main)]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Learning
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {renderTab()}
            </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
