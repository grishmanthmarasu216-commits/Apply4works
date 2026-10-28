import React, { useState } from 'react';

export default function CompanyLogo({ logoUrl, companyLogo, companyLogoUrl, image, thumbnail, companyName, textLogo, logoColor, size = 'medium' }) {
  const [imgError, setImgError] = useState(false);
  
  const safeCompanyName = typeof companyName === 'string' ? companyName : (companyName?.name || companyName?.text || 'Company');
  const safeTextLogo = typeof textLogo === 'string' ? textLogo : '';
  
  const rawUrl = logoUrl || companyLogo || companyLogoUrl || image || thumbnail;
  const safeLogoUrl = typeof rawUrl === 'string' ? rawUrl : (rawUrl?.url || rawUrl?.src || '');
  
  const companyFirstLetter = safeTextLogo || safeCompanyName.charAt(0).toUpperCase();

  let sizeClass = 'w-16 h-16'; // 64x64 default
  let fontSize = '1.75rem';
  if (size === 'large' || size === 80) {
    sizeClass = 'w-20 h-20'; // 80x80
    fontSize = '2.25rem';
  } else if (size === 'small' || size === 48) {
    sizeClass = 'w-12 h-12'; // 48x48
    fontSize = '1.25rem';
  }

  if (imgError || !safeLogoUrl) {
    let color = logoColor;
    if (!color) {
      let hash = 0;
      for (let i = 0; i < (safeCompanyName?.length || 0); i++) {
        hash = safeCompanyName.charCodeAt(i) + ((hash << 5) - hash);
      }
      color = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
    }

    return (
      <div 
        className={`${sizeClass} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}
        style={{ background: color, fontSize }}
      >
        {companyFirstLetter}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden`} style={{ border: '1px solid var(--border)' }}>
      <img 
        src={safeLogoUrl} 
        alt={`${safeCompanyName} logo`} 
        onError={() => setImgError(true)}
        className="w-full h-full object-contain p-1.5"
        loading="lazy"
      />
    </div>
  );
}
