import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { SOC_DATABASE } from './socData';
import SocGuideModal from './SocGuideModal';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const VISA_OPTIONS = [
  { value: 'graduate',       label: 'Graduate Visa (PSW)' },
  { value: 'student',        label: 'Student Visa (Tier 4)' },
  { value: 'skilled_worker', label: 'Skilled Worker Visa' },
  { value: 'health_care',    label: 'Health & Care Worker Visa' },
  { value: 'no_uk_visa',     label: 'No current UK visa' },
  { value: 'other',          label: 'Other UK visa' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'student', label: 'Student',        sub: 'Still studying' },
  { value: '0-2',     label: '0–2 years',      sub: 'Just starting out' },
  { value: '2-5',     label: '2–5 years',      sub: 'Building momentum' },
  { value: '5-10',    label: '5–10 years',     sub: 'Experienced' },
  { value: '10+',     label: '10+ years',      sub: 'Senior level' },
];

const SALARY_BANDS = [
  'Under £25,000', '£25,000–£30,000', '£30,000–£35,000',
  '£35,000–£40,000', '£40,000–£45,000', '£45,000–£55,000',
  '£55,000–£70,000', '£70,000–£90,000', '£90,000+',
];

const UK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol',
  'Edinburgh', 'Glasgow', 'Liverpool', 'Sheffield', 'Newcastle',
  'Nottingham', 'Cardiff', 'Leicester', 'Southampton', 'Oxford', 'Cambridge',
];

// Testimonial shown between step 3 → 4
const INTERSTITIAL_TESTIMONIAL = {
  quote: "I thought my Student visa meant I had no chance. Sponsrr showed me I qualified as a new entrant with a lower salary threshold. I had three interviews within a month.",
  name: "Kofi A.",
  role: "Graduate Civil Engineer",
  visa: "Student → Skilled Worker",
};

// Compute new entrant status live
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

// ── STYLES ────────────────────────────────────────────────────────────────────
const inputStyle = {
  background: 'rgba(240,237,232,0.06)',
  border: '1px solid rgba(240,237,232,0.12)',
  borderRadius: 14,
  padding: '1rem 1.1rem',
  color: '#f0ede8',
  fontSize: '1rem',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: '2.5rem',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(240,237,232,0.4)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep]           = useState(1); // 1–4
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [animDir, setAnimDir]     = useState('forward'); // forward | back
  const [animating, setAnimating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showSocGuide, setShowSocGuide] = useState(false);
  const [userId, setUserId]       = useState(null);

  // SOC search
  const [jobInput, setJobInput]   = useState('');
  const [socMatches, setSocMatches] = useState([]);
  const [selectedSoc, setSelectedSoc] = useState(null);
  const jobRef = useRef(null);

  // Form fields
  const [form, setForm] = useState({
    full_name:     '',
    experience:    '',
    current_visa:  '',
    age:           '',
    salary_bands:  [],   // up to 3
    locations:     [],   // up to 3
  });

  // ── AUTH CHECK ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);

      // If already onboarded, skip
      const { data: profile } = await supabase
        .from('profiles')
        .select('job_title')
        .eq('id', user.id)
        .single();
      if (profile?.job_title) { navigate('/dashboard'); return; }
    }
    check();
  }, [navigate]);

  // ── SOC SEARCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobInput.trim() || jobInput.length < 2) { setSocMatches([]); return; }
    const q = jobInput.toLowerCase();
    const matches = SOC_DATABASE.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.related_titles || []).some(t => t.toLowerCase().includes(q))
    ).slice(0, 5);
    setSocMatches(matches);
  }, [jobInput]);

  // ── DERIVED ────────────────────────────────────────────────────────────────
  const isNewEntrant = computeNewEntrant({
    age: form.age,
    current_visa: form.current_visa,
    grad_year: null,
    uk_university: false,
  });

  // ── NAVIGATION ─────────────────────────────────────────────────────────────
  function goForward() {
    // Step 3 → interstitial → step 4
    if (step === 3) {
      setShowInterstitial(true);
      return;
    }
    transition(step + 1, 'forward');
  }

  function goBack() {
    if (step === 1) return;
    transition(step - 1, 'back');
  }

  function transition(nextStep, dir) {
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 220);
  }

  function continueFromInterstitial() {
    setShowInterstitial(false);
    transition(4, 'forward');
  }

  // ── STEP VALIDATION ────────────────────────────────────────────────────────
  function canProceed() {
    if (step === 1) return form.full_name.trim().length > 0 && (selectedSoc || jobInput.trim().length > 0);
    if (step === 2) return form.current_visa !== '' && form.age !== '';
    if (step === 3) return form.experience !== '';
    if (step === 4) return form.salary_bands.length > 0;
    return true;
  }

  // ── SAVE + FINISH ──────────────────────────────────────────────────────────
  async function handleFinish() {
    if (!canProceed()) return;
    setSaving(true);
    setError('');

    const isNE = computeNewEntrant({
      age: form.age,
      current_visa: form.current_visa,
      grad_year: null,
      uk_university: false,
    });

    const { error: saveError } = await supabase.from('profiles').upsert({
      id:                  userId,
      full_name:           form.full_name.trim(),
      job_title:           selectedSoc ? selectedSoc.title : jobInput.trim(),
      soc_code:            selectedSoc ? selectedSoc.code : null,
      sector:              selectedSoc ? selectedSoc.sector : null,
      experience:          form.experience || null,
      current_visa:        form.current_visa || null,
      age:                 form.age ? parseInt(form.age) : null,
      preferred_locations: form.locations,
      target_salary_band:  form.salary_bands.length > 0 ? form.salary_bands : null,
      is_new_entrant:      isNE,
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'id' });

    setSaving(false);
    if (saveError) { setError('Something went wrong. Please try again.'); return; }
    navigate('/score');
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleSalary(band) {
    setForm(prev => {
      const bands = prev.salary_bands;
      if (bands.includes(band)) return { ...prev, salary_bands: bands.filter(b => b !== band) };
      if (bands.length >= 3) return prev;
      return { ...prev, salary_bands: [...bands, band] };
    });
  }

  function toggleLocation(city) {
    setForm(prev => {
      const locs = prev.locations;
      if (locs.includes(city)) return { ...prev, locations: locs.filter(l => l !== city) };
      if (locs.length >= 3) return prev;
      return { ...prev, locations: [...locs, city] };
    });
  }

  // ── PROGRESS ───────────────────────────────────────────────────────────────
  const progressPct = showInterstitial ? 87 : ((step - 1) / 4) * 100;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes slideInForward {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInBack {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .step-enter-forward { animation: slideInForward 0.25s ease forwards; }
        .step-enter-back    { animation: slideInBack    0.25s ease forwards; }
        .step-exit          { opacity: 0; }

        .ob-input:focus { border-color: rgba(200,255,0,0.4) !important; }
        .ob-input::placeholder { color: rgba(240,237,232,0.25); }
        .ob-select:focus { border-color: rgba(200,255,0,0.4) !important; }

        .exp-pill {
          display: flex; flex-direction: column; align-items: flex-start;
          padding: 0.85rem 1.1rem; border-radius: 14px;
          border: 1px solid rgba(240,237,232,0.1);
          background: rgba(240,237,232,0.04);
          cursor: pointer; transition: all 0.15s; width: 100%;
          font-family: 'DM Sans', sans-serif; text-align: left;
        }
        .exp-pill:hover { border-color: rgba(240,237,232,0.25); background: rgba(240,237,232,0.07); }
        .exp-pill.on { background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.35); }

        .visa-pill {
          display: flex; align-items: center;
          padding: 0.85rem 1.1rem; border-radius: 14px;
          border: 1px solid rgba(240,237,232,0.1);
          background: rgba(240,237,232,0.04);
          cursor: pointer; transition: all 0.15s; width: 100%;
          font-family: 'DM Sans', sans-serif; text-align: left;
          font-size: 0.9rem; color: rgba(240,237,232,0.75);
        }
        .visa-pill:hover { border-color: rgba(240,237,232,0.25); background: rgba(240,237,232,0.07); color: #f0ede8; }
        .visa-pill.on { background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.35); color: #f0ede8; }

        .loc-chip {
          padding: 0.5rem 1rem; border-radius: 100px;
          border: 1px solid rgba(240,237,232,0.1);
          background: rgba(240,237,232,0.04);
          color: rgba(240,237,232,0.55); font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .loc-chip:hover { border-color: rgba(240,237,232,0.25); color: rgba(240,237,232,0.85); }
        .loc-chip.on { background: rgba(200,255,0,0.09); border-color: rgba(200,255,0,0.35); color: #c8ff00; }
        .loc-chip:disabled { opacity: 0.28; cursor: not-allowed; }

        .sal-chip {
          padding: 0.5rem 0.9rem; border-radius: 10px;
          border: 1px solid rgba(240,237,232,0.1);
          background: rgba(240,237,232,0.04);
          color: rgba(240,237,232,0.55); font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .sal-chip:hover { border-color: rgba(240,237,232,0.25); color: rgba(240,237,232,0.85); }
        .sal-chip.on { background: rgba(200,255,0,0.09); border-color: rgba(200,255,0,0.35); color: #c8ff00; }
        .sal-chip:disabled { opacity: 0.28; cursor: not-allowed; }

        .soc-match {
          padding: 0.65rem 0.9rem; cursor: pointer;
          border-bottom: 1px solid rgba(240,237,232,0.06);
          transition: background 0.12s;
        }
        .soc-match:last-child { border-bottom: none; }
        .soc-match:hover { background: rgba(200,255,0,0.06); }

        .next-btn {
          background: #c8ff00; color: #080808;
          border: none; border-radius: 100px;
          padding: 1rem 2.5rem;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: all 0.2s ease;
          display: inline-flex; align-items: center; gap: 0.5rem;
          box-shadow: 0 0 28px rgba(200,255,0,0.18);
        }
        .next-btn:hover:not(:disabled) {
          background: #aee600; transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(200,255,0,0.3);
        }
        .next-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

        .back-btn {
          background: none; border: none;
          color: rgba(240,237,232,0.3); font-size: 0.82rem;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: color 0.15s; padding: 0;
        }
        .back-btn:hover { color: rgba(240,237,232,0.65); }

        .soc-link-btn {
          background: none; border: none; padding: 0;
          color: rgba(200,255,0,0.65); font-size: 0.75rem; font-weight: 600;
          cursor: pointer; font-family: inherit;
          text-decoration: underline; text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .soc-link-btn:hover { color: #c8ff00; }

        div::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── TOP BAR: logo + progress ──────────────────────────────────────── */}
      <div style={{ padding: '1.25rem 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Logo */}
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.04em', color: '#f0ede8' }}>
          Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'relative', height: 3, background: 'rgba(240,237,232,0.08)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progressPct}%`,
            background: '#c8ff00',
            borderRadius: 100,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Step label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Geist Mono, monospace' }}>
            {showInterstitial ? 'Almost there' : `Step ${step} of 4`}
          </span>
          {step > 1 && !showInterstitial && (
            <button className="back-btn" onClick={goBack}>← Back</button>
          )}
        </div>
      </div>

      {/* ── INTERSTITIAL ─────────────────────────────────────────────────── */}
      {showInterstitial && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1.5rem', animation: 'fadeUp 0.3s ease forwards' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>

            {/* Label */}
            <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Geist Mono, monospace', marginBottom: '1.5rem' }}>
              While you're here
            </div>

            {/* Testimonial card */}
            <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 20, padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1, color: 'rgba(200,255,0,0.2)', fontFamily: 'Georgia, serif', marginBottom: '0.6rem' }}>"</div>
              <p style={{ fontSize: '0.95rem', color: 'rgba(240,237,232,0.75)', lineHeight: 1.7, margin: '0 0 1.25rem' }}>
                {INTERSTITIAL_TESTIMONIAL.quote}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif' }}>{INTERSTITIAL_TESTIMONIAL.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.15rem' }}>{INTERSTITIAL_TESTIMONIAL.role}</div>
                </div>
                <div style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 100, padding: '0.25rem 0.7rem', fontSize: '0.65rem', color: 'rgba(200,255,0,0.7)', fontWeight: 700 }}>
                  {INTERSTITIAL_TESTIMONIAL.visa}
                </div>
              </div>
            </div>

            {/* One last step hint */}
            <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.6, marginBottom: '2rem', textAlign: 'center' }}>
              One last step — tell us your salary target and preferred locations so we can match you to the right roles.
            </p>

            <button className="next-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={continueFromInterstitial}>
              Continue <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEPS ────────────────────────────────────────────────────────── */}
      {!showInterstitial && (
        <div
          key={step}
          className={animating ? 'step-exit' : animDir === 'forward' ? 'step-enter-forward' : 'step-enter-back'}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1.5rem 2rem', overflowY: 'auto' }}
        >
          <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>

            {/* ── STEP 1: Who are you? ─────────────────────────────────── */}
            {step === 1 && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
                  What's your<br /><span style={{ color: '#c8ff00' }}>name and role?</span>
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', margin: '0 0 2rem', lineHeight: 1.6 }}>
                  We'll use this to personalise your experience.
                </p>

                {/* Full name */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,237,232,0.45)', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Full name
                  </label>
                  <input
                    className="ob-input"
                    style={inputStyle}
                    type="text"
                    placeholder="e.g. John Smith"
                    value={form.full_name}
                    onChange={e => update('full_name', e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Job title / SOC search */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,237,232,0.45)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Job title
                    </label>
                    <button className="soc-link-btn" onClick={() => setShowSocGuide(true)}>
                      What's a SOC code? →
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={jobRef}
                      className="ob-input"
                      style={inputStyle}
                      type="text"
                      placeholder="e.g. Software Engineer, Staff Nurse..."
                      value={jobInput}
                      onChange={e => { setJobInput(e.target.value); setSelectedSoc(null); }}
                    />

                    {/* SOC dropdown matches */}
                    {socMatches.length > 0 && !selectedSoc && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#1a1a1a', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 14, zIndex: 50, overflow: 'hidden' }}>
                        {socMatches.map(soc => (
                          <div key={soc.code} className="soc-match" onClick={() => { setSelectedSoc(soc); setJobInput(soc.title); setSocMatches([]); }}>
                            <div style={{ fontSize: '0.85rem', color: '#f0ede8', fontWeight: 600 }}>{soc.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.15rem' }}>
                              SOC {soc.code} · {soc.sector}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected SOC confirmation */}
                  {selectedSoc && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.9rem', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(200,255,0,0.8)', fontWeight: 600 }}>
                        ✓ SOC {selectedSoc.code} — {selectedSoc.sector}
                      </span>
                      <button onClick={() => { setSelectedSoc(null); setJobInput(''); }} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.3)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 2: Visa situation ───────────────────────────────── */}
            {step === 2 && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
                  What's your<br /><span style={{ color: '#c8ff00' }}>visa situation?</span>
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', margin: '0 0 2rem', lineHeight: 1.6 }}>
                  This determines your salary threshold and new entrant eligibility.
                </p>

                {/* Visa pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {VISA_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`visa-pill${form.current_visa === opt.value ? ' on' : ''}`}
                      onClick={() => update('current_visa', opt.value)}
                    >
                      <span style={{ marginRight: 'auto' }}>{opt.label}</span>
                      {form.current_visa === opt.value && (
                        <span style={{ color: '#c8ff00', fontSize: '1rem' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Age input */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,237,232,0.45)', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Your age
                  </label>
                  <input
                    className="ob-input"
                    style={{ ...inputStyle, maxWidth: 160 }}
                    type="number"
                    placeholder="e.g. 24"
                    value={form.age}
                    onChange={e => update('age', e.target.value)}
                    min={16} max={70}
                  />
                  {form.age && !isNaN(parseInt(form.age)) && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: parseInt(form.age) < 26 ? 'rgba(200,255,0,0.75)' : 'rgba(240,237,232,0.35)' }}>
                      {parseInt(form.age) < 26 ? '✓ Under 26 — new entrant eligible' : 'Over 26 — visa status determines eligibility'}
                    </div>
                  )}
                </div>

                {/* New entrant live indicator */}
                {(form.current_visa || form.age) && (
                  <div style={{ marginTop: '1.25rem', padding: '0.9rem 1rem', background: isNewEntrant ? 'rgba(200,255,0,0.05)' : 'rgba(240,237,232,0.03)', border: `1px solid ${isNewEntrant ? 'rgba(200,255,0,0.2)' : 'rgba(240,237,232,0.08)'}`, borderRadius: 12 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isNewEntrant ? '#c8ff00' : 'rgba(240,237,232,0.4)', marginBottom: '0.2rem' }}>
                      {isNewEntrant ? '✓ New Entrant — Eligible' : '◎ Standard Threshold Applies'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.55 }}>
                      {isNewEntrant
                        ? 'Lower salary threshold of £33,400 or 70% of going rate — whichever is higher.'
                        : 'Standard threshold of £41,700 or the full going rate for your SOC code.'}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 3: Experience ───────────────────────────────────── */}
            {step === 3 && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
                  How much<br /><span style={{ color: '#c8ff00' }}>experience do you have?</span>
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', margin: '0 0 2rem', lineHeight: 1.6 }}>
                  In your field — not just UK experience.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`exp-pill${form.experience === opt.value ? ' on' : ''}`}
                      onClick={() => update('experience', opt.value)}
                    >
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: form.experience === opt.value ? '#c8ff00' : '#f0ede8' }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.1rem' }}>
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── STEP 4: Salary + Locations ───────────────────────────── */}
            {step === 4 && (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
                  Where and<br /><span style={{ color: '#c8ff00' }}>what are you targeting?</span>
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', margin: '0 0 2rem', lineHeight: 1.6 }}>
                  Helps us match you to the right sponsored roles.
                </p>

                {/* Salary bands */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,237,232,0.45)', display: 'block', marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Target salary {form.salary_bands.length > 0 ? `(${form.salary_bands.length}/3 selected)` : '— pick up to 3'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {SALARY_BANDS.map(band => {
                      const on = form.salary_bands.includes(band);
                      const disabled = !on && form.salary_bands.length >= 3;
                      return (
                        <button
                          key={band}
                          className={`sal-chip${on ? ' on' : ''}`}
                          disabled={disabled}
                          style={{ opacity: disabled ? 0.28 : 1 }}
                          onClick={() => toggleSalary(band)}
                        >
                          {band}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Locations */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(240,237,232,0.45)', display: 'block', marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Preferred locations {form.locations.length > 0 ? `(${form.locations.length}/3)` : '— up to 3, optional'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {UK_CITIES.map(city => {
                      const on = form.locations.includes(city);
                      const disabled = !on && form.locations.length >= 3;
                      return (
                        <button
                          key={city}
                          className={`loc-chip${on ? ' on' : ''}`}
                          disabled={disabled}
                          onClick={() => toggleLocation(city)}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── ERROR ────────────────────────────────────────────────── */}
            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 12, fontSize: '0.8rem', color: '#ff4d00' }}>
                {error}
              </div>
            )}

            {/* ── CTA ──────────────────────────────────────────────────── */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {step < 4 ? (
                <button className="next-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={goForward} disabled={!canProceed()}>
                  Continue <span style={{ fontSize: '1.1rem' }}>→</span>
                </button>
              ) : (
                <button className="next-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={handleFinish} disabled={!canProceed() || saving}>
                  {saving ? 'Calculating...' : 'See my Sponsrr Score →'}
                </button>
              )}

              {/* Skip for step 4 locations (salary is required, locations optional) */}
              {step === 4 && !saving && (
                <button onClick={handleFinish} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.28)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                  Skip locations and calculate anyway
                </button>
              )}
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '2rem' }}>
              {[1,2,3,4].map(s => (
                <div key={s} style={{ width: s === step ? 18 : 6, height: 6, borderRadius: 100, background: s === step ? '#c8ff00' : s < step ? 'rgba(200,255,0,0.3)' : 'rgba(240,237,232,0.12)', transition: 'all 0.3s ease' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.15)' }}>
          © Sponsrr. Made for Internationals.
        </div>
      </div>

      {/* ── SOC GUIDE MODAL ──────────────────────────────────────────────── */}
      {showSocGuide && (
        <SocGuideModal
          onClose={() => setShowSocGuide(false)}
          onSelect={soc => {
            setSelectedSoc(soc);
            setJobInput(soc.title);
            setSocMatches([]);
            setShowSocGuide(false);
          }}
        />
      )}
    </div>
  );
}