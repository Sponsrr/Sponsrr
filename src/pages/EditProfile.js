import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import SocGuideModal from './SocGuideModal';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const UK_CITIES = [
  'London','Manchester','Birmingham','Leeds','Bristol','Edinburgh',
  'Glasgow','Liverpool','Sheffield','Newcastle','Nottingham','Cardiff',
  'Leicester','Southampton','Oxford','Cambridge',
];

const VISA_OPTIONS = [
  { value: '',               label: 'Select current visa...' },
  { value: 'graduate',       label: 'Graduate Visa (PSW)' },
  { value: 'student',        label: 'Student Visa (Tier 4)' },
  { value: 'skilled_worker', label: 'Skilled Worker Visa' },
  { value: 'health_care',    label: 'Health & Care Worker Visa' },
  { value: 'no_uk_visa',     label: 'No current UK visa' },
  { value: 'other',          label: 'Other UK visa' },
];

const DEGREE_OPTIONS = [
  { value: '',          label: 'Select qualification...' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters',   label: "Master's Degree" },
  { value: 'phd_stem',  label: 'PhD — STEM subject' },
  { value: 'phd_other', label: 'PhD — Non-STEM subject' },
  { value: 'none',      label: 'No degree / other' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'student',  label: 'Student / No experience yet' },
  { value: '0-2',      label: '0–2 years' },
  { value: '2-5',      label: '2–5 years' },
  { value: '5-10',     label: '5–10 years' },
  { value: '10+',      label: '10+ years' },
];

const SALARY_BANDS = [
  'Under £25,000', '£25,000–£30,000', '£30,000–£35,000',
  '£35,000–£40,000', '£40,000–£45,000', '£45,000–£55,000',
  '£55,000–£70,000', '£70,000–£90,000', '£90,000+',
];

// Compute new entrant from profile fields
function computeNewEntrant({ age, current_visa, grad_year, uk_university }) {
  if (current_visa === 'graduate' || current_visa === 'student') return true;
  if (current_visa === 'skilled_worker') return false;
  if (age && parseInt(age) < 26) return true;
  if (uk_university && grad_year) {
    const yrs = new Date().getFullYear() - parseInt(grad_year);
    if (yrs <= 2) return true;
  }
  return false;
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0ede8', letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.25rem' }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

// ── FIELD COMPONENTS ──────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'rgba(240,237,232,0.55)', marginBottom: '0.5rem', display: 'block' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'rgba(240,237,232,0.35)', lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.1)',
  borderRadius: 12, padding: '0.8rem 1rem', color: '#f0ede8', fontSize: '0.88rem',
  fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.2s',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none', cursor: 'pointer',
  paddingRight: '2.2rem',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(240,237,232,0.4)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function EditProfile() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const fromOnboarding = location.state?.fromOnboarding || false;

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [userId, setUserId]     = useState(null);
  const [showSocGuide, setShowSocGuide] = useState(false);

  // Form state
  const [form, setForm] = useState({
    full_name:           '',
    job_title:           '',
    soc_code:            '',
    soc_title:           '',
    experience:          '',
    current_visa:        '',
    age:                 '',
    degree:              '',
    uk_university:       false,
    university:          '',
    grad_year:           '',
    preferred_locations: [],
    target_salary_band:  [],  // now multi-select up to 3
    sector:              '',
  });

  // ── LOAD EXISTING PROFILE ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setForm({
          full_name:           profile.full_name           || '',
          job_title:           profile.job_title           || '',
          soc_code:            profile.soc_code            || '',
          soc_title:           '',
          experience:          profile.experience          || '',
          current_visa:        profile.current_visa        || '',
          age:                 profile.age                 || '',
          degree:              profile.degree              || '',
          uk_university:       profile.uk_university       || false,
          university:          profile.university          || '',
          grad_year:           profile.grad_year           || '',
          preferred_locations: profile.preferred_locations || [],
          target_salary_band:  Array.isArray(profile.target_salary_band) ? profile.target_salary_band : (profile.target_salary_band ? [profile.target_salary_band] : []),
          sector:              profile.sector              || '',
        });
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleLocation(city) {
    setForm(prev => {
      const locs = prev.preferred_locations;
      if (locs.includes(city)) return { ...prev, preferred_locations: locs.filter(l => l !== city) };
      if (locs.length >= 3)    return prev;
      return { ...prev, preferred_locations: [...locs, city] };
    });
    setSaved(false);
  }

  function handleSocSelect(soc) {
    setForm(prev => ({ ...prev, soc_code: soc.code, soc_title: soc.title, job_title: prev.job_title || soc.title, sector: soc.sector }));
    setSaved(false);
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    setSaving(true);
    setError('');

    const isNewEntrant = computeNewEntrant({
      age: form.age,
      current_visa: form.current_visa,
      grad_year: form.grad_year,
      uk_university: form.uk_university,
    });

    
const { error: saveError } = await supabase.from('profiles').upsert({
      id:                  userId,
      full_name:           form.full_name.trim(),
      job_title:           form.job_title.trim(),
      soc_code:            form.soc_code || null,
      experience:          form.experience || null,
      current_visa:        form.current_visa || null,
      age:                 form.age ? parseInt(form.age) : null,
      degree:              form.degree || null,
      uk_university:       form.uk_university,
      university:          form.university.trim() || null,
      grad_year:           form.grad_year ? parseInt(form.grad_year) : null,
      preferred_locations: form.preferred_locations,
      target_salary_band:  form.target_salary_band.length > 0 ? form.target_salary_band : null,
      sector:              form.sector || null,
      is_new_entrant:      isNewEntrant,
      updated_at:          new Date().toISOString(),
    });

    setSaving(false);
    
if (saveError) { setError('Failed to save. Please try again.'); return; }

    setSaved(true);

    // If coming from onboarding, go to score
    if (fromOnboarding) { navigate('/score'); return; }

    // Brief success state then nothing — stay on page
    setTimeout(() => setSaved(false), 3000);
  }

  // Derived
  const isNewEntrant = computeNewEntrant({
    age: form.age,
    current_visa: form.current_visa,
    grad_year: form.grad_year,
    uk_university: form.uk_university,
  });

  // Completeness score
  const fields = [
    form.full_name, form.job_title, form.soc_code, form.experience,
    form.current_visa, form.age, form.degree,
    form.preferred_locations.length > 0, form.target_salary_band,
  ];
  const complete = fields.filter(Boolean).length;
  const completePct = Math.round((complete / fields.length) * 100);

  if (loading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading profile...</div>
    </div>
  );

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          .ep-in { animation: fadeUp 0.4s ease forwards; }
          .fi:focus { border-color: rgba(200,255,0,0.4) !important; }
          .fi::placeholder { color: rgba(240,237,232,0.25); }
          .fs:focus { border-color: rgba(200,255,0,0.4) !important; }
          .loc-pill { padding: 0.45rem 0.9rem; border-radius: 100px; font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; border: 1px solid rgba(240,237,232,0.1); background: rgba(240,237,232,0.04); color: rgba(240,237,232,0.5); }
          .loc-pill:hover { border-color: rgba(240,237,232,0.25); color: rgba(240,237,232,0.8); }
          .loc-pill.on { background: rgba(200,255,0,0.1); border-color: rgba(200,255,0,0.3); color: #c8ff00; }
          .loc-pill:disabled { opacity: 0.3; cursor: not-allowed; }
          .tog { flex: 1; padding: 0.65rem; border-radius: 10px; font-size: 0.82rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.2s; }
          .tog.on  { background: #c8ff00; color: #080808; border: 1px solid #c8ff00; }
          .tog.off { background: rgba(240,237,232,0.04); color: rgba(240,237,232,0.5); border: 1px solid rgba(240,237,232,0.1); }
          .soc-link { background: none; border: none; color: rgba(200,255,0,0.7); font-size: 0.72rem; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: underline; text-underline-offset: 3px; padding: 0; }
          .soc-link:hover { color: #c8ff00; }
          .loc-pill:disabled { opacity: 0.3 !important; cursor: not-allowed !important; }
          div::-webkit-scrollbar { display: none; }
          .save-btn { background: #c8ff00; color: #080808; border: none; border-radius: 100px; padding: 0.9rem 2rem; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.92rem; cursor: pointer; width: 100%; transition: all 0.2s ease; }
          .save-btn:hover { background: #aee600; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,255,0,0.25); }
          .save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
          .sal-band { padding: 0.6rem 0.85rem; border-radius: 10px; font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; border: 1px solid rgba(240,237,232,0.1); background: rgba(240,237,232,0.04); color: rgba(240,237,232,0.5); white-space: nowrap; }
          .sal-band:hover { border-color: rgba(240,237,232,0.25); color: rgba(240,237,232,0.8); }
          .sal-band.on { background: rgba(200,255,0,0.1); border-color: rgba(200,255,0,0.3); color: #c8ff00; }
        `}</style>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>

          {/* ── HEADER ── */}
          <div className="ep-in" style={{ marginBottom: '2rem' }}>
            {!fromOnboarding && (
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', padding: 0 }}>
                ← Back
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: 0 }}>
                  {fromOnboarding ? 'Tell us about yourself' : 'Edit Profile'}
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', marginTop: '0.5rem', lineHeight: 1.6, margin: '0.5rem 0 0' }}>
                  {fromOnboarding
                    ? 'This powers your Sponsrr Score, salary checker and job matching.'
                    : 'Keep your profile up to date for accurate scores and better job matches.'}
                </p>
              </div>

              {/* Completeness ring — stays right of title always */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <svg width={52} height={52} viewBox="0 0 52 52">
                  <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(240,237,232,0.08)" strokeWidth={4} />
                  <circle cx={26} cy={26} r={20} fill="none" stroke="#c8ff00" strokeWidth={4}
                    strokeDasharray={`${2 * Math.PI * 20 * completePct / 100} ${2 * Math.PI * 20}`}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                  <text x={26} y={31} textAnchor="middle" fontSize={11} fontWeight={700} fill="#c8ff00" fontFamily="Syne,sans-serif">
                    {completePct}%
                  </text>
                </svg>
                <span style={{ fontSize: '0.58rem', color: 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Complete</span>
              </div>
            </div>
          </div>

          {/* ── FORM CARD ── */}
          <div className="ep-in" style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* ── PERSONAL ── */}
            <Section title="Personal" subtitle="Basic info used across your profile">
              <Field label="Full name">
                <input className="fi" style={inputStyle} type="text" placeholder="e.g. Priya Sharma"
                  value={form.full_name} onChange={e => update('full_name', e.target.value)} />
              </Field>
            </Section>

            <div style={{ height: 1, background: 'rgba(240,237,232,0.07)', margin: '0 0 2rem' }} />

            {/* ── PROFESSIONAL ── */}
            <Section title="Professional" subtitle="Your current role and experience level">
              <Field label="Job title">
                <input className="fi" style={inputStyle} type="text" placeholder="e.g. Software Engineer, Staff Nurse, Solicitor..."
                  value={form.job_title} onChange={e => update('job_title', e.target.value)} />
              </Field>

              <div>
                {/* SOC label is itself the clickable guide link */}
                <button className="soc-link" onClick={() => setShowSocGuide(true)}
                  style={{ background:'none', border:'none', fontFamily:'inherit', cursor:'pointer', padding:0, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                  <span style={{ fontSize:'0.76rem', fontWeight:700, color:'rgba(240,237,232,0.55)', textDecoration:'underline', textUnderlineOffset:3 }}>SOC code</span>
                  <span style={{ fontSize:'0.76rem', color:'rgba(200,255,0,0.7)' }}>→</span>
                </button>
                <input className="fi" style={inputStyle} type="text" placeholder="e.g. 2134 — tap label above to find yours" maxLength={4}
                  value={form.soc_code} onChange={e => update('soc_code', e.target.value.replace(/\D/g, ''))} />
                {form.soc_code && form.soc_code.length === 4 && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'rgba(200,255,0,0.7)' }}>
                    ✓ SOC {form.soc_code}{form.soc_title ? ` — ${form.soc_title}` : ''}
                  </div>
                )}
              </div>

              <Field label="Experience level">
                <div style={{ position: 'relative' }}>
                  <select className="fs" style={selectStyle} value={form.experience} onChange={e => update('experience', e.target.value)}>
                    <option value="">Select experience level...</option>
                    {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </Field>
            </Section>

            <div style={{ height: 1, background: 'rgba(240,237,232,0.07)', margin: '0 0 2rem' }} />

            {/* ── VISA SITUATION ── */}
            <Section title="Visa Situation" subtitle="Determines your thresholds and new entrant eligibility">
              <Field label="Current UK visa">
                <div style={{ position: 'relative' }}>
                  <select className="fs" style={selectStyle} value={form.current_visa} onChange={e => update('current_visa', e.target.value)}>
                    {VISA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {form.current_visa && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: (form.current_visa === 'graduate' || form.current_visa === 'student') ? 'rgba(200,255,0,0.7)' : form.current_visa === 'skilled_worker' ? 'rgba(255,77,0,0.7)' : 'rgba(240,237,232,0.35)' }}>
                    {form.current_visa === 'graduate'       && '✓ Graduate (PSW) — qualifies as new entrant'}
                    {form.current_visa === 'student'        && '✓ Student visa — qualifies as new entrant'}
                    {form.current_visa === 'skilled_worker' && '✗ Skilled Worker — does not qualify as new entrant'}
                    {form.current_visa === 'health_care'    && 'Health & Care route — lower thresholds apply'}
                    {form.current_visa === 'no_uk_visa'     && 'Age and education determine new entrant eligibility'}
                    {form.current_visa === 'other'          && 'Check with an immigration adviser for your route'}
                  </div>
                )}
              </Field>

              <Field label="Your age" hint="Used to determine new entrant status (under 26 qualifies)">
                <input className="fi" style={inputStyle} type="number" placeholder="e.g. 24"
                  value={form.age} onChange={e => update('age', e.target.value)} min={16} max={70} />
                {form.age && !isNaN(parseInt(form.age)) && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: parseInt(form.age) < 26 ? 'rgba(200,255,0,0.7)' : 'rgba(240,237,232,0.35)' }}>
                    {parseInt(form.age) < 26 ? '✓ Under 26 — qualifies as new entrant' : 'Over 26 — check visa status above'}
                  </div>
                )}
              </Field>

              {/* New entrant computed summary */}
              <div style={{ background: isNewEntrant ? 'rgba(200,255,0,0.05)' : 'rgba(240,237,232,0.03)', border: `1px solid ${isNewEntrant ? 'rgba(200,255,0,0.2)' : 'rgba(240,237,232,0.08)'}`, borderRadius: 12, padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isNewEntrant ? '#c8ff00' : 'rgba(240,237,232,0.4)', marginBottom: '0.2rem' }}>
                  {isNewEntrant ? '✓ New Entrant — Eligible' : '◎ New Entrant — Not Eligible'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.55 }}>
                  {isNewEntrant
                    ? 'Your salary threshold is £33,400 or 70% of the going rate — whichever is higher.'
                    : 'Your salary threshold is £41,700 or the full going rate for your SOC code.'}
                </div>
              </div>
            </Section>

            <div style={{ height: 1, background: 'rgba(240,237,232,0.07)', margin: '0 0 2rem' }} />

            {/* ── EDUCATION ── */}
            <Section title="Education" subtitle="Affects new entrant window and PhD salary discounts">
              <Field label="Highest qualification">
                <div style={{ position: 'relative' }}>
                  <select className="fs" style={selectStyle} value={form.degree} onChange={e => update('degree', e.target.value)}>
                    {DEGREE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {(form.degree === 'phd_stem' || form.degree === 'phd_other') && (
                  <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'rgba(200,255,0,0.7)' }}>
                    ✓ PhD discount — {form.degree === 'phd_stem' ? '80% of going rate minimum' : '90% of going rate minimum'}
                  </div>
                )}
              </Field>

              {form.degree && form.degree !== 'none' && (
                <Field label="Did you study at a UK university?">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={`tog ${form.uk_university ? 'on' : 'off'}`} onClick={() => update('uk_university', true)}>Yes</button>
                    <button className={`tog ${!form.uk_university ? 'on' : 'off'}`} onClick={() => update('uk_university', false)}>No</button>
                  </div>
                </Field>
              )}

              {form.uk_university && form.degree && form.degree !== 'none' && (
                <>
                  <Field label="University name (optional)">
                    <input className="fi" style={inputStyle} type="text" placeholder="e.g. University of Manchester"
                      value={form.university} onChange={e => update('university', e.target.value)} />
                  </Field>
                  <Field label="Year of graduation">
                    <input className="fi" style={inputStyle} type="number" placeholder="e.g. 2023"
                      value={form.grad_year} onChange={e => update('grad_year', e.target.value)} min={2000} max={new Date().getFullYear()} />
                    {form.grad_year && (
                      <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: (() => { const y = new Date().getFullYear() - parseInt(form.grad_year); return y <= 2 ? 'rgba(200,255,0,0.7)' : 'rgba(240,237,232,0.35)'; })() }}>
                        {(() => {
                          const y = new Date().getFullYear() - parseInt(form.grad_year);
                          if (y <= 0) return '✓ Current student — qualifies as new entrant';
                          if (y <= 2) return `✓ Graduated ${y <= 1 ? 'within the last year' : '2 years ago'} — qualifies as new entrant`;
                          return `Graduated ${y} years ago — graduate window has closed`;
                        })()}
                      </div>
                    )}
                  </Field>
                </>
              )}
            </Section>

            <div style={{ height: 1, background: 'rgba(240,237,232,0.07)', margin: '0 0 2rem' }} />

            {/* ── PREFERENCES ── */}
            <Section title="Job Preferences" subtitle="Used for job matching and Sponsrr Score">
              <Field label={`Preferred UK locations ${form.preferred_locations.length > 0 ? `(${form.preferred_locations.length}/3)` : '— up to 3'}`}>
                <div style={{ display:'flex', gap:'0.45rem', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch', paddingBottom:4 }}>
                  {UK_CITIES.map(city => {
                    const selected = form.preferred_locations.includes(city);
                    const disabled = !selected && form.preferred_locations.length >= 3;
                    return (
                      <button key={city}
                        className={`loc-pill${selected ? ' on' : ''}`}
                        disabled={disabled}
                        style={{ flexShrink:0 }}
                        onClick={() => toggleLocation(city)}>
                        {city}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label={`Target salary band ${form.target_salary_band.length > 0 ? `(${form.target_salary_band.length}/3)` : '— up to 3'}`}>
                <div style={{ display:'flex', gap:'0.45rem', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch', paddingBottom:4 }}>
                  {SALARY_BANDS.map(band => {
                    const selected = form.target_salary_band.includes(band);
                    const disabled = !selected && form.target_salary_band.length >= 3;
                    return (
                      <button key={band}
                        className={`sal-band${selected ? ' on' : ''}`}
                        disabled={disabled}
                        style={{ flexShrink:0, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                          if (disabled) return;
                          setForm(prev => {
                            const bands = prev.target_salary_band;
                            if (bands.includes(band)) return { ...prev, target_salary_band: bands.filter(b => b !== band) };
                            return { ...prev, target_salary_band: [...bands, band] };
                          });
                          setSaved(false);
                        }}>
                        {band}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Section>

            <div style={{ height: 1, background: 'rgba(240,237,232,0.07)', margin: '0 0 2rem' }} />

            {/* ── SAVE ── */}
            {error && (
              <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 12, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#ff4d00', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {saved && !fromOnboarding && (
              <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 12, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#c8ff00', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✓ Profile saved successfully
              </div>
            )}

            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : fromOnboarding ? 'Save and see my Sponsrr Score →' : 'Save profile'}
            </button>

            {!fromOnboarding && (
              <button onClick={() => navigate('/score')} style={{ background: 'none', border: 'none', color: 'rgba(200,255,0,0.6)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: '0.75rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Recalculate my Sponsrr Score →
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' }}>
            Your data is used only to personalise your Sponsrr experience · Never shared or sold
          </div>
        </div>

        {showSocGuide && (
          <SocGuideModal
            onClose={() => setShowSocGuide(false)}
            onSelect={soc => { handleSocSelect(soc); setShowSocGuide(false); }}
          />
        )}
      </div>
    </Layout>
  );
}