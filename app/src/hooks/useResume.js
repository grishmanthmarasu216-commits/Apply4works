/**
 * useResume.js — V3
 * Bulletproof persistence layer:
 *  - Autosave (2s debounce) → backend
 *  - localStorage backup on every change
 *  - Recovery prompt when local backup is newer than server data
 *  - "Unsaved changes" warning on navigation/refresh
 *  - Detailed save status: 'idle' | 'saving' | 'saved' | 'failed'
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { normalizeResume, createEmptyResume } from '../utils/resumeNormalizer';

import { API_BASE } from '../config/api';

const AUTOSAVE_MS   = 2000;
const BACKUP_KEY    = 'resume_backup_v3';
const ONBOARD_KEY   = 'resume_onboarding_completed';

// ── localStorage helpers ──────────────────────────────────────────────────────
function writeBackup(data, template) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      data, template, ts: new Date().toISOString(),
    }));
  } catch {}
}

function readBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearBackup() {
  try { localStorage.removeItem(BACKUP_KEY); } catch {}
}

export function markOnboardingDone() {
  try { localStorage.setItem(ONBOARD_KEY, 'true'); } catch {}
}

export function isOnboardingDone() {
  try { return localStorage.getItem(ONBOARD_KEY) === 'true'; } catch { return false; }
}

export function clearOnboardingFlag() {
  try { localStorage.removeItem(ONBOARD_KEY); } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useResume() {
  const { token } = useAuth();

  const [resumeData,      setResumeDataInternal] = useState(null);
  const [template,        setTemplateState]      = useState('Modern ATS');
  const [isLoading,       setIsLoading]          = useState(true);
  // 'idle' | 'saving' | 'saved' | 'failed'
  const [saveStatus,      setSaveStatus]         = useState('idle');
  const [lastSavedAt,     setLastSavedAt]        = useState(null);
  const [resumeId,        setResumeId]           = useState(null);
  const [error,           setError]              = useState(null);
  const [hasUnsaved,      setHasUnsaved]         = useState(false);
  // Recovery modal state
  const [showRecovery,    setShowRecovery]       = useState(false);
  const [recoveryBackup,  setRecoveryBackup]     = useState(null);

  const autosaveTimer  = useRef(null);
  const pendingSave    = useRef(null);
  const serverSavedAt  = useRef(null); // ISO string from server
  const templateRef    = useRef('Modern ATS');

  const isSaving = saveStatus === 'saving';

  // ── Auth headers ─────────────────────────────────────────────────────────
  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  // ── Fetch from server ─────────────────────────────────────────────────────
  const fetchResume = useCallback(async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/resume/me`, { headers: headers() });
      const data = await res.json();

      if (data.success && data.resume) {
        const normalized   = normalizeResume(data.resume.resumeData);
        const tmpl         = data.resume.template || 'Modern ATS';
        const serverTs     = data.resume.lastSavedAt;
        serverSavedAt.current = serverTs;

        // Check local backup
        const backup = readBackup();
        if (backup && backup.ts && serverTs && new Date(backup.ts) > new Date(serverTs)) {
          // Local backup is newer — offer recovery
          setRecoveryBackup(backup);
          setShowRecovery(true);
          // Load server data for now (user can restore from prompt)
          setResumeDataInternal(normalized);
          setTemplateState(tmpl);
          templateRef.current = tmpl;
        } else {
          setResumeDataInternal(normalized);
          setTemplateState(tmpl);
          templateRef.current = tmpl;
          setLastSavedAt(serverTs);
        }
        setResumeId(data.resume._id);
      } else {
        // No resume yet — check backup
        const backup = readBackup();
        if (backup?.data) {
          setRecoveryBackup(backup);
          setShowRecovery(true);
          setResumeDataInternal(createEmptyResume());
        } else {
          setResumeDataInternal(createEmptyResume());
        }
      }
    } catch (err) {
      console.error('[useResume] Fetch error:', err);
      setError(err.message);
      // API failed — try local backup
      const backup = readBackup();
      if (backup?.data) {
        setResumeDataInternal(normalizeResume(backup.data));
        setTemplateState(backup.template || 'Modern ATS');
        templateRef.current = backup.template || 'Modern ATS';
      } else {
        setResumeDataInternal(createEmptyResume());
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, headers]);

  useEffect(() => { fetchResume(); }, [fetchResume]);

  // ── Persist to backend ────────────────────────────────────────────────────
  const saveResume = useCallback(async (data, tmpl) => {
    if (!token || !data) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/resume/save`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ resumeData: data, template: tmpl }),
      });
      const result = await res.json();
      if (result.success) {
        const ts = result.lastSavedAt || new Date().toISOString();
        serverSavedAt.current = ts;
        setLastSavedAt(ts);
        setSaveStatus('saved');
        setHasUnsaved(false);
        clearBackup(); // Server is now authoritative
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (err) {
      console.error('[useResume] Save error:', err);
      setSaveStatus('failed');
      // Keep local backup alive — it's our safety net
    }
  }, [token, headers]);

  // ── Autosave debounce ─────────────────────────────────────────────────────
  const scheduleAutosave = useCallback((data, tmpl) => {
    // Always write local backup immediately
    writeBackup(data, tmpl);
    setHasUnsaved(true);
    setSaveStatus('saving'); // Show "Saving…" immediately

    pendingSave.current = { data, tmpl };
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (pendingSave.current) {
        saveResume(pendingSave.current.data, pendingSave.current.tmpl);
        pendingSave.current = null;
      }
    }, AUTOSAVE_MS);
  }, [saveResume]);

  useEffect(() => () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
  }, []);

  // ── Warn on page refresh / close if unsaved ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsaved) return;
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  // ── Public setter — triggers autosave ─────────────────────────────────────
  const setResumeData = useCallback((updater) => {
    setResumeDataInternal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      scheduleAutosave(next, templateRef.current);
      return next;
    });
  }, [scheduleAutosave]);

  const setTemplate = useCallback((tmpl) => {
    templateRef.current = tmpl;
    setTemplateState(tmpl);
    setResumeDataInternal(prev => {
      if (prev) scheduleAutosave(prev, tmpl);
      return prev;
    });
  }, [scheduleAutosave]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const setField = useCallback((key, value) => {
    setResumeData(prev => ({ ...prev, [key]: value }));
  }, [setResumeData]);

  const setPersonalInfo = useCallback((key, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [key]: value },
    }));
  }, [setResumeData]);

  const setSkillCategory = useCallback((category, value) => {
    setResumeData(prev => ({
      ...prev,
      skills: { ...prev.skills, [category]: value },
    }));
  }, [setResumeData]);

  const updateArrayItem = useCallback((arrayKey, index, itemKey, value) => {
    setResumeData(prev => {
      const arr = [...(prev[arrayKey] || [])];
      arr[index] = { ...arr[index], [itemKey]: value };
      return { ...prev, [arrayKey]: arr };
    });
  }, [setResumeData]);

  const addArrayItem = useCallback((arrayKey, tmpl = {}) => {
    setResumeData(prev => ({
      ...prev,
      [arrayKey]: [...(prev[arrayKey] || []), { id: Math.random().toString(36).slice(2), ...tmpl }],
    }));
  }, [setResumeData]);

  const removeArrayItem = useCallback((arrayKey, index) => {
    setResumeData(prev => {
      const arr = [...(prev[arrayKey] || [])];
      arr.splice(index, 1);
      return { ...prev, [arrayKey]: arr };
    });
  }, [setResumeData]);

  const replaceArrayItem = useCallback((arrayKey, index, newItem) => {
    setResumeData(prev => {
      const arr = [...(prev[arrayKey] || [])];
      arr[index] = newItem;
      return { ...prev, [arrayKey]: arr };
    });
  }, [setResumeData]);

  // ── Recovery actions ──────────────────────────────────────────────────────
  const acceptRecovery = useCallback(() => {
    if (recoveryBackup?.data) {
      setResumeDataInternal(normalizeResume(recoveryBackup.data));
      setTemplateState(recoveryBackup.template || 'Modern ATS');
      templateRef.current = recoveryBackup.template || 'Modern ATS';
      // Schedule save so backend is updated
      scheduleAutosave(normalizeResume(recoveryBackup.data), recoveryBackup.template || 'Modern ATS');
    }
    setShowRecovery(false);
    setRecoveryBackup(null);
  }, [recoveryBackup, scheduleAutosave]);

  const dismissRecovery = useCallback(() => {
    clearBackup();
    setShowRecovery(false);
    setRecoveryBackup(null);
  }, []);

  return {
    resumeData,
    setResumeData,
    setField,
    setPersonalInfo,
    setSkillCategory,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    replaceArrayItem,
    template,
    setTemplate,
    isLoading,
    isSaving,
    saveStatus,
    lastSavedAt,
    resumeId,
    error,
    hasUnsaved,
    showRecovery,
    recoveryBackup,
    acceptRecovery,
    dismissRecovery,
    refetch: fetchResume,
    saveNow: () => {
      if (pendingSave.current) {
        clearTimeout(autosaveTimer.current);
        saveResume(pendingSave.current.data, pendingSave.current.tmpl);
        pendingSave.current = null;
      }
    },
  };
}
