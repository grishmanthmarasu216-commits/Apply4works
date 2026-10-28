export function extractLogoUrl(job) {
  if (!job) return '';
  return job.companyLogo || 
         job.logo || 
         job.company?.logo || 
         job.companyLogoUrl || 
         job.logoUrl || 
         job.image || 
         job.thumbnail || 
         '';
}

export function extractCompanyName(job) {
  if (!job) return 'Unknown Company';
  if (typeof job.company === 'string') return job.company;
  if (job.company?.name) return job.company.name;
  if (job.companyName) return job.companyName;
  return 'Company';
}

export function extractMatchScore(job, wrapperInfo = null) {
  if (wrapperInfo && wrapperInfo.matchScore !== undefined && wrapperInfo.matchScore !== null) {
    return Number(wrapperInfo.matchScore);
  }
  if (!job) return 0;
  if (job.matchScore !== undefined && job.matchScore !== null) {
    return Number(job.matchScore);
  }
  if (job.matchDetails?.score !== undefined) {
    return Number(job.matchDetails.score);
  }
  return 0;
}
