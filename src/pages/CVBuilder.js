import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const lbl = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(240,237,232,0.55)', marginBottom: '0.5rem', display: 'block' };
const inp = { background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 12, padding: '0.8rem 1rem', color: '#f0ede8', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const textarea = { ...inp, resize: 'vertical', minHeight: 90, lineHeight: 1.6 };
const primaryBtn = { background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease', boxSizing: 'border-box' };
const secondaryBtn = { background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease', boxSizing: 'border-box' };
const card = { background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem' };
const poweredBy = { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' };

// ── GROQ CALL ─────────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── SYSTEM PROMPTS ────────────────────────────────────────────────────────────
const CV_SYSTEM_PROMPT = `You are an expert CV writer who specialises in UK visa sponsorship job applications. You write CVs that sound like a sharp, confident human wrote them — not AI.

STRICT RULES:
- No em dashes (—) anywhere. Ever.
- No phrases: "results-driven", "detail-oriented", "passionate about", "seasoned professional", "leveraging", "synergy", "dynamic", "I am writing to", "proactive", "go-getter", "team player"
- No bullet points starting with "Responsible for" or "Duties included"
- Active voice only. Short, punchy sentences.
- British English spelling throughout (organised, recognised, specialised)
- Start bullet points with strong action verbs (Built, Led, Delivered, Increased, Reduced, Managed, Created, Launched, Improved)
- Professional summary should be 3 sentences max. Hook first, then value, then one line about what they're looking for.
- Work experience bullets should be achievement-focused, not task-focused. Include numbers and outcomes where provided.
- Keep it tight. No waffle.

OUTPUT FORMAT:
Return the CV as clean plain text with clear section headers. Use this exact structure:

[FULL NAME]
[Job Title] | [Location] | [Email] | [LinkedIn if provided]

PROFESSIONAL SUMMARY
[3 sentences max]

WORK EXPERIENCE
[Company Name] | [Job Title] | [Start Date - End Date]
- [Achievement bullet]
- [Achievement bullet]
- [Achievement bullet]

EDUCATION
[Degree] | [University] | [Year]

SKILLS
[Comma separated list]

Do not add any commentary before or after the CV. Just output the CV.`;

const ENHANCE_SYSTEM_PROMPT = `You are an expert CV writer who specialises in UK visa sponsorship job applications. You take existing CVs and rewrite them to be sharper, more impactful, and better optimised for ATS systems and UK Skilled Worker visa applications.

STRICT RULES:
- No em dashes (—) anywhere. Ever.
- No phrases: "results-driven", "detail-oriented", "passionate about", "seasoned professional", "leveraging", "synergy", "dynamic", "Responsible for", "Duties included"
- Active voice only. Short punchy sentences.
- British English spelling throughout
- Rewrite bullet points to be achievement-focused not task-focused. Add impact language.
- Keep all real information — do not invent achievements or companies
- Professional summary: 3 sentences max
- Start bullets with strong action verbs

OUTPUT FORMAT:
Return as clean plain text with the same structure as the input CV but rewritten. Do not add commentary before or after.`;

// ── LOADING ANIMATION ─────────────────────────────────────────────────────────
function GeneratingLoader({ mode }) {
  const messages = mode === 'cv'
    ? ['Crafting your professional summary...', 'Rewriting your experience bullets...', 'Optimising for ATS systems...', 'Making it sound human...']
    : ['Extracting your CV content...', 'Rewriting bullet points...', 'Improving impact and clarity...', 'Making it sound human...'];

  const [msgIndex, setMsgIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setMsgIndex(prev => (prev + 1) % messages.length), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.5rem', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 60, height: 60 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(200,255,0,0.15)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#c8ff00', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(200,255,0,0.4)', animation: 'spin 1.5s linear infinite reverse' }} />
      </div>
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0ede8', marginBottom: '0.5rem' }}>
          {mode === 'cv' ? 'Building your CV' : 'Enhancing your CV'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(200,255,0,0.7)', fontWeight: 600, minHeight: '1.2em' }}>{messages[msgIndex]}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.25)', marginTop: '0.35rem' }}>Powered by Sponsrr AI</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── RESULT DISPLAY ────────────────────────────────────────────────────────────
function ResultDisplay({ content, onReset, onPrint, name }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lines = content.split('\n');

  return (
    <div>
      <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>
        ← Start over
      </button>

      <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 14, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem' }}>✓</span>
        <span style={{ fontSize: '0.78rem', color: '#c8ff00', fontWeight: 600 }}>Your CV is ready - more human, less AI</span>
      </div>

      <div style={{ ...card, marginBottom: '1.25rem' }}>
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} style={{ height: '0.75rem' }} />;
          if (line.trim() === line.trim().toUpperCase() && line.trim().length > 2 && !line.startsWith('-') && !line.includes('@') && !line.includes('|') && !line.includes(',')) {
            return <div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.72rem', color: '#c8ff00', letterSpacing: '0.1em', marginTop: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(200,255,0,0.15)', paddingBottom: '0.35rem' }}>{line}</div>;
          }
          if (line.trim().startsWith('-')) {
            return <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', paddingLeft: '0.5rem' }}>
              <span style={{ color: '#c8ff00', flexShrink: 0, fontSize: '0.7rem', marginTop: '0.25rem' }}>→</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.75)', lineHeight: 1.6 }}>{line.replace(/^-\s*/, '')}</span>
            </div>;
          }
          if (i === 0) return <div key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#f0ede8', marginBottom: '0.15rem' }}>{line}</div>;
          if (i === 1) return <div key={i} style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', marginBottom: '1rem' }}>{line}</div>;
          return <div key={i} style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.7)', lineHeight: 1.65, marginBottom: '0.2rem' }}>{line}</div>;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button className="primary-btn" style={primaryBtn} onClick={handleCopy}>{copied ? '✓ Copied!' : 'Copy text'}</button>
        <button className="secondary-btn" style={secondaryBtn} onClick={onPrint}>Download PDF</button>
      </div>

      <div style={poweredBy}>Sound more like yourself. Powered by Sponsrr AI.</div>
    </div>
  );
}

// ── WORK EXPERIENCE ENTRY ─────────────────────────────────────────────────────
function ExperienceEntry({ entry, index, onChange, onRemove }) {
  return (
    <div style={{ background: 'rgba(240,237,232,0.03)', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 14, padding: '1.25rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(200,255,0,0.6)', letterSpacing: '0.05em' }}>ROLE {index + 1}</span>
        {index > 0 && <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', color: 'rgba(255,77,0,0.6)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><label style={lbl}>Company</label><input style={inp} placeholder="e.g. Deloitte UK" value={entry.company} onChange={e => onChange(index, 'company', e.target.value)} /></div>
          <div><label style={lbl}>Job title</label><input style={inp} placeholder="e.g. Software Engineer" value={entry.title} onChange={e => onChange(index, 'title', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><label style={lbl}>Start date</label><input style={inp} placeholder="e.g. Jan 2022" value={entry.start} onChange={e => onChange(index, 'start', e.target.value)} /></div>
          <div><label style={lbl}>End date</label><input style={inp} placeholder="e.g. Dec 2023 or Present" value={entry.end} onChange={e => onChange(index, 'end', e.target.value)} /></div>
        </div>
        <div>
          <label style={lbl}>What did you do and achieve? <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>(include numbers where you can)</span></label>
          <textarea style={textarea} placeholder="e.g. Led a team of 5 engineers, reduced deployment time by 40%, built a payments feature used by 10,000+ users..." value={entry.description} onChange={e => onChange(index, 'description', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CV BUILDER — SCRATCH MODE
// ══════════════════════════════════════════════════════════════════════════════
function CVScratch({ onBack }) {
  const [step, setStep] = useState('form');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '',
    targetRole: '', targetSector: '', summary: '', visaStatus: '',
    experience: [{ company: '', title: '', start: '', end: '', description: '' }],
    education: [{ degree: '', university: '', year: '' }],
    skills: '',
  });

  function updateExp(index, field, value) {
    const updated = [...form.experience];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, experience: updated });
  }

  async function handleGenerate() {
    if (!form.name || !form.targetRole) return;
    setStep('loading');
    setError('');
    try {
      const userPrompt = `Write a professional CV for:

Name: ${form.name}
Email: ${form.email}
Phone: ${form.phone}
Location: ${form.location}
LinkedIn: ${form.linkedin}
Target role: ${form.targetRole}
Target sector: ${form.targetSector}
Visa status: ${form.visaStatus}

Summary (rewrite and improve): ${form.summary || 'Write a professional summary based on their experience'}

Work experience:
${form.experience.map((e, i) => `Role ${i + 1}: ${e.title} at ${e.company} (${e.start} - ${e.end})\n${e.description}`).join('\n\n')}

Education:
${form.education.map(e => `${e.degree} at ${e.university}, ${e.year}`).join('\n')}

Skills: ${form.skills}`;

      const cv = await callGroq(CV_SYSTEM_PROMPT, userPrompt);
      setResult(cv);
      setStep('result');
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('form');
    }
  }

  function handlePrint() {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>CV - ${form.name}</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:13px;}pre{white-space:pre-wrap;font-family:inherit;}</style></head><body><pre>${result}</pre></body></html>`);
    w.document.close(); w.print();
  }

  if (step === 'loading') return <GeneratingLoader mode="cv" />;
  if (step === 'result') return <ResultDisplay content={result} name={form.name} onReset={() => { setStep('form'); setResult(''); }} onPrint={handlePrint} />;

  return (
    <>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>← Back</button>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>✍️ Build from scratch</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,5vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>Tell us about<br /><span style={{ color: '#c8ff00' }}>yourself</span></h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>Fill in your details and we'll write a polished, visa-ready CV that sounds like you.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={card}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>Personal details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>Full name *</label><input style={inp} placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={lbl}>Email</label><input style={inp} placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>Phone</label><input style={inp} placeholder="+44 7700 000000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label style={lbl}>Location</label><input style={inp} placeholder="London, UK" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>LinkedIn URL</label><input style={inp} placeholder="linkedin.com/in/yourname" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
              <div><label style={lbl}>Visa status</label><input style={inp} placeholder="e.g. Graduate visa" value={form.visaStatus} onChange={e => setForm({ ...form, visaStatus: e.target.value })} /></div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>Target role</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><label style={lbl}>Job title you're targeting *</label><input style={inp} placeholder="e.g. Product Manager, Software Engineer, Retail Buyer" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} /></div>
            <div><label style={lbl}>Sector / industry</label><input style={inp} placeholder="e.g. FinTech, Fashion, Healthcare, Retail" value={form.targetSector} onChange={e => setForm({ ...form, targetSector: e.target.value })} /></div>
            <div>
              <label style={lbl}>Brief summary <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>(optional - we'll write one if you skip)</span></label>
              <textarea style={textarea} placeholder="A few lines about who you are. Don't worry about making it perfect - we'll rewrite it." value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>Work experience</div>
          {form.experience.map((entry, i) => (
            <ExperienceEntry key={i} entry={entry} index={i} onChange={updateExp} onRemove={idx => setForm({ ...form, experience: form.experience.filter((_, j) => j !== idx) })} />
          ))}
          <button className="secondary-btn" style={{ ...secondaryBtn, marginTop: '0.5rem' }} onClick={() => setForm({ ...form, experience: [...form.experience, { company: '', title: '', start: '', end: '', description: '' }] })}>+ Add another role</button>
        </div>

        <div style={card}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>Education</div>
          {form.education.map((edu, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div><label style={lbl}>Degree</label><input style={inp} placeholder="BSc Computer Science" value={edu.degree} onChange={e => { const u = [...form.education]; u[i].degree = e.target.value; setForm({ ...form, education: u }); }} /></div>
              <div><label style={lbl}>University</label><input style={inp} placeholder="University of Manchester" value={edu.university} onChange={e => { const u = [...form.education]; u[i].university = e.target.value; setForm({ ...form, education: u }); }} /></div>
              <div><label style={lbl}>Year</label><input style={inp} placeholder="2023" value={edu.year} onChange={e => { const u = [...form.education]; u[i].year = e.target.value; setForm({ ...form, education: u }); }} /></div>
            </div>
          ))}
          <button className="secondary-btn" style={{ ...secondaryBtn, marginTop: '0.25rem' }} onClick={() => setForm({ ...form, education: [...form.education, { degree: '', university: '', year: '' }] })}>+ Add another qualification</button>
        </div>

        <div style={card}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>Skills</div>
          <textarea style={textarea} placeholder="Python, React, Project Management, SQL, Figma, Agile, Stakeholder Communication..." value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
        </div>

        {error && <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 12, padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'rgba(255,77,0,0.8)' }}>{error}</div>}

        <button className="primary-btn" style={{ ...primaryBtn, marginTop: '0.5rem' }} onClick={handleGenerate} disabled={!form.name || !form.targetRole}>Generate my CV →</button>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CV BUILDER — UPLOAD & ENHANCE MODE
// ══════════════════════════════════════════════════════════════════════════════
function CVEnhance({ onBack }) {
  const [step, setStep] = useState('upload');
  const [result, setResult] = useState('');
  const [cvText, setCvText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError('');
    try {
      if (file.name.endsWith('.txt')) {
        setCvText(await file.text());
      } else {
        setError('Please upload a .txt file, or paste your CV text below.');
      }
    } catch {
      setError('Could not read the file. Please paste your CV text below.');
    }
  }

  async function handleEnhance() {
    if (!cvText.trim()) return;
    setStep('loading');
    setError('');
    try {
      const userPrompt = `Enhance and rewrite this CV to be sharper, more impactful, and optimised for ATS and UK Skilled Worker visa applications.
${targetRole ? `\nThe person is targeting: ${targetRole}` : ''}

Existing CV:
${cvText}`;

      const enhanced = await callGroq(ENHANCE_SYSTEM_PROMPT, userPrompt);
      setResult(enhanced);
      setStep('result');
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('upload');
    }
  }

  function handlePrint() {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Enhanced CV</title><style>body{font-family:Georgia,serif;max-width:750px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6;font-size:13px;}pre{white-space:pre-wrap;font-family:inherit;}</style></head><body><pre>${result}</pre></body></html>`);
    w.document.close(); w.print();
  }

  if (step === 'loading') return <GeneratingLoader mode="enhance" />;
  if (step === 'result') return <ResultDisplay content={result} onReset={() => { setStep('upload'); setResult(''); }} onPrint={handlePrint} />;

  return (
    <>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>← Back</button>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>✨ Upload and enhance</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,5vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>Your CV,<br /><span style={{ color: '#c8ff00' }}>but better</span></h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>Upload your existing CV and we'll rewrite it to be sharper, more impactful, and visa-ready.</p>
      </div>

      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={lbl}>Upload your CV <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>.txt file</span></label>
          <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed rgba(200,255,0,0.2)', borderRadius: 14, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(200,255,0,0.02)' }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.5)' }}>Drop your CV here or click to upload</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.25)', marginTop: '0.25rem' }}>.txt file</div>
          </div>
          <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
          <span style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.25)' }}>or paste below</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
        </div>

        <div>
          <label style={lbl}>Paste your CV text</label>
          <textarea style={{ ...textarea, minHeight: 200 }} placeholder="Paste the text of your existing CV here..." value={cvText} onChange={e => setCvText(e.target.value)} />
        </div>

        <div>
          <label style={lbl}>What role are you targeting? <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>(optional)</span></label>
          <input style={inp} placeholder="e.g. Marketing Manager at a fashion brand" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
        </div>

        {error && <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 12, padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'rgba(255,77,0,0.8)' }}>{error}</div>}
        {cvText.trim() && <div style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'rgba(200,255,0,0.7)' }}>✓ CV text ready - {cvText.split(' ').length} words detected</div>}

        <button className="primary-btn" style={primaryBtn} onClick={handleEnhance} disabled={!cvText.trim()}>Enhance my CV →</button>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function HomeScreen({ onSelect, navigate }) {
  const tools = [
    { id: 'scratch', icon: '✍️', title: 'Build from scratch', desc: 'Fill in your details and we\'ll write a polished, ATS-ready CV tailored to any role or industry. Tech, retail, fashion, finance - your call.', tag: 'Most popular', tagColor: '#c8ff00' },
    { id: 'enhance', icon: '✨', title: 'Upload and enhance', desc: 'Already have a CV? Paste or upload it and we\'ll rewrite it to be sharper, more impactful, and better aligned with what UK employers actually want.', tag: 'Quick win', tagColor: '#ffc800' },
  ];

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>
          ✍️ AI CV Builder · Visa Ready
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem,5vw,2.6rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          Sounds human.<br /><span style={{ color: '#c8ff00' }}>Written by AI.</span>
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>
          Hiring manager won't know the difference - and neither will you.
        </p>
      </div>

      {/* Cards — same format as Calculator */}
      <div className="cv-home-grid">
        {tools.map(tool => (
          <button key={tool.id} className="cv-tool-card" onClick={() => onSelect(tool.id)}>
            <span style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: `${tool.tagColor}28`, border: `1px solid ${tool.tagColor}70`, borderRadius: 100, padding: '0.22rem 0.7rem', fontSize: '0.6rem', fontWeight: 700, color: tool.tagColor, whiteSpace: 'nowrap' }}>{tool.tag}</span>
            <span style={{ fontSize: '1.5rem', lineHeight: 1, marginBottom: '0.85rem', display: 'block' }}>{tool.icon}</span>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.92rem', color: '#f0ede8', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '0.6rem', paddingRight: '3.5rem' }}>{tool.title}</div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.65, flex: 1 }}>{tool.desc}</p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'rgba(200,255,0,0.7)', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
              Build CV →
            </div>
          </button>
        ))}
      </div>

      {/* Cover letter redirect banner */}
      <div style={{ marginTop: '1.25rem', background: 'rgba(240,237,232,0.03)', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 20, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '0.3rem' }}>Your job hunt got you this far</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.55 }}>Don't lose it on the cover letter.</div>
        </div>
        <button onClick={() => navigate('/cover-letter')} style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.3)', borderRadius: 100, padding: '0.65rem 1.25rem', color: '#c8ff00', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,255,0,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,255,0,0.08)'; }}>
          Build my cover letter →
        </button>
      </div>

      <div style={{ marginTop: '1rem', background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)', borderRadius: 14, padding: '0.85rem 1.1rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.35)', lineHeight: 1.65 }}>
          <strong style={{ color: 'rgba(200,255,0,0.55)' }}>Built for sponsored roles:</strong> Every CV passes ATS filters, matches UK Skilled Worker visa requirements, and sounds like a real human wrote it - because your hiring manager has seen too many AI CVs.
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function CVBuilder() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('home');
  const [authLoading, setAuthLoading] = useState(true);

  React.useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setAuthLoading(false);
    }
    check();
  }, [navigate]);

  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [screen]);

  if (authLoading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading...</div>
    </div>
  );

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          @keyframes fu { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .fu { animation: fu 0.45s ease forwards; }
          .cv-home-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; align-items:stretch; }
          .cv-tool-card { background:#111; border:1px solid rgba(240,237,232,0.08); border-radius:20px; padding:1.5rem; text-align:left; cursor:pointer; font-family:inherit; transition:all 0.2s ease; display:flex; flex-direction:column; width:100%; position:relative; min-height:260px; }
          .cv-tool-card:hover { border-color:rgba(200,255,0,0.25); transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }
          @media(max-width:600px){ .cv-home-grid{ grid-template-columns:1fr !important; } .cv-tool-card{ min-height:200px !important; } }
          .primary-btn:hover { background:#aee600 !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(200,255,0,0.25); }
          .secondary-btn:hover { background:rgba(240,237,232,0.08) !important; border-color:rgba(240,237,232,0.7) !important; transform:translateY(-2px); }
          input:focus, textarea:focus { border-color:rgba(200,255,0,0.4) !important; outline:none; }
          input::placeholder, textarea::placeholder { color:rgba(240,237,232,0.25); }
          button:disabled { opacity:0.35; cursor:not-allowed; }
          textarea { font-family:inherit; }
        `}</style>
        <div style={{ maxWidth: screen === 'home' ? 820 : 680, margin: '0 auto', padding: '6.5rem 1.5rem 4rem', transition: 'max-width 0.3s ease' }}>
          <div className="fu" key={screen}>
            {screen === 'home'    && <HomeScreen onSelect={setScreen} navigate={navigate} />}
            {screen === 'scratch' && <CVScratch onBack={() => setScreen('home')} />}
            {screen === 'enhance' && <CVEnhance onBack={() => setScreen('home')} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}