/**
 * JobResumeOptimizer.jsx — Apply4Works Optimization Experience
 * Jobright-style 3-step flow: Analyze → Fix My Resume → Review & Apply
 * Embedded in /jobs/:id/resume-optimizer — no separate platform.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Search, Wand2, FileText, Send, Target, Wrench, AlertTriangle, TrendingUp, Check, Download, Edit } from 'lucide-react';
import ResumeTemplatesV2, { TEMPLATES } from '../components/resume/ResumeTemplatesV2';

import { API_BASE } from '../config/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function ScoreRing({ score, size = 80, strokeW = 7 }) {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score || 0, 100) / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={size / 5} fontWeight={800} fill={color}>{score || 0}</text>
    </svg>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-m)', marginBottom: 3, fontWeight: 600 }}>
        <span>{label}</span><span>{value}/{max}</span>
      </div>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

function StepBadge({ icon, label, active, done }) {
  const bg = done ? '#10b981' : active ? 'var(--primary)' : '#e2e8f0';
  const color = (done || active) ? '#fff' : '#94a3b8';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: bg, color,
        boxShadow: (done || active) ? `0 0 0 4px ${done ? 'rgba(16,185,129,.15)' : 'rgba(99,102,241,.18)'}` : 'none',
        transition: 'all .3s',
      }}>
        {done ? <Check size={18} strokeWidth={3} /> : icon}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: active ? 'var(--primary)' : done ? '#10b981' : '#94a3b8' }}>
        {label}
      </span>
    </div>
  );
}

function Pill({ text, type = 'missing' }) {
  const styles = {
    missing: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    present: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    added:   { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  };
  return (
    <span style={{ ...styles[type], fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>
      {type === 'present' ? '✓ ' : type === 'added' ? '+ ' : ''}{text}
    </span>
  );
}

// ─── Scaled Preview ───────────────────────────────────────────────────────────
function ScaledPreview({ resumeData, template, scale = 100 }) {
  const actualScale = scale / 100;
  const a4Width = 794; 
  const scaledWidth = a4Width * actualScale;
  const scaledHeight = scaledWidth * 1.4142;

  return (
    <div style={{ width: scaledWidth, height: scaledHeight, margin: '0 auto' }}>
      <div style={{
        width: a4Width,
        transformOrigin:'top left',
        transform:`scale(${actualScale})`,
        height: `${a4Width * 1.4142}px`, 
        boxShadow:'0 4px 24px rgba(0,0,0,.15)',
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

// ─── Step 1: Analyze ──────────────────────────────────────────────────────────

function StepAnalyze({ job, atsData, extractedCategories, onNext, loading }) {
  const score = atsData?.atsScore || 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? '🟢 Strong Match' : score >= 45 ? '🟡 Moderate Match' : '🔴 Needs Work';

  const bd = atsData?.scoreBreakdown || {};
  const maxes = { skills: 40, title: 15, experience: 15, projects: 15, completeness: 10, keywords: 5 };
  const labels = { skills: 'Skills Match', title: 'Job Title Fit', experience: 'Experience', projects: 'Projects', completeness: 'Completeness', keywords: 'Keywords' };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-h)', margin: '0 0 6px' }}>Resume Analysis</h1>
        <p style={{ color: 'var(--text-m)', fontSize: 14, margin: 0 }}>
          Analyzing your resume against <strong>{job?.title}</strong> at <strong>{job?.company}</strong>
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 0' }}>
          <div style={{ width: 52, height: 52, border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-m)' }}>Running ATS analysis…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Compact Score cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {/* Main score */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: score >= 70 ? 'rgba(16,185,129,.1)' : score >= 45 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)', color: scoreColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: .5 }}>ATS Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: scoreColor }}>{score}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor }}>{scoreLabel.split(' ')[1]}</span>
                </div>
              </div>
            </div>

            {/* Keyword Match */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99,102,241,.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={20} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: .5 }}>Keyword Match</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-h)' }}>{atsData?.presentSkills?.length || 0}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-m)', fontWeight: 600 }}>/ {(atsData?.presentSkills?.length || 0) + (atsData?.missingSkills?.length || 0)}</span>
                </div>
              </div>
            </div>

            {/* Skills Match */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: bd.skills >= 30 ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: bd.skills >= 30 ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={20} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: .5 }}>Skills Match</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-h)' }}>{bd.skills || 0}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-m)', fontWeight: 600 }}>/ {maxes.skills} pts</span>
                </div>
              </div>
            </div>

            {/* Improvement Potential */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99,102,241,.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: .5 }}>Potential</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#6366f1' }}>+{Math.min(40, (atsData?.missingSkills?.length || 0) * 3)}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-m)', fontWeight: 600 }}>pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content: skills + breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
            {/* Present Skills */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ Matched Skills ({atsData?.presentSkills?.length || 0})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {(atsData?.presentSkills || []).length === 0 && <span style={{ color: 'var(--text-m)', fontSize: 12 }}>No matches found.</span>}
                {(atsData?.presentSkills || []).map(kw => <Pill key={kw} text={kw} type="present" />)}
              </div>
            </div>

            {/* Missing Skills */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✗ Missing Skills ({atsData?.missingSkills?.length || 0})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {(atsData?.missingSkills || []).length === 0 && <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>🎉 All required skills present!</span>}
                {(atsData?.missingSkills || []).map(kw => <Pill key={kw} text={kw} type="missing" />)}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-h)', marginBottom: 16 }}>Score Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 40px' }}>
              {Object.entries(bd).map(([key, val]) => {
                if (!maxes[key]) return null;
                const c = val >= maxes[key] * 0.75 ? '#10b981' : val >= maxes[key] * 0.4 ? '#f59e0b' : '#ef4444';
                return <MiniBar key={key} label={labels[key] || key} value={val} max={maxes[key]} color={c} />;
              })}
            </div>
          </div>

          {/* Recommendations */}
          {(atsData?.recommendations || []).length > 0 && (
            <div style={{ background: 'rgba(99,102,241,.05)', borderRadius: 16, padding: 20, border: '1px solid rgba(99,102,241,.15)', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', marginBottom: 12 }}>💡 Improvement Opportunities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atsData.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-b)', background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(99,102,241,.15)', lineHeight: 1.5 }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link to={`/jobs`} style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: 'var(--text-b)', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              ← Return to Jobs
            </Link>
            <button
              onClick={onNext}
              style={{
                padding: '12px 32px', borderRadius: 12, background: 'var(--primary)', color: '#fff',
                fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99,102,241,.35)', transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(99,102,241,.45)'; }}
              onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 4px 16px rgba(99,102,241,.35)'; }}
            >
              🔧 Fix My Resume →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 2: Fix My Resume ────────────────────────────────────────────────────

// Converts resume section data (string, array, or object) to readable text nodes
function renderReadableSection(data, section) {
  if (!data) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;

  // Plain string (e.g. summary)
  if (typeof data === 'string') {
    return <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{data}</p>;
  }

  // Array of strings or objects
  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((item, i) => {
          if (typeof item === 'string') {
            return <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: '#475569', lineHeight: 1.5 }}><span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>•</span><span>{item}</span></div>;
          }
          // Object item (e.g. experience entry, project entry)
          const title = item.role || item.name || item.company || item.title || `Item ${i + 1}`;
          const sub = item.company || item.issuer || '';
          const bullets = item.responsibilities || item.description ? [item.description].filter(Boolean) : [];
          return (
            <div key={i} style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{title}{sub ? <span style={{ fontWeight: 400, color: '#64748b' }}> · {sub}</span> : ''}</div>
              {item.startDate && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{item.startDate}{item.endDate ? ` — ${item.isCurrent ? 'Present' : item.endDate}` : ''}</div>}
              {(item.responsibilities || []).map((r, j) => (
                <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: '#475569', lineHeight: 1.5 }}><span style={{ flexShrink: 0 }}>•</span><span>{r}</span></div>
              ))}
              {item.description && typeof item.description === 'string' && (
                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginTop: 2 }}>• {item.description}</div>
              )}
              {(item.technologies || []).length > 0 && (
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {item.technologies.map(t => <span key={t} style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{t}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Object (e.g. skills map)
  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => Array.isArray(v) ? v.length > 0 : !!v);
    if (entries.length === 0) return <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(([key, val]) => (
          <div key={key}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-m)', textTransform: 'capitalize', marginBottom: 3 }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(Array.isArray(val) ? val : [val]).map((v, i) => (
                <span key={i} style={{ fontSize: 11, background: '#f1f5f9', color: '#334155', borderRadius: 10, padding: '2px 8px', fontWeight: 500 }}>{v}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span style={{ fontSize: 12, color: '#475569' }}>{String(data)}</span>;
}

function DiffCard({ section, original, suggested, applied, onApply, onReject }) {
  return (
    <div id={`diff-${section}`} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: applied ? '#f0fdf4' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-h)', textTransform: 'capitalize' }}>{section.replace(/([A-Z])/g, ' $1').trim()}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {applied ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} strokeWidth={3} /> Applied
            </span>
          ) : (
            <>
              <button onClick={onReject} style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s' }}>Reject</button>
              <button onClick={onApply}  style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s' }}>Apply Change</button>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 80 }}>
        <div style={{ padding: '20px 24px', borderRight: '1px solid #e2e8f0', background: '#fafafa' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Original
          </div>
          {renderReadableSection(original, section)}
        </div>
        <div style={{ padding: '20px 24px', background: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wand2 size={12} /> Suggested Improvement
          </div>
          {renderReadableSection(suggested, section)}
        </div>
      </div>
    </div>
  );
}

function StepFixResume({ job, originalResume, optimizedResume, atsData, onNext, optimizing, scoreBefore, scoreAfter }) {
  const [appliedSections, setAppliedSections] = useState({});
  const [mergedResume, setMergedResume] = useState({ ...(originalResume || {}) });

  const sections = ['summary', 'experience', 'projects', 'skills'];
  const changedSections = sections.filter(s => {
    const orig = JSON.stringify(originalResume?.[s] || '');
    const opt  = JSON.stringify(optimizedResume?.[s] || '');
    return orig !== opt && optimizedResume?.[s] !== undefined;
  });

  const handleApplySection = useCallback((section) => {
    setAppliedSections(prev => ({ ...prev, [section]: true }));
    setMergedResume(prev => ({ ...prev, [section]: optimizedResume[section] }));
  }, [optimizedResume]);

  const handleRejectSection = useCallback((section) => {
    setAppliedSections(prev => ({ ...prev, [section]: false }));
    setMergedResume(prev => ({ ...prev, [section]: originalResume[section] }));
  }, [originalResume]);

  const handleApplyAll = () => {
    const allApplied = {};
    const allMerged = { ...originalResume };
    changedSections.forEach(s => {
      allApplied[s] = true;
      allMerged[s] = optimizedResume[s];
    });
    setAppliedSections(allApplied);
    setMergedResume(allMerged);
  };

  const appliedCount = Object.values(appliedSections).filter(Boolean).length;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-h)', margin: '0 0 6px' }}>Fix My Resume</h1>
          <p style={{ color: 'var(--text-m)', fontSize: 14, margin: 0 }}>
            Review AI-generated improvements for <strong>{job?.title}</strong>. Apply or reject each change.
          </p>
        </div>
        {changedSections.length > 0 && (
          <button onClick={handleApplyAll} style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ✨ Apply All Changes
          </button>
        )}
      </div>

      {optimizing ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 0' }}>
          <div style={{ width: 52, height: 52, border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-m)' }}>AI is optimizing your resume…</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>This may take 15-30 seconds</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : changedSections.length === 0 ? (
        <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '40px 32px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>Your resume is already well-optimized!</div>
          <div style={{ fontSize: 14, color: '#166534' }}>No significant changes were needed for this role.</div>
        </div>
      ) : (
        <>
          {/* Progress indicator */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '14px 20px', border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${changedSections.length > 0 ? Math.round(appliedCount / changedSections.length * 100) : 0}%`, background: 'linear-gradient(90deg,var(--primary),#8b5cf6)', borderRadius: 4, transition: 'width .4s ease' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-m)', whiteSpace: 'nowrap' }}>
              {appliedCount}/{changedSections.length} changes applied
            </div>
          </div>

          {/* Quick Navigation */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {changedSections.map(sec => (
              <a href={`#diff-${sec}`} key={sec} onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(`diff-${sec}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-m)', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }} onMouseLeave={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = 'var(--text-m)'; }}>
                {sec.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
              </a>
            ))}
          </div>

          {/* Diff cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            {changedSections.map(sec => (
              <DiffCard
                key={sec}
                section={sec}
                original={originalResume?.[sec]}
                suggested={optimizedResume?.[sec]}
                applied={appliedSections[sec] === true}
                onApply={() => handleApplySection(sec)}
                onReject={() => handleRejectSection(sec)}
              />
            ))}
          </div>
        </>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/jobs`} style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: 'var(--text-b)', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            ← Back to Jobs
          </Link>
        </div>
        <button
          onClick={() => onNext(mergedResume)}
          style={{ padding: '12px 32px', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,.35)' }}
        >
          Review & Apply →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & Apply ───────────────────────────────────────────────────

function StepReviewApply({ job, originalResume, finalResume, scoreBefore, scoreAfter, atsData, onApplyOptimized, onApplyOriginal, onSave, onReturn, applying, selectedTemplate, setSelectedTemplate }) {
  const delta = (scoreAfter || 0) - (scoreBefore || 0);
  const gaps = atsData?.missingSkills || [];

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('resume-preview-v2');
      if (!element) return;
      const opt = {
        margin: 0,
        filename: `${originalResume?.personalInfo?.firstName || 'Resume'}_Optimized.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF.');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-h)', margin: '0 0 6px' }}>Review & Apply</h1>
        <p style={{ color: 'var(--text-m)', fontSize: 14, margin: 0 }}>
          Review your optimized resume for <strong>{job?.title}</strong> before downloading or applying.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Sidebar: Score Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-h)', marginBottom: 20 }}>Score Improvement</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', marginBottom: 8 }}>Original</div>
                <ScoreRing score={scoreBefore || 0} size={70} strokeW={6} />
              </div>
              <div style={{ color: '#94a3b8', fontSize: 24 }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 8 }}>Optimized</div>
                <ScoreRing score={scoreAfter || 0} size={70} strokeW={6} />
              </div>
            </div>

            <div style={{ background: delta > 0 ? '#f0fdf4' : '#f8fafc', borderRadius: 12, padding: '16px', border: `1px solid ${delta > 0 ? '#bbf7d0' : '#e2e8f0'}`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: delta > 0 ? '#16a34a' : 'var(--text-m)', textTransform: 'uppercase', letterSpacing: .5 }}>Net Improvement</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: delta > 0 ? '#16a34a' : 'var(--text-h)', marginTop: 4 }}>{delta > 0 ? '+' : ''}{delta} pts</div>
            </div>
          </div>

          {gaps.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>⚠️ Remaining Gaps</div>
              <div style={{ fontSize: 12, color: 'var(--text-m)', marginBottom: 12, lineHeight: 1.5 }}>
                You are still missing {gaps.length} skills from the job description.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {gaps.map(g => <Pill key={g} text={g} type="missing" />)}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-h)', marginBottom: 16 }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={onApplyOptimized} disabled={applying} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: applying ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {applying ? '⌛ Saving…' : <><Send size={16} /> Apply with Optimized</>}
              </button>
              <button onClick={onApplyOriginal} style={{ padding: '14px 16px', borderRadius: 12, background: '#fff', color: 'var(--text-h)', fontWeight: 700, fontSize: 13, border: '1.5px solid #e2e8f0', cursor: 'pointer' }}>
                Apply with Original
              </button>
              <button onClick={onSave} style={{ padding: '12px 16px', borderRadius: 12, background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 13, border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                💾 Save as New Version
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Live Preview & Toolbar */}
        <div style={{ background: '#e5e7eb', borderRadius: 16, border: '1px solid #d1d5db', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color="var(--primary)" /> Final Optimized Resume
              
              <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-m)' }}>Template:</span>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-h)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/resume-builder" style={{ textDecoration: 'none', padding: '8px 14px', borderRadius: 8, background: '#f8fafc', color: 'var(--text-m)', fontWeight: 700, fontSize: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={14} /> Open in Builder
              </Link>
              <button onClick={handleDownloadPDF} style={{ padding: '8px 14px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 12, border: '1px solid #bbf7d0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
          
          {/* Scaled Preview */}
          <div style={{ padding: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <ScaledPreview resumeData={finalResume || originalResume} template={selectedTemplate} scale={100} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobResumeOptimizer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=Analyze, 2=Fix, 3=Review
  const [job, setJob] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [atsData, setAtsData] = useState(null);
  const [extractedCategories, setExtractedCategories] = useState(null);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [finalResume, setFinalResume] = useState(null);
  const [scoreBefore, setScoreBefore] = useState(0);
  const [scoreAfter, setScoreAfter] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);

  const [pageLoading, setPageLoading] = useState(true);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Load job + resume on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setPageLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const hdrs = { Authorization: `Bearer ${token}` };

        // Check session cache
        const cacheKey = `opt_${id}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const c = JSON.parse(cached);
            if (c.job && c.resumeData && c.atsData) {
              setJob(c.job); setResumeData(c.resumeData); setAtsData(c.atsData);
              setExtractedCategories(c.extractedCategories);
              setScoreBefore(c.atsData.atsScore || 0);
              setPageLoading(false);
              return;
            }
          } catch { }
        }

        // Fetch job
        const [jobRes, resumeRes] = await Promise.all([
          fetch(`${API_BASE}/jobs/${id}`, { headers: hdrs }),
          fetch(`${API_BASE}/resume/me`, { headers: hdrs }),
        ]);
        const jobData = await jobRes.json().catch(() => ({}));
        const resumeJson = await resumeRes.json().catch(() => ({}));

        if (!jobRes.ok || jobData.message === 'Job not found') throw new Error('Job not found. Please return to the jobs list.');
        if (!resumeJson.success || !resumeJson.resume) throw new Error('No resume found. Please upload or build your resume first.');

        const rData = resumeJson.resume?.resumeData || resumeJson.resume?.optimizedResume || resumeJson.resume?.parsedResume;
        if (!rData) throw new Error('Resume data missing. Please upload your resume first.');

        setJob(jobData);
        setResumeData(rData);

        // Auto-run analysis
        setAnalyzeLoading(true);
        const analysisRes = await fetch(`${API_BASE}/resume/analyze-job`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            jobId: id, jobTitle: jobData.title, jobDescription: jobData.description,
            experienceLevel: jobData.experienceLevel || '',
          }),
        });
        const analysisData = await analysisRes.json().catch(() => ({}));
        if (!analysisData.success) throw new Error(analysisData.message || 'ATS analysis failed. Please try again.');

        setAtsData(analysisData.atsData);
        setExtractedCategories(analysisData.extractedCategories);
        setScoreBefore(analysisData.atsData?.atsScore || 0);

        sessionStorage.setItem(cacheKey, JSON.stringify({ job: jobData, resumeData: rData, atsData: analysisData.atsData, extractedCategories: analysisData.extractedCategories }));
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setPageLoading(false);
        setAnalyzeLoading(false);
      }
    }
    init();
  }, [id]);

  // ── Step 1 → 2: Trigger optimization ──────────────────────────────────────
  const handleStartFix = useCallback(async () => {
    setStep(2);
    setOptimizing(true);
    try {
      const token = localStorage.getItem('authToken');
      const missingKeywords = atsData?.missingSkills || [];
      const res = await fetch(`${API_BASE}/resume/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobId: id,
          jobTitle: job?.title || '',
          jobDescription: job?.description || '',
          selectedKeywords: missingKeywords,
          sectionsToOptimize: ['summary', 'skills', 'experience', 'projects'],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message || 'Optimization failed. Please try again.');
      setOptimizedResume(data.optimizedResume || data.resumeData);
      setScoreAfter(data.scoreAfter || data.atsData?.atsScore || 0);
      // Update atsData with new scores
      if (data.atsData) setAtsData(data.atsData);
    } catch (err) {
      setErrorMsg(err.message);
      setStep(1);
    } finally {
      setOptimizing(false);
    }
  }, [id, job, atsData]);

  // ── Step 2 → 3: Accept final merged resume ─────────────────────────────────
  const handleGoToReview = useCallback((merged) => {
    setFinalResume(merged);
    setStep(3);
  }, []);

  // ── Step 3: Apply with optimized ──────────────────────────────────────────
  const handleApplyOptimized = useCallback(async () => {
    setApplying(true);
    try {
      const token = localStorage.getItem('authToken');
      // Save the optimized version
      await fetch(`${API_BASE}/resume/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeData: finalResume || optimizedResume }),
      });
      const url = job?.apply_link || job?.applyUrl || job?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      localStorage.setItem('pendingApplyJob', JSON.stringify(job));
      navigate('/jobs');
    } catch (err) {
      alert(err.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  }, [finalResume, optimizedResume, job, navigate]);

  const handleApplyOriginal = useCallback(() => {
    const url = job?.apply_link || job?.applyUrl || job?.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    localStorage.setItem('pendingApplyJob', JSON.stringify(job));
    navigate('/jobs');
  }, [job, navigate]);

  const handleSaveVersion = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_BASE}/resume/versions/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: `Optimized for ${job?.title || 'job'} — ${new Date().toLocaleDateString()}` }),
      });
      alert('Optimized version saved successfully!');
    } catch { alert('Failed to save version.'); }
  }, [job]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const steps = [
    { num: 1, label: 'Analyze Resume', icon: <Search size={18} /> },
    { num: 2, label: 'Fix Resume', icon: <Wand2 size={18} /> },
    { num: 3, label: 'Review & Apply', icon: <Send size={18} /> },
  ];

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <div style={{ width: 52, height: 52, border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-m)' }}>Loading optimizer…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 440, width: '100%', background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #fecaca', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginBottom: 10 }}>Optimization Error</h2>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link to="/jobs" style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                ← Return to Jobs
              </Link>
              <Link to="/resume-builder" style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0', color: 'var(--text-b)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Resume Builder
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title="Resume Optimization" subtitle={job ? `${job.title} · ${job.company}` : ''} />

        {/* ── Step Progress Bar ─────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            {steps.map(s => (
              <StepBadge key={s.num} icon={s.icon} label={s.label} active={step === s.num} done={step > s.num} />
            ))}
          </div>
        </div>

        {/* ── Step Content ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {step === 1 && (
            <StepAnalyze
              job={job} atsData={atsData} extractedCategories={extractedCategories}
              onNext={handleStartFix} loading={analyzeLoading}
            />
          )}
          {step === 2 && (
            <StepFixResume
              job={job} originalResume={resumeData} optimizedResume={optimizedResume}
              atsData={atsData} onNext={handleGoToReview} optimizing={optimizing}
              scoreBefore={scoreBefore} scoreAfter={scoreAfter}
            />
          )}
          {step === 3 && (
            <StepReviewApply
              job={job} originalResume={resumeData} finalResume={finalResume}
              scoreBefore={scoreBefore} scoreAfter={scoreAfter} atsData={atsData}
              onApplyOptimized={handleApplyOptimized}
              onApplyOriginal={handleApplyOriginal}
              onSave={handleSaveVersion}
              onReturn={() => navigate(`/jobs/${id}`)}
              applying={applying}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
