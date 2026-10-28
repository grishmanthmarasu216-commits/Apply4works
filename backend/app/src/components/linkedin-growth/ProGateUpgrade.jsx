import React from 'react';
import { Link } from 'react-router-dom';

export default function ProGateUpgrade({ 
  title = "LinkedIn Growth Studio Pro", 
  description = "Create professional LinkedIn content using AI, publish directly to LinkedIn, schedule posts, save drafts, and grow your personal brand.", 
  features 
}) {
  const defaultFeatures = [
    { title: "AI Post Generation", desc: "Generate LinkedIn posts instantly.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { title: "Multiple Writing Styles", desc: "Professional, Storytelling, Friendly.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { title: "Direct Publishing", desc: "Publish with one click.", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
    { title: "Smart Scheduling", desc: "Schedule future posts.", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { title: "Draft Management", desc: "Save and manage drafts.", icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" },
    { title: "Resume & URL Context", desc: "Generate posts from resumes and URLs.", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  ];

  const displayFeatures = features || defaultFeatures;

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[400px] relative overflow-hidden">
      
      <div className="max-w-xl w-full card p-8 text-center relative z-10 overflow-hidden flex flex-col items-center">
        {/* Background glow using standard primary var */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl" style={{ background: 'var(--primary)', opacity: 0.1 }}></div>
        
        {/* Icon using standard primary var */}
        <div className="w-12 h-12 border rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10"
             style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
          <svg className="w-6 h-6" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-extrabold mb-2 relative z-10" style={{ color: 'var(--text-h)' }}>
          {title}
        </h2>
        <p className="text-sm mb-6 relative z-10 max-w-[450px] mx-auto" style={{ color: 'var(--text-m)' }}>
          {description}
        </p>

        {/* Feature Grid: 2 cols x 3 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8 relative z-10 text-left">
          {displayFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--bg-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[13px] leading-tight mb-0.5" style={{ color: 'var(--text-h)' }}>{feature.title}</h4>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-m)' }}>{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Button using existing design tokens */}
        <Link to="/payment" className="btn btn-primary w-full max-w-[200px] relative z-10 flex items-center justify-center shadow-md hover:-translate-y-0.5 transition-transform text-sm py-2">
          Upgrade To Pro
        </Link>
      </div>
    </div>
  );
}
