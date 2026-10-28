import React from 'react';
import { Link } from 'react-router-dom';

export default function GlobalLogo({ 
  className = '', 
  style = {}, 
  size = 'md', // sm, md, lg
  withLink = true 
}) {
  
  // Mobile: 24-32px, Tablet: 28-36px, Desktop: 32-40px
  let iconHeight = '32px';
  let textClass = 'text-lg font-bold';
  let gapClass = 'gap-2';
  
  if (size === 'sm') {
    iconHeight = '24px';
    textClass = 'text-base font-extrabold';
    gapClass = 'gap-2';
  } else if (size === 'md') {
    iconHeight = '32px';
    textClass = 'text-base font-bold';
    gapClass = 'gap-2.5';
  } else if (size === 'lg') {
    iconHeight = '40px';
    textClass = 'text-xl font-bold';
    gapClass = 'gap-3';
  } else if (size === 'xl') {
    iconHeight = '48px';
    textClass = 'text-2xl font-bold';
    gapClass = 'gap-3';
  }

  // The uploaded logo has a white background. mix-blend-mode: multiply makes white transparent on light backgrounds.
  const logoProps = {
    src: '/a4-logo.jpg',
    alt: 'Apply4Works',
    className: `object-contain flex-shrink-0`,
    style: {
      height: iconHeight,
      width: 'auto',
      mixBlendMode: 'multiply',
      filter: 'contrast(1.1) saturate(1.1)',
      imageRendering: '-webkit-optimize-contrast',
      ...style
    }
  };

  const content = (
    <div className={`flex items-center ${gapClass} ${className}`}>
      <img {...logoProps} />
      <span className={textClass} style={{ color: 'var(--text-h)' }}>
        Apply4<span style={{ color: 'var(--primary)' }}>works</span>
      </span>
    </div>
  );

  if (withLink) {
    return (
      <Link to="/" className="inline-block flex-shrink-0 transition-opacity hover:opacity-90" style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}
