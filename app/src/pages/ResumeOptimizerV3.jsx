/**
 * ResumeOptimizerV3.jsx — Apply4Works Resume Platform V3
 * Redesigned: Clean 3-section layout with score gauge, keyword tags, and recommendation panel.
 * Fixed: paddingLeft layout, error handling, and overall design quality.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../hooks/useResume';
import { calculateRealTimeAts } from '../utils/frontendAtsEngine';
import { flattenSkills } from '../utils/resumeNormalizer';

import { API_BASE as API } from '../config/api';

const STEPS = ['Resume', 'Job', 'Match', 'Keywords', 'Optimize', 'Review', 'Download'];

const PROGRESS_STAGES = [
  { label: 'Analyzing Job Description', duration: 1200 },
  { label: 'Extracting Keywords & Skills', duration: 1000 },
  { label: 'Optimizing Summary', duration: 2000 },
  { label: 'Optimizing Experience', duration: 2500 },
  { label: 'Optimizing Projects', duration: 1500 },
  { label: 'Running ATS Validation', duration: 800 },
];

const ALL_SECTIONS = ['summary', 'experience', 'projects', 'skills'];

export default function ResumeOptimizerV3() {
  const { token } = useAuth();
  const { resumeData, refetch } = useResume();
  const navigate = useNavigate();

  const [step, setStep]                       = useState(0);
  const [jobTitle, setJobTitle]               = useState('');
  const [jobDescription, setJobDescription]   = useState('');
  const [company, setCompany]                 = useState('');
  const [atsResult, setAtsResult]             = useState(null);
  const [analyzing, setAnalyzing]             = useState(false);
  const [selectedSections, setSelectedSections] = useState(['summary','experience','skills']);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [intensity, setIntensity]             = useState('moderate');
  const [progressStage, setProgressStage]     = useState(0);
  const [progressPct, setProgressPct]         = useState(0);
  const [optimizedData, setOptimizedData]     = useState(null);
  const [scoreBefore, setScoreBefore]         = useState(0);
  const [scoreAfter, setScoreAfter]           = useState(0);
  const [saving, setSaving]                   = useState(false);
  const [saveMode, setSaveMode]               = useState('new');
  const [versionLabel, setVersionLabel]       = useState('');
  const [saved, setSaved]                     = useState(false);
  const [error, setError]                     = useState('');
  const [activeTab, setActiveTab]             = useState('match'); // match | keywords | optimize | review

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Compute local ATS score from resume data
  const localAts = resumeData ? calculateRealTimeAts(resumeData, null) : null;

  // ── Step 0 → 1: Analyze ────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!jobDescription.trim()) { setError('Please enter a job description.'); return; }
    if (!resumeData) { setError('No resume found. Please build your resume first in Resume Builder.'); return; }
    setError('');
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/resume/analyze-job`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jobTitle, jobDescription, experienceLevel: '' }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Analysis failed.');
      setAtsResult(data.atsData);
      setScoreBefore(data.atsData?.atsScore || 0);
      setSelectedKeywords((data.atsData?.missingSkills || []).slice(0, 10));
      setStep(1);
      setActiveTab('match');
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }, [jobDescription, jobTitle, resumeData, authHeaders]);

  // ── Optimize ──────────────────────────────────────────────────────────
  const handleOptimize = useCallback(async () => {
    if (selectedSections.length === 0) { setError('Select at least one section to optimize.'); return; }
    setError('');
    setStep(2);
    setProgressStage(0);
    setProgressPct(0);

    let cumulative = 0;
    const total = PROGRESS_STAGES.reduce((s, p) => s + p.duration, 0);
    for (let i = 0; i < PROGRESS_STAGES.length; i++) {
      setProgressStage(i);
      const stage = PROGRESS_STAGES[i];
      const steps = 20;
      const stepDur = stage.duration / steps;
      for (let j = 0; j <= steps; j++) {
        await new Promise(r => setTimeout(r, stepDur));
        const done = cumulative + (stage.duration * j / steps);
        setProgressPct(Math.min(95, Math.round((done / total) * 100)));
      }
      cumulative += stage.duration;
    }

    try {
      const res = await fetch(`${API}/resume/optimize`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jobTitle, jobDescription, selectedKeywords, sectionsToOptimize: selectedSections }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Optimization failed.');
      setProgressPct(100);
      setOptimizedData(data.resumeData);
      setScoreBefore(data.scoreBefore);
      setScoreAfter(data.scoreAfter);
      await new Promise(r => setTimeout(r, 400));
      setStep(1);
      setActiveTab('review');
    } catch (e) {
      setError(e.message || 'Optimization failed. Please try again.');
      setStep(1);
    }
  }, [selectedSections, selectedKeywords, jobTitle, jobDescription, authHeaders]);

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!optimizedData) { setError('No optimized data to save.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/resume/save`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ resumeData: optimizedData, template: undefined }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Save failed.');
      await refetch();
      setSaved(true);
    } catch (e) {
      setError(e.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [optimizedData, authHeaders, refetch]);

  const delta = scoreAfter - scoreBefore;
  const scoreColor = (s) => s >= 70 ? '#10b981' : s >= 45 ? '#f59e0b' : '#ef4444';

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{
      marginLeft: 240,
      minHeight: '100vh',
      background: 'var(--bg-subtle)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 'calc(100vw - 240px)',
      overflow: 'hidden',
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-h)' }}>⚡ Resume Optimizer</div>
          <div style={{ fontSize: 11, color: 'var(--text-m)' }}>AI-powered ATS optimization</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((s, i) => {
            const done = step > 0 && i < 2;
            const active = (i === 0 && step === 0) || (i === 1 && step === 1) || (i === 2 && step === 2);
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 800,
                    background: done ? 'var(--primary)' : active ? 'var(--primary)' : 'var(--border)',
                    color: done || active ? '#fff' : 'var(--text-m)',
                    boxShadow: active ? '0 0 0 3px var(--primary-lt)' : 'none',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? 'var(--primary)' : 'var(--text-m)', whiteSpace: 'nowrap' }}>{s}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 28, height: 2, background: done ? 'var(--primary)' : 'var(--border)', margin: '0 2px', marginBottom: 18 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          margin: '12px 32px 0',
          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)',
          borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#ef4444',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{ flex: 1 }}>⚠ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>×</button>
        </div>
      )}

      {/* ── STEP 0: Input ── */}
      {step === 0 && (
        <div style={{ flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, maxWidth: 1100 }}>

            {/* LEFT: Job input */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, border: '1px solid var(--border)' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📋 Paste Job Details
              </h2>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Job Title</label>
                <input className="input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Company (optional)</label>
                <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Job Description <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="input" rows={10} value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here…" style={{ resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: 'var(--text-m)', marginTop: 4 }}>
                  {jobDescription.length} chars · More text = better analysis
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAnalyze}
                disabled={analyzing || !jobDescription.trim() || !resumeData}
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px 0' }}>
                {analyzing ? '⌛ Analyzing…' : '🔍 Analyze My Resume'}
              </button>
              {!resumeData && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#f59e0b', textAlign: 'center' }}>
                  ⚠ No resume found.{' '}
                  <button onClick={() => navigate('/resume-builder')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    Build your resume first →
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Resume stats & tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Current score widget */}
              {localAts && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20 }}>
                  <ScoreGauge score={localAts.atsScore} size={90} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-m)', marginBottom: 2 }}>Current ATS Score</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor(localAts.atsScore) }}>{localAts.atsScore}/100</div>
                    <div style={{ fontSize: 12, color: scoreColor(localAts.atsScore), fontWeight: 700 }}>
                      {localAts.atsScore >= 70 ? '🟢 Strong' : localAts.atsScore >= 45 ? '🟡 Moderate' : '🔴 Needs Work'}
                    </div>
                  </div>
                </div>
              )}

              {/* Resume stats */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 12 }}>📊 Resume Overview</div>
                {resumeData ? (
                  <>
                    <StatRow label="Experience entries" value={`${(resumeData.experience || []).length}`} />
                    <StatRow label="Projects" value={`${(resumeData.projects || []).length}`} />
                    <StatRow label="Skills listed" value={`${flattenSkills(resumeData.skills).length}`} />
                    <StatRow label="Certifications" value={`${(resumeData.certifications || []).length}`} />
                    <StatRow label="Name" value={`${resumeData.personalInfo?.firstName || ''} ${resumeData.personalInfo?.lastName || ''}`.trim() || '—'} />
                  </>
                ) : (
                  <div style={{ color: 'var(--text-m)', fontSize: 13 }}>No resume loaded.</div>
                )}
              </div>

              {/* Protection notice */}
              <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.08),rgba(168,85,247,.06))', borderRadius: 16, padding: 20, border: '1px solid rgba(99,102,241,.2)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>🔒 Anti-Hallucination Protection</div>
                <div style={{ fontSize: 12, color: 'var(--text-m)', lineHeight: 1.6 }}>
                  All AI optimizations are <strong>fact-locked</strong>. The AI only rewrites your existing content — it never adds fake companies, metrics, or experience.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Progress animation ── */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-h)', marginBottom: 8 }}>⚡ Optimizing Your Resume…</div>
            <div style={{ fontSize: 14, color: 'var(--text-m)' }}>AI is rewriting your resume — this takes 10–15 seconds</div>
          </div>
          <svg width={160} height={160}>
            <circle cx={80} cy={80} r={70} fill="none" stroke="var(--border)" strokeWidth={8} />
            <circle cx={80} cy={80} r={70} fill="none" stroke="var(--primary)" strokeWidth={8}
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPct / 100)}`}
              strokeLinecap="round" transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dashoffset .3s ease' }} />
            <text x={80} y={80} textAnchor="middle" dominantBaseline="central" fontSize={28} fontWeight={900} fill="var(--primary)">{progressPct}%</text>
          </svg>
          <div style={{ width: '100%', maxWidth: 440 }}>
            {PROGRESS_STAGES.map((stage, i) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: i < PROGRESS_STAGES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0,
                  background: i < progressStage ? '#10b981' : i === progressStage ? 'var(--primary)' : 'var(--border)',
                  color: i <= progressStage ? '#fff' : 'var(--text-m)',
                }}>
                  {i < progressStage ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: i === progressStage ? 700 : 400,
                  color: i < progressStage ? '#10b981' : i === progressStage ? 'var(--primary)' : 'var(--text-m)' }}>
                  {stage.label}{i === progressStage && <span style={{ animation: 'pulse 1s infinite' }}> …</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 1: 3-column analysis view ── */}
      {step === 1 && atsResult && (
        <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

          {/* LEFT: Target role + score */}
          <div style={{
            width: 260, flexShrink: 0, borderRight: '1px solid var(--border)',
            background: 'var(--bg-card)', overflowY: 'auto', padding: 24,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Target Role</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-h)', lineHeight: 1.3 }}>
                {jobTitle || 'Your Job Role'}
              </div>
              {company && <div style={{ fontSize: 12, color: 'var(--text-m)', marginTop: 4 }}>{company}</div>}
            </div>

            {/* ATS Score card */}
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>ATS Match Score</div>
              <ScoreGauge score={scoreBefore} size={110} />
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: scoreColor(scoreBefore) }}>
                {scoreBefore >= 70 ? '🟢 Strong Match' : scoreBefore >= 45 ? '🟡 Moderate' : '🔴 Weak Match'}
              </div>
            </div>

            {/* Score breakdown */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Score Breakdown</div>
              {Object.entries(atsResult.scoreBreakdown || {}).map(([key, val]) => {
                const maxes = { skills: 35, experience: 25, projects: 15, titleAlignment: 10, education: 5, keywordCoverage: 10 };
                const labels = { skills: 'Skills', experience: 'Experience', projects: 'Projects', titleAlignment: 'Title', education: 'Education', keywordCoverage: 'Keywords' };
                const pct = maxes[key] ? Math.round((val / maxes[key]) * 100) : 0;
                const c = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-m)', marginBottom: 3 }}>
                      <span>{labels[key]}</span><span style={{ fontWeight: 700, color: c }}>{val}/{maxes[key]}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 4, transition: 'width .5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optimized score (if available) */}
            {optimizedData && (
              <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>After Optimization</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ScoreGauge score={scoreAfter} size={56} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{scoreAfter}</div>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                      {delta > 0 ? `+${delta} points 🎉` : `${delta} points`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CENTER: Tabs — Match / Keywords / Optimize / Review */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', flexShrink: 0, padding: '0 8px' }}>
              {[
                { id: 'match', label: '📊 Match Analysis' },
                { id: 'keywords', label: '🔑 Keywords' },
                { id: 'optimize', label: '⚡ Optimize' },
                ...(optimizedData ? [{ id: 'review', label: '✨ Review' }] : []),
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '12px 16px', fontSize: 12, fontWeight: activeTab === tab.id ? 800 : 500,
                  border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-m)', transition: 'all .15s',
                }}>{tab.label}</button>
              ))}
              <div style={{ flex: 1 }} />
              {optimizedData && (
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}
                  style={{ margin: '8px 8px', fontSize: 12 }}>
                  {saving ? '⌛ Saving…' : '💾 Apply to Resume'}
                </button>
              )}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

              {/* Match Analysis tab */}
              {activeTab === 'match' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Present vs missing skills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Present Skills</div>
                      {(atsResult.matchedKeywords || []).length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(atsResult.matchedKeywords || []).slice(0, 15).map(kw => (
                            <span key={kw} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,.1)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)', fontWeight: 600 }}>
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-m)', fontSize: 12 }}>No exact matches found.</div>
                      )}
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Missing Skills</div>
                      {(atsResult.missingSkills || []).length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(atsResult.missingSkills || []).slice(0, 15).map(kw => (
                            <span key={kw} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600 }}>
                              ⊗ {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>✓ All required skills matched!</div>
                      )}
                    </div>
                  </div>

                  {/* Resume Health */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 14 }}>Resume Health</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {Object.entries(atsResult.scoreBreakdown || {}).map(([key, val]) => {
                        const maxes = { skills: 35, experience: 25, projects: 15, titleAlignment: 10, education: 5, keywordCoverage: 10 };
                        const labels = { skills: 'Skills Match', experience: 'Experience Match', projects: 'Projects Match', titleAlignment: 'Title Match', education: 'Education', keywordCoverage: 'Completeness' };
                        const pct = maxes[key] ? Math.round((val / maxes[key]) * 100) : 0;
                        const grade = pct >= 70 ? { label: 'Strong', color: '#10b981' } : pct >= 40 ? { label: 'Medium', color: '#f59e0b' } : { label: 'Weak', color: '#ef4444' };
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-b)' }}>{labels[key] || key}:</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: grade.color }}>{grade.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {(atsResult.suggestions || atsResult.missingSkills?.length > 0) && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 12 }}>💡 Recommendations</div>
                      {(atsResult.missingSkills || []).slice(0, 3).map((kw, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--text-b)', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: 8, marginBottom: 6, lineHeight: 1.5, border: '1px solid var(--border)' }}>
                          • Add <strong>{kw}</strong> to your skills section to improve match score
                        </div>
                      ))}
                      {(atsResult.suggestions || []).slice(0, 4).map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--text-b)', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: 8, marginBottom: 6, lineHeight: 1.5, border: '1px solid var(--border)' }}>
                          • {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Keywords tab */}
              {activeTab === 'keywords' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 6 }}>Select keywords to integrate into your resume</div>
                    <div style={{ fontSize: 12, color: 'var(--text-m)', marginBottom: 16 }}>Click to toggle · {selectedKeywords.length} selected for optimization</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(atsResult.missingSkills || []).map(kw => (
                        <button key={kw} onClick={() => setSelectedKeywords(prev =>
                          prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
                        )} style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                          borderColor: selectedKeywords.includes(kw) ? 'var(--primary)' : 'var(--border)',
                          background: selectedKeywords.includes(kw) ? 'var(--primary-lt)' : 'transparent',
                          color: selectedKeywords.includes(kw) ? 'var(--primary)' : 'var(--text-m)',
                          transition: 'all .15s',
                        }}>{selectedKeywords.includes(kw) ? '✓ ' : ''}{kw}</button>
                      ))}
                    </div>
                  </div>
                  {selectedKeywords.length > 0 && (
                    <div style={{ background: 'var(--primary-lt)', border: '1px solid rgba(31,122,108,.2)', borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>{selectedKeywords.length} keywords selected for optimization:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedKeywords.map(kw => (
                          <span key={kw} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--primary)', color: '#fff', fontWeight: 600 }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optimize tab */}
              {activeTab === 'optimize' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 14 }}>📝 Sections to Optimize</div>
                    {ALL_SECTIONS.map(sec => (
                      <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                        <input type="checkbox" checked={selectedSections.includes(sec)}
                          onChange={() => setSelectedSections(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec])}
                          style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-b)', textTransform: 'capitalize' }}>{sec}</span>
                        {resumeData?.[sec] && (
                          <span style={{ fontSize: 11, color: 'var(--text-m)', marginLeft: 'auto' }}>
                            {Array.isArray(resumeData[sec]) ? `${resumeData[sec].length} entries` : '✓'}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', marginBottom: 14 }}>⚡ Optimization Intensity</div>
                    {[
                      { id: 'light', label: 'Light', desc: 'Minor rewrites, keyword additions only' },
                      { id: 'moderate', label: 'Moderate', desc: 'Stronger rewrites, better structure' },
                      { id: 'aggressive', label: 'Aggressive', desc: 'Maximum ATS impact — still fact-locked' },
                    ].map(opt => (
                      <label key={opt.id} onClick={() => setIntensity(opt.id)} style={{
                        display: 'flex', gap: 12, padding: 12, borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                        border: '1.5px solid', borderColor: intensity === opt.id ? 'var(--primary)' : 'var(--border)',
                        background: intensity === opt.id ? 'var(--primary-lt)' : 'transparent', transition: 'all .15s',
                      }}>
                        <div style={{ marginTop: 2 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${intensity === opt.id ? 'var(--primary)' : 'var(--border)'}`, background: intensity === opt.id ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {intensity === opt.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: intensity === opt.id ? 'var(--primary)' : 'var(--text-h)' }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-m)' }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button className="btn btn-primary" onClick={handleOptimize}
                    disabled={selectedSections.length === 0}
                    style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px 0' }}>
                    ⚡ Start AI Optimization →
                  </button>
                </div>
              )}

              {/* Review tab */}
              {activeTab === 'review' && optimizedData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Score comparison */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-m)', marginBottom: 6, fontWeight: 600 }}>Before</div>
                        <ScoreGauge score={scoreBefore} size={72} dimmed />
                      </div>
                      <div style={{ fontSize: 24, color: 'var(--text-m)' }}>→</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-m)', marginBottom: 6, fontWeight: 600 }}>After</div>
                        <ScoreGauge score={scoreAfter} size={72} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: delta > 0 ? '#10b981' : 'var(--text-h)' }}>
                        {delta > 0 ? `+${delta}` : delta} point{Math.abs(delta) !== 1 ? 's' : ''} {delta > 0 ? '🎉' : ''}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-m)', marginTop: 4 }}>
                        {selectedKeywords.length} keywords integrated · {selectedSections.length} sections optimized
                      </div>
                    </div>
                  </div>

                  {/* Side-by-side diff */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <SectionDiff title="Original Resume" data={resumeData} sections={selectedSections} accent="var(--border)" />
                    <SectionDiff title="Optimized Resume" data={optimizedData} sections={selectedSections} accent="var(--primary)" highlight />
                  </div>

                  {saved && (
                    <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>✅ Resume saved successfully!</div>
                      <button onClick={() => navigate('/resume-builder')} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                        Open Resume Builder →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Quick actions */}
          <div style={{
            width: 220, flexShrink: 0, borderLeft: '1px solid var(--border)',
            background: 'var(--bg-card)', overflowY: 'auto', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Actions</div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
              onClick={() => setActiveTab('optimize')}>
              ⚡ Optimize Resume
            </button>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setStep(0)}>
              ← Change Job
            </button>

            {optimizedData && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', borderColor: '#10b981', color: '#10b981' }}
                  onClick={handleSave} disabled={saving}>
                  {saving ? '⌛' : '💾'} Apply to Resume
                </button>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/resume-builder')}>
                  Open Builder →
                </button>
              </>
            )}

            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Job Info</div>
            <div style={{ fontSize: 12, color: 'var(--text-b)' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{jobTitle || '—'}</div>
              {company && <div style={{ color: 'var(--text-m)' }}>{company}</div>}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-m)', lineHeight: 1.5 }}>
              {selectedKeywords.length > 0 && (
                <><strong>{selectedKeywords.length}</strong> keywords selected<br /></>
              )}
              {selectedSections.length > 0 && (
                <><strong>{selectedSections.length}</strong> sections to optimize</>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}

// ── Score Gauge (half-circle style) ──────────────────────────────────────────
function ScoreGauge({ score, size = 90, dimmed = false }) {
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const r = size / 2 - 8;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ opacity: dimmed ? 0.55 : 1 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset .6s' }} />
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central"
        fontSize={size / 4} fontWeight={900} fill={color}>{score}</text>
    </svg>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-m)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)' }}>{value}</span>
    </div>
  );
}

function SectionDiff({ title, data, sections, accent, highlight }) {
  const bg = highlight ? 'rgba(99,102,241,.04)' : 'var(--bg-card)';
  const border = highlight ? 'rgba(99,102,241,.25)' : 'var(--border)';
  return (
    <div style={{ background: bg, borderRadius: 14, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: highlight ? 'rgba(99,102,241,.1)' : 'var(--bg-subtle)', borderBottom: `1px solid ${border}`, fontSize: 12, fontWeight: 800, color: highlight ? 'var(--primary)' : 'var(--text-h)' }}>
        {highlight ? '✨ ' : ''}{title}
      </div>
      <div style={{ padding: 14, maxHeight: 400, overflowY: 'auto' }}>
        {sections.includes('summary') && data.summary && (
          <DiffSection label="Summary">
            <p style={{ fontSize: 11, color: 'var(--text-b)', lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
          </DiffSection>
        )}
        {sections.includes('experience') && (data.experience || []).map((exp, i) => (
          <DiffSection key={i} label={`${exp.role || 'Role'} @ ${exp.company || 'Company'}`}>
            {(exp.responsibilities || []).slice(0, 3).map((r, j) => (
              <div key={j} style={{ fontSize: 11, color: 'var(--text-m)', padding: '2px 0', paddingLeft: 10, borderLeft: `2px solid ${accent}`, marginBottom: 4 }}>{r}</div>
            ))}
          </DiffSection>
        ))}
        {sections.includes('skills') && data.skills && (
          <DiffSection label="Skills">
            <div style={{ fontSize: 11, color: 'var(--text-b)' }}>
              {flattenSkills(data.skills).slice(0, 15).join(' · ')}
            </div>
          </DiffSection>
        )}
      </div>
    </div>
  );
}

function DiffSection({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-m)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
