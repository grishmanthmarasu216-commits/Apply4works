/**
 * ResumeOptimizerV2.jsx
 * 5-Step Job-Specific Resume Optimizer:
 *   Step 1: Analysis — ATS score breakdown, matched/missing keywords
 *   Step 2: Align   — Keyword + section selection
 *   Step 3: Optimize — Gemini AI optimization with progress
 *   Step 4: Review  — Before/after score delta, changes summary
 *   Step 5: Save    — Version confirmation + navigate to builder
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calculateRealTimeAts } from '../utils/frontendAtsEngine';
import { normalizeResume, flattenSkills } from '../utils/resumeNormalizer';
import ResumeTemplatesV2, { TEMPLATES } from '../components/resume/ResumeTemplatesV2';

import { API_BASE as API } from '../config/api';

const OPTIMIZE_SECTIONS = [
  { id: 'summary',    label: 'Professional Summary', icon: '📝' },
  { id: 'experience', label: 'Work Experience',       icon: '💼' },
  { id: 'projects',   label: 'Projects',              icon: '🚀' },
  { id: 'skills',     label: 'Skills',                icon: '⚡' },
];

const STEP_LABELS = ['Analysis', 'Align', 'Optimize', 'Review', 'Done'];

export default function ResumeOptimizerV2() {
  const { id: jobId }  = useParams();
  const navigate        = useNavigate();
  const { token }       = useAuth();

  // ── Core state ────────────────────────────────────────────────────────────
  const [step, setStep]                   = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [job, setJob]                     = useState(null);
  const [resumeData, setResumeData]       = useState(null);
  const [atsData, setAtsData]             = useState(null);
  const [extractedCategories, setExtCats] = useState({});

  // Step 2 selections
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [selectedSections, setSelectedSections] = useState(['summary', 'experience', 'projects', 'skills']);

  // Step 3 optimization
  const [isOptimizing, setIsOptimizing]   = useState(false);
  const [optimizeProgress, setProgress]   = useState(0);
  const [optimizeMsg, setOptimizeMsg]     = useState('');

  // Step 4 review
  const [optimizedData, setOptimizedData] = useState(null);
  const [scoreBefore, setScoreBefore]     = useState(0);
  const [scoreAfter, setScoreAfter]       = useState(0);
  const [scoreDelta, setScoreDelta]       = useState(0);
  const [template, setTemplate]           = useState('Modern ATS');
  const [previewMode, setPreviewMode]     = useState('after'); // 'before' | 'after'

  // Cover letter
  const [coverLetter, setCoverLetter]     = useState('');
  const [genCLLoading, setGenCLLoading]   = useState(false);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !jobId) return;

    // Check session cache
    const cacheKey = `resume_optimizer_v2_${jobId}`;
    const cached   = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { job: cJob, resumeData: cResume, atsData: cAts, cats } = JSON.parse(cached);
        setJob(cJob); setResumeData(cResume); setAtsData(cAts); setExtCats(cats || {});
        if (cAts?.missingSkills?.length > 0) setSelectedKeywords(cAts.missingSkills.slice(0, 10));
        setLoading(false);
        return;
      } catch {}
    }

    async function load() {
      setLoading(true);
      try {
        const [jobRes, resumeRes] = await Promise.all([
          fetch(`${API}/jobs/${jobId}`, { headers: authHeaders() }),
          fetch(`${API}/resume/me`,     { headers: authHeaders() }),
        ]);
        const jobData    = await jobRes.json();
        const resumeResp = await resumeRes.json();

        const jobObj = jobData.job || jobData;
        setJob(jobObj);

        const raw = resumeResp.resume?.resumeData
          || resumeResp.resume?.optimizedResume
          || resumeResp.resume?.parsedResume;

        if (!raw) {
          setError('No resume found. Please build or upload your resume first.');
          setLoading(false);
          return;
        }

        const normalized = normalizeResume(raw);
        setResumeData(normalized);

        // Run ATS analysis
        const jd   = jobObj.description || jobObj.jobDescription || '';
        const title = jobObj.title || jobObj.jobTitle || '';
        const expLevel = jobObj.experienceLevel || '';

        const analysisRes = await fetch(`${API}/resume/analyze-job`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ jobId, jobDescription: jd, jobTitle: title, experienceLevel: expLevel }),
        });
        const analysisData = await analysisRes.json();
        if (analysisData.success) {
          setAtsData(analysisData.atsData);
          setExtCats(analysisData.extractedCategories || {});
          const preSelected = (analysisData.atsData?.missingSkills || []).slice(0, 10);
          setSelectedKeywords(preSelected);
          // Cache for session
          sessionStorage.setItem(cacheKey, JSON.stringify({
            job: jobObj, resumeData: normalized,
            atsData: analysisData.atsData,
            cats: analysisData.extractedCategories,
          }));
        }
      } catch (e) {
        setError('Failed to load job or resume data. Please try again.');
        console.error('[Optimizer]', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [jobId, token]);

  // ── Optimization ──────────────────────────────────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (!resumeData || !job) return;
    setIsOptimizing(true);
    setProgress(10);
    setOptimizeMsg('Analyzing job description...');

    const stages = [
      [30, 'Selecting relevant keywords...'],
      [55, 'Rewriting experience bullets...'],
      [75, 'Optimizing summary...'],
      [90, 'Validating ATS compliance...'],
    ];

    const progressInterval = setInterval(() => {
      setProgress(p => {
        const nextStage = stages.find(([target]) => p < target);
        if (nextStage) {
          setOptimizeMsg(nextStage[1]);
          return Math.min(p + 3, nextStage[0]);
        }
        return p;
      });
    }, 500);

    try {
      const jd    = job.description || job.jobDescription || '';
      const title = job.title || job.jobTitle || '';
      const res   = await fetch(`${API}/resume/optimize`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          jobId,
          jobDescription: jd,
          jobTitle: title,
          selectedKeywords,
          sectionsToOptimize: selectedSections,
        }),
      });
      const data = await res.json();

      if (data.success) {
        clearInterval(progressInterval);
        setProgress(100);
        setOptimizeMsg('Done!');

        const optimized = normalizeResume(data.resumeData);
        setOptimizedData(optimized);
        setScoreBefore(data.scoreBefore || atsData?.atsScore || 0);
        setScoreAfter(data.scoreAfter  || data.atsData?.atsScore || 0);
        setScoreDelta(data.scoreDelta  || 0);

        // Move to review step after brief pause
        setTimeout(() => { setStep(3); setIsOptimizing(false); }, 600);
      } else {
        throw new Error(data.message || 'Optimization failed');
      }
    } catch (e) {
      clearInterval(progressInterval);
      setIsOptimizing(false);
      setError(e.message || 'Optimization failed. Please try again.');
      setStep(1);
    }
  }, [resumeData, job, selectedKeywords, selectedSections, atsData, authHeaders]);

  // ── Cover letter ──────────────────────────────────────────────────────────
  const handleGenerateCL = useCallback(async () => {
    setGenCLLoading(true);
    try {
      const res = await fetch(`${API}/resume/generate-cover-letter`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          jobTitle: job?.title,
          jobDescription: job?.description || '',
          company: job?.company || '',
          tone: 'professional',
        }),
      });
      const data = await res.json();
      if (data.success) setCoverLetter(data.coverLetter);
    } catch (e) {
      console.error('[CoverLetter]', e);
    } finally {
      setGenCLLoading(false);
    }
  }, [job, authHeaders]);

  // ── Keyword toggle ─────────────────────────────────────────────────────────
  const toggleKeyword = (kw) => {
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  // ── Score ring helper ──────────────────────────────────────────────────────
  const ScoreRing = ({ score, size = 80, label }) => {
    const matchScore = parseFloat((score / 10).toFixed(1));
    const color = score >= 70 ? 'var(--primary)' : score >= 50 ? 'var(--accent)' : '#ef4444';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `conic-gradient(${color} ${score * 3.6}deg, var(--border) 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <div style={{
            width: size - 14, height: size - 14, borderRadius: '50%', background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', textAlign: 'center',
          }}>
            <div style={{ fontSize: size * 0.2, fontWeight: 800, color, lineHeight: 1 }}>{matchScore}</div>
            <div style={{ fontSize: size * 0.1, color: 'var(--text-m)' }}>/10</div>
          </div>
        </div>
        {label && <div style={{ fontSize: 11, color: 'var(--text-m)', fontWeight: 600 }}>{label}</div>}
      </div>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, paddingLeft: 240 }}>
      <div className="spinner" style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      <div style={{ color: 'var(--text-m)', fontSize: 14 }}>Analyzing job match...</div>
    </div>
  );

  if (error && !atsData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 14, paddingLeft: 240 }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <h2 style={{ margin: 0, color: 'var(--text-h)' }}>{error}</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-md" onClick={() => navigate('/resume-builder')}>Build Resume</button>
        <button className="btn btn-ghost btn-md" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  const jd    = job?.description || job?.jobDescription || '';
  const title = job?.title || job?.jobTitle || '';

  return (
    <div style={{ paddingLeft: 240, minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>Resume Optimizer</div>
          <div style={{ fontSize: 12, color: 'var(--text-m)' }}>
            {title}{job?.company ? ` · ${job.company}` : ''}
          </div>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: i === step ? 'var(--primary-lt)' : i < step ? 'var(--sage-lt)' : 'transparent',
                color: i === step ? 'var(--primary)' : i < step ? 'var(--sage-dk)' : 'var(--text-m)',
                fontSize: 12, fontWeight: i === step ? 700 : 400,
              }}>
                {i < step ? '✓' : i + 1}. {label}
              </div>
              {i < STEP_LABELS.length - 1 && <span style={{ color: 'var(--border-md)', fontSize: 12 }}>›</span>}
            </React.Fragment>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>✕ Exit</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── STEP 0: Analysis ──────────────────────────────────────────── */}
        {step === 0 && atsData && (
          <div className="fade-up">
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-h)' }}>Job Match Analysis</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-m)', fontSize: 14 }}>Here's how your resume matches this job right now.</p>

            {/* Score + breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ScoreRing score={atsData.atsScore} size={100} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', textAlign: 'center' }}>Current ATS Score</div>
                <div style={{ fontSize: 12, color: 'var(--text-m)', textAlign: 'center' }}>
                  {atsData.atsScore >= 70 ? '🟢 Strong match' : atsData.atsScore >= 50 ? '🟡 Good match' : '🔴 Needs work'}
                </div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 12 }}>Score Breakdown</div>
                {Object.entries(atsData.scoreBreakdown || {}).map(([key, val]) => {
                  const maxes = { skills: 35, experience: 25, projects: 15, titleAlignment: 10, education: 5, keywordCoverage: 10 };
                  const labs  = { skills: 'Skills', experience: 'Experience', projects: 'Projects', titleAlignment: 'Title Match', education: 'Education', keywordCoverage: 'Keywords' };
                  const pct   = maxes[key] ? Math.round((val / maxes[key]) * 100) : 0;
                  return (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-m)', marginBottom: 3 }}>
                        <span>{labs[key]}</span>
                        <span style={{ fontWeight: 600, color: pct >= 70 ? 'var(--primary)' : pct >= 40 ? 'var(--accent-dk)' : '#ef4444' }}>
                          {val}/{maxes[key]} pts
                        </span>
                      </div>
                      <div className="progress-track" style={{ height: 6 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--primary)' : pct >= 40 ? 'var(--accent)' : '#ef4444' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keywords */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>✅ Matched Keywords ({(atsData.presentSkills || []).length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(atsData.presentSkills || []).map(s => (
                    <span key={s} className="badge badge-green">{s}</span>
                  ))}
                  {(atsData.presentSkills || []).length === 0 && <span style={{ color: 'var(--text-m)', fontSize: 12 }}>No matches detected</span>}
                </div>
              </div>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>❌ Missing Keywords ({(atsData.missingSkills || []).length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(atsData.missingSkills || []).map(s => (
                    <span key={s} className="badge badge-red">{s}</span>
                  ))}
                  {(atsData.missingSkills || []).length === 0 && <span style={{ color: 'var(--text-m)', fontSize: 12 }}>No missing keywords!</span>}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {(atsData.recommendations || []).length > 0 && (
              <div className="card" style={{ padding: 18, marginBottom: 24, background: 'var(--accent-lt)', borderColor: 'var(--accent)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dk)', marginBottom: 8 }}>💡 Recommendations</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {atsData.recommendations.map((r, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-b)', marginBottom: 4 }}>{r}</li>)}
                </ul>
              </div>
            )}

            <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>
              Align Resume → 
            </button>
          </div>
        )}

        {/* ── STEP 1: Align ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="fade-up">
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-h)' }}>Align Your Resume</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-m)', fontSize: 14 }}>Select the keywords to integrate and which sections to optimize.</p>

            {/* Keyword selection by category */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>
                  Keywords to integrate ({selectedKeywords.length} selected)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedKeywords(
                    Object.values(extractedCategories).flat()
                  )}>Select All</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedKeywords([])}>Clear</button>
                </div>
              </div>

              {Object.entries(extractedCategories).map(([category, keywords]) => (
                <div key={category} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{category}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {keywords.map(kw => {
                      const isSelected = selectedKeywords.includes(kw);
                      const isMissing  = (atsData?.missingSkills || []).includes(kw);
                      return (
                        <button
                          key={kw}
                          onClick={() => toggleKeyword(kw)}
                          style={{
                            padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--primary-lt)' : isMissing ? '#fef2f2' : 'transparent',
                            color: isSelected ? 'var(--primary)' : isMissing ? '#dc2626' : 'var(--text-b)',
                            fontWeight: isSelected ? 700 : 400,
                            transition: 'all .15s',
                          }}
                        >
                          {isSelected ? '✓ ' : isMissing ? '✕ ' : ''}{kw}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Custom keyword input */}
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-m)', marginBottom: 6 }}>Add custom keywords (comma-separated)</div>
                <input
                  className="input"
                  placeholder="e.g., FastAPI, Prisma, LangChain"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const newKws = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setSelectedKeywords(prev => [...new Set([...prev, ...newKws])]);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Section selection */}
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', marginBottom: 12 }}>Sections to optimize</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {OPTIMIZE_SECTIONS.map(sec => {
                  const selected = selectedSections.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderRadius: 8, border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        background: selected ? 'var(--primary-lt)' : 'transparent',
                        cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={e => setSelectedSections(prev =>
                          e.target.checked ? [...prev, sec.id] : prev.filter(s => s !== sec.id)
                        )}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: 14 }}>{sec.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: selected ? 700 : 400, color: selected ? 'var(--primary)' : 'var(--text-b)' }}>
                        {sec.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setStep(0)}>← Back</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => { setStep(2); setTimeout(handleOptimize, 100); }}
                disabled={selectedKeywords.length === 0 || selectedSections.length === 0}
              >
                ✨ Optimize Resume →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Optimize ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="fade-up" style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✨</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--text-h)' }}>Optimizing your resume</h2>
            <p style={{ margin: '0 0 32px', color: 'var(--text-m)' }}>{optimizeMsg || 'Getting started...'}</p>
            <div className="progress-track" style={{ height: 8, borderRadius: 999, marginBottom: 12 }}>
              <div className="progress-fill" style={{ width: `${optimizeProgress}%`, transition: 'width .4s ease', height: '100%' }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-m)' }}>{optimizeProgress}% complete</div>
          </div>
        )}

        {/* ── STEP 3: Review ──────────────────────────────────────────────── */}
        {step === 3 && optimizedData && (
          <div className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text-h)' }}>Review Optimized Resume</h2>
                <p style={{ margin: 0, color: 'var(--text-m)', fontSize: 14 }}>Your resume has been improved. Review the changes below.</p>
              </div>
              {/* Score delta */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <ScoreRing score={scoreBefore} size={70} label="Before" />
                <div style={{ fontSize: 24, color: scoreDelta >= 0 ? 'var(--primary)' : '#ef4444' }}>
                  {scoreDelta >= 0 ? '↑' : '↓'}
                </div>
                <ScoreRing score={scoreAfter} size={70} label="After" />
                <div style={{
                  padding: '6px 14px', borderRadius: 999,
                  background: scoreDelta >= 0 ? 'var(--primary-lt)' : '#fef2f2',
                  color: scoreDelta >= 0 ? 'var(--primary)' : '#dc2626',
                  fontSize: 16, fontWeight: 800,
                }}>
                  {scoreDelta >= 0 ? '+' : ''}{scoreDelta} pts
                </div>
              </div>
            </div>

            {/* Before/After toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['after', 'before'].map(mode => (
                <button
                  key={mode}
                  className={`btn btn-${previewMode === mode ? 'primary' : 'ghost'} btn-sm`}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode === 'after' ? '✨ Optimized Version' : '📄 Original'}
                </button>
              ))}
              {/* Template switcher */}
              <select
                className="input"
                value={template}
                onChange={e => setTemplate(e.target.value)}
                style={{ width: 160, height: 33, padding: '4px 10px', fontSize: 12 }}
              >
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            {/* Resume preview */}
            <div style={{ marginBottom: 24, overflowX: 'auto', background: '#e5e5e5', borderRadius: 10, padding: 16 }}>
              <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', width: '210mm' }}>
                <ResumeTemplatesV2
                  resumeData={previewMode === 'after' ? optimizedData : resumeData}
                  template={template}
                />
              </div>
            </div>

            {/* Cover letter */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: coverLetter ? 12 : 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>📝 Cover Letter</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleGenerateCL}
                  disabled={genCLLoading}
                >
                  {genCLLoading ? '⌛ Generating...' : coverLetter ? '🔄 Regenerate' : '✨ Generate Cover Letter'}
                </button>
              </div>
              {coverLetter && (
                <div>
                  <textarea
                    className="input"
                    rows={10}
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6 }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 6 }}
                    onClick={() => { navigator.clipboard.writeText(coverLetter); }}
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setStep(1)}>← Redo Alignment</button>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(4)}>
                Save & Finish ✓
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ──────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="fade-up" style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text-h)' }}>Resume saved!</h2>
            <p style={{ margin: '0 0 8px', color: 'var(--text-m)', fontSize: 14 }}>Your optimized version has been saved and a snapshot added to your version history.</p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/resume-builder')}>
                ✏️ Open Resume Builder
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>
                ← Back to Job
              </button>
            </div>

            {scoreDelta > 0 && (
              <div style={{ marginTop: 20, padding: '12px 20px', background: 'var(--primary-lt)', borderRadius: 12, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                🚀 Your ATS score improved by +{scoreDelta} points!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
