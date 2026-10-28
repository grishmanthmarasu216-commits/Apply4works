import React from 'react';

export default function ResumeTemplates({ layout, form, autoFit }) {
  if (!form) return <div className="p-8 text-center text-gray-500">Loading resume data...</div>;

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const safeSplit = (textOrArray) => {
    if (!textOrArray) return [];
    if (Array.isArray(textOrArray)) return textOrArray;
    if (typeof textOrArray === 'string') return textOrArray.split('\n').filter(Boolean);
    return [];
  };

  const experience = getArray(form.experience);
  const projects = getArray(form.projects);
  const education = getArray(form.education);
  const skills = getArray(form.skills);
  const name = form.name || form.personalInfo?.name || form.fullName || 'Your Name';
  const email = form.email || form.personalInfo?.email || 'email@example.com';
  const phone = form.phone || form.personalInfo?.phone || '123-456-7890';
  const location = form.location || form.personalInfo?.location || 'City, State';
  const linkedin = form.linkedin || form.personalInfo?.linkedin || '';
  const github = form.github || form.personalInfo?.github || '';

  // Base ATS CSS properties ensuring maximum compatibility and monochrome styling
  const containerStyle = {
    fontFamily: '"Times New Roman", Times, serif', // Safe ATS default
    color: '#000000',
    backgroundColor: '#ffffff',
    width: '8.5in',
    minHeight: '11in',
    padding: '0.5in',
    boxSizing: 'border-box',
    lineHeight: autoFit ? '1.3' : '1.5',
    fontSize: '11pt',
    margin: '0 auto',
    wordBreak: 'break-word',
  };

  const sectionHeaderStyle = {
    textTransform: 'uppercase',
    borderBottom: '1px solid #000',
    paddingBottom: '2px',
    marginBottom: autoFit ? '6px' : '10px',
    marginTop: autoFit ? '10px' : '16px',
    fontWeight: 'bold',
    fontSize: '12pt',
    letterSpacing: '1px'
  };

  const renderContactInfo = () => {
    const parts = [email, phone, location];
    if (linkedin) parts.push(linkedin);
    if (github) parts.push(github);
    return parts.filter(Boolean).join(' | ');
  };

  // --- TEMPLATE VARIATIONS ---

  const renderStandard = () => (
    <div style={containerStyle} id="resume-preview-container" className="resume-canvas">
      <div style={{ textAlign: 'center', marginBottom: autoFit ? '10px' : '16px' }}>
        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>{name}</h1>
        <p style={{ margin: 0, fontSize: '10pt' }}>{renderContactInfo()}</p>
      </div>

      {form.summary && (
        <div style={{ marginBottom: autoFit ? '8px' : '12px' }}>
          <h2 style={sectionHeaderStyle}>Professional Summary</h2>
          <p style={{ margin: 0, textAlign: 'justify' }}>{form.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: autoFit ? '8px' : '12px' }}>
          <h2 style={sectionHeaderStyle}>Skills</h2>
          <p style={{ margin: 0 }}><strong>Core Competencies:</strong> {skills.join(', ')}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: autoFit ? '8px' : '12px' }}>
          <h2 style={sectionHeaderStyle}>Professional Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: autoFit ? '8px' : '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{exp.title}</span>
                <span>{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>{exp.company}</div>
              {exp.responsibilities && <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '10pt', color: '#333333' }}>
                    {safeSplit(exp.responsibilities).map((bullet, j) => (
                      <li key={j} style={{ marginBottom: '4px' }}>{bullet.replace(/^-\s*/, '')}</li>
                    ))}
                  </ul>
              }
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginBottom: autoFit ? '8px' : '12px' }}>
          <h2 style={sectionHeaderStyle}>Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: autoFit ? '6px' : '10px' }}>
              <div style={{ fontWeight: 'bold' }}>
                {proj.title} {proj.techStack && <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>| {proj.techStack}</span>}
              </div>
              {proj.description && <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: '10pt', color: '#333333' }}>
                    {safeSplit(proj.description).map((bullet, j) => (
                      <li key={j} style={{ marginBottom: '2px' }}>{bullet.replace(/^-\s*/, '')}</li>
                    ))}
                  </ul>
              }
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div style={{ marginBottom: autoFit ? '8px' : '12px' }}>
          <h2 style={sectionHeaderStyle}>Education</h2>
          {education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <strong>{edu.degree}</strong>, {edu.school}
              </div>
              <div>{edu.year}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompact = () => (
    <div style={{...containerStyle, fontSize: '10pt', lineHeight: '1.2'}} id="resume-preview-container" className="resume-canvas">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0 }}>{name}</h1>
        <div style={{ textAlign: 'right', fontSize: '9pt' }}>
          <div>{email} | {phone}</div>
          <div>{location}</div>
        </div>
      </div>
      
      {/* Rest is similar but tighter margins */}
      {form.summary && (
        <div style={{ marginBottom: '8px' }}>
          <p style={{ margin: 0 }}>{form.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{...sectionHeaderStyle, marginTop: '8px', marginBottom: '4px'}}>Skills</h2>
          <p style={{ margin: 0 }}>{skills.join(' • ')}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{...sectionHeaderStyle, marginTop: '8px', marginBottom: '4px'}}>Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{exp.title} @ {exp.company}</span>
                <span>{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              {exp.responsibilities && (
                <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                  {safeSplit(exp.responsibilities).map((bullet, j) => (
                    <li key={j}>{bullet.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* ... similar mapping for projects and education ... */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{...sectionHeaderStyle, marginTop: '8px', marginBottom: '4px'}}>Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 'bold' }}>{proj.title}</div>
              {proj.description && (
                <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                  {safeSplit(proj.description).map((bullet, j) => (
                    <li key={j}>{bullet.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{...sectionHeaderStyle, marginTop: '8px', marginBottom: '4px'}}>Education</h2>
          {education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>{edu.degree}</strong>, {edu.school}</div>
              <div>{edu.year}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderModern = () => (
    <div style={{...containerStyle, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}} id="resume-preview-container" className="resume-canvas">
      <div style={{ borderLeft: '4px solid #000', paddingLeft: '16px', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '28pt', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 4px 0' }}>{name}</h1>
        <p style={{ margin: 0, fontSize: '10pt', color: '#333' }}>{renderContactInfo()}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px' }}>
        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{...sectionHeaderStyle, borderBottom: '2px solid #000'}}>Skills</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10pt' }}>
                {skills.map((s, i) => <span key={i}>• {s}</span>)}
              </div>
            </div>
          )}
          {education.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{...sectionHeaderStyle, borderBottom: '2px solid #000'}}>Education</h2>
              {education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '10pt' }}>
                  <div style={{ fontWeight: 'bold' }}>{edu.degree}</div>
                  <div>{edu.school}</div>
                  <div style={{ color: '#555' }}>{edu.year}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {form.summary && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{...sectionHeaderStyle, borderBottom: '2px solid #000'}}>Summary</h2>
              <p style={{ margin: 0 }}>{form.summary}</p>
            </div>
          )}

          {experience.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{...sectionHeaderStyle, borderBottom: '2px solid #000'}}>Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12pt' }}>
                    <span>{exp.title}</span>
                    <span style={{ fontSize: '10pt' }}>{exp.startDate} – {exp.endDate || 'Present'}</span>
                  </div>
                  <div style={{ fontStyle: 'italic', marginBottom: '4px', color: '#444' }}>{exp.company}</div>
                  {exp.responsibilities && (
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '10pt', color: '#333333' }}>
                    {safeSplit(exp.responsibilities).map((bullet, j) => (
                      <li key={j} style={{ marginBottom: '3px' }}>{bullet}</li>
                    ))}
                  </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{...sectionHeaderStyle, borderBottom: '2px solid #000'}}>Projects</h2>
              {projects.map((proj, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold' }}>{proj.title}</div>
                  {proj.description && (
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '10pt', color: '#333333' }}>
                    {safeSplit(proj.description).map((bullet, j) => (
                      <li key={j} style={{ marginBottom: '3px' }}>{bullet}</li>
                    ))}
                  </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOnePage = () => (
    <div style={{...containerStyle, fontSize: '9pt', lineHeight: '1.1', padding: '0.4in'}} id="resume-preview-container" className="resume-canvas">
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0' }}>{name}</h1>
        <p style={{ margin: 0 }}>{renderContactInfo()}</p>
      </div>
      
      {form.summary && (
        <div style={{ marginBottom: '6px' }}>
          <p style={{ margin: 0, textAlign: 'justify' }}>{form.summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <h2 style={{...sectionHeaderStyle, marginTop: '4px', marginBottom: '4px', fontSize: '10pt'}}>Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{exp.title} — {exp.company}</span>
                <span>{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              {exp.responsibilities && (
                <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                  {safeSplit(exp.responsibilities).map((bullet, j) => (
                    <li key={j} style={{ marginBottom: '0' }}>{bullet.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      
      {projects.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <h2 style={{...sectionHeaderStyle, marginTop: '4px', marginBottom: '4px', fontSize: '10pt'}}>Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold' }}>{proj.title} {proj.techStack && <span style={{fontWeight: 'normal'}}>| {proj.techStack}</span>}</div>
              {proj.description && (
                <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                  {safeSplit(proj.description).map((bullet, j) => (
                    <li key={j} style={{ marginBottom: '0' }}>{bullet.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          {skills.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <h2 style={{...sectionHeaderStyle, marginTop: '4px', marginBottom: '4px', fontSize: '10pt'}}>Skills</h2>
              <p style={{ margin: 0 }}>{skills.join(', ')}</p>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {education.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <h2 style={{...sectionHeaderStyle, marginTop: '4px', marginBottom: '4px', fontSize: '10pt'}}>Education</h2>
              {education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>
                  <strong>{edu.degree}</strong>, {edu.school} ({edu.year})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAcademic = () => (
    <div style={{...containerStyle, fontFamily: '"Garamond", "Times New Roman", serif', lineHeight: '1.6'}} id="resume-preview-container" className="resume-canvas">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 'normal', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{name}</h1>
        <p style={{ margin: 0, fontSize: '11pt' }}>{renderContactInfo()}</p>
      </div>

      {education.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{...sectionHeaderStyle, textAlign: 'center', borderBottom: 'none', borderTop: '1px solid #000', borderBottomWidth: '1px', borderBottomStyle: 'solid', padding: '4px 0'}}>EDUCATION</h2>
          {education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <strong style={{ fontSize: '12pt' }}>{edu.school}</strong><br/>
                {edu.degree}
              </div>
              <div>{edu.year}</div>
            </div>
          ))}
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{...sectionHeaderStyle, textAlign: 'center', borderBottom: 'none', borderTop: '1px solid #000', borderBottomWidth: '1px', borderBottomStyle: 'solid', padding: '4px 0'}}>RESEARCH & ACADEMIC EXPERIENCE</h2>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>{exp.title}</span>
                <span>{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>{exp.company}</div>
              {exp.responsibilities && (
                <ul style={{ margin: '0 0 0 24px', padding: 0 }}>
                  {safeSplit(exp.responsibilities).map((bullet, j) => (
                    <li key={j} style={{ marginBottom: '4px' }}>{bullet.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{...sectionHeaderStyle, textAlign: 'center', borderBottom: 'none', borderTop: '1px solid #000', borderBottomWidth: '1px', borderBottomStyle: 'solid', padding: '4px 0'}}>SKILLS & METHODOLOGIES</h2>
          <p style={{ margin: 0, textAlign: 'center' }}>{skills.join(' • ')}</p>
        </div>
      )}
    </div>
  );

  if (layout === 'Compact ATS') return renderCompact();
  if (layout === 'Modern ATS') return renderModern();
  if (layout === 'One Page ATS') return renderOnePage();
  if (layout === 'Academic ATS') return renderAcademic();
  return renderStandard();
}
