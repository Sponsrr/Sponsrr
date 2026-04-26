import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// ── PLACEHOLDER TESTIMONIALS ──────────────────────────────────────────────────
// Replace with real ones as they come in. Keep them specific and believable.
const TESTIMONIALS = [
  {
    quote: "I had no idea my salary was £4,000 below the threshold. Sponsrr told me in seconds. I renegotiated and got my CoS two weeks later.",
    name: "Amir K.",
    role: "Software Engineer",
    visa: "Graduate Visa → Skilled Worker",
  },
  {
    quote: "As a nurse on a Health & Care visa I didn't know I qualified for a lower threshold. Sponsrr showed me I was already eligible. Huge relief.",
    name: "Priya M.",
    role: "Registered Nurse",
    visa: "Health & Care Visa",
  },
  {
    quote: "I was applying to companies that couldn't even sponsor me. The sponsor directory saved me months of wasted applications.",
    name: "Daniel O.",
    role: "Data Analyst",
    visa: "Student Visa → Skilled Worker",
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [firstName, setFirstName]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [animating, setAnimating]       = useState(false);

  // ── AUTH CHECK + GET NAME ────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // Check if already onboarded — skip welcome if profile exists with job_title
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, job_title')
        .eq('id', user.id)
        .single();

      if (profile?.job_title) {
        // Already onboarded — go straight to dashboard
        navigate('/dashboard');
        return;
      }

      // Get first name from profile or email
      const name = profile?.full_name?.split(' ')[0]
        || user.email?.split('@')[0]
        || '';
      setFirstName(name);
      setLoading(false);
    }
    load();
  }, [navigate]);

  // ── TESTIMONIAL ROTATION ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
        setAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  function handleStart() {
    navigate('/onboarding');
  }

  if (loading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading...</div>
    </div>
  );

  const t = TESTIMONIALS[activeTestimonial];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .w-logo   { animation: fadeUp 0.5s ease forwards; }
        .w-badge  { animation: fadeUp 0.5s 0.1s ease both; }
        .w-title  { animation: fadeUp 0.5s 0.2s ease both; }
        .w-sub    { animation: fadeUp 0.5s 0.3s ease both; }
        .w-cta    { animation: fadeUp 0.5s 0.4s ease both; }
        .w-testi  { animation: fadeUp 0.5s 0.5s ease both; }

        .cta-btn {
          background: #c8ff00;
          color: #080808;
          border: none;
          border-radius: 100px;
          padding: 1rem 2.5rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 0 32px rgba(200,255,0,0.2);
        }
        .cta-btn:hover {
          background: #aee600;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(200,255,0,0.35);
        }

        .testi-card {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .testi-card.out {
          opacity: 0;
          transform: translateY(8px);
        }

        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(240,237,232,0.2);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          padding: 0;
        }
        .dot.on { background: #c8ff00; transform: scale(1.2); }

        .blinking-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #c8ff00;
          animation: pulse 1.5s ease-in-out infinite;
          display: inline-block;
        }

        .time-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: rgba(200,255,0,0.08);
          border: 1px solid rgba(200,255,0,0.2);
          border-radius: 100px;
          padding: 0.35rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #c8ff00;
          letter-spacing: 0.04em;
        }
      `}</style>

      {/* ── NAVBAR (minimal — logo only) ───────────────────────────────── */}
      <nav className="w-logo" style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.04em', color: '#f0ede8' }}>
          Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
        </div>
      </nav>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center' }}>

        {/* Time badge */}
        <div className="w-badge" style={{ marginBottom: '1.75rem' }}>
          <span className="time-chip">
            <span className="blinking-dot" />
            2 minutes to set up
          </span>
        </div>

        {/* Heading */}
        <h1 className="w-title" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 6vw, 3.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: '0 0 1.25rem', maxWidth: 600 }}>
          {firstName
            ? <>Welcome to Sponsrr,<br /><span style={{ color: '#c8ff00' }}>{firstName}.</span></>
            : <>Welcome to<br /><span style={{ color: '#c8ff00' }}>Sponsrr.</span></>
          }
        </h1>

        {/* Subtext */}
        <p className="w-sub" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', color: 'rgba(240,237,232,0.5)', lineHeight: 1.7, maxWidth: 480, margin: '0 0 2.5rem' }}>
          Before we calculate your visa eligibility and Sponsrr Score,
          we need a couple of minutes to understand your situation.
        </p>

        {/* CTA */}
        <div className="w-cta" style={{ marginBottom: '3.5rem' }}>
          <button className="cta-btn" onClick={handleStart}>
            Let's get started
            <span style={{ fontSize: '1.1rem' }}>→</span>
          </button>
          <div style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)' }}>
            No card required · Takes about 2 minutes
          </div>
        </div>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <div className="w-testi" style={{ width: '100%', maxWidth: 480 }}>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
            <span style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.25)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              What our users say
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
          </div>

          {/* Testimonial card */}
          <div className={`testi-card${animating ? ' out' : ''}`}
            style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 18, padding: '1.5rem', textAlign: 'left', minHeight: 140 }}>

            {/* Quote mark */}
            <div style={{ fontSize: '2rem', lineHeight: 1, color: 'rgba(200,255,0,0.25)', fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>"</div>

            <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.7)', lineHeight: 1.65, margin: '0 0 1.1rem' }}>
              {t.quote}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif' }}>{t.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.1rem' }}>{t.role}</div>
              </div>
              <div style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 100, padding: '0.2rem 0.65rem', fontSize: '0.62rem', color: 'rgba(200,255,0,0.7)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {t.visa}
              </div>
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} className={`dot${i === activeTestimonial ? ' on' : ''}`}
                onClick={() => { setAnimating(true); setTimeout(() => { setActiveTestimonial(i); setAnimating(false); }, 300); }} />
            ))}
          </div>
        </div>
      </main>

      {/* ── FOOTER (minimal) ────────────────────────────────────────────── */}
      <footer style={{ padding: '1.25rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' }}>
          Sponsrr · Built for internationals · sponsrr.com
        </div>
      </footer>
    </div>
  );
}