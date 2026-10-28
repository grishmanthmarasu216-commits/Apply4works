import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

/**
 * Utility for exporting resumes in ATS-friendly formats.
 */

export async function exportResumeToDOCX(resumeData, filename = 'Resume.docx') {
  const children = [];

  // Name & Contact
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: resumeData.name || 'Your Name', bold: true })]
  }));
  
  children.push(new Paragraph({
    children: [new TextRun({ text: `${resumeData.email || ''} | ${resumeData.phone || ''} | ${resumeData.location || ''}` })]
  }));

  // Summary
  if (resumeData.summary) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROFESSIONAL SUMMARY")] }));
    children.push(new Paragraph({ children: [new TextRun(resumeData.summary)] }));
  }

  // Skills
  if (resumeData.skills) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("SKILLS")] }));
    children.push(new Paragraph({ children: [new TextRun(Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : resumeData.skills)] }));
  }

  // Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("EXPERIENCE")] }));
    resumeData.experience.forEach(exp => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${exp.title || 'Role'} | ${exp.company || 'Company'}`, bold: true })
        ]
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${exp.startDate || ''} - ${exp.endDate || ''}`, italics: true })]
      }));
      if (exp.responsibilities) {
         exp.responsibilities.split('\n').filter(Boolean).forEach(bullet => {
             children.push(new Paragraph({
                 text: bullet.replace(/^-\s*/, ''),
                 bullet: { level: 0 }
             }));
         });
      }
    });
  }

  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROJECTS")] }));
    resumeData.projects.forEach(proj => {
      children.push(new Paragraph({
        children: [new TextRun({ text: proj.title || 'Project', bold: true })]
      }));
      if (proj.techStack) {
          children.push(new Paragraph({ children: [new TextRun({ text: `Tech: ${proj.techStack}`, italics: true })] }));
      }
      if (proj.description) {
         proj.description.split('\n').filter(Boolean).forEach(bullet => {
             children.push(new Paragraph({
                 text: bullet.replace(/^-\s*/, ''),
                 bullet: { level: 0 }
             }));
         });
      }
    });
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("EDUCATION")] }));
    resumeData.education.forEach(edu => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${edu.degree || 'Degree'} | ${edu.school || 'School'}`, bold: true })
        ]
      }));
      children.push(new Paragraph({ children: [new TextRun(edu.year || '')] }));
    });
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResumeToTXT(resumeData, filename = 'Resume.txt') {
  let content = '';

  // Name & Contact
  content += `${resumeData.name || 'Your Name'}\n`;
  content += `${resumeData.email || ''} | ${resumeData.phone || ''} | ${resumeData.location || ''}\n\n`;

  // Summary
  if (resumeData.summary) {
    content += `PROFESSIONAL SUMMARY\n`;
    content += `${resumeData.summary}\n\n`;
  }

  // Skills
  if (resumeData.skills) {
    content += `SKILLS\n`;
    content += `${resumeData.skills}\n\n`;
  }

  // Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    content += `EXPERIENCE\n`;
    resumeData.experience.forEach(exp => {
      content += `${exp.title || 'Role'} | ${exp.company || 'Company'}\n`;
      content += `${exp.startDate || ''} - ${exp.endDate || ''}\n`;
      if (exp.responsibilities) {
         content += `${exp.responsibilities}\n`;
      }
      content += '\n';
    });
  }

  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    content += `PROJECTS\n`;
    resumeData.projects.forEach(proj => {
      content += `${proj.title || 'Project'}\n`;
      if (proj.techStack) content += `Tech: ${proj.techStack}\n`;
      if (proj.description) content += `${proj.description}\n`;
      content += '\n';
    });
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    content += `EDUCATION\n`;
    resumeData.education.forEach(edu => {
      content += `${edu.degree || 'Degree'} | ${edu.school || 'School'} | ${edu.year || ''}\n\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResumeToPDF() {
  // Using native browser print to PDF is the ONLY way to guarantee 100% 
  // ATS-friendly text selection without a heavy backend PDF generator like Puppeteer.
  // html2pdf.js generates images which fail ATS parsers.
  
  // We inject a temporary print stylesheet to hide everything except the resume
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden !important;
      }
      #resume-preview-container, #resume-preview-container * {
        visibility: visible !important;
      }
      #resume-preview-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none !important;
        transform: none !important;
      }
      @page {
        margin: 0.5in;
        size: letter portrait;
      }
    }
  `;
  document.head.appendChild(style);
  
  window.print();
  
  // Cleanup
  setTimeout(() => {
    document.head.removeChild(style);
  }, 1000);
}
