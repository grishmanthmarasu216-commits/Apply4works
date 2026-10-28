/**
 * ResumeBuilderV2.jsx — Apply4Works Resume Platform V3
 * Premium three-panel builder: Sections | Editor | Live Preview
 * Fixes: layout, onboarding, data recovery, dropdowns, completeness, version history, error handling
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume, markOnboardingDone, isOnboardingDone, clearOnboardingFlag } from '../hooks/useResume';
import { calculateRealTimeAts, calculateHealthScore } from '../utils/frontendAtsEngine';
import { getCompleteness, flattenSkills } from '../utils/resumeNormalizer';
import ResumeTemplatesV2, { TEMPLATES } from '../components/resume/ResumeTemplatesV2';
import ResumeOnboardingModal from '../components/resume/ResumeOnboardingModal';



import { API_BASE as API } from '../config/api';

const SECTIONS = [
  { id: 'personalInfo',         label: 'Personal Info',             icon: '👤' },
  { id: 'summary',              label: 'Summary',                   icon: '📝' },
  { id: 'experience',           label: 'Experience',                icon: '💼' },
  { id: 'projects',             label: 'Projects',                  icon: '🚀' },
  { id: 'education',            label: 'Education',                 icon: '🎓' },
  { id: 'hardSkills',           label: 'Hard Skills',               icon: '⚙️' },
  { id: 'softSkills',           label: 'Soft Skills',               icon: '🤝' },
  { id: 'certsAndAchievements', label: 'Certifications & Achievements', icon: '🏅' },
  { id: 'languages',            label: 'Languages',                 icon: '🌐' },
];

// Hard skill categories (technical & work-related)
const HARD_SKILL_CATEGORIES = ['programming','frameworks','databases','cloud','devops','tools'];
const HARD_SKILL_CAT_LABELS = {
  programming: 'Programming Languages', frameworks: 'Frameworks & Libraries',
  databases: 'Databases', cloud: 'Cloud & Platforms', devops: 'DevOps & CI/CD',
  tools: 'Tools',
};

// Soft skill categories (interpersonal & extracurricular)
const SOFT_SKILL_CATEGORIES = ['softSkills', 'extracurricular'];
const SOFT_SKILL_CAT_LABELS = {
  softSkills:     'Soft Skills (e.g. Leadership, Communication)',
  extracurricular:'Extracurricular & Activities',
};

// Legacy combined categories (for backward compat in flattenSkills)
const SKILL_CATEGORIES = [...HARD_SKILL_CATEGORIES, ...SOFT_SKILL_CATEGORIES];
const SKILL_CAT_LABELS = { ...HARD_SKILL_CAT_LABELS, ...SOFT_SKILL_CAT_LABELS };

// Smart dropdown options
const DEGREE_OPTIONS = [
  'Bachelor of Technology (B.Tech)', 'Bachelor of Engineering (B.E)',
  'Bachelor of Science (B.Sc)', 'Bachelor of Computer Applications (BCA)',
  'Master of Technology (M.Tech)', 'Master of Science (M.Sc)',
  'Master of Computer Applications (MCA)', 'MBA', 'PhD', 'Diploma', 'Other',
];
const FIELD_OPTIONS = [
  'Computer Science', 'Artificial Intelligence', 'Machine Learning', 'Data Science',
  'Information Technology', 'Software Engineering', 'Cyber Security', 'Electronics',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Finance', 'Marketing', 'Other',
];
const EMPLOYMENT_TYPES = ['Full Time', 'Internship', 'Contract', 'Part Time', 'Freelance'];
const LOCATION_TYPES   = ['Onsite', 'Remote', 'Hybrid'];
const PROF_LEVELS      = ['Beginner', 'Intermediate', 'Advanced', 'Native'];

const MAX_HISTORY = 50;

// ── Styles object ─────────────────────────────────────────────────────────────
const s = {
  label: { fontSize:12, fontWeight:600, color:'var(--text-m)', display:'block', marginBottom:6,
           textTransform:'uppercase', letterSpacing:.5 },
  mb: { marginBottom:16 },
};

// ── Save status text helper ───────────────────────────────────────────────────
function useSaveStatusText(saveStatus, lastSavedAt) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  if (saveStatus === 'saving') return { text: '💾 Saving…', color: '#f59e0b' };
  if (saveStatus === 'failed') return { text: '⚠ Failed to save — retrying', color: '#ef4444' };
  if (saveStatus === 'saved' && lastSavedAt) {
    const secs = Math.round((Date.now() - new Date(lastSavedAt)) / 1000);
    if (secs < 10)  return { text: '✓ Saved just now', color: '#10b981' };
    if (secs < 60)  return { text: `✓ Saved ${secs}s ago`, color: '#10b981' };
    const mins = Math.round(secs / 60);
    return { text: `✓ Saved ${mins}m ago`, color: '#10b981' };
  }
  return { text: 'Not saved yet', color: 'var(--text-m)' };
}

// ── Completeness % for a single section ──────────────────────────────────────
function sectionPct(section, resumeData) {
  if (!resumeData) return 0;
  const pi = resumeData.personalInfo || {};
  switch (section) {
    case 'personalInfo': {
      const filled = ['firstName','lastName','email','phone','location'].filter(k => pi[k]).length;
      return Math.round((filled / 5) * 100);
    }
    case 'summary': {
      const words = (resumeData.summary || '').split(/\s+/).filter(Boolean).length;
      return Math.min(100, Math.round((words / 50) * 100));
    }
    case 'experience': {
      const exps = resumeData.experience || [];
      if (!exps.length) return 0;
      let score = 0;
      exps.forEach(exp => {
        let fields = 0;
        if (exp.company) fields++;
        if (exp.role) fields++;
        if (exp.startDate) fields++;
        if (exp.responsibilities && exp.responsibilities.length > 0) fields++;
        score += (fields / 4);
      });
      return Math.round((score / exps.length) * 100);
    }
    case 'projects': {
      const projs = resumeData.projects || [];
      if (!projs.length) return 0;
      let score = 0;
      projs.forEach(proj => {
        let fields = 0;
        if (proj.name) fields++;
        if (proj.description) fields++;
        if (proj.technologies && proj.technologies.length > 0) fields++;
        score += (fields / 3);
      });
      return Math.round((score / projs.length) * 100);
    }
    case 'education': {
      const edus = resumeData.education || [];
      if (!edus.length) return 0;
      let score = 0;
      edus.forEach(edu => {
        let fields = 0;
        if (edu.institution) fields++;
        if (edu.degree) fields++;
        if (edu.startDate || edu.endDate) fields++;
        score += (fields / 3);
      });
      return Math.round((score / edus.length) * 100);
    }
    case 'hardSkills': {
      const hasHardSkills = HARD_SKILL_CATEGORIES.some(c => (resumeData.skills?.[c] || []).length > 0) || (resumeData.skills?.tools || []).length > 0;
      return hasHardSkills ? 100 : 0;
    }
    case 'softSkills': {
      const hasSoftSkills = SOFT_SKILL_CATEGORIES.some(c => (resumeData.skills?.[c] || []).length > 0);
      return hasSoftSkills ? 100 : 0;
    }
    case 'certsAndAchievements': {
      const hasCerts = (resumeData.certifications || []).length > 0;
      const hasAchievements = (resumeData.achievements || []).filter(Boolean).length > 0;
      return (hasCerts || hasAchievements) ? 100 : 0;
    }
    case 'languages':  return (resumeData.languages  || []).length > 0 ? 100 : 0;
    default: return 0;
  }
}

export default function ResumeBuilderV2() {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const {
    resumeData, setResumeData, setField, setPersonalInfo, setSkillCategory,
    updateArrayItem, addArrayItem, removeArrayItem,
    template, setTemplate, isLoading, saveStatus, lastSavedAt, hasUnsaved, refetch,
    showRecovery, recoveryBackup, acceptRecovery, dismissRecovery, saveNow,
  } = useResume();

  const [activeSection, setActiveSection] = useState('personalInfo');
  const [aiLoading, setAiLoading]         = useState(null);
  const [aiPrompt, setAiPrompt]           = useState('');
  const [showAiPanel, setShowAiPanel]     = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVersions, setShowVersions]   = useState(false);
  const [showUpload, setShowUpload]       = useState(false);
  const [uploadFile, setUploadFile]       = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]     = useState('');
  const [fieldConf, setFieldConf]         = useState(null);
  const [usedGemini, setUsedGemini]       = useState(false);
  const [historyStack, setHistoryStack]   = useState([]);
  const [historyIndex, setHistoryIndex]   = useState(-1);
  const [rightTab, setRightTab]           = useState('preview');
  const [previewScale, setPreviewScale]   = useState(75); // Default 75%
  const [toast, setToast]                 = useState(null);
  // Optimize For Job
  const [jobDesc, setJobDesc]             = useState('');
  const [atsJobResult, setAtsJobResult]   = useState(null);
  const [atsJobLoading, setAtsJobLoading] = useState(false);
  const isUndoRedo = useRef(false);

  const saveStatus$ = useSaveStatusText(saveStatus, lastSavedAt);

  // ── Show onboarding ONLY ONCE when no data and not completed before ─────────
  const onboardingChecked = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (onboardingChecked.current) return; // Guard: run once per session
    onboardingChecked.current = true;
    
    const pi = resumeData?.personalInfo || {};
    const hasMeaningfulData = !!(
      pi.email || pi.firstName || pi.lastName || pi.phone ||
      (resumeData?.experience && resumeData.experience.length > 0) ||
      (resumeData?.education && resumeData.education.length > 0) ||
      (resumeData?.projects && resumeData.projects.length > 0)
    );
    
    // Feature 1: Only show if NO parsed resume exists.
    if (!hasMeaningfulData && !isOnboardingDone()) {
      setShowOnboarding(true);
    } else {
      // If we have meaningful data, they shouldn't see onboarding again.
      markOnboardingDone();
      setShowOnboarding(false);
    }
  }, [isLoading, resumeData]); // Added resumeData to dependencies

  // ── Warn on navigation if unsaved ──────────────────────────────────────────
  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Leave page?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  // ── Undo/Redo ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!resumeData || isUndoRedo.current) { isUndoRedo.current = false; return; }
    setHistoryStack(prev => {
      const cut = prev.slice(0, historyIndex + 1);
      const next = [...cut, JSON.stringify(resumeData)].slice(-MAX_HISTORY);
      setHistoryIndex(next.length - 1);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newIdx = historyIndex - 1;
    isUndoRedo.current = true;
    setHistoryIndex(newIdx);
    setResumeData(JSON.parse(historyStack[newIdx]));
  }, [canUndo, historyIndex, historyStack, setResumeData]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const newIdx = historyIndex + 1;
    isUndoRedo.current = true;
    setHistoryIndex(newIdx);
    setResumeData(JSON.parse(historyStack[newIdx]));
  }, [canRedo, historyIndex, historyStack, setResumeData]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNow(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, saveNow]);

  const atsResult   = useMemo(() => resumeData ? calculateRealTimeAts(resumeData, null) : null, [resumeData]);
  const healthResult = useMemo(() => resumeData ? calculateHealthScore(resumeData) : null, [resumeData]);
  const completeness = useMemo(() => resumeData ? getCompleteness(resumeData) : {}, [resumeData]);
  const overallPct  = useMemo(() => {
    if (!resumeData) return 0;
    const sections = SECTIONS.map(s => sectionPct(s.id, resumeData));
    return Math.round(sections.reduce((a, b) => a + b, 0) / sections.length);
  }, [resumeData]);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Optimize For Job (inline ATS) ─────────────────────────────────────────
  const handleJobAnalyze = useCallback(async () => {
    if (!jobDesc.trim() || !resumeData) return;
    setAtsJobLoading(true);
    try {
      const res = await fetch(`${API}/resume/analyze-job`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ jobDescription: jobDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setAtsJobResult(data);
        showToast('Job analysis complete ✓');
      } else throw new Error(data.message || 'Analysis failed');
    } catch (e) {
      showToast(`Analysis failed: ${e.message}`, 'error');
    } finally { setAtsJobLoading(false); }
  }, [jobDesc, resumeData, authHeaders, showToast]);


  // ── Upload resume file ──────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    setUploadProgress(10);

    // File validation
    const ext = uploadFile.name.split('.').pop().toLowerCase();
    if (!['pdf','doc','docx'].includes(ext)) {
      setUploadError(`Unsupported file type ".${ext}". Please upload a PDF, DOC, or DOCX file.`);
      setUploading(false); setUploadProgress(0); return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      setUploadError(`File is too large (${(uploadFile.size/(1024*1024)).toFixed(1)} MB). Maximum allowed is 10 MB.`);
      setUploading(false); setUploadProgress(0); return;
    }

    try {
      const fd = new FormData();
      fd.append('resume', uploadFile);
      setUploadProgress(30);
      const res = await fetch(`${API}/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      setUploadProgress(80);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upload failed. Please try again.');
      }
      setFieldConf(data.fieldConfidence || null);
      setUsedGemini(data.usedGemini || false);
      setUploadProgress(100);
      await refetch();
      setShowUpload(false);
      setUploadFile(null);
      setUploadProgress(0);
      showToast('Resume uploaded and parsed successfully ✓');
    } catch (e) {
      setUploadError(e.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }, [uploadFile, token, refetch, showToast]);

  // ── AI improve section ──────────────────────────────────────────────────────
  const handleAiImprove = useCallback(async (sectionName, sectionData) => {
    setAiLoading(sectionName);
    try {
      const res = await fetch(`${API}/resume/optimize-section`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ sectionName, sectionData, context: { targetRole:'', keywords:[] } }),
      });
      const data = await res.json();
      if (data.success) { setField(sectionName, data.improvedSection); showToast(`${sectionName} improved ✨`); }
      else throw new Error(data.message);
    } catch (e) {
      showToast(`AI improvement failed: ${e.message}`, 'error');
    } finally { setAiLoading(null); }
  }, [authHeaders, setField, showToast]);

  // ── AI prompt ───────────────────────────────────────────────────────────────
  const handleAiPrompt = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading('prompt');
    try {
      const res = await fetch(`${API}/resume/ai-suggest`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ instruction: aiPrompt, sectionName: activeSection,
          sectionData: resumeData[activeSection], context: { targetRole:'' } }),
      });
      const data = await res.json();
      if (data.success) { setField(activeSection, data.result); setAiPrompt(''); showToast('AI suggestion applied ✨'); }
      else throw new Error(data.message);
    } catch (e) {
      showToast(`AI suggestion failed: ${e.message}`, 'error');
    } finally { setAiLoading(null); }
  }, [aiPrompt, activeSection, resumeData, authHeaders, setField, showToast]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    const el = document.getElementById('resume-preview-v2');
    if (!el) { showToast('Preview not ready. Switch to Preview tab first.', 'error'); return; }
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin: 0, filename: 'resume.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
      showToast('PDF exported ✓');
    } catch (e) { showToast(`Export failed: ${e.message}`, 'error'); }
  }, [showToast]);

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
      background:'var(--bg)', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'3px solid var(--border)', borderTopColor:'var(--primary)',
        borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <div style={{ color:'var(--text-m)', fontSize:14 }}>Loading your resume…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const scoreColor = atsResult
    ? (atsResult.atsScore >= 70 ? '#10b981' : atsResult.atsScore >= 45 ? '#f59e0b' : '#ef4444')
    : 'var(--primary)';

  return (
    // Outer wrapper: fills the remaining viewport space beside the fixed sidebar.
    // Sidebar is fixed at 240px. This container fills the rest of the screen.
    <div style={{
      width: '100%',
      maxWidth: 'none',
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-subtle)',
    }}>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showOnboarding && (
        <ResumeOnboardingModal
          onComplete={(data) => {
            setResumeData(data);
            markOnboardingDone();
            setShowOnboarding(false);
          }}
          onClose={() => {
            markOnboardingDone();
            setShowOnboarding(false);
          }}
          token={token}
        />
      )}

      {/* Recovery modal */}
      {showRecovery && recoveryBackup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000,
          display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'var(--bg-card)', borderRadius:16, padding:32, width:440,
            boxShadow:'0 24px 48px rgba(0,0,0,.3)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:32, marginBottom:12, textAlign:'center' }}>💾</div>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800, color:'var(--text-h)', textAlign:'center' }}>
              Unsaved Changes Found
            </h3>
            <p style={{ margin:'0 0 20px', color:'var(--text-m)', fontSize:13, textAlign:'center', lineHeight:1.6 }}>
              We found local changes from{' '}
              <strong>{recoveryBackup.ts ? new Date(recoveryBackup.ts).toLocaleString() : 'earlier'}</strong>{' '}
              that weren't saved to the server. Would you like to restore them?
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}
                onClick={acceptRecovery}>↩ Restore Changes</button>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }}
                onClick={dismissRecovery}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1500,
          display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div style={{ background:'var(--bg-card)', borderRadius:18, padding:32, width:480,
            boxShadow:'0 24px 48px rgba(0,0,0,.3)', position:'relative' }}>
            <button onClick={() => { setShowUpload(false); setUploadFile(null); setUploadError(''); setUploadProgress(0); }}
              style={{ position:'absolute', top:16, right:16, background:'none', border:'none',
                cursor:'pointer', fontSize:22, color:'var(--text-m)', lineHeight:1 }}>×</button>

            <h3 style={{ margin:'0 0 6px', fontSize:20, fontWeight:800, color:'var(--text-h)' }}>Upload Resume</h3>
            <p style={{ margin:'0 0 20px', color:'var(--text-m)', fontSize:13 }}>
              PDF, DOC, or DOCX — max 10 MB. We'll auto-populate all fields.
            </p>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setUploadFile(e.dataTransfer.files[0]); setUploadError(''); }}
              style={{
                border: `2px dashed ${uploadFile ? 'var(--primary)' : 'var(--border-md)'}`,
                borderRadius:12, padding:32, textAlign:'center', cursor:'pointer', marginBottom:16,
                background: uploadFile ? 'var(--primary-lt)' : 'var(--bg-subtle)', transition:'all .2s',
              }}
              onClick={() => document.getElementById('rb-upload-input').click()}
            >
              <div style={{ fontSize:36, marginBottom:8 }}>{uploadFile ? '📄' : '📂'}</div>
              {uploadFile ? (
                <div style={{ color:'var(--primary)', fontWeight:700, fontSize:14 }}>{uploadFile.name}</div>
              ) : (
                <>
                  <div style={{ color:'var(--text-h)', fontWeight:600, fontSize:14, marginBottom:4 }}>Drop your resume here</div>
                  <div style={{ color:'var(--text-m)', fontSize:12 }}>or click to browse</div>
                </>
              )}
              <input id="rb-upload-input" type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }}
                onChange={e => { setUploadFile(e.target.files[0]); setUploadError(''); }} />
            </div>

            {uploadProgress > 0 && (
              <div style={{ height:4, background:'var(--border)', borderRadius:4, marginBottom:12, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${uploadProgress}%`, background:'var(--primary)',
                  borderRadius:4, transition:'width .3s ease' }} />
              </div>
            )}

            {uploadError && (
              <div style={{ color:'#dc2626', fontSize:13, marginBottom:12, padding:'10px 14px',
                background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, lineHeight:1.5 }}>
                ⚠ {uploadError}
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}
                onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? '⏳ Parsing…' : '⬆ Upload & Parse'}
              </button>
              {uploadError && (
                <button className="btn btn-ghost" onClick={() => { setUploadError(''); handleUpload(); }}>↺ Retry</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background: toast.type === 'error' ? '#dc2626' : '#10b981',
          color:'#fff', padding:'10px 20px', borderRadius:10, fontSize:13,
          fontWeight:600, zIndex:9999, boxShadow:'0 8px 24px rgba(0,0,0,.2)',
          animation:'fadeUp .25s ease both',
        }}>{toast.msg}</div>
      )}

      {/* ── TOP TOOLBAR ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        height: 56,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            fontSize: 13, fontWeight: 700, color: 'var(--text-h)', cursor: 'pointer',
            background: 'transparent', border: 'none', borderRadius: 8, transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Resume Builder
        </button>

        {/* Divider */}
        <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0, margin: '0 4px' }} />

        {/* Save status */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', marginRight:8 }}>
          <div style={{ fontSize:11, color: saveStatus$.color, fontWeight:600, lineHeight:1.2 }}>{saveStatus$.text}</div>
        </div>

        {/* Divider */}
        <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0 }} />

        {/* Undo / Redo */}
        <button onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
          style={{ padding:'5px 12px', fontSize:12, borderRadius:6, border:'1px solid var(--border)',
            background: canUndo ? 'var(--bg-subtle)' : 'transparent',
            cursor: canUndo ? 'pointer' : 'default',
            color: canUndo ? 'var(--text-b)' : 'var(--border)', flexShrink:0 }}>↩ Undo</button>
        <button onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
          style={{ padding:'5px 12px', fontSize:12, borderRadius:6, border:'1px solid var(--border)',
            background: canRedo ? 'var(--bg-subtle)' : 'transparent',
            cursor: canRedo ? 'pointer' : 'default',
            color: canRedo ? 'var(--text-b)' : 'var(--border)', flexShrink:0 }}>↪ Redo</button>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* Overall completion badge */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ width:80, height:5, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${overallPct}%`, borderRadius:4,
              background: overallPct >= 80 ? '#10b981' : overallPct >= 50 ? '#f59e0b' : '#ef4444',
              transition:'width .5s ease' }} />
          </div>
          <span style={{ fontSize:11, fontWeight:700,
            color: overallPct >= 80 ? '#10b981' : overallPct >= 50 ? '#f59e0b' : '#ef4444' }}>{overallPct}%</span>
        </div>

        {/* Divider */}
        <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0 }} />

        {/* Upload Resume */}
        <button className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}
          onClick={() => setShowUpload(true)}>⬆ Upload Resume</button>

        {/* Export PDF */}
        <button className="btn btn-primary btn-sm" style={{ flexShrink:0 }}
          onClick={handleExportPDF}>↓ Export PDF</button>
      </div>

      {/* ── MAIN 3-PANEL ROW ─────────────────────────────────────────────────── */}
      {/* Layout: [Left 220px] [Center flex:1 min 420px] [Right 380px fixed] */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
        minWidth: 0,
      }}>

        {/* ── LEFT: Section Navigator — 15% ────────────────────────── */}
        <div style={{
          flex: '0 0 15%',
          minWidth: 200,
          maxWidth: 250,
          flexShrink: 0,
          display:'flex',
          flexDirection:'column',
          overflow:'hidden',
          background:'var(--bg-card)',
          borderRight:'1px solid var(--border)',
        }}>

          {/* Slim section header — just a label, title/undo/save are in top toolbar */}
          <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-m)', textTransform:'uppercase', letterSpacing:.6 }}>Sections</div>
          </div>

          {/* Section nav */}
          <div style={{ flex:1, overflowY:'auto', padding:'6px 8px' }}>
            {SECTIONS.map(sec => {
              const pct = sectionPct(sec.id, resumeData);
              const isActive = activeSection === sec.id;
              const color = pct >= 80 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#e5e7eb';
              return (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                  width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                  borderRadius:10, border:'none', cursor:'pointer',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-m)', fontSize:13,
                  fontWeight: isActive ? 700 : 500, marginBottom:4, textAlign:'left', transition:'all .15s',
                }}>
                  <span style={{ fontSize:14, minWidth:16 }}>{sec.icon}</span>
                  <span style={{ flex:1 }}>{sec.label}</span>
                  <span style={{ fontSize:9, fontWeight:700, color: pct > 0 ? color : 'var(--border)', minWidth:28, textAlign:'right' }}>
                    {pct > 0 ? `${pct}%` : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary actions */}
          <div style={{ padding:12, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
            <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center', fontSize:12 }}
              onClick={() => setShowVersions(v => !v)}>🕐 Version History</button>
            <button className="btn btn-ghost btn-sm"
              style={{ width:'100%', justifyContent:'center', fontSize:10, color:'var(--text-m)',
                borderStyle:'dashed', borderColor:'var(--border)' }}
              onClick={() => { clearOnboardingFlag(); setShowOnboarding(true); }}>
              + Start New Resume
            </button>
          </div>
        </div>

        {/* ── CENTER: Section Editor — 40% ────────────────────────── */}
        <div id="resume-editor-panel" style={{
          flex: '0 0 40%',
          minWidth: 350,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          <div style={{ flex:1, padding:'12px', width:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:12 }}>

            {/* Section completeness bar */}
            {resumeData && (() => {
              const pct = sectionPct(activeSection, resumeData);
              const color = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
              return (
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:'var(--text-h)' }}>
                      {SECTIONS.find(s => s.id === activeSection)?.icon}{' '}
                      {SECTIONS.find(s => s.id === activeSection)?.label}
                    </h2>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:12, color:'var(--text-m)' }}>Section Completeness</div>
                        <div style={{ fontSize:15, fontWeight:800, color }}>{pct}%</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ height:4, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width .5s ease' }} />
                  </div>
                </div>
              );
            })()}

            {/* Upload confidence panel */}
            {fieldConf && activeSection === 'personalInfo' && (
              <ConfidencePanel fieldConf={fieldConf} usedGemini={usedGemini} onDismiss={() => setFieldConf(null)} />
            )}



            {/* Section editor */}
            {resumeData && (
              <SectionEditor
                section={activeSection}
                resumeData={resumeData}
                setField={setField}
                setPersonalInfo={setPersonalInfo}
                setSkillCategory={setSkillCategory}
                updateArrayItem={updateArrayItem}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                aiLoading={aiLoading}
                onAiImprove={handleAiImprove}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT: Live Preview + Score — remaining 45% ────────────────────────── */}
        <div style={{
          flex: 1,
          minWidth: 300,
          display:'flex',
          flexDirection:'column',
          overflow:'hidden',
          background:'var(--bg-card)',
          borderLeft:'1px solid var(--border)',
        }}>

          {/* New Toolbar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-card)', flexShrink:0 }}>
             <div style={{ fontWeight:800, fontSize:14, color:'var(--text-h)', display: 'flex', alignItems: 'center', gap: 12 }}>
               Resume Preview
               <select className="input" style={{ width: '180px', padding: '4px 8px', fontSize: 12, height: 'auto' }} value={template} onChange={(e) => setTemplate(e.target.value)}>
                 {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
               </select>
             </div>
             <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {/* Zoom Controls */}
                <div style={{ display:'flex', alignItems:'center', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                  <button onClick={() => setPreviewScale(s => Math.max(50, s - 25))} style={{ padding:'6px 12px', border:'none', background:'transparent', cursor:'pointer', fontWeight:700, color:'var(--text-h)' }}>-</button>
                  <div style={{ fontSize:12, fontWeight:700, padding:'0 8px', minWidth:50, textAlign:'center' }}>{previewScale}%</div>
                  <button onClick={() => setPreviewScale(s => Math.min(200, s + 25))} style={{ padding:'6px 12px', border:'none', background:'transparent', cursor:'pointer', fontWeight:700, color:'var(--text-h)' }}>+</button>
                </div>
                {/* Edit Button */}
                <button onClick={() => {
                  const el = document.getElementById('resume-editor-panel');
                  if(el) { 
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => {
                      const firstInput = el.querySelector('input, textarea');
                      if (firstInput) firstInput.focus();
                    }, 300);
                  }
                }} className="btn btn-ghost btn-sm" style={{ fontWeight:700 }}>✏ Edit Resume</button>
             </div>
          </div>

          <div style={{
            flex:1, display: 'flex', flexDirection:'column',
            background:'#e5e7eb', overflowY:'auto',
          }}>
            {/* ATS Score Widget */}
            <div style={{ padding:'24px 24px 0 24px', display:'flex', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:'100%', maxWidth:794, background:'var(--bg-card)', borderRadius:12, padding:16, display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid var(--border)', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background: atsResult?.atsScore >= 75 ? 'rgba(16,185,129,.1)' : atsResult?.atsScore >= 50 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)', display:'flex', alignItems:'center', justifyContent:'center', color: atsResult?.atsScore >= 75 ? '#10b981' : atsResult?.atsScore >= 50 ? '#f59e0b' : '#ef4444', fontWeight:800, fontSize:18 }}>
                    {atsResult?.atsScore || 0}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'var(--text-h)' }}>ATS Score</div>
                    <div style={{ fontSize:12, fontWeight:600, color: atsResult?.atsScore >= 75 ? '#10b981' : atsResult?.atsScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {atsResult?.atsScore >= 75 ? 'Strong' : atsResult?.atsScore >= 50 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scaled preview */}
            <div style={{ padding:24, display:'flex', justifyContent:'center' }}>
              <div id="resume-preview-v2-wrapper" style={{ position:'relative', display:'flex', justifyContent:'center' }}>
                <ScaledPreview resumeData={resumeData} template={template} scale={previewScale} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Version History drawer ─────────────────────────────────────────── */}
      {showVersions && (
        <VersionDrawer
          token={token}
          onClose={() => setShowVersions(false)}
          onRestore={async () => { await refetch(); setShowVersions(false); showToast('Version restored ✓'); }}
          onSaveVersion={async (label) => {
            try {
              const res = await fetch(`${API}/resume/versions/save`, {
                method:'POST', headers: authHeaders(),
                body: JSON.stringify({ label }),
              });
              const data = await res.json();
              if (data.success) showToast('Version saved ✓');
              else throw new Error(data.message);
            } catch (e) { showToast(`Failed to save version: ${e.message}`, 'error'); }
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Scaled Preview ────────────────────────────────────────────────────────────
function ScaledPreview({ resumeData, template, scale = 100 }) {
  const actualScale = scale / 100;

  // A4 aspect ratio height calculation: 297mm / 210mm ≈ 1.414 * width
  const a4Width = 794; 
  const scaledWidth = a4Width * actualScale;
  const scaledHeight = scaledWidth * 1.4142;

  return (
    <div style={{ width: scaledWidth, height: scaledHeight }}>
      <div style={{
        width: a4Width,
        transformOrigin:'top left',
        transform:`scale(${actualScale})`,
        height: `${a4Width * 1.4142}px`, 
        boxShadow:'0 4px 24px rgba(0,0,0,.2)',
        overflow:'hidden',
        background: '#fff',
      }}>
        <div id="resume-preview-v2">
          {resumeData && <ResumeTemplatesV2 resumeData={resumeData} templateId={template} />}
        </div>
      </div>
    </div>
  );
}

// ── Confidence Panel ──────────────────────────────────────────────────────────
function ConfidencePanel({ fieldConf, usedGemini, onDismiss }) {
  const fields = ['name','email','phone','location','linkedin','github','summary'];
  return (
    <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(5,150,105,.04))',
      border:'1px solid rgba(16,185,129,.3)', borderRadius:12, padding:16, marginBottom:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#065f46' }}>
          ✅ Resume Parsed {usedGemini && <span style={{ fontSize:10, color:'#6366f1', marginLeft:6, fontWeight:600 }}>✨ Gemini assisted</span>}
        </div>
        <button onClick={onDismiss} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-m)' }}>×</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {fields.map(key => {
          const f = fieldConf[key];
          if (!f) return null;
          const pct = Math.round((f.confidence || 0) * 100);
          const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
              <span style={{ fontSize:11, color:'var(--text-m)', textTransform:'capitalize', flex:1 }}>{key}</span>
              <span style={{ fontSize:10, fontWeight:700, color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Version History Drawer ────────────────────────────────────────────────────
function VersionDrawer({ token, onClose, onRestore, onSaveVersion }) {
  const [versions, setVersions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [restoring, setRestoring]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  const API_BASE = API;

  const loadVersions = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/resume/versions`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setVersions(d.versions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, API_BASE]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleRestore = async (versionId) => {
    setRestoring(versionId);
    try {
      await fetch(`${API_BASE}/resume/restore-version`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ versionId }),
      });
      await onRestore();
    } finally { setRestoring(null); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveVersion(versionLabel.trim() || undefined);
      setVersionLabel('');
      setShowLabelInput(false);
      loadVersions();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/resume/versions/${id}`, {
      method:'DELETE', headers:{ Authorization:`Bearer ${token}` },
    });
    setVersions(prev => prev.filter(v => v._id !== id));
  };

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:340,
      background:'var(--bg-card)', borderLeft:'1px solid var(--border)', zIndex:800,
      display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,.15)' }}>
      <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)',
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800, fontSize:15, color:'var(--text-h)' }}>🕐 Version History</div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'var(--text-m)' }}>×</button>
      </div>

      {/* Save version section */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
        {showLabelInput ? (
          <div style={{ display:'flex', gap:6 }}>
            <input className="input" placeholder="Version label (optional)" value={versionLabel}
              onChange={e => setVersionLabel(e.target.value)} style={{ flex:1, fontSize:12 }}
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? '⌛' : 'Save'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowLabelInput(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }}
            onClick={() => setShowLabelInput(true)}>
            + Save Current Version
          </button>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:12 }}>
        {loading ? (
          <div style={{ color:'var(--text-m)', fontSize:13, padding:16, textAlign:'center' }}>Loading versions…</div>
        ) : versions.length === 0 ? (
          <div style={{ color:'var(--text-m)', fontSize:13, padding:16, textAlign:'center' }}>
            No saved versions yet.<br />
            <span style={{ fontSize:11 }}>Save a version to restore it later.</span>
          </div>
        ) : versions.map((v, i) => (
          <div key={v._id} style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)',
            borderRadius:10, padding:12, marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-h)', marginBottom:2 }}>
              {v.label || `Version ${versions.length - i}`}
            </div>
            <div style={{ fontSize:11, color:'var(--text-m)', marginBottom:8 }}>
              {v.timestamp ? new Date(v.timestamp).toLocaleDateString('en-US',
                { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}
              {v.atsScore > 0 && <span style={{ marginLeft:8, color:'var(--primary)', fontWeight:600 }}>ATS {v.atsScore}</span>}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }}
                onClick={() => handleRestore(v._id)} disabled={restoring === v._id}>
                {restoring === v._id ? '⌛ Restoring…' : '↩ Restore'}
              </button>
              <button onClick={() => handleDelete(v._id)}
                style={{ background:'none', border:'1px solid #fecaca', borderRadius:6,
                  cursor:'pointer', color:'#ef4444', padding:'4px 8px', fontSize:11 }}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Health Score Panel ────────────────────────────────────────────────────────
function HealthScorePanel({ healthResult, onSectionClick }) {
  const { healthScore, grade, breakdown, actionItems } = healthResult;
  const gradeColor = grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444';
  const SECTION_MAP = { contact:'personalInfo', summary:'summary', experience:'experience', projects:'projects', education:'education', skills:'skills', extras:'certifications' };
  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#94a3b8' };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
        <div style={{ width:68, height:68, borderRadius:'50%', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
          background:`conic-gradient(${gradeColor} ${healthScore * 3.6}deg, var(--border) 0deg)`,
          boxShadow:`0 0 0 4px var(--bg-card), 0 0 0 6px ${gradeColor}22` }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--bg-card)',
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
            <div style={{ fontSize:18, fontWeight:900, color:gradeColor, lineHeight:1 }}>{grade}</div>
            <div style={{ fontSize:9, color:'var(--text-m)', fontWeight:600 }}>{healthScore}/100</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--text-h)' }}>Resume Health</div>
          <div style={{ fontSize:11, color:gradeColor, fontWeight:700 }}>
            {grade === 'A' ? '🌟 Excellent!' : grade === 'B' ? '✅ Good' : grade === 'C' ? '⚠️ Fair' : grade === 'D' ? '📉 Needs Work' : '🚨 Incomplete'}
          </div>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        {Object.entries(breakdown).map(([key, { score, max, label }]) => {
          const pct = Math.round((score / max) * 100);
          const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={key} style={{ marginBottom:6, cursor:'pointer' }}
              onClick={() => SECTION_MAP[key] && onSectionClick(SECTION_MAP[key])}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-m)', marginBottom:2 }}>
                <span style={{ color: pct < 50 ? '#ef4444' : 'inherit' }}>{label}</span>
                <span style={{ fontWeight:700 }}>{score}/{max}</span>
              </div>
              <div style={{ height:5, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width .5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
      {actionItems.length > 0 && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-m)', textTransform:'uppercase',
            letterSpacing:.5, marginBottom:6 }}>Top Improvements</div>
          {actionItems.map((item, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'7px 10px',
              borderRadius:8, background:'var(--bg-subtle)', border:'1px solid var(--border)', marginBottom:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:priorityColor[item.priority],
                flexShrink:0, marginTop:4 }} />
              <span style={{ fontSize:11, color:'var(--text-b)', lineHeight:1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section Editor ────────────────────────────────────────────────────────────
function SectionEditor({ section, resumeData, setField, setPersonalInfo, setSkillCategory,
  updateArrayItem, addArrayItem, removeArrayItem, aiLoading, onAiImprove }) {
  const r = resumeData;

  if (section === 'personalInfo') {
    const pi = r.personalInfo || {};
    const fields = [
      ['firstName','First Name'], ['lastName','Last Name'], ['email','Email'],
      ['phone','Phone'], ['location','Location (City, State)'],
      ['linkedin','LinkedIn URL'], ['github','GitHub URL'], ['portfolio','Portfolio / Website'],
    ];
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        {fields.map(([key, label]) => (
          <LabeledInput key={key} label={label} value={pi[key] || ''} onChange={v => setPersonalInfo(key, v)} />
        ))}
      </div>
    );
  }

  if (section === 'summary') {
    const words = (r.summary || '').split(/\s+/).filter(Boolean).length;
    return (
      <div>
        <textarea className="input" rows={8} value={r.summary || ''} onChange={e => setField('summary', e.target.value)}
          placeholder="Write a concise professional summary (3–4 sentences)…" style={{ resize:'vertical' }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-m)', marginTop:4 }}>
          <span>{words} words · Aim for 40–80 words</span>
          <span style={{ color: words >= 40 && words <= 80 ? '#10b981' : 'var(--text-m)' }}>
            {words >= 40 && words <= 80 ? '✓ Good length' : words < 40 ? 'Too short' : 'Too long'}
          </span>
        </div>
      </div>
    );
  }

  if (section === 'experience') {
    return (
      <ArraySection items={r.experience || []} label="Add Experience"
        onAdd={() => addArrayItem('experience', { company:'', role:'', location:'', employmentType:'Full Time',
          locationType:'Onsite', startDate:'', endDate:'', isCurrent:false, responsibilities:[''] })}
        onRemove={i => removeArrayItem('experience', i)}
        renderItem={(exp, i) => (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              <LabeledInput label="Role / Title" value={exp.role} onChange={v => updateArrayItem('experience', i, 'role', v)} />
              <LabeledInput label="Company" value={exp.company} onChange={v => updateArrayItem('experience', i, 'company', v)} />
              {/* Smart dropdowns */}
              <LabeledSelect label="Employment Type" value={exp.employmentType || 'Full Time'}
                options={EMPLOYMENT_TYPES} onChange={v => updateArrayItem('experience', i, 'employmentType', v)} />
              <LabeledSelect label="Location Type" value={exp.locationType || 'Onsite'}
                options={LOCATION_TYPES} onChange={v => updateArrayItem('experience', i, 'locationType', v)} />
              <LabeledInput label="Start Date" value={exp.startDate} placeholder="e.g. Jan 2022"
                onChange={v => updateArrayItem('experience', i, 'startDate', v)} />
              <LabeledInput label="End Date" value={exp.isCurrent ? 'Present' : exp.endDate}
                placeholder="e.g. Dec 2023"
                onChange={v => updateArrayItem('experience', i, 'endDate', v)} disabled={exp.isCurrent} />
            </div>
            <LabeledInput label="Location" value={exp.location} onChange={v => updateArrayItem('experience', i, 'location', v)} />
            <label style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, cursor:'pointer', fontSize:12, color:'var(--text-b)' }}>
              <input type="checkbox" checked={exp.isCurrent} onChange={e => updateArrayItem('experience', i, 'isCurrent', e.target.checked)} />
              Currently working here
            </label>
            <BulletListEditor
              label="Responsibilities / Achievements"
              items={exp.responsibilities || []}
              placeholder="Led migration to microservices, reducing latency by 40%"
              onChange={bullets => updateArrayItem('experience', i, 'responsibilities', bullets)}
            />
          </div>
        )}
      />
    );
  }

  if (section === 'projects') {
    return (
      <ArraySection items={r.projects || []} label="Add Project"
        onAdd={() => addArrayItem('projects', { name:'', description:'', technologies:[], github:'', liveLink:'' })}
        onRemove={i => removeArrayItem('projects', i)}
        renderItem={(proj, i) => (
          <div>
            <LabeledInput label="Project Name" value={proj.name} onChange={v => updateArrayItem('projects', i, 'name', v)} />
            <div style={s.mb}>
              <label style={s.label}>Description</label>
              <textarea className="input" rows={3} value={proj.description}
                onChange={e => updateArrayItem('projects', i, 'description', e.target.value)} style={{ resize:'vertical' }} />
            </div>
            <div style={s.mb}>
              <label style={s.label}>Technologies (comma-separated)</label>
              <input className="input" value={(proj.technologies || []).join(', ')}
                onChange={e => updateArrayItem('projects', i, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              <LabeledInput label="GitHub URL" value={proj.github} onChange={v => updateArrayItem('projects', i, 'github', v)} />
              <LabeledInput label="Live Link" value={proj.liveLink} onChange={v => updateArrayItem('projects', i, 'liveLink', v)} />
            </div>
          </div>
        )}
      />
    );
  }

  if (section === 'education') {
    return (
      <ArraySection items={r.education || []} label="Add Education"
        onAdd={() => addArrayItem('education', { institution:'', degree:'', field:'', startDate:'', endDate:'', gpa:'' })}
        onRemove={i => removeArrayItem('education', i)}
        renderItem={(edu, i) => (
          <div>
            <LabeledInput label="Institution / University" value={edu.institution}
              onChange={v => updateArrayItem('education', i, 'institution', v)} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              {/* Smart degree dropdown */}
              <LabeledSelect label="Degree" value={edu.degree} options={DEGREE_OPTIONS}
                placeholder="Select degree…"
                onChange={v => updateArrayItem('education', i, 'degree', v)} />
              {/* Smart field of study dropdown */}
              <LabeledSelect label="Field of Study" value={edu.field} options={FIELD_OPTIONS}
                placeholder="Select field…"
                onChange={v => updateArrayItem('education', i, 'field', v)} />
              <LabeledInput label="Start Year" value={edu.startDate} placeholder="2020"
                onChange={v => updateArrayItem('education', i, 'startDate', v)} />
              <LabeledInput label="Graduation Year" value={edu.endDate} placeholder="2024"
                onChange={v => updateArrayItem('education', i, 'endDate', v)} />
            </div>
            <LabeledInput label="GPA / CGPA (optional)" value={edu.gpa}
              onChange={v => updateArrayItem('education', i, 'gpa', v)} />
          </div>
        )}
      />
    );
  }

  if (section === 'hardSkills') {
    const skills = r.skills || {};
    const total = HARD_SKILL_CATEGORIES.map(c => (skills[c] || []).length).reduce((a,b)=>a+b,0);
    return (
      <div>
        <div style={{ marginBottom:16, padding:12, borderRadius:10, background:'rgba(31,122,108,.06)',
          border:'1px solid rgba(31,122,108,.15)', fontSize:12, color:'var(--primary)', lineHeight:1.5 }}>
          ⚙️ <strong>Hard Skills</strong> — Technical skills, tools, frameworks, and work-related competencies.
        </div>
        {HARD_SKILL_CATEGORIES.map(cat => (
          <div key={cat} style={s.mb}>
            <label style={s.label}>{HARD_SKILL_CAT_LABELS[cat]}</label>
            <input className="input" placeholder="Comma separated, e.g., Python, Java"
              value={(skills[cat] || []).join(', ')}
              onChange={e => setSkillCategory(cat, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        ))}
        <div style={{ background: total >= 10 ? 'rgba(16,185,129,.08)' : 'var(--primary-lt)', borderRadius:8,
          padding:12, fontSize:12, color: total >= 10 ? '#065f46' : 'var(--primary)',
          border:`1px solid ${total >= 10 ? 'rgba(16,185,129,.2)' : 'rgba(99,102,241,.2)'}` }}>
          💡 Total hard skills: <strong>{total}</strong>.{' '}
          {total >= 10 ? '✓ Great coverage!' : `Aim for 10–20 (add ${10 - total} more).`}
        </div>
      </div>
    );
  }

  if (section === 'softSkills') {
    const skills = r.skills || {};
    const total = SOFT_SKILL_CATEGORIES.map(c => (skills[c] || []).length).reduce((a,b)=>a+b,0);
    return (
      <div>
        <div style={{ marginBottom:16, padding:12, borderRadius:10, background:'rgba(99,102,241,.06)',
          border:'1px solid rgba(99,102,241,.2)', fontSize:12, color:'#6366f1', lineHeight:1.5 }}>
          🤝 <strong>Soft Skills</strong> — Interpersonal skills, extracurricular activities, and non-technical abilities.
        </div>
        {SOFT_SKILL_CATEGORIES.map(cat => (
          <div key={cat} style={s.mb}>
            <label style={s.label}>{SOFT_SKILL_CAT_LABELS[cat]}</label>
            <input className="input"
              placeholder={cat === 'extracurricular' ? 'e.g. College Magazine Editor, Cultural Fest Organizer' : 'e.g. Leadership, Communication, Teamwork'}
              value={(skills[cat] || []).join(', ')}
              onChange={e => setSkillCategory(cat, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        ))}
        <div style={{ background: total >= 3 ? 'rgba(16,185,129,.08)' : 'rgba(99,102,241,.08)', borderRadius:8,
          padding:12, fontSize:12, color: total >= 3 ? '#065f46' : '#6366f1',
          border:`1px solid ${total >= 3 ? 'rgba(16,185,129,.2)' : 'rgba(99,102,241,.2)'}` }}>
          💡 Total soft skills & activities: <strong>{total}</strong>.{' '}
          {total >= 3 ? '✓ Good coverage!' : 'Add at least 3 soft skills or activities.'}
        </div>
      </div>
    );
  }

  if (section === 'certsAndAchievements') {
    const certs = r.certifications || [];
    const achievements = r.achievements || [];
    return (
      <div>
        {/* Certifications sub-section */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--text-h)' }}>📜 Certifications</div>
          </div>
          <ArraySection items={certs} label="Add Certification"
            onAdd={() => addArrayItem('certifications', { name:'', issuer:'', date:'', url:'' })}
            onRemove={i => removeArrayItem('certifications', i)}
            renderItem={(cert, i) => (
              <div>
                <LabeledInput label="Certification Name" value={cert.name}
                  onChange={v => updateArrayItem('certifications', i, 'name', v)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                  <LabeledInput label="Issuer" value={cert.issuer} onChange={v => updateArrayItem('certifications', i, 'issuer', v)} />
                  <LabeledInput label="Date" value={cert.date} placeholder="2023"
                    onChange={v => updateArrayItem('certifications', i, 'date', v)} />
                </div>
                <LabeledInput label="Credential URL (optional)" value={cert.url}
                  onChange={v => updateArrayItem('certifications', i, 'url', v)} />
              </div>
            )}
          />
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'var(--border)', marginBottom:24 }} />

        {/* Achievements sub-section */}
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'var(--text-h)', marginBottom:12 }}>🏆 Achievements</div>
          {achievements.map((a, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input className="input" value={a}
                placeholder="Won 1st place in national hackathon 2023"
                onChange={e => {
                  const arr = [...achievements]; arr[i] = e.target.value;
                  setField('achievements', arr);
                }} />
              <button onClick={() => setField('achievements', achievements.filter((_, k) => k !== i))}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-m)', fontSize:18 }}>×</button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setField('achievements', [...achievements, ''])}>
            + Add Achievement
          </button>
        </div>
      </div>
    );
  }

  if (section === 'languages') {
    return (
      <ArraySection items={r.languages || []} label="Add Language"
        onAdd={() => addArrayItem('languages', { language:'', proficiency:'' })}
        onRemove={i => removeArrayItem('languages', i)}
        renderItem={(lang, i) => (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
            <LabeledInput label="Language" value={lang.language}
              onChange={v => updateArrayItem('languages', i, 'language', v)} placeholder="e.g. English" />
            <div style={s.mb}>
              <label style={s.label}>Proficiency</label>
              <select className="input" value={lang.proficiency}
                onChange={e => updateArrayItem('languages', i, 'proficiency', e.target.value)}>
                <option value="">Select level</option>
                {PROF_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}
      />
    );
  }


  return null;
}


// ── Bullet List Editor ────────────────────────────────────────────────────────
function BulletListEditor({ label, items, placeholder, onChange }) {
  return (
    <div style={s.mb}>
      <label style={s.label}>{label}</label>
      {(items || []).map((bullet, j) => (
        <div key={j} style={{ display:'flex', gap:6, marginBottom:6 }}>
          <input className="input" value={bullet} placeholder={placeholder}
            onChange={e => { const arr = [...items]; arr[j] = e.target.value; onChange(arr); }} />
          <button onClick={() => onChange(items.filter((_, k) => k !== j))}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-m)', fontSize:18, padding:'0 4px' }}>×</button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={() => onChange([...(items || []), ''])} style={{ marginTop:2 }}>
        + Add bullet
      </button>
    </div>
  );
}

// ── Reusable sub-components ───────────────────────────────────────────────────
function LabeledInput({ label, value, onChange, placeholder, disabled }) {
  return (
    <div style={s.mb}>
      <label style={s.label}>{label}</label>
      <input className="input" value={value || ''} onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder || ''} disabled={disabled} />
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div style={s.mb}>
      <label style={s.label}>{label}</label>
      <select className="input" value={value || ''} onChange={e => onChange?.(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ArraySection({ items, label, onAdd, onRemove, renderItem }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id || i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:12, padding:20, marginBottom:16, position:'relative',
          boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-m)', textTransform:'uppercase', letterSpacing:.5 }}>#{i + 1}</span>
            <div style={{ display:'flex', gap:6 }}>

              <button onClick={() => onRemove(i)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-m)', fontSize:20, lineHeight:1 }}>×</button>
            </div>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
      <button className="btn btn-ghost btn-md" onClick={onAdd}
        style={{ width:'100%', justifyContent:'center', borderStyle:'dashed', borderColor:'var(--border-md)' }}>
        + {label}
      </button>
    </div>
  );
}
