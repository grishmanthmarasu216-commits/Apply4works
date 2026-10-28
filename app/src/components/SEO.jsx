import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, canonical, structuredData }) {
  const siteName = "Jobright AI";
  const defaultDescription = "Optimize your resume with AI to beat the ATS and land more interviews.";
  const baseUrl = "https://jobright.ai"; // Replace with real domain when known

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title ? `${title} | ${siteName}` : siteName}</title>
      <meta name="description" content={description || defaultDescription} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title ? `${title} | ${siteName}` : siteName} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | ${siteName}` : siteName} />
      <meta name="twitter:description" content={description || defaultDescription} />

      {/* Canonical Link */}
      {canonical && <link rel="canonical" href={`${baseUrl}${canonical}`} />}

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
