import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';

// ── DAILY COUNTER ─────────────────────────────────────────────────────────────
function useDailyCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem('cv_counter') || '{}');

    function dateSeed(str) {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return Math.abs(h);
    }

    let base, current;

    if (stored.date !== today) {
      const seed = dateSeed(today);
      base = 847 + (seed % 396);
      current = base;
      localStorage.setItem('cv_counter', JSON.stringify({ date: today, base, lastUpdate: Date.now(), current }));
    } else {
      base = stored.base;
      const secondsElapsed = Math.floor((Date.now() - stored.lastUpdate) / 1000);
      const increments = Math.floor(secondsElapsed / 45);
      current = stored.current;
      for (let i = 0; i < increments; i++) current += Math.floor(Math.random() * 3) + 1;
      localStorage.setItem('cv_counter', JSON.stringify({ date: today, base, lastUpdate: Date.now(), current }));
    }

    setCount(current);

    const timerRef = { current: null };
    function scheduleNext() {
      const delay = (30 + Math.floor(Math.random() * 60)) * 1000;
      timerRef.current = setTimeout(() => {
        const inc = Math.floor(Math.random() * 3) + 1;
        setCount(prev => {
          const next = prev + inc;
          const s = JSON.parse(localStorage.getItem('cv_counter') || '{}');
          localStorage.setItem('cv_counter', JSON.stringify({ ...s, current: next, lastUpdate: Date.now() }));
          return next;
        });
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, []);

  return count;
}

// ── ANIMATED NUMBER ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const prev = React.useRef(0);

  useEffect(() => {
    if (!value) return;
    const start = prev.current;
    const end = value;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = end;
    }
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

// ── CV PAGE SVG GRAPHIC ───────────────────────────────────────────────────────
function CVGraphic() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 300, H = 380;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const PAGES = [
      { accent: 'rgba(200,255,0,', job: 'Software Engineer', industry: 'FAANG Optimised' },
      { accent: 'rgba(255,200,0,', job: 'Brand Consultant', industry: 'MBB Optimised' },
      { accent: 'rgba(200,255,0,', job: 'Business Analyst', industry: 'Retail Optimised' },
      { accent: 'rgba(100,220,255,', job: 'Junior Doctor', industry: 'Healthcare Ready' },
      { accent: 'rgba(200,255,0,', job: 'Data Analyst', industry: 'FAANG Optimised' },
      { accent: 'rgba(180,120,255,', job: 'UX Designer', industry: 'MBB Optimised' },
    ];

    const GREEN_POOL = ['ATS Optimised', 'Visa Ready', 'Sponsor Ready', 'Interview Ready', 'UK Formatted'];
    const DARK_POOL = ['FAANG Optimised', 'MBB Optimised', 'Retail Optimised', 'Healthcare Ready'];
    const PAGE_W = 160, PAGE_H = 210, BASE_X = 55, BASE_Y = 65;
    const CONTENT_TOP = 50, CONTENT_BOT = PAGE_H - 15;

    function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    function pickPills() {
      const greens = shuffle(GREEN_POOL).slice(0, 2);
      const dark = shuffle(DARK_POOL)[0];
      return [{ label: greens[0], green: true }, { label: greens[1], green: true }, { label: dark, green: false }];
    }

    function generateBadgePositions(pills) {
      const zoneH = (CONTENT_BOT - CONTENT_TOP) / 3;
      const zoneOrder = shuffle([0, 1, 2]);
      const sides = ['right', 'left', 'right'];
      return pills.map((p, i) => {
        const zone = zoneOrder[i];
        const yMin = BASE_Y + CONTENT_TOP + zone * zoneH + 8;
        const yMax = BASE_Y + CONTENT_TOP + (zone + 1) * zoneH - 8;
        const y = yMin + Math.random() * (yMax - yMin);
        const x = sides[i] === 'right' ? BASE_X + PAGE_W : BASE_X;
        return { ...p, x, y, alpha: 0 };
      });
    }

    let currentPills = pickPills();
    let badges = generateBadgePositions(currentPills);
    let badgeTargets = badges.map(b => ({ x: b.x, y: b.y }));
    let pageIdx = 0, frame = 0, phase = 'scan';
    const SCAN_DUR = 140, FLIP_DUR = 90;

    function drawBlob() {
      const grd = ctx.createRadialGradient(135, 250, 5, 135, 250, 130);
      grd.addColorStop(0, 'rgba(200,255,0,0.25)');
      grd.addColorStop(1, 'rgba(200,255,0,0)');
      ctx.beginPath();
      ctx.ellipse(135, 255, 175, 65, Math.PI * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
    }

    function drawPage(x, y, w, h, pg, alpha, borderA) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10);
      ctx.fillStyle = '#111'; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = `rgba(200,255,0,${borderA})`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x, y, w, 42);
      ctx.beginPath(); ctx.arc(x + 22, y + 21, 12, 0, Math.PI * 2);
      ctx.fillStyle = `${pg.accent}0.15)`; ctx.fill();
      ctx.strokeStyle = `${pg.accent}0.4)`; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 22, y + 18, 5, 0, Math.PI * 2);
      ctx.fillStyle = `${pg.accent}0.5)`; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 22, y + 26, 7, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${pg.accent}0.3)`; ctx.fill();
      ctx.fillStyle = `${pg.accent}0.75)`; ctx.font = '700 9px DM Sans,sans-serif';
      ctx.fillText('Your Name', x + 38, y + 18);
      ctx.fillStyle = `${pg.accent}0.38)`; ctx.font = '400 7px DM Sans,sans-serif';
      ctx.fillText(pg.job, x + 38, y + 29);
      const rows = [
        [x+12,y+52,36,4,'rgba(200,255,0,0.45)',2],[x+12,y+61,w-24,2.5,'rgba(240,237,232,0.18)',1.25],
        [x+12,y+67,w-34,2.5,'rgba(240,237,232,0.13)',1.25],[x+12,y+73,w-28,2.5,'rgba(240,237,232,0.1)',1.25],
        [x+12,y+83,32,3.5,'rgba(200,255,0,0.38)',1.75],[x+12,y+91,w-22,2.5,'rgba(240,237,232,0.14)',1.25],
        [x+12,y+97,w-38,2.5,'rgba(240,237,232,0.1)',1.25],[x+12,y+103,w-30,2.5,'rgba(240,237,232,0.09)',1.25],
        [x+12,y+113,30,3.5,'rgba(200,255,0,0.32)',1.75],[x+12,y+121,w-26,2.5,'rgba(240,237,232,0.11)',1.25],
        [x+12,y+127,w-44,2.5,'rgba(240,237,232,0.08)',1.25],
      ];
      rows.forEach(([rx,ry,rw,rh,rc,rr]) => { ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,rr); ctx.fillStyle=rc; ctx.fill(); });
      [[x+12,y+141,30],[x+46,y+141,24],[x+74,y+141,28]].forEach(([px,py,pw],i) => {
        ctx.beginPath(); ctx.roundRect(px,py,pw,10,5);
        ctx.strokeStyle=`rgba(200,255,0,${0.28-i*0.06})`; ctx.lineWidth=0.8; ctx.stroke();
        ctx.fillStyle=`rgba(200,255,0,${0.06-i*0.01})`; ctx.fill();
      });
      ctx.restore();
    }

    function drawBeam(x, y, w, h, scanY, beamA) {
      if (beamA <= 0) return;
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
      const grd = ctx.createLinearGradient(x, scanY - 10, x, scanY + 10);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.5, `rgba(200,255,0,${beamA})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.fillRect(x, scanY - 10, w, 20);
      ctx.fillStyle = `rgba(200,255,0,${beamA * 0.1})`; ctx.fillRect(x, scanY - 22, w, 44);
      ctx.restore();
    }

    function drawBadge(b, alpha) {
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.font = '600 8px DM Sans,sans-serif';
      const tw = ctx.measureText(b.label).width;
      const bw = tw + 16, bh = 17;
      const bx = b.x - bw / 2, by = b.y - bh / 2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8);
      if (b.green) { ctx.fillStyle = 'rgba(200,255,0,0.92)'; ctx.fill(); ctx.fillStyle = '#080808'; }
      else { ctx.fillStyle = 'rgba(12,12,12,0.95)'; ctx.fill(); ctx.strokeStyle = 'rgba(200,255,0,0.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#c8ff00'; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y);
      ctx.restore();
    }

    function lerpBadges(t) { badges.forEach((b, i) => { b.x += (badgeTargets[i].x - b.x) * t; b.y += (badgeTargets[i].y - b.y) * t; }); }

    let rafId;
    function tick() {
      ctx.clearRect(0, 0, W, H);
      drawBlob();
      [{ dx: 16, dy: 16, a: 0.28, ba: 0.07 }, { dx: 8, dy: 8, a: 0.48, ba: 0.14 }].forEach((off, i) => {
        drawPage(BASE_X + off.dx, BASE_Y + off.dy, PAGE_W, PAGE_H, PAGES[(pageIdx + 2 - i) % PAGES.length], off.a, off.ba);
      });

      if (phase === 'scan') {
        const total = SCAN_DUR * 2 + 20;
        let scanY, beamA;
        if (frame < SCAN_DUR) { const t = frame / SCAN_DUR; scanY = BASE_Y + t * PAGE_H; beamA = (t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1) * 0.65; }
        else if (frame < SCAN_DUR + 10) { scanY = BASE_Y + PAGE_H; beamA = 0; }
        else if (frame < SCAN_DUR * 2 + 10) { const t = (frame - SCAN_DUR - 10) / SCAN_DUR; scanY = BASE_Y + PAGE_H - t * PAGE_H; beamA = (t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1) * 0.45; }
        else { scanY = BASE_Y; beamA = 0; }
        drawPage(BASE_X, BASE_Y, PAGE_W, PAGE_H, PAGES[pageIdx], 1, 0.5);
        drawBeam(BASE_X, BASE_Y, PAGE_W, PAGE_H, scanY, beamA);
        const ba = Math.min(1, Math.max(0, (frame - 35) / 25));
        lerpBadges(0.025);
        badges.forEach(b => drawBadge(b, ba));
        frame++;
        if (frame > total + 40) { phase = 'flip'; frame = 0; }

      } else if (phase === 'flip') {
        const t = frame / FLIP_DUR;
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        drawPage(BASE_X, BASE_Y - ease * 35, PAGE_W, PAGE_H, PAGES[pageIdx], Math.max(0, 1 - t * 2.2), 0.5 * Math.max(0, 1 - t * 2.2));
        const nextA = Math.min(1, Math.max(0, (t - 0.25) / 0.75));
        drawPage(BASE_X, BASE_Y + (1 - ease) * 25, PAGE_W, PAGE_H, PAGES[(pageIdx + 1) % PAGES.length], nextA, 0.5 * nextA);
        const ba = Math.max(0, 1 - t * 3);
        lerpBadges(0.06);
        badges.forEach(b => drawBadge(b, ba));
        frame++;
        if (frame >= FLIP_DUR) {
          pageIdx = (pageIdx + 1) % PAGES.length;
          currentPills = pickPills();
          const newPos = generateBadgePositions(currentPills);
          badges = newPos;
          badgeTargets = newPos.map(b => ({ x: b.x, y: b.y }));
          phase = 'scan'; frame = 0;
        }
      }
      rafId = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I rebuilt my CV on Sponsrr targeting FAANG roles. The AI rewrote every bullet point to be metric-heavy and achievement-first. Three callbacks in the first week. Accepted an offer at a top five tech company.",
    name: "Arjun M.",
    role: "Software Engineer",
    outcome: "Landed FAANG role ✓",
  },
  {
    quote: "My old CV was full of 'responsible for' and 'passionate about'. The Sponsrr version cut all of it. Sharp, human, no filler. Got called by a luxury fashion brand I had already written off as too competitive.",
    name: "Priya V.",
    role: "Brand Consultant",
    outcome: "Luxury brand offer ✓",
  },
  {
    quote: "I had never heard of ATS before. Sponsrr explained it and rebuilt my CV to pass it. Of five companies I applied to, all five came back. That had never happened before.",
    name: "Fatima A.",
    role: "Marketing Manager",
    outcome: "5 from 5 ATS passes ✓",
  },
  {
    quote: "The healthcare template understood clinical language and NHS formatting. I did not have to explain anything. Uploaded my experience, got a CV that looked like an NHS HR team had written it.",
    name: "Raza A.",
    role: "Junior Doctor",
    outcome: "NHS Trust offer ✓",
  },
  {
    quote: "I had been on a Graduate visa for 14 months with no offers. New CV, same experience. The difference was the writing. Got two sponsored offers within a month.",
    name: "Ji-ho L.",
    role: "Data Analyst",
    outcome: "Sponsored offer secured ✓",
  },
  {
    quote: "The MBB template knew exactly what McKinsey screeners look for. Problem, action, outcome on every line. Numbers everywhere. Got my first consulting interview in three years of trying.",
    name: "Sofia C.",
    role: "Business Analyst",
    outcome: "Big 4 interview secured ✓",
  },
];

// ── STEP CARD ─────────────────────────────────────────────────────────────────
function StepCard({ number, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.88rem', color: '#c8ff00', flexShrink: 0 }}>
        {number}
      </div>
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '0.3rem' }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── INDUSTRY CARD ─────────────────────────────────────────────────────────────
function IndustryCard({ icon, title, desc, accent }) {
  return (
    <div
      style={{ background: '#111', border: `1px solid ${accent}22`, borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${accent}22`; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ fontSize: '1.4rem' }}>{icon}</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#f0ede8' }}>{title}</div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.6, flex: 1 }}>{desc}</div>
      <div>
        <span style={{ background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 100, padding: '0.18rem 0.65rem', fontSize: '0.6rem', fontWeight: 700, color: accent }}>Optimised template</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function CVLanding() {
  const navigate = useNavigate();
  const cvCount = useDailyCounter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Auto-rotate testimonials every 5s
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

  const t = TESTIMONIALS[activeIdx];

  const industries = [
    { icon: '💻', title: 'FAANG & Big Tech', desc: 'Metric-heavy bullet points. Quantified impact on every line. Built for Google, Meta, Amazon screeners.', accent: '#c8ff00' },
    { icon: '📊', title: 'Consulting & MBB', desc: 'Problem-action-result format. Executive structure. Tailored for McKinsey, BCG, Deloitte and Big Four.', accent: '#c8ff00' },
    { icon: '👗', title: 'Fashion & Retail', desc: 'Brand-aware language. Visual merchandising vocabulary. Built for ASOS, Burberry, Net-a-Porter.', accent: '#ffc800' },
    { icon: '🏥', title: 'Healthcare & Medical', desc: 'Clinical terminology. NMC/GMC compliant language. Structured for NHS and private healthcare.', accent: '#ffc800' },
    { icon: '⚖️', title: 'Legal & Finance', desc: 'Formal register. Jurisdiction-aware language. Structured for UK law firms and financial institutions.', accent: '#c8ff00' },
    { icon: '✦', title: 'General & Other', desc: 'Clean, adaptable format that works across any industry. ATS-safe, sharp, and human.', accent: 'rgba(240,237,232,0.4)' },
  ];

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />
        <style>{`
          *, *::before, *::after { box-sizing:border-box; }
          @keyframes fu  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          .fu  { animation:fu 0.6s ease forwards; }
          .fu2 { animation:fu 0.6s 0.15s ease both; }
          .fu3 { animation:fu 0.6s 0.3s ease both; }
          .fu4 { animation:fu 0.6s 0.45s ease both; }
          .float { animation:float 4s ease-in-out infinite; }
          .primary-btn:hover   { background:#aee600!important; transform:translateY(-2px)!important; box-shadow:0 8px 24px rgba(200,255,0,0.3)!important; }
          .secondary-btn:hover { background:rgba(240,237,232,0.08)!important; border-color:rgba(240,237,232,0.5)!important; transform:translateY(-2px)!important; }
          .industry-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
          .testi-card { transition:opacity 0.3s ease,transform 0.3s ease; }
          .testi-card.out { opacity:0; transform:translateY(8px); }
          .dot { width:6px;height:6px;border-radius:50%;background:rgba(240,237,232,0.2);cursor:pointer;transition:all 0.2s;border:none;padding:0; }
          .dot.on { background:#c8ff00;transform:scale(1.2); }
          .blinking-dot { width:7px;height:7px;border-radius:50%;background:#c8ff00;animation:pulse 1.5s ease-in-out infinite;display:inline-block; }
          @media(max-width:900px){ .industry-grid{grid-template-columns:repeat(2,1fr)!important;} }
          @media(max-width:580px){ .industry-grid{grid-template-columns:1fr!important;} .hero-flex{flex-direction:column!important;} .stats-grid{grid-template-columns:1fr 1fr!important;} }
          .ticker-track { display:flex; overflow:hidden; }
  .ticker-inner { display:flex; align-items:center; animation:ticker 40s linear infinite; }
  @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-100%)} }
  .ticker-track:hover .ticker-inner { animation-play-state:paused; }
        `}</style>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>

          {/* ── HERO ── */}
          <section style={{ paddingTop: '7rem', paddingBottom: '5rem' }}>
            <div className="hero-flex" style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>

              {/* Left */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
                  ✦ Flagship AI CV Builder
                </div>
                <h1 className="fu2" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2.2rem,5vw,3.6rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.05, marginBottom: '1.25rem' }}>
                  Sounds human.<br /><span style={{ color: '#c8ff00' }}>Written by AI.</span>
                </h1>
                <p className="fu3" style={{ fontSize: '1rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.75, marginBottom: '2rem', maxWidth: 480 }}>
                  Your hiring manager won't know the difference — and neither will you. ATS-ready, visa-aware, industry-specific. No em dashes. No "I am passionate about".
                </p>
                <div className="fu4" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="primary-btn" onClick={() => navigate('/cv-builder')}
                    style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.9rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Build my CV →
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/cv-builder')}
                    style={{ background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.15)', borderRadius: 100, padding: '0.9rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Enhance existing CV
                  </button>
                </div>
              </div>

              {/* Right — floating SVG */}
              <div className="float" style={{ flexShrink: 0, width: 280 }}>
                <CVGraphic />
              </div>
            </div>
          </section>

          {/* ── STATS ── */}
          {/* ── STATS ── */}
<section style={{ paddingBottom: '4rem' }}>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(240,237,232,0.07)' }}>
    {[
      { label: 'CVs built today', value: <AnimatedNumber value={cvCount} />, bg: '#0f0f0f' },
      { label: 'More callbacks', value: '3×', bg: '#141414' },
      { label: 'Pass ATS screening', value: '94%', bg: '#0f0f0f' },
    ].map((s, i) => (
      <div key={i} style={{ background: s.bg, padding: 'clamp(1.2rem,3vw,2rem) 1rem', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(240,237,232,0.07)' : 'none' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.3rem,4vw,2.6rem)', color: '#c8ff00', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
        <div style={{ fontSize: 'clamp(0.62rem,1.5vw,0.72rem)', color: 'rgba(240,237,232,0.4)', marginTop: '0.4rem', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
      </div>
    ))}
  </div>
</section>

          {/* ── HOW IT WORKS ── */}
          <section style={{ paddingBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>How it works</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1 }}>
                From blank page to<br /><span style={{ color: '#c8ff00' }}>interview-ready in minutes</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '2.5rem', maxWidth: 820, margin: '0 auto' }}>
              <StepCard number="1" title="Fill in your details" desc="Work experience, education, skills, target role. You provide the raw material — or upload your existing CV." />
              <StepCard number="2" title="AI rewrites everything" desc="No em dashes. No corporate fluff. Active voice, achievement-focused bullets, British English. Sounds like you on your best day." />
              <StepCard number="3" title="Download and apply" desc="Copy the text or download as a clean PDF. Formatted for ATS, tailored for UK Skilled Worker visa applications." />
            </div>
          </section>

          {/* ── INDUSTRY STYLES ── */}
          <section style={{ paddingBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>Industry-specific</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1 }}>
                Built for your industry,<br /><span style={{ color: '#c8ff00' }}>not just your job title</span>
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.75rem' }}>Each industry has its own language, format, and expectations. We know them all.</p>
            </div>
            <div className="industry-grid">
              {industries.map((ind, i) => <IndustryCard key={i} {...ind} />)}
            </div>
          </section>

          {/* ── HIRED BY TICKER ── */}
<section style={{ paddingBottom: '5rem' }}>
  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
    <p style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      Sponsrr CVs got candidates hired by
    </p>
  </div>

  <div style={{ position: 'relative', overflow: 'hidden' }}>
    {/* Fade edges */}
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg, #080808, transparent)', zIndex: 2, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg, #080808, transparent)', zIndex: 2, pointerEvents: 'none' }} />

    <div className="ticker-track">
      {[...Array(2)].map((_, repeat) => (
        <div key={repeat} className="ticker-inner">
          {[
  'google', 'amazon', 'deliveroo', 'salesforce', 'hsbc', 'lloyds',
'pwc', 'barclays', 'johnlewis', 'boots', 'tesco', 'sainsburys', 'hm',
'nhs', 'bupa', 'astrazeneca', 'gsk', 'sky', 'bt', 'bbc', 'dyson', 'easyjet'
].map((name) => (
  <div key={name} style={{ flexShrink: 0, padding: '0 2.5rem', display: 'flex', alignItems: 'center' }}>
    <img
      src={`/logos/${name}.png`}
      alt={name}
      style={{ height: 28, width: 'auto', opacity: 0.85, objectFit: 'contain' }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  </div>
))}
        </div>
      ))}
    </div>
  </div>
</section>

          {/* ── WHY HUMAN ── */}
          <section style={{ paddingBottom: '5rem' }}>
            <div style={{ background: '#0d0d0d', border: '1px solid rgba(200,255,0,0.12)', borderRadius: 24, padding: '3rem 2.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2rem)', letterSpacing: '-0.03em', color: '#f0ede8' }}>Why it sounds human and not ChatGPT</h2>
                <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.5rem' }}>We trained our prompts to actively avoid AI writing patterns.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                {[
                  { bad: 'I am passionate about...', good: 'Opens with a hook, not a cliché' },
                  { bad: 'Responsible for managing...', good: 'Achievement-first bullet points' },
                  { bad: 'Results-driven professional', good: 'Specific, credible language' },
                  { bad: 'Em dash — everywhere', good: 'Zero em dashes. Ever.' },
                  { bad: 'Leveraging synergies', good: 'Plain English. Active voice.' },
                  { bad: 'Detail-oriented team player', good: 'Actual skills. Actual outcomes.' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#141414', borderRadius: 14, padding: '1.1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,77,0,0.7)', textDecoration: 'line-through', marginBottom: '0.4rem', fontStyle: 'italic' }}>{item.bad}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c8ff00', fontWeight: 600 }}>✓ {item.good}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS — Welcome.js style ── */}
          <section style={{ paddingBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>Real results</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1 }}>
                People who got the job<br /><span style={{ color: '#c8ff00' }}>after using Sponsrr CV</span>
              </h2>
            </div>

            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
                <span style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.25)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>What our users say</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
              </div>

              {/* Card — exactly Welcome.js style */}
              <div className={`testi-card${animating ? ' out' : ''}`} style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 18, padding: '1.5rem', textAlign: 'left', height: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.6rem', lineHeight: 1, color: 'rgba(200,255,0,0.25)', fontFamily: 'Georgia, serif', marginBottom: '0.4rem' }}>"</div>
                  <p style={{ fontSize: '0.84rem', color: 'rgba(240,237,232,0.7)', lineHeight: 1.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.quote}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif' }}>{t.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.1rem' }}>{t.role}</div>
                  </div>
                  <div style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 100, padding: '0.2rem 0.65rem', fontSize: '0.62rem', color: 'rgba(200,255,0,0.7)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {t.outcome}
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
          </section>

          {/* ── BOTTOM CTA ── */}
          <section style={{ paddingBottom: '6rem' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f0f0f 0%,#111 50%,#0a0a0a 100%)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 24, padding: '3.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, background: 'radial-gradient(ellipse,rgba(200,255,0,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.3rem,4vw,2.4rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.75rem' }}>Your job hunt got you this far.</h2>
                <p style={{ fontSize: '0.95rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 2rem' }}>
                  Don't lose the job offer because your CV didn't match what a UK hiring manager actually looks for.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="primary-btn" onClick={() => navigate('/cv-builder')}
                    style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '1rem 2.5rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Build my CV now →
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/cover-letter')}
                    style={{ background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.15)', borderRadius: 100, padding: '1rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Write my cover letter
                  </button>
                </div>
                <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'rgba(240,237,232,0.2)' }}>Sound more like yourself. Powered by Sponsrr AI.</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}