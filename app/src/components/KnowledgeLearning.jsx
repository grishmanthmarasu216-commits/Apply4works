import React, { useState, useEffect } from 'react';
import { fetchLearningRoadmap } from '../utils/knowledgeApi';
import { ChevronDown, PlayCircle, BookOpen, Terminal, Target, HelpCircle, Clock, ExternalLink, Sparkles, LayoutList, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function KnowledgeLearning() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchLearningRoadmap();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to load learning structure.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (catIdx, topicIdx) => {
    const key = `${catIdx}-${topicIdx}`;
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8">
            <div className="h-6 bg-[var(--border-md)] rounded w-1/4 mb-4"></div>
            <div className="space-y-4 mt-6">
              {[1, 2].map(j => (
                <div key={j} className="h-16 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border)]"></div>
              ))}
            </div>
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

  if (!data || !data.categories) return null;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Header Info */}
      <div className="mb-10 text-center">
        <Layers className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 bg-[var(--primary-lt)] p-3 rounded-2xl" />
        <h2 className="text-2xl font-bold text-[var(--text-h)] mb-2">Structured Learning Center</h2>
        <p className="text-[var(--text-m)] max-w-xl mx-auto">
          Deep dive into official documentation, notes, interview questions, and AI-curated practice problems for your role.
        </p>
      </div>

      <div className="space-y-10">
        {data.categories.map((category, catIdx) => (
          <div key={catIdx} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="bg-[var(--bg-subtle)] px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
                <LayoutList className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-h)]">{category.categoryName}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {(!category.topics || category.topics.length === 0) && (
                <p className="text-[var(--text-m)] text-sm">No topics available in this category yet.</p>
              )}

              {category.topics?.map((topic, topicIdx) => {
                const isExpanded = expandedTopics[`${catIdx}-${topicIdx}`];

                return (
                  <div key={topicIdx} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)] transition-all">
                    <button 
                      onClick={() => toggleTopic(catIdx, topicIdx)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[var(--primary-lt)] transition-colors text-left"
                    >
                      <div>
                        <h4 className="font-bold text-[16px] text-[var(--text-h)] flex items-center gap-2">
                          {topic.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--primary)] bg-[var(--primary-lt)] px-2 py-0.5 rounded">
                            {topic.difficulty || 'Intermediate'}
                          </span>
                          <span className="text-[12px] font-medium text-[var(--text-m)] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {topic.completionEstimate || '1 hour'}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-[var(--text-m)] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--primary)]' : ''}`} />
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-6 border-t border-[var(--border)] bg-white space-y-6 animate-fade-up">
                        
                        <div className="bg-[var(--primary-lt)]/30 border border-[var(--primary-lt)] p-4 rounded-xl">
                          <p className="text-[14px] text-[var(--text-b)] leading-relaxed">
                            {topic.explanation}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Left Column: Resources */}
                          <div className="space-y-6">
                            {topic.referenceLinks?.length > 0 && (
                              <div>
                                <h5 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-m)] mb-3 flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Reference Links</h5>
                                <ul className="space-y-2.5">
                                  {topic.referenceLinks.map((link, i) => (
                                    <li key={i}>
                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-[14px] font-medium text-[var(--text-b)] hover:text-[var(--primary)] group">
                                        <ExternalLink className="w-4 h-4 text-[var(--text-m)] group-hover:text-[var(--primary)] mt-0.5 shrink-0" />
                                        <span>{link.title}</span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {topic.recommendedVideos?.length > 0 && (
                              <div>
                                <h5 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-m)] mb-3 flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> YouTube Videos</h5>
                                <ul className="space-y-2.5">
                                  {topic.recommendedVideos.map((vid, i) => (
                                    <li key={i}>
                                      <a href={vid.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-[14px] font-medium text-[var(--text-b)] hover:text-red-500 group">
                                        <PlayCircle className="w-4 h-4 text-[var(--text-m)] group-hover:text-red-500 mt-0.5 shrink-0" />
                                        <span>{vid.title}</span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {topic.practiceLinks?.length > 0 && (
                              <div>
                                <h5 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-m)] mb-3 flex items-center gap-1.5"><Terminal className="w-4 h-4" /> Practice & Exercises</h5>
                                <ul className="space-y-2.5">
                                  {topic.practiceLinks.map((link, i) => (
                                    <li key={i}>
                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-[14px] font-medium text-[var(--text-b)] hover:text-[var(--primary)] group">
                                        <Target className="w-4 h-4 text-[var(--text-m)] group-hover:text-[var(--primary)] mt-0.5 shrink-0" />
                                        <span>{link.title}</span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Right Column: AI & Q/A */}
                          <div className="space-y-6">
                            {topic.aiSummary && (
                              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 shadow-inner">
                                <h5 className="text-[12px] font-bold text-[var(--primary)] flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                                  <Sparkles className="w-4 h-4" /> AI Summary & Notes
                                </h5>
                                <div className="prose prose-sm max-w-none text-[var(--text-b)] prose-p:leading-relaxed">
                                  <ReactMarkdown>{topic.aiSummary}</ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {topic.interviewQuestions?.length > 0 && (
                              <div>
                                <h5 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-m)] mb-3 flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> Interview Questions</h5>
                                <ul className="space-y-3">
                                  {topic.interviewQuestions.map((q, i) => (
                                    <li key={i} className="flex gap-2">
                                      <span className="font-bold text-[var(--primary)]">Q:</span>
                                      <span className="text-[14px] text-[var(--text-b)]">{q}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
