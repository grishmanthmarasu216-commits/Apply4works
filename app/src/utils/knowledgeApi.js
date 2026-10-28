import { API_BASE } from '../config/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const fetchLatestContent = async () => {
  const res = await fetch(`${API_BASE}/knowledge/latest`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch latest content');
  return res.json();
};

export const fetchLearningRoadmap = async () => {
  const res = await fetch(`${API_BASE}/knowledge/learning`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch learning roadmap');
  return res.json();
};

export const searchAssistant = async (query, history) => {
  const res = await fetch(`${API_BASE}/knowledge/search`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ query, history })
  });
  if (!res.ok) throw new Error('Failed to search assistant');
  return res.json();
};

export const toggleBookmark = async (data) => {
  const res = await fetch(`${API_BASE}/knowledge/bookmark`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
};

export const getBookmarks = async () => {
  const res = await fetch(`${API_BASE}/knowledge/bookmarks`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  return res.json();
};

export const getSearchHistory = async () => {
  const res = await fetch(`${API_BASE}/knowledge/history`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch search history');
  return res.json();
};

export const clearSearchHistory = async () => {
  const res = await fetch(`${API_BASE}/knowledge/history`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to clear search history');
  return res.json();
};
