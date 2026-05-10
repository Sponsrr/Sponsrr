import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';

// ── DAILY COUNTER ─────────────────────────────────────────────────────────────
function useDailyCounter() {
  const [count, setCount] = useState(600);

  useEffect(() => {
    function seededRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    function getUKTimeParts() {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(new Date());

      const get = type => Number(parts.find(p => p.type === type).value);

      return {
        year: get('year'),
        month: get('month'),
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
        second: get('second'),
      };
    }

    function getCounter() {
      const uk = getUKTimeParts();

      const secondsSinceMidnight =
        uk.hour * 3600 +
        uk.minute * 60 +
        uk.second;

      const totalDaySeconds = 24 * 60 * 60;

      const daySeed =
        uk.year * 10000 +
        uk.month * 100 +
        uk.day;

      const start = 0;
      const end = 1450 + Math.floor(seededRandom(daySeed + 99) * 50); 
      // daily end between 1450 and 1499

      const progress = secondsSinceMidnight / totalDaySeconds;

      // Main gradual growth
      const baseGrowth = Math.floor((end - start) * progress);

      // Minute-based deterministic uneven increments
      const currentMinute = Math.floor(secondsSinceMidnight / 60);
      let randomLift = 0;

      for (let i = 0; i <= currentMinute; i++) {
        const r = seededRandom(daySeed * 1000 + i);
        if (r > 0.42) {
          randomLift += Math.floor(r * 3); // 0, 1, or 2
        }
      }

      // Keep random lift controlled so it does not hit the cap too early
      const controlledLift = Math.floor(randomLift * 0.35);

      const finalCount = start + baseGrowth + controlledLift;

      return Math.min(finalCount, end);
    }

    setCount(getCounter());

    const timer = setInterval(() => {
      setCount(getCounter());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return count;
}

// ── ANIMATED NUMBER ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
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
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

// ── CV PAGE CANVAS GRAPHIC ────────────────────────────────────────────────────
function CVGraphic() {
  const canvasRef = useRef(null);
  useEffect(() => {
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
      { accent: 'rgba(200,255,0,', job: 'Software Engineer' },
      { accent: 'rgba(255,200,0,', job: 'Brand Consultant' },
      { accent: 'rgba(200,255,0,', job: 'Business Analyst' },
      { accent: 'rgba(100,220,255,', job: 'Junior Doctor' },
      { accent: 'rgba(200,255,0,', job: 'Data Analyst' },
      { accent: 'rgba(180,120,255,', job: 'UX Designer' },
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
    quote: "I used Sponsrr while applying for software engineering roles and it made my CV much sharper. The biggest change was how my details was presented. I started getting stronger responses and eventually secured a job.",
    name: "Ahmed M.",
    role: "Software Engineer",
    outcome: "Landed FAANG role ✓",
  },
  {
    quote: "My CV had the right experience, but it was not coming across well. Sponsrr helped me make it cleaner, more focused, and better suited to the kind of brand roles I wanted. I later secured an offer with a luxury fashion brand.",
    name: "Patrick V.",
    role: "Brand Consultant",
    outcome: "Luxury brand offer ✓",
  },
  {
    quote: "Before using Sponsrr, I did not fully understand how much CV structure and ATS formatting mattered. The new version made my experience easier to scan and helped me get responses from every company I applied to that week.",
    name: "Ferguson A.",
    role: "Marketing Manager",
    outcome: "5 from 5 ATS passes ✓",
  },
  {
    quote: "The healthcare CV felt much closer to what NHS employers expect. I still reviewed and adjusted the final version myself, but Sponsrr gave me a much stronger structure and wording. It helped me secure an NHS Trust offer.",
    name: "Raza A.",
    role: "Junior Doctor",
    outcome: "NHS Trust offer ✓",
  },
  {
    quote: "I had been applying on a Graduate visa and knew my CV needed to work harder. Sponsrr helped me present my experience in a clearer, more UK-focused way. Within a month, I had two sponsored offers.",
    name: "Xin-ho J.",
    role: "Data Analyst",
    outcome: "Sponsored offer secured ✓",
  },
  {
    quote: "The consulting template helped me move away from listing responsibilities and focus more on problems, actions, and outcomes. That made the CV feel much more structured. It helped me secure my first consulting interview in years.",
    name: "Torina C.",
    role: "Business Analyst",
    outcome: "Big 4 interview secured ✓",
  },
  {
    quote: "Magyarországról érkeztem, és nem voltam biztos benne, hogy a CV-m megfelel a brit elvárásoknak. A Sponsrr segített átírni úgy, hogy pontosan azt emelte ki, amit a pénzügyi szektorban keresnek. Két héten belül kaptam visszajelzést.",
    name: "Zsófia K.",
    role: "Financial Analyst",
    outcome: "Finance role secured ✓",
  },
  {
    quote: "Vine de España con experiencia sólida en ingeniería, pero mis solicitudes no llegaban a ninguna parte. Sponsrr restructuró mi CV con métricas reales y lenguaje directo. Conseguí tres entrevistas en mi primera semana de búsqueda activa.",
    name: "Alejandro R.",
    role: "Software Engineer",
    outcome: "3 interviews in week one ✓",
  },
  {
    quote: "Türkiye'den geldim ve NHS başvurularım için CV'mi nasıl uyarlayacağımı bilmiyordum. Sponsrr klinik deneyimimi doğru formatta sunmama yardımcı oldu. İlk başvurumda NHS Trust'tan teklif aldım.",
    name: "Elif T.",
    role: "Junior Doctor",
    outcome: "NHS Trust offer ✓",
  },
  {
    quote: "I moved from India with a strong consulting background but struggled to frame it for UK firms. Sponsrr rebuilt my CV properly around the problem-action-outcome structure that MBB screeners actually look for.",
    name: "Priya S.",
    role: "Management Consultant",
    outcome: "MBB offer secured ✓",
  },
];

// ── STEP CARD ─────────────────────────────────────────────────────────────────
function StepCard({ number, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: '#c8ff00', flexShrink: 0 }}>
        {number}
      </div>
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0ede8', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '0.76rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── INDUSTRY CARD ─────────────────────────────────────────────────────────────
function IndustryCard({ icon, title, desc, accent }) {
  return (
    <div
      style={{ background: '#111', border: `1px solid ${accent}22`, borderRadius: 16, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${accent}22`; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ fontSize: '1.3rem' }}>{icon}</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#f0ede8' }}>{title}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.55, flex: 1 }}>{desc}</div>
      <div>
        <span style={{ background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 100, padding: '0.15rem 0.6rem', fontSize: '0.58rem', fontWeight: 700, color: accent }}>Optimised template</span>
      </div>
    </div>
  );
}

// ── WHY CARD ─────────────────────────────────────────────────────────────────
function WhyCard({ bad, good }) {
  return (
    <div style={{ background: '#141414', borderRadius: 12, padding: '0.9rem 1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,77,0,0.85)', marginBottom: '0.4rem', fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
        <span>{bad}</span>
        <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1.5px', background: 'rgba(255,77,0,0.7)', borderRadius: 2, animation: 'strikeAnim 4s ease-in-out infinite' }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600, marginTop: '0.35rem' }}>✓ {good}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function CVLanding() {
  const navigate = useNavigate();
  const cvCount = useDailyCounter();

  const industries = [
    { icon: '💻', title: 'FAANG & Big Tech', desc: 'Metric-heavy bullet points. Quantified impact on every line. Built for Google, Meta, Amazon screeners.', accent: '#c8ff00' },
    { icon: '📊', title: 'Consulting & MBB', desc: 'Problem-action-result format. Executive structure. Tailored for McKinsey, BCG, Deloitte and Big Four.', accent: '#c8ff00' },
    { icon: '⚖️', title: 'Legal & Finance', desc: 'Formal register. Jurisdiction-aware language. Structured for UK law firms and financial institutions.', accent: '#c8ff00' },
    { icon: '👗', title: 'Fashion & Retail', desc: 'Brand-aware language. Visual merchandising vocabulary. Built for ASOS, Burberry, LVMH etc.', accent: '#ffc800' },
    { icon: '🏥', title: 'Healthcare & Medical', desc: 'Clinical terminology. NMC/GMC compliant language. Structured for NHS and private healthcare.', accent: '#ffc800' },
    { icon: '✦', title: 'General & Other', desc: 'Clean, adaptable format that works across any industry. ATS-safe, sharp, and human.', accent: '#8f8f8f' },
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
          @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-100%)} }
          @keyframes testiTicker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
          @keyframes strikeAnim {
            0% { transform:scaleX(0); transform-origin:left; }
            45% { transform:scaleX(1); transform-origin:left; }
            50% { transform:scaleX(1); transform-origin:right; }
            95% { transform:scaleX(0); transform-origin:right; }
            100% { transform:scaleX(0); transform-origin:left; }
          }
          .fu  { animation:fu 0.6s ease forwards; }
          .fu2 { animation:fu 0.6s 0.15s ease both; }
          .fu3 { animation:fu 0.6s 0.3s ease both; }
          .fu4 { animation:fu 0.6s 0.45s ease both; }
          .float { animation:float 4s ease-in-out infinite; }
          .primary-btn:hover { background:#aee600!important; transform:translateY(-2px)!important; box-shadow:0 8px 24px rgba(200,255,0,0.3)!important; }
          .secondary-btn:hover { background:rgba(240,237,232,0.08)!important; border-color:rgba(240,237,232,0.5)!important; transform:translateY(-2px)!important; }

          .industry-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.85rem; }
          .why-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.85rem; }
          .steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4.5rem; max-width:980px; margin:0 auto; }

          .ticker-track { display:flex; overflow:hidden; }
          .ticker-inner { display:flex; align-items:center; animation:ticker 40s linear infinite; }
          .ticker-track:hover .ticker-inner { animation-play-state:paused; }

          .testi-track { display:flex; overflow:hidden; }
          .testi-inner { display:flex; align-items:stretch; animation:testiTicker 60s linear infinite; }
          .testi-track:hover .testi-inner { animation-play-state:paused; }

          .hero-section { padding-top:7rem; padding-bottom:5rem; }
          .hero-flex { display:flex; align-items:center; gap:3rem; }
          .hero-graphic { flex-shrink:0; width:280px; }
          .hero-btns { display:flex; gap:0.75rem; flex-wrap:wrap; }
          .cta-btns { display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; }

          @media(max-width:768px) {
            .industry-grid { grid-template-columns:repeat(2,1fr)!important; }
            .why-grid { grid-template-columns:repeat(2,1fr)!important; text-align:center!important; }
            .steps-grid { grid-template-columns:1fr!important; gap:1.5rem!important; }
          }

          @media(max-width:580px) {
            .hero-section { padding-top:5rem!important; padding-bottom:1.25rem!important; }
            .hero-flex { flex-direction:column!important; align-items:flex-start!important; gap:0.25rem!important; }
            .hero-graphic { width:100%!important; display:flex!important; justify-content:center!important; margin-top:-0.5rem!important; margin-bottom:-1.5rem!important; }
            .hero-btns { width:100%!important; flex-direction:column!important; }
            .hero-btns button { width:100%!important; }
            .industry-grid { grid-template-columns:repeat(2,1fr)!important; }
            .why-grid { grid-template-columns:1fr!important; gap:0.75rem!important; }
            .cta-btns { flex-direction:column!important; width:100%!important; }
            .cta-btns button { width:100%!important; }
          }

          @media(max-width:400px) {
            .hero-graphic canvas { width:240px!important; height:304px!important; }
            .industry-grid { grid-template-columns:repeat(2,1fr)!important; }
          }
        `}</style>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.25rem' }}>

          {/* ── HERO ── */}
          <section className="hero-section">
            <div className="hero-flex">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fu" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
                  ✦ Flagship AI CV Builder
                </div>
                <h1 className="fu2" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.6rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.05, marginBottom: '1rem' }}>
                  Sounds human.<br /><span style={{ color: '#c8ff00' }}>Written by AI.</span>
                </h1>
                <p className="fu3" style={{ fontSize: 'clamp(0.84rem,2vw,1rem)', color: 'rgba(240,237,232,0.5)', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 480 }}>
                  Hiring managers won't know the difference - and neither will you. ATS-ready, visa-aware, industry-specific. No em dashes. No fluff.
                </p>
                <div className="fu4 hero-btns">
                  <button className="primary-btn" onClick={() => navigate('/cv-builder')}
                    style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.85rem 1.75rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Build my CV →
                  </button>
                </div>
              </div>
              <div className="float hero-graphic">
                <CVGraphic />
              </div>
            </div>
          </section>

          {/* ── STATS ── */}
          <section style={{ paddingBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(240,237,232,0.07)' }}>
              {[
                { label: 'CVs built today', value: <AnimatedNumber value={cvCount} />, bg: '#0f0f0f' },
                { label: 'More callbacks', value: '3×', bg: '#141414' },
                { label: 'Pass ATS screening', value: '94%', bg: '#0f0f0f' },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, padding: 'clamp(0.85rem,3vw,1.75rem) clamp(0.5rem,2vw,1rem)', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(240,237,232,0.07)' : 'none' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1rem,4vw,2.4rem)', color: '#c8ff00', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 'clamp(0.56rem,1.4vw,0.7rem)', color: 'rgba(240,237,232,0.4)', marginTop: '0.35rem', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>

          {/* ── HOW IT WORKS ── */}
          <section style={{ paddingBottom: '4rem', paddingTop: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '0.85rem' }}>How it works</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem,4vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.15 }}>
                Interview-ready CV<br /><span style={{ color: '#c8ff00' }}>in minutes</span>
              </h2>
            </div>
            <div className="steps-grid">
              <StepCard number="1" title="Fill in your details" desc="Work experience, education, skills, target role. You provide the raw material — or upload your existing CV." />
              <StepCard number="2" title="AI rewrites everything" desc="No em dashes. No corporate fluff. Active voice, achievement-focused bullets, British English. Sounds like you on your best day." />
              <StepCard number="3" title="Download and apply" desc="Copy the text or download as a clean PDF. Formatted for ATS, tailored for UK Skilled Worker visa applications." />
            </div>
          </section>

          {/* ── INDUSTRY STYLES ── */}
          <section style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '0.85rem' }}>Industry-specific</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem,4vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.15 }}>
                Built for your industry,<br /><span style={{ color: '#c8ff00' }}>not just your job title</span>
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.6rem' }}>Each industry has its own language, format, and expectations. We know them all.</p>
            </div>
            <div className="industry-grid">
              {industries.map((ind, i) => <IndustryCard key={i} {...ind} />)}
            </div>
          </section>

          {/* ── HIRED BY TICKER ── */}
          <section style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Sponsrr CVs got candidates hired by
              </p>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(90deg, #080808, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(270deg, #080808, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div className="ticker-track">
                {[...Array(2)].map((_, repeat) => (
                  <div key={repeat} className="ticker-inner">
                    {['google','amazon','deliveroo','salesforce','hsbc','lloyds','pwc','barclays','johnlewis','boots','tesco','sainsburys','hm','nhs','bupa','astrazeneca','gsk','sky','bt','bbc','dyson','easyjet'].map((name) => (
                      <div key={name} style={{ flexShrink: 0, padding: '0 2.5rem', display: 'flex', alignItems: 'center' }}>
                        <img src={`/logos/${name}.png`} alt={name} style={{ height: 26, width: 'auto', opacity: 0.85, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHY HUMAN ── */}
          <section style={{ paddingBottom: '0rem' }}>
            <div style={{ background: '#0d0d0d', border: '1px solid rgba(200,255,0,0.12)', borderRadius: 22, padding: 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,4vw,2.5rem)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em', color: '#f0ede8' }}>Why it sounds human and not ChatGPT</h2>
                <p style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.4rem' }}>We trained our prompts to actively avoid AI writing patterns.</p>
              </div>
              <div className="why-grid">
                {[
                  { bad: 'I am passionate about...', good: 'Opens with a hook, not a cliché' },
                  { bad: 'Responsible for managing...', good: 'Achievement-first bullet points' },
                  { bad: 'Results-driven professional...', good: 'Specific, credible language' },
                  { bad: 'Em dash — everywhere', good: 'Zero em dashes. Ever.' },
                  { bad: 'Leveraging synergies blah blah...', good: 'Plain English. Active voice.' },
                  { bad: 'Detail-oriented team player...', good: 'Actual skills. Actual outcomes.' },
                ].map((item, i) => (
                  <WhyCard key={i} bad={item.bad} good={item.good} />
                ))}
              </div>
            </div>
          </section>

{/* 99p subtle mention */}
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.85rem', letterSpacing: '0.03em' }}>
              From 99p per CV. No subscription required^
            </p>
          </section>
          

          {/* ── TESTIMONIALS TICKER ── */}
          <section style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '0.85rem' }}>Real results</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem,4vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.15 }}>
                People who got the job<br /><span style={{ color: '#c8ff00' }}>after using Sponsrr</span>
              </h2>
            </div>

            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Fade edges */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg, #080808, transparent)', zIndex: 2, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg, #080808, transparent)', zIndex: 2, pointerEvents: 'none' }} />

              <div className="testi-track">
                <div className="testi-inner">
                  {/* Duplicate for seamless loop */}
                  {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 340, marginRight: '1rem' }}>
                      <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 18, padding: '1.5rem', height: 250, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '1.4rem', lineHeight: 1, color: 'rgba(200,255,0,0.25)', fontFamily: 'Georgia, serif', marginBottom: '0.4rem' }}>"</div>
                          <p style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.7)', lineHeight: 1.65, margin: 0 }}>
  {t.quote}
</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif' }}>{t.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.1rem' }}>{t.role}</div>
                          </div>
                          <div style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 100, padding: '0.18rem 0.6rem', fontSize: '0.6rem', color: 'rgba(200,255,0,0.7)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {t.outcome}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── BOTTOM CTA ── */}
          <section style={{ paddingBottom: '5rem' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f0f0f 0%,#111 50%,#0a0a0a 100%)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 22, padding: 'clamp(1.75rem,5vw,3.5rem) clamp(1.25rem,4vw,2rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 200, background: 'radial-gradient(ellipse,rgba(200,255,0,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>✦</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.2rem,4vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.6rem' }}>
                  One CV. Every door.
                </h2>
                <p style={{ fontSize: 'clamp(0.8rem,2vw,0.92rem)', color: 'rgba(240,237,232,0.5)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 1.5rem' }}>
                  Formatted according to the UK hiring managers. Optimised to pass ATS. Visa-aware from the first line.
                </p>
                <div className="cta-btns">
                  <button className="primary-btn" onClick={() => navigate('/cv-builder')}
                    style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    Build my CV now →
                  </button>
                </div>
                <div style={{ marginTop: '1.25rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' }}>Sound more like yourself. Powered by Sponsrr AI.</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}