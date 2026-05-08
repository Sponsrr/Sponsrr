import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const lbl = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(240,237,232,0.55)', marginBottom: '0.5rem', display: 'block' };
const inp = { background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 12, padding: '0.8rem 1rem', color: '#f0ede8', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const textarea = { ...inp, resize: 'vertical', minHeight: 90, lineHeight: 1.6 };
const primaryBtn = { background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease', boxSizing: 'border-box' };
const secondaryBtn = { background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease', boxSizing: 'border-box' };
const poweredBy = { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' };

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert cover letter writer specialising in UK visa sponsorship job applications. You write cover letters that sound like a sharp, confident human — not AI.

STRICT RULES:
- No em dashes (—) anywhere. Ever.
- Never start with "I am writing to apply" or "I am writing to express my interest"
- No phrases: "passionate about", "results-driven", "I believe I would be", "I am confident that", "Furthermore", "Moreover", "In conclusion", "I am excited to", "I am keen to"
- 3 paragraphs maximum. Tight. Punchy.
- Paragraph 1: Strong opening hook. Who they are and why this specific role at this specific company. No generic openers.
- Paragraph 2: Their strongest 2-3 relevant achievements. Numbers where possible. Make it specific.
- Paragraph 3: Brief close. Forward looking. Confident not desperate. One sentence max.
- British English spelling throughout (organised, recognised, specialised)
- Active voice only
- Sound like a real person wrote this on a good day — someone who is good at their job and knows it
- Do not start the letter with "Dear Hiring Manager" or any salutation — just the body paragraphs

Do not add any commentary before or after the letter. Just output the 3 paragraphs.`;

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.75,
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

function GeneratingLoader() {
  const messages = [
    'Reading the job description...',
    'Matching your experience to the role...',
    'Writing your opening hook...',
    'Making it sound human...',
  ];
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
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0ede8', marginBottom: '0.5rem' }}>Writing your cover letter</div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(200,255,0,0.7)', fontWeight: 600, minHeight: '1.2em' }}>{messages[msgIndex]}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.25)', marginTop: '0.35rem' }}>Powered by Sponsrr AI</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ResultDisplay({ content, onReset, onPrint, name, role, company }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div>
      <button onClick={onReset} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>
        ← Write another
      </button>

      <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 14, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem' }}>✓</span>
        <span style={{ fontSize: '0.78rem', color: '#c8ff00', fontWeight: 600 }}>Your cover letter is ready — sounds human, not AI</span>
      </div>

      {/* Letter display */}
      <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '2rem', marginBottom: '1.25rem' }}>
        {name && <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.3)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(240,237,232,0.06)' }}>
          {name}{role && ` · Applying for ${role}`}{company && ` at ${company}`}
        </div>}
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: '0.88rem', color: '#f0ede8', lineHeight: 1.85, marginBottom: i < paragraphs.length - 1 ? '1.25rem' : 0, margin: i < paragraphs.length - 1 ? '0 0 1.25rem 0' : 0 }}>
            {para.trim()}
          </p>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button className="primary-btn" style={primaryBtn} onClick={handleCopy}>{copied ? '✓ Copied!' : 'Copy text'}</button>
        <button className="secondary-btn" style={secondaryBtn} onClick={onPrint}>Download PDF</button>
      </div>

      <div style={{ ...poweredBy }}>Sound more like yourself. Powered by Sponsrr AI.</div>
    </div>
  );
}

export default function CoverLetter() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [form, setForm] = useState({
    name: '', role: '', company: '', jd: '', experience: '', extra: '', visaStatus: '',
  });

  React.useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setAuthLoading(false);
    }
    check();
  }, [navigate]);

  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  async function handleGenerate() {
    if (!form.jd || !form.role) return;
    setStep('loading');
    setError('');
    try {
      const userPrompt = `Write a cover letter for:

Applicant name: ${form.name}
Applying for: ${form.role}${form.company ? ` at ${form.company}` : ''}
Visa status: ${form.visaStatus}

Job description:
${form.jd}

Their relevant experience:
${form.experience}

Anything specific to mention:
${form.extra}

Write 3 tight paragraphs. Make it sound like a sharp, confident human.`;

      const letter = await callGroq(COVER_LETTER_SYSTEM_PROMPT, userPrompt);
      setResult(letter);
      setStep('result');
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('form');
    }
  }

  function handlePrint() {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Cover Letter${form.name ? ' - ' + form.name : ''}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:60px auto;padding:0 20px;color:#1a1a1a;line-height:1.9;font-size:14px;}p{margin-bottom:1.5em;}</style></head><body>${result.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('')}</body></html>`);
    w.document.close(); w.print();
  }

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
          .primary-btn:hover { background:#aee600 !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(200,255,0,0.25); }
          .secondary-btn:hover { background:rgba(240,237,232,0.08) !important; border-color:rgba(240,237,232,0.7) !important; transform:translateY(-2px); }
          input:focus, textarea:focus { border-color:rgba(200,255,0,0.4) !important; outline:none; }
          input::placeholder, textarea::placeholder { color:rgba(240,237,232,0.25); }
          button:disabled { opacity:0.35; cursor:not-allowed; }
          textarea { font-family:inherit; }
        `}</style>

        <div style={{ maxWidth: 620, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>
          <div className="fu" key={step}>

            {step === 'loading' && <GeneratingLoader />}

            {step === 'result' && (
              <ResultDisplay
                content={result}
                name={form.name}
                role={form.role}
                company={form.company}
                onReset={() => { setStep('form'); setResult(''); }}
                onPrint={handlePrint}
              />
            )}

            {step === 'form' && (
              <>
                {/* Back to CV builder */}
                <button onClick={() => navigate('/cv-builder')} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>
                  ← Back to CV Builder
                </button>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>✉️ Cover Letter Builder</div>
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem,5vw,2.6rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                    Paste the JD,<br /><span style={{ color: '#c8ff00' }}>get the letter.</span>
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>
                    No "I am writing to apply". No em dashes. Just a sharp, human cover letter that actually gets read.
                  </p>
                </div>

                <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label style={lbl}>Your name</label><input style={inp} placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div><label style={lbl}>Visa status</label><input style={inp} placeholder="e.g. Graduate visa" value={form.visaStatus} onChange={e => setForm({ ...form, visaStatus: e.target.value })} /></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label style={lbl}>Role you're applying for *</label><input style={inp} placeholder="e.g. Senior Designer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                    <div><label style={lbl}>Company name</label><input style={inp} placeholder="e.g. ASOS" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                  </div>

                  <div>
                    <label style={lbl}>Job description *</label>
                    <textarea style={{ ...textarea, minHeight: 160 }} placeholder="Paste the full job description here..." value={form.jd} onChange={e => setForm({ ...form, jd: e.target.value })} />
                  </div>

                  <div>
                    <label style={lbl}>Your relevant experience <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>(a few bullet points is fine)</span></label>
                    <textarea style={textarea} placeholder="e.g. 3 years at H&M as a visual merchandiser, led a rebrand project, increased sales by 15%..." value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
                  </div>

                  <div>
                    <label style={lbl}>Anything specific to mention? <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>(optional)</span></label>
                    <input style={inp} placeholder="e.g. I'm on a Graduate visa and can start immediately, I met the founder at X..." value={form.extra} onChange={e => setForm({ ...form, extra: e.target.value })} />
                  </div>

                  {error && <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 12, padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'rgba(255,77,0,0.8)' }}>{error}</div>}

                  <button className="primary-btn" style={{ ...primaryBtn, marginTop: '0.25rem' }} onClick={handleGenerate} disabled={!form.jd || !form.role}>
                    Write my cover letter →
                  </button>
                </div>

                <div style={{ marginTop: '1.5rem', background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)', borderRadius: 14, padding: '0.85rem 1.1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.35)', lineHeight: 1.65 }}>
                    <strong style={{ color: 'rgba(200,255,0,0.55)' }}>How it works:</strong> Paste the JD, tell us your background, and our AI writes 3 tight paragraphs that sound human. No fluff. No filler. No phrases that scream "written by ChatGPT".
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}