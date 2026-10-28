import React, { useState, useEffect } from 'react';
import { fetchLatestContent, toggleBookmark } from '../utils/knowledgeApi';
import { PlayCircle, Code, BookOpen, FileText, MessageSquare, Share2, Bookmark, Clock, BrainCircuit, ExternalLink, Eye } from 'lucide-react';

export default function KnowledgeLatest() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchLatestContent();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to load latest content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (item) => {
    try {
      await toggleBookmark({
        title: item.title,
        url: item.url,
        summary: item.summary,
        source: item.source,
        publishedDate: item.publishedDate,
        type: item.sourceType || 'article'
      });
      alert('Bookmark updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to bookmark.');
    }
  };

  const handleShare = (url) => {
    if (navigator.share) {
      navigator.share({ url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const getSourceIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'video': return <PlayCircle className="w-4 h-4" />;
      case 'github': return <Code className="w-4 h-4" />;
      case 'documentation': return <BookOpen className="w-4 h-4" />;
      case 'discussion': return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="break-inside-avoid animate-pulse bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
            <div className="h-40 bg-[var(--border-md)] rounded-xl mb-4"></div>
            <div className="h-4 bg-[var(--border-md)] rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-[var(--border-md)] rounded w-full mb-2"></div>
            <div className="h-3 bg-[var(--border-md)] rounded w-full mb-2"></div>
            <div className="h-10 bg-[var(--border-md)] rounded w-full mt-6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <BrainCircuit className="w-16 h-16 text-[var(--sage)] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[var(--text-h)] mb-2">No content found</h3>
        <p className="text-[var(--text-m)]">We couldn't find any relevant content for your role right now.</p>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {data.map((item, idx) => (
        <div 
          key={idx} 
          className="break-inside-avoid bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--primary)] transition-all duration-300 shadow-[var(--sh-sm)] hover:shadow-[var(--sh-lg)] group flex flex-col"
        >
          {item.thumbnail && (
            <div className="w-full h-48 overflow-hidden relative border-b border-[var(--border)] bg-gray-100">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
              <img 
                src={item.thumbnail} 
                alt={item.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          
          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--primary-lt)] text-[var(--primary)] text-[10px] font-bold rounded-full uppercase tracking-wider">
                {getSourceIcon(item.sourceType)}
                {item.sourceType || 'Article'}
              </span>
              <span className="text-xs text-[var(--text-m)] font-medium">
                {item.publishedDate ? new Date(item.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
            
            <h3 className="text-[1.1rem] font-bold mb-2 leading-snug text-[var(--text-h)] group-hover:text-[var(--primary)] transition-colors">
              {item.title}
            </h3>
            
            {item.author && (
              <p className="text-xs text-[var(--text-m)] mb-3 font-semibold uppercase tracking-wide">By {item.author}</p>
            )}
            
            <p className="text-[14px] text-[var(--text-b)] mb-5 line-clamp-3 leading-relaxed mt-2">
              {item.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--text-m)] mb-6 mt-auto">
              <span className="flex items-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-[var(--text-f)]" />
                {item.duration ? item.duration : item.estimatedReadingTime}
              </span>
              
              {item.views && (
                <span className="flex items-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg">
                  <Eye className="w-3.5 h-3.5 text-[var(--text-f)]" />
                  {item.views}
                </span>
              )}

              {!item.duration && (
                <span className="flex items-center gap-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg">
                  <BrainCircuit className="w-3.5 h-3.5 text-[var(--text-f)]" />
                  {item.difficultyLevel}
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-5 border-t border-[var(--border)]">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-[var(--primary-lt)] text-[var(--primary)] text-[13px] font-bold rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
              <button 
                onClick={() => handleBookmark(item)} 
                className="p-2.5 border border-[var(--border-md)] rounded-xl text-[var(--text-m)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-lt)] transition-all shadow-sm bg-white" 
                title="Save Bookmark"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleShare(item.url)} 
                className="p-2.5 border border-[var(--border-md)] rounded-xl text-[var(--text-m)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-lt)] transition-all shadow-sm bg-white" 
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
