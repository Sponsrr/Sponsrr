import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
// 8 cards — diverse, visa-accurate, fixed card height so rotation never resizes
const TESTIMONIALS = [
  {
    quote: "I had no idea my salary was £4,200 below the Skilled Worker threshold. Sponsrr flagged it in seconds. I renegotiated, got my CoS three weeks later and I'm now working in London.",
    name: "Arjun M.",
    role: "Software Engineer",
    visa: "Graduate → Skilled Worker",
  },
  {
    quote: "As a nurse I assumed the salary threshold applied to me the same as everyone else. Sponsrr showed me the Health & Care route had a lower rate. I was already eligible. Total relief.",
    name: "Chinwe O.",
    role: "Registered Nurse",
    visa: "Student → Health & Care",
  },
  {
    quote: "I was sending CVs to companies that weren't even on the sponsor register. Months wasted. The Sponsrr directory changed everything — I only apply to verified sponsors now.",
    name: "Bartosz K.",
    role: "Data Analyst",
    visa: "Student → Skilled Worker",
  },
  {
    quote: "The new entrant salary rate saved me. I was 24, fresh out of uni, and the standard threshold looked impossible. Sponsrr told me I qualified for the lower rate. Got sponsored within 6 weeks.",
    name: "Fatima A.",
    role: "Junior Accountant",
    visa: "Graduate → Skilled Worker",
  },
  {
    quote: "I didn't know my SOC code determined my minimum salary. Sponsrr matched me to the right code for my role and suddenly three job offers I'd ignored made sense. Accepted one last month.",
    name: "Wei Z.",
    role: "Mechanical Engineer",
    visa: "Graduate → Skilled Worker",
  },
  {
    quote: "My employer wanted to sponsor me but didn't know if my salary was compliant. I ran the Sponsrr checker and sent them the result. HR approved it the same day. Easiest HR conversation I've had.",
    name: "Yemi A.",
    role: "Marketing Manager",
    visa: "Graduate → Skilled Worker",
  },
  {
    quote: "I've been on a Student visa for three years wondering if I'd ever be sponsored. Sponsrr gave me a score of 81 and showed me exactly which sectors were actively hiring. I finally feel like I have a plan.",
    name: "Priya N.",
    role: "UX Designer",
    visa: "Student → Skilled Worker",
  },
  {
    quote: "I came from Bucharest, my English was okay but the UK visa system felt impossible. Sponsrr explained my eligibility clearly, no legal jargon. I have my Skilled Worker visa now. Worth every minute.",
    name: "Andreea C.",
    role: "Civil Engineer",
    visa: "Skilled Worker Visa",
  },
];

export default function Welcome() {
  const navigate = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [activeIdx, setActiveIdx]       = useState(0);
  const [animating, setAnimating]       = useState(false);

  // ── AUTH CHECK + NAME ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, job_title')
        .eq('id', user.id)
        .single();

      // Already onboarded — skip welcome
      if (profile?.job_title) { navigate('/dashboard'); return; }

      setLoading(false);
    }
    load();
  }, [navigate]);

  // ── AUTO-ROTATION (5s) ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActiveIdx(prev => (prev + 1) % TESTIMONIALS.length);
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function goTo(i) {
    setAnimating(true);
    setTimeout(() => { setActiveIdx(i); setAnimating(false); }, 300);
  }

  if (loading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading...</div>
    </div>
  );

  const t = TESTIMONIALS[activeIdx];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }

        .w-logo  { animation: fadeUp 0.5s ease forwards; }
        .w-badge { animation: fadeUp 0.5s 0.1s ease both; }
        .w-title { animation: fadeUp 0.5s 0.2s ease both; }
        .w-sub   { animation: fadeUp 0.5s 0.3s ease both; }
        .w-cta   { animation: fadeUp 0.5s 0.4s ease both; }
        .w-testi { animation: fadeUp 0.5s 0.5s ease both; }

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
          border: none; padding: 0;
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

      {/* ── NAVBAR (logo only) ─────────────────────────────────────────── */}
      <nav className="w-logo" style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.04em', color: '#f0ede8' }}>
          Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
        </div>
      </nav>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center' }}>

        {/* Time badge */}
        <div className="w-badge" style={{ marginBottom: '1.75rem' }}>
          <span className="time-chip">
            <span className="blinking-dot" />
            2 minutes to set up
          </span>
        </div>

        {/* Heading — white / green */}
        <div className="w-title" style={{ marginBottom: '1.25rem' }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 6vw, 3.2rem)',
            letterSpacing: '-0.04em',
            color: '#f0ede8',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Welcome to{' '}
            <span style={{ color: '#c8ff00' }}>Sponsrr</span>
          </h1>
        </div>

        {/* Subtext */}
        <p className="w-sub" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', color: 'rgba(240,237,232,0.5)', lineHeight: 1.7, maxWidth: 480, margin: '0 0 2.5rem' }}>
          Before we calculate your Sponsrr Score and show jobs to you,
          we need a couple of minutes to understand you.
        </p>

        {/* CTA */}
        <div className="w-cta" style={{ marginBottom: '3.5rem' }}>
          <button className="cta-btn" onClick={() => navigate('/onboarding')}>
            Let's get started
            <span style={{ fontSize: '1.1rem' }}>→</span>
          </button>
          <div style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)' }}>
            No card required · Takes about 2 minutes
          </div>
        </div>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <div className="w-testi" style={{ width: '100%', maxWidth: 480 }}>

          {/* Divider label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
            <span style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.25)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              What our users say
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
          </div>

          {/* Card — fixed height so rotation never reflows the page */}
          <div
            className={`testi-card${animating ? ' out' : ''}`}
            style={{
              background: '#111',
              border: '1px solid rgba(240,237,232,0.08)',
              borderRadius: 18,
              padding: '1.5rem',
              textAlign: 'left',
              height: 200,           // ← fixed height, content clips gracefully
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Quote body */}
            <div>
              <div style={{ fontSize: '1.6rem', lineHeight: 1, color: 'rgba(200,255,0,0.25)', fontFamily: 'Georgia, serif', marginBottom: '0.4rem' }}>"</div>
              <p style={{
                fontSize: '0.84rem',
                color: 'rgba(240,237,232,0.7)',
                lineHeight: 1.65,
                margin: 0,
                // 3-line clamp so long quotes never break layout
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {t.quote}
              </p>
            </div>

            {/* Attribution */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
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
              <button key={i} className={`dot${i === activeIdx ? ' on' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' }}>
          © Sponsrr. Made for Internationals.
        </div>
      </footer>
    </div>
  );
}