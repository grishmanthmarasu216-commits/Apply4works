import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ProGateUpgrade from '../components/linkedin-growth/ProGateUpgrade';
import StudioLeftPanel from '../components/linkedin-growth/StudioLeftPanel';
import StudioCenterPanel from '../components/linkedin-growth/StudioCenterPanel';
import StudioRightPanel from '../components/linkedin-growth/StudioRightPanel';
import { useApp } from '../context/AppContext';
import { useProAccess } from '../hooks/useProAccess';

import { API_BASE } from '../config/api';

export default function LinkedInGrowth() {
  const { toast, currentUser } = useApp();
  const isProAccess = useProAccess();

  // Left Panel State
  const [topic, setTopic] = useState('');
  const [urlContext, setUrlContext] = useState('');
  const [useResume, setUseResume] = useState(false);
  const [category, setCategory] = useState('Project Showcase');
  const [userFocus, setUserFocus] = useState('');
  const [relevantLink, setRelevantLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Center Panel State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Right Panel / Header State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  
  const isContentEmpty = typeof editorContent !== 'string' || !editorContent.trim();
  
  const autoSaveTimer = useRef(null);

  // Check auth and plan...
  useEffect(() => {
    fetchConnectionStatus();
    loadAutoDraft();
    fetchDrafts();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`${API_BASE}/linkedin/status`, { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.connected);
      }
    } catch (err) {}
  };

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await fetch(`${API_BASE}/linkedin/drafts`, { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (err) {}
  };

  const loadAutoDraft = () => {
    const saved = localStorage.getItem('linkedin_studio_draft');
    if (saved) setEditorContent(saved);
  };

  // Auto-save typing drafts locally
  useEffect(() => {
    if (editorContent) {
      const timeout = setTimeout(() => {
        localStorage.setItem('linkedin_studio_draft', editorContent);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [editorContent]);

  const handleSelectDraft = (draft) => {
    let content = draft.selectedContent || '';
    if (!content && draft.generatedVariations) {
      if (Array.isArray(draft.generatedVariations)) {
        content = draft.generatedVariations[0]?.text || '';
      } else if (typeof draft.generatedVariations === 'object') {
        const first = Object.values(draft.generatedVariations)[0];
        content = typeof first === 'string' ? first : (first?.text || first?.content || JSON.stringify(first) || '');
      }
    }
    setEditorContent(content);
    setSelectedPostId(draft._id);
    setTopic(draft.topic || '');
    if (draft.generatedVariations) {
      setGeneratedContent(draft.generatedVariations);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE}/linkedin/connect`, { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        toast('Unable to connect LinkedIn. Please try again.', 'error');
      }
    } catch (err) {
      toast('Unable to connect LinkedIn. Please try again.', 'error');
    }
  };

  const handleGenerate = async (overrideTopic = null, overrideCategory = null) => {
    const activeTopic = overrideTopic || topic;
    const activeCategory = overrideCategory || category;

    if (!activeTopic.trim()) {
      toast('Please enter a topic first', 'error');
      return;
    }
    
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE}/linkedin/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: activeTopic,
          category: activeCategory,
          userFocus,
          urlContext,
          useResume,
          attachedLink: relevantLink
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Generation failed');
      
      setGeneratedContent(data.variations);
      setSelectedPostId(data.postId);
      toast('Content generated successfully!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPostId || !editorContent) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE}/linkedin/drafts/${selectedPostId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editorContent })
      });
      if (res.ok) {
        toast('Draft saved successfully', 'success');
        fetchDrafts();
      }
    } catch (err) {
      toast('Failed to save draft', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPostId || !editorContent) return;
    if (!isConnected) {
      toast('Please connect LinkedIn first', 'error');
      return;
    }
    
    setIsPublishing(true);
    try {
      const token = localStorage.getItem('authToken');
      let finalImageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch(`${API_BASE}/linkedin/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload image');
        finalImageUrl = uploadData.imageUrl;
      }

      const res = await fetch(`${API_BASE}/linkedin/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          postId: selectedPostId, 
          content: editorContent,
          imageUrl: finalImageUrl,
          attachedLink: relevantLink
        })
      });
      if (res.ok) {
        toast('Successfully published to LinkedIn!', 'success');
        localStorage.removeItem('linkedin_studio_draft');
        setImageFile(null);
        setImagePreview(null);
      } else {
        throw new Error('Failed to publish');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedPostId || !editorContent || !scheduleDate) return;
    if (!isConnected) {
      toast('Please connect LinkedIn first', 'error');
      return;
    }
    
    setIsScheduling(true);
    try {
      const token = localStorage.getItem('authToken');
      let finalImageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch(`${API_BASE}/linkedin/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload image');
        finalImageUrl = uploadData.imageUrl;
      }

      const res = await fetch(`${API_BASE}/linkedin/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          postId: selectedPostId,
          content: editorContent,
          scheduledAt: scheduleDate,
          imageUrl: finalImageUrl,
          attachedLink: relevantLink
        })
      });
      if (res.ok) {
        toast('Successfully scheduled post!', 'success');
        setIsScheduleModalOpen(false);
        setScheduleDate('');
        localStorage.removeItem('linkedin_studio_draft');
        setImageFile(null);
        setImagePreview(null);
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to schedule');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  if (!isProAccess) {
    return (
      <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] w-full md:w-[calc(100%-240px)]">
          <TopBar 
            title="LinkedIn Growth Studio" 
            subtitle="Premium Content Creator" 
          />
          <main className="p-7 flex flex-col gap-7 h-full">
            <ProGateUpgrade />
          </main>
        </div>
      </div>
    );
  }

  // Pro users see the Full Screen 3-Panel Workspace
  return (
    <div className="flex bg-brand-bg min-h-screen font-sans text-brand-text relative">
      
      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-brand-heading/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-brand-border">
            <div className="p-6">
              <h3 className="text-xl font-bold text-brand-heading mb-2">Schedule Post</h3>
              <p className="text-sm text-slate-500 mb-6">Choose when you want this post to be published to LinkedIn automatically.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-brand-heading mb-2">Publish Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSchedule}
                  disabled={!scheduleDate || isScheduling}
                  className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-md flex justify-center items-center gap-2 ${(!scheduleDate || isScheduling) ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                  {isScheduling ? 'Scheduling...' : 'Schedule'}
                  {!isScheduling && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar is hidden for immersive view */}
      <div className="hidden">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        
        {/* PREMIUM ACTION BAR */}
        <div className="sticky top-0 z-40 bg-brand-card border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             {/* Back to Dashboard Button */}
             <button 
               onClick={() => window.location.href = '/'}
               className="flex items-center gap-2 text-brand-heading hover:bg-brand-subtle px-3 py-1.5 rounded-lg transition-colors font-semibold text-sm"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
               Back to Dashboard
             </button>
             <div className="w-px h-6 bg-slate-200 hidden md:block"></div>

             <div className="w-8 h-8 rounded-lg bg-[#0a66c2] flex items-center justify-center text-white font-bold text-sm shadow-md">in</div>
             <h1 className="font-bold text-xl text-brand-heading hidden md:block flex items-center gap-2">
               Growth Studio
               <span className="px-2 py-0.5 ml-2 bg-brand-accent/20 text-brand-accentDk border border-brand-accent/30 rounded text-[10px] uppercase tracking-wider font-bold">PRO</span>
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            
            {isConnected ? (
              <span className="px-3 py-1.5 bg-brand-light text-brand-primary border border-brand-primary/20 rounded-lg text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(31,122,108,0.5)]"></span> 
                LinkedIn Connected
              </span>
            ) : (
              <button onClick={handleConnect} className="px-4 py-2 text-sm font-bold text-white bg-[#0a66c2] hover:bg-[#004182] rounded-lg transition-all shadow-md shadow-[#0a66c2]/20">Connect LinkedIn</button>
            )}
            
            <button 
              onClick={handleSaveDraft} 
              disabled={!selectedPostId || isContentEmpty || isSaving}
              className="px-4 py-2 text-sm font-bold text-brand-muted hover:text-brand-heading hover:bg-brand-subtle rounded-lg transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            
            {/* SCHEDULE BUTTON */}
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={!selectedPostId || isContentEmpty || !isConnected}
              className="px-4 py-2 text-sm font-bold text-brand-primary bg-brand-light hover:bg-brand-light/70 border border-brand-primary/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Schedule
            </button>

            <button 
              onClick={handlePublish}
              disabled={!selectedPostId || isContentEmpty || isPublishing}
              className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-md ${(!selectedPostId || isContentEmpty || isPublishing) ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-lg'}`}
            >
              {isPublishing ? 'Publishing...' : 'Publish to LinkedIn'}
            </button>
          </div>
        </div>

        {/* 3-COLUMN PREMIUM LAYOUT */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[340px_1fr_380px] gap-6 p-6 h-[calc(100vh-73px)] overflow-hidden">
          
          {/* LEFT PANEL */}
          <div className="h-full overflow-y-auto custom-scrollbar pr-1">
            <StudioLeftPanel 
              topic={topic} setTopic={setTopic}
              category={category} setCategory={setCategory}
              userFocus={userFocus} setUserFocus={setUserFocus}
              urlContext={urlContext} setUrlContext={setUrlContext}
              useResume={useResume} setUseResume={setUseResume}
              relevantLink={relevantLink} setRelevantLink={setRelevantLink}
              imageFile={imageFile} setImageFile={setImageFile}
              imagePreview={imagePreview} setImagePreview={setImagePreview}
              isGenerating={isGenerating} handleGenerate={handleGenerate}
            />
          </div>
          
          {/* CENTER PANEL */}
          <div className="h-full">
            <StudioCenterPanel 
              isGenerating={isGenerating}
              generatedContent={generatedContent}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              handleGenerate={handleGenerate}
            />
          </div>
          
          {/* RIGHT PANEL */}
          <div className="h-full overflow-y-auto custom-scrollbar pl-1">
            <StudioRightPanel 
              editorContent={editorContent}
              drafts={drafts}
              onSelectDraft={handleSelectDraft}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
