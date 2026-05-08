import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';
import { SOC_DATABASE } from './socData';
import SocGuideModal from './SocGuideModal';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const STANDARD_THRESHOLD    = 41700;
const NEW_ENTRANT_THRESHOLD = 33400;
const HEALTH_CARE_THRESHOLD = 25000;
const ILR_FAST_TRACK_HIGH   = 125140;
const ILR_FAST_TRACK_MID    = 50270;
const COS_TRANSITIONAL_CUTOFF = new Date('2024-04-04');
const EARNED_SETTLEMENT_START = new Date('2026-04-01');
const GRAD_VISA_18M_CUTOFF    = new Date('2027-01-01');

const VISA_OPTIONS = [
  { value: '',               label: 'Select visa type...' },
  { value: 'skilled_worker', label: 'Skilled Worker Visa' },
  { value: 'health_care',    label: 'Health & Care Worker Visa' },
  { value: 'graduate',       label: 'Graduate Visa (PSW)' },
  { value: 'student',        label: 'Student Visa (Tier 4)' },
  { value: 'tier2',          label: 'Tier 2 (General) - legacy' },
  { value: 'other',          label: 'Other work visa' },
];

const DEGREE_OPTIONS = [
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters',   label: "Master's Degree" },
  { value: 'phd',       label: 'PhD (any subject)' },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return '-';
  return `£${Number(n).toLocaleString('en-GB')}`;
}
function addYears(date, years) {
  const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d;
}
function addMonths(date, months) {
  const d = new Date(date); d.setMonth(d.getMonth() + months); return d;
}
function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const lbl = { fontSize: '0.76rem', fontWeight: 600, color: 'rgba(240,237,232,0.55)', marginBottom: '0.5rem', display: 'block' };
const inp = { background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 12, padding: '0.8rem 1rem', color: '#f0ede8', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const sel = { ...inp, appearance: 'none', cursor: 'pointer', paddingRight: '2.2rem', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(240,237,232,0.4)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' };
const tog = { flex: 1, padding: '0.65rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(240,237,232,0.1)' };
const togOn = { background: 'rgba(200,255,0,0.08)', color: '#c8ff00', border: '1px solid rgba(200,255,0,0.4)' };
const togOff = { background: 'rgba(240,237,232,0.04)', color: 'rgba(240,237,232,0.5)' };
const hint = { fontSize: '0.7rem', marginTop: '0.4rem', lineHeight: 1.5, color: 'rgba(240,237,232,0.35)' };
const primaryBtn   = { background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease', boxSizing: 'border-box' };
const secondaryBtn = { background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 100, padding: '0.85rem 2rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease', boxSizing: 'border-box' };
const socLinkStyle = { background: 'none', border: 'none', color: 'rgba(200,255,0,0.7)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 };
const poweredBy = { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' };

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>
      ← Back
    </button>
  );
}

function ResultRow({ label, value, color = '#f0ede8' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(240,237,232,0.05)' }}>
      <span style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color, textAlign: 'right', maxWidth: '58%', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function InfoBox({ color = '#c8ff00', bg, border, children }) {
  return (
    <div style={{ background: bg || 'rgba(200,255,0,0.04)', border: `1px solid ${border || 'rgba(200,255,0,0.15)'}`, borderRadius: 12, padding: '0.85rem 1rem', fontSize: '0.75rem', color: color === '#c8ff00' ? 'rgba(200,255,0,0.75)' : color, lineHeight: 1.65 }}>
      {children}
    </div>
  );
}

function UrgencyBadge({ level }) {
  const map = {
    green:  { label: 'Plenty of time', bg: 'rgba(200,255,0,0.1)',  border: 'rgba(200,255,0,0.25)',  color: '#c8ff00' },
    amber:  { label: 'Act soon',       bg: 'rgba(255,200,0,0.1)',  border: 'rgba(255,200,0,0.25)',  color: '#ffc800' },
    red:    { label: 'Urgent',         bg: 'rgba(255,77,0,0.1)',   border: 'rgba(255,77,0,0.25)',   color: '#ff4d00' },
    passed: { label: 'Window closed',  bg: 'rgba(255,77,0,0.08)',  border: 'rgba(255,77,0,0.2)',    color: '#ff4d00' },
  };
  const s = map[level] || map.green;
  return <span style={{ display: 'inline-block', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 100, padding: '0.22rem 0.75rem', fontSize: '0.68rem', fontWeight: 700, color: s.color }}>{s.label}</span>;
}

// ── LOADER SHELL (shared structure) ───────────────────────────────────────────
function LoaderShell({ canvasRef, canvasW, canvasH, steps, stepsDone, activeStep, fillWidth, complete, title, subtitle }) {
  const currentText = complete ? 'Analysis complete ✓' : steps[activeStep]?.text;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.75rem' }}>
      <style>{`
        @keyframes ss-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .ss-in { animation: ss-in 0.3s ease forwards; }
        .lp { background:rgba(240,237,232,0.03); border:1px solid rgba(240,237,232,0.07); border-radius:100px; padding:0.28rem 0.7rem; font-size:0.62rem; font-weight:600; color:rgba(240,237,232,0.2); white-space:nowrap; transition:all 0.5s ease; }
        .lp.done { background:rgba(200,255,0,0.08); border-color:rgba(200,255,0,0.25); color:rgba(200,255,0,0.8); }
        .lpl { display:none; flex-direction:column; gap:0.55rem; width:100%; max-width:380px; }
        .lpl-track { position:relative; height:2px; background:rgba(240,237,232,0.08); border-radius:100px; margin:0 10px; }
        .lpl-fill { position:absolute; left:0;top:0;bottom:0; background:#c8ff00; border-radius:100px; box-shadow:0 0 8px rgba(200,255,0,0.6); transition:width 1.33s linear; }
        .lpl-dots { display:flex; justify-content:space-between; margin-top:-5px; padding:0 8px; }
        .lpl-dot { width:8px;height:8px;border-radius:50%;background:rgba(240,237,232,0.12);border:2px solid #080808;transition:all 0.4s;flex-shrink:0; }
        .lpl-dot.on { background:#c8ff00; box-shadow:0 0 8px rgba(200,255,0,0.9); }
        .lpl-lbls { display:flex; justify-content:space-between; padding:0 4px; }
        .lpl-lbl { font-size:0.6rem;font-weight:600;color:rgba(240,237,232,0.2);transition:color 0.4s;text-align:center;flex:1; }
        .lpl-lbl.on { color:rgba(200,255,0,0.7); }
        @media(min-width:600px){ .lmob{display:none!important} .lpl{display:flex!important} }
        @media(max-width:599px){ .lpl{display:none!important} .lmob{display:flex!important} }
      `}</style>

      <div style={{ position: 'relative', width: canvasW, height: canvasH }}>
        <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(200,255,0,0.07) 0%, transparent 70%)', filter: 'blur(16px)' }} />
        <canvas ref={canvasRef} width={canvasW} height={canvasH} style={{ position: 'relative', zIndex: 2, display: 'block' }} />
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#f0ede8', letterSpacing: '-0.02em' }}>{title}</div>
        <div key={currentText} className="ss-in" style={{ fontSize: '0.78rem', fontWeight: 600, color: complete ? '#c8ff00' : 'rgba(200,255,0,0.7)', minHeight: '1.2em' }}>{currentText}</div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.25)' }}>{subtitle}</div>
      </div>

      <div className="lmob" style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {steps.map((s, i) => <div key={i} className={`lp${stepsDone[i] ? ' done' : ''}`}>{stepsDone[i] ? '✓ ' : ''}{s.label}</div>)}
      </div>

      <div className="lpl">
        <div style={{ position: 'relative' }}>
          <div className="lpl-track"><div className="lpl-fill" style={{ width: `${fillWidth}%` }} /></div>
          <div className="lpl-dots">{steps.map((_, i) => <div key={i} className={`lpl-dot${stepsDone[i] ? ' on' : ''}`} />)}</div>
        </div>
        <div className="lpl-lbls">{steps.map((s, i) => <div key={i} className={`lpl-lbl${stepsDone[i] ? ' on' : ''}`}>{s.label}</div>)}</div>
      </div>
    </div>
  );
}

// ── BINARY RAIN LOADER (ILR) ──────────────────────────────────────────────────
function BinaryRainLoader({ steps, title, subtitle }) {
  const canvasRef = useRef(null);
  const [stepsDone, setStepsDone] = useState(steps.map(() => false));
  const [activeStep, setActiveStep] = useState(0);
  const [fillWidth, setFillWidth]   = useState(0);
  const [complete, setComplete]     = useState(false);
  const STEP_MS = Math.floor(9000 / steps.length);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cols = 26;
    const colW = W / cols;
    const drops  = Array.from({ length: cols }, () => Math.random() * -20);
    const speeds = Array.from({ length: cols }, () => 0.22 + Math.random() * 0.42);
    let rafId, frame = 0;

    function draw() {
      ctx.fillStyle = 'rgba(8,8,8,0.14)';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < cols; i++) {
        const char = Math.random() > 0.5 ? '1' : '0';
        const y = drops[i] * 13;
        const depth = Math.min(1, Math.max(0, y / H));
        const alpha = Math.max(0.04, depth * 0.88);
        ctx.font = `${9 + Math.random() * 2}px monospace`;
        ctx.fillStyle = `rgba(200,255,0,${alpha})`;
        ctx.fillText(char, i * colW + 3, y);
        if (y > H && Math.random() > 0.975) drops[i] = 0;
        drops[i] += speeds[i];
      }
      if (frame % 22 < 2) {
        const fi = Math.floor(Math.random() * cols);
        ctx.fillStyle = 'rgba(200,255,0,0.97)';
        ctx.font = '12px monospace';
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', fi * colW + 3, drops[fi] * 13);
      }
      frame++;
      // Stop at 9s (540 frames @ 60fps) - freeze on final frame, no restart
      if (frame < 540) rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const timers = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActiveStep(i);
        setStepsDone(prev => { const n = [...prev]; n[i] = true; return n; });
        setFillWidth(((i + 1) / steps.length) * 100);
      }, i * STEP_MS));
    });
    timers.push(setTimeout(() => setComplete(true), steps.length * STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  return <LoaderShell canvasRef={canvasRef} canvasW={220} canvasH={110} steps={steps} stepsDone={stepsDone} activeStep={activeStep} fillWidth={fillWidth} complete={complete} title={title} subtitle={subtitle} />;
}

// ── DATA COMPRESSION LOADER (Graduate) ────────────────────────────────────────
function DataCompressionLoader({ steps, title, subtitle, resultLabel }) {
  const canvasRef = useRef(null);
  const [stepsDone, setStepsDone] = useState(steps.map(() => false));
  const [activeStep, setActiveStep] = useState(0);
  const [fillWidth, setFillWidth]   = useState(0);
  const [complete, setComplete]     = useState(false);
  const STEP_MS = Math.floor(9000 / steps.length);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const ROWS = 6, COLS = 28;
    const cW = W / COLS, cH = H / ROWS;
    let frame = 0, rafId;
    const TOTAL = 540;  // 9s @ 60fps - runs once, no restart
    const chars = ['0','1','4','7','A','E','£','%','2','8','F','3'];

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const progress = Math.min(frame / TOTAL, 1);
      const front = Math.floor(progress * COLS);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * cW, y = r * cH;
          if (c < front) {
            const fade = Math.max(0, 1 - (front - c) / Math.max(1, front));
            if (fade > 0.03) { ctx.font = '7px monospace'; ctx.fillStyle = `rgba(200,255,0,${fade * 0.18})`; ctx.fillText('·', x + 3, y + cH * 0.75); }
          } else if (c === front) {
            ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(200,255,0,0.95)';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', x + 3, y + cH * 0.75);
            ctx.fillStyle = 'rgba(200,255,0,0.32)'; ctx.fillRect(x + cW - 1, y, 1.5, cH);
          } else {
            const alpha = 0.1 + Math.random() * 0.25;
            ctx.font = `${7 + Math.random() * 3}px monospace`; ctx.fillStyle = `rgba(200,255,0,${alpha})`;
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x + 3, y + cH * 0.75);
          }
        }
      }

      if (progress > 0.8 && resultLabel) {
        const fade = Math.min(1, (progress - 0.8) / 0.2);
        const rW = Math.min(100, W * 0.32), rH = 24;
        const rX = W - rW - 8, rY = H / 2 - rH / 2;
        ctx.fillStyle = `rgba(200,255,0,${fade * 0.12})`;
        ctx.beginPath(); ctx.roundRect(rX, rY, rW, rH, 5); ctx.fill();
        ctx.fillStyle = `rgba(200,255,0,${fade * 0.92})`;
        ctx.font = `600 10px monospace`; ctx.textAlign = 'center';
        ctx.fillText(resultLabel, rX + rW / 2, rY + 16); ctx.textAlign = 'left';
      }

      frame++;
      if (frame < TOTAL) rafId = requestAnimationFrame(draw);
      // else: done - freeze on final frame showing result label
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [resultLabel]);

  useEffect(() => {
    const timers = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActiveStep(i);
        setStepsDone(prev => { const n = [...prev]; n[i] = true; return n; });
        setFillWidth(((i + 1) / steps.length) * 100);
      }, i * STEP_MS));
    });
    timers.push(setTimeout(() => setComplete(true), steps.length * STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  return <LoaderShell canvasRef={canvasRef} canvasW={280} canvasH={90} steps={steps} stepsDone={stepsDone} activeStep={activeStep} fillWidth={fillWidth} complete={complete} title={title} subtitle={subtitle} />;
}

// ── WAVEFORM COLLAPSE LOADER (Extension) ──────────────────────────────────────
function WaveformLoader({ steps, title, subtitle, verdict }) {
  const canvasRef = useRef(null);
  const [stepsDone, setStepsDone] = useState(steps.map(() => false));
  const [activeStep, setActiveStep] = useState(0);
  const [fillWidth, setFillWidth]   = useState(0);
  const [complete, setComplete]     = useState(false);
  const STEP_MS = Math.floor(9000 / steps.length);

  const verdictMap = {
    pass:       { color: [200, 255, 0],  label: 'ELIGIBLE' },
    fail:       { color: [255, 77, 0],   label: 'BELOW THRESHOLD' },
    borderline: { color: [255, 200, 0],  label: 'CHECK REQUIRED' },
  };
  const vd = verdictMap[verdict] || verdictMap.pass;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let frame = 0, rafId;
    const TOTAL = 540;  // 9s @ 60fps - runs once, no restart
    const mid = H / 2;
    const startColor = [200, 255, 0]; // always starts green
const endColor = vd.color;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const progress = Math.min(frame / TOTAL, 1);
      const calm = Math.pow(progress, 1.6);
      const r1 = Math.round(200 + (endColor[0] - 200) * calm);
  const g1 = Math.round(255 + (endColor[1] - 255) * calm);
  const b1 = Math.round(0   + (endColor[2] - 0)   * calm);

      for (let layer = 0; layer < 3; layer++) {
        const alpha = (0.12 + layer * 0.09) * (1 - calm * 0.82);
        const amp = (32 - layer * 7) * (1 - calm);
        const freq = 0.033 + layer * 0.017;
        ctx.beginPath();
        for (let x = 0; x < W; x++) {
          const noise = (1 - calm) * (Math.random() - 0.5) * 11;
          const y = mid + Math.sin(x * freq + frame * 0.07 + layer * 1.1) * amp + Math.sin(x * freq * 2.1 + frame * 0.04) * amp * 0.33 + noise;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(200,255,0,${alpha})`; ctx.lineWidth = 1.4 - layer * 0.3; ctx.stroke();
      }

      const lineAlpha = 0.22 + calm * 0.72;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const residual = (1 - calm) * Math.sin(x * 0.024 + frame * 0.088) * 5;
        ctx.lineTo(x, mid + residual);
      }
      ctx.strokeStyle = `rgba(${r1},${g1},${b1},${lineAlpha})`; ctx.lineWidth = 2; ctx.stroke();

      [0.25, 0.5, 0.75].forEach(xPct => {
        ctx.beginPath(); ctx.moveTo(W * xPct, 0); ctx.lineTo(W * xPct, H);
        ctx.strokeStyle = 'rgba(240,237,232,0.04)'; ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
      });

      if (calm > 0.52) {
        const fade = Math.min(1, (calm - 0.52) / 0.48);
        const dotX = W * 0.8;
        ctx.beginPath(); ctx.arc(dotX, mid, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r1},${g1},${b1},${fade})`; ctx.fill();
        const rippleR = 5 + (1 - fade) * 13;
        ctx.beginPath(); ctx.arc(dotX, mid, rippleR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r1},${g1},${b1},${fade * 0.22})`; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = `rgba(${r1},${g1},${b1},${fade * 0.9})`;
        ctx.font = '600 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(vd.label, dotX, mid - 13); ctx.textAlign = 'left';
      }

      frame++;
      if (frame < TOTAL) rafId = requestAnimationFrame(draw);
      // else: done - freeze on final frame showing verdict label
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [verdict]);

  useEffect(() => {
    const timers = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActiveStep(i);
        setStepsDone(prev => { const n = [...prev]; n[i] = true; return n; });
        setFillWidth(((i + 1) / steps.length) * 100);
      }, i * STEP_MS));
    });
    timers.push(setTimeout(() => setComplete(true), steps.length * STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  return <LoaderShell canvasRef={canvasRef} canvasW={280} canvasH={100} steps={steps} stepsDone={stepsDone} activeStep={activeStep} fillWidth={fillWidth} complete={complete} title={title} subtitle={subtitle} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function HomeScreen({ onSelect }) {
  const tools = [
    { id: 'graduate',  icon: '🎓', title: 'Can I switch to Skilled Worker Visa?',         desc: "On a Graduate visa? See exactly how long you have left, whether the 18-month rule hits you, and your real deadline to secure a CoS.",                                    tag: 'Time sensitive',      tagColor: '#ff4d00' },
    { id: 'extension', icon: '🔄', title: 'Will my salary pass my extension?',        desc: 'Pre-2024 and post-2024 CoS holders get different rates. Find out exactly which threshold applies when you extend.',                                                        tag: 'Often misunderstood', tagColor: '#ffc800' },
    { id: 'ilr',       icon: '🏠', title: 'When can I get ILR or PR?',      desc: 'Calculate your exact ILR eligibility date and find out whether the proposed 10-year rule affects you.',                                                                     tag: 'High demand',  tagColor: '#c8ff00' },
  ];

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>
          🎯 Flagship calculators · AI Powered
        </div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem,5vw,2.6rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          Visa <span style={{ color: '#c8ff00' }}>Calculators</span>
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>
          Three tools. Three questions nobody else answers clearly.
        </p>
      </div>

      <div className="calc-home-grid">
        {tools.map(tool => (
          <button key={tool.id} className="tool-card" onClick={() => onSelect(tool.id)}>
            {/* Pill - absolute top right */}
            <span style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: `${tool.tagColor}28`, border: `1px solid ${tool.tagColor}70`, borderRadius: 100, padding: '0.22rem 0.7rem', fontSize: '0.6rem', fontWeight: 700, color: tool.tagColor, whiteSpace: 'nowrap' }}>{tool.tag}</span>
            {/* Emoji */}
            <span style={{ fontSize: '1.5rem', lineHeight: 1, marginBottom: '0.85rem', display: 'block' }}>{tool.icon}</span>
            {/* Title - padded right so it doesn't overlap pill */}
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.92rem', color: '#f0ede8', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '0.6rem', paddingRight: '3.5rem' }}>{tool.title}</div>
            {/* Description */}
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.65, flex: 1 }}>{tool.desc}</p>
            {/* Calculate → */}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', color: 'rgba(200,255,0,0.7)', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
              Calculate →
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)', borderRadius: 14, padding: '0.85rem 1.1rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.35)', lineHeight: 1.65 }}>
          <strong style={{ color: 'rgba(200,255,0,0.55)' }}>Based on 2026 rules:</strong> Skilled Worker threshold £41,700 · New entrant £33,400 · RQF Level 6+ required from July 2025 · ILR qualifying period proposed to increase to 10 years - Sponsrr shows you both scenarios.
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 1 - GRADUATE SWITCH WINDOW
// ══════════════════════════════════════════════════════════════════════════════
function GraduateSwitchWindow({ onBack, navigate }) {
  const [step, setStep]           = useState('input');
  const [result, setResult]       = useState(null);
  const [animLabel, setAnimLabel] = useState('730 DAYS');
  const [gradVisaStart, setGradVisaStart] = useState('');
  const [degree, setDegree]       = useState('bachelors');
  const [hasOffer, setHasOffer]   = useState('');
  const [offerSalary, setOfferSalary] = useState('');

  const canProceed = gradVisaStart && degree;

  function calculate() {
    const startDate = new Date(gradVisaStart);
    const today = new Date();
    const appliedBeforeNewRule = startDate < GRAD_VISA_18M_CUTOFF;
    const visaDurationMonths = degree === 'phd' ? 36 : appliedBeforeNewRule ? 24 : 18;
    const expiryDate = addMonths(startDate, visaDurationMonths);
    const daysLeft = daysBetween(today, expiryDate);
    const monthsLeft = monthsBetween(today, expiryDate);
    const alreadyExpired = expiryDate < today;
    const safeDeadline = addMonths(expiryDate, -3);
    const pastSafeDeadline = safeDeadline < today;
    const urgency = alreadyExpired ? 'passed' : daysLeft <= 60 ? 'red' : daysLeft <= 120 ? 'amber' : 'green';
    const salaryNum = Number(offerSalary) || 0;
    const meetsThreshold = salaryNum > 0 && salaryNum >= NEW_ENTRANT_THRESHOLD;
    const salaryGap = NEW_ENTRANT_THRESHOLD - salaryNum;
    const label = alreadyExpired ? 'EXPIRED' : `${daysLeft} DAYS`;
    setAnimLabel(label);
    setResult({ startDate, expiryDate, today, daysLeft, monthsLeft, alreadyExpired, safeDeadline, pastSafeDeadline, urgency, visaDurationMonths, appliedBeforeNewRule, degree, hasOffer, salaryNum, meetsThreshold, salaryGap });
  }

  function handleCheck() {
    // Pre-calculate animLabel before loader mounts
    const startDate = new Date(gradVisaStart);
    const today = new Date();
    const appliedBeforeNewRule = startDate < GRAD_VISA_18M_CUTOFF;
    const visaDurationMonths = degree === 'phd' ? 36 : appliedBeforeNewRule ? 24 : 18;
    const expiryDate = addMonths(startDate, visaDurationMonths);
    const daysLeft = daysBetween(today, expiryDate);
    const monthsLeft = monthsBetween(today, expiryDate);
    const alreadyExpired = expiryDate < today;
    setAnimLabel(alreadyExpired ? 'EXPIRED' : `${daysLeft} DAYS`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setStep('loading'), 300);
    setTimeout(() => { calculate(); window.scrollTo({ top: 0, behavior: 'instant' }); setStep('result'); }, 9300);
  }

  const STEPS = [
    { text: 'AI calculating your Graduate visa expiry date...', label: 'Expiry' },
    { text: 'Neural engine checking 18-month rule impact...', label: '18mo Rule' },
    { text: 'AI mapping your sponsorship switch window...', label: 'Window' },
  ];

  return (
    <>
      {step === 'input' && (
        <>
          <BackBtn onClick={onBack} />
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>🎓 Graduate Switch Window</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,5vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              How long do you have<br /><span style={{ color: '#c8ff00' }}>to find sponsorship?</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>See your exact Graduate visa expiry, whether the 18-month rule applies, and your real deadline to get a CoS.</p>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={lbl}>Date your Graduate visa was granted</label>
              <input style={inp} type="date" value={gradVisaStart} onChange={e => setGradVisaStart(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              {gradVisaStart && new Date(gradVisaStart) < GRAD_VISA_18M_CUTOFF && <div style={{ ...hint, color: 'rgba(200,255,0,0.7)' }}>✓ Applied before January 2027 - current 2-year/3-year rules apply to you</div>}
            </div>

            <div>
              <label style={lbl}>Degree level</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {DEGREE_OPTIONS.map(opt => (
                  <button key={opt.value} style={{ ...tog, textAlign: 'left', ...(degree === opt.value ? togOn : togOff) }} onClick={() => setDegree(opt.value)}>
                    {opt.label} <span style={{ fontSize: '0.7rem', marginLeft: '0.4rem', opacity: 0.6 }}>{opt.value === 'phd' ? '→ 3 years always' : '→ 2 yrs (before Jan 2027) / 18 months (after)'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Do you have a job offer with sponsorship?</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ ...tog, ...(hasOffer === 'yes' ? togOn : togOff) }} onClick={() => setHasOffer('yes')}>Yes</button>
                <button style={{ ...tog, ...(hasOffer === 'no'  ? togOn : togOff) }} onClick={() => setHasOffer('no')}>Not yet</button>
              </div>
            </div>

            {hasOffer === 'yes' && (
              <div>
                <label style={lbl}>Offered annual salary (£)</label>
                <input style={inp} type="number" placeholder="e.g. 35000" value={offerSalary} onChange={e => setOfferSalary(e.target.value)} min="0" />
                {offerSalary && <div style={{ ...hint, color: Number(offerSalary) >= NEW_ENTRANT_THRESHOLD ? 'rgba(200,255,0,0.7)' : 'rgba(255,77,0,0.7)' }}>{Number(offerSalary) >= NEW_ENTRANT_THRESHOLD ? `✓ Meets the new entrant threshold of ${fmt(NEW_ENTRANT_THRESHOLD)}` : `✗ ${fmt(NEW_ENTRANT_THRESHOLD - Number(offerSalary))} below the new entrant threshold of ${fmt(NEW_ENTRANT_THRESHOLD)}`}</div>}
              </div>
            )}

            <button className="primary-btn" style={{...primaryBtn, marginTop: '0.5rem'}} onClick={handleCheck} disabled={!canProceed}>Calculate my switch window →</button>
          </div>
        </>
      )}

      {step === 'loading' && <DataCompressionLoader steps={STEPS} title="AI is mapping your switch window" subtitle="Cross-referencing Graduate visa rules · Powered by Sponsrr AI" resultLabel={animLabel} />}

      {step === 'result' && result && (
        <>
          <BackBtn onClick={() => setStep('input')} />
          <div style={{ background: '#111', border: `1px solid ${result.alreadyExpired ? 'rgba(255,77,0,0.25)' : result.urgency === 'red' ? 'rgba(255,77,0,0.2)' : result.urgency === 'amber' ? 'rgba(255,200,0,0.2)' : 'rgba(200,255,0,0.2)'}`, borderRadius: 22, padding: '2rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{result.alreadyExpired ? '⛔' : result.urgency === 'red' ? '🚨' : result.urgency === 'amber' ? '⚠️' : '✅'}</div>
            <div style={{ marginBottom: '0.75rem' }}><UrgencyBadge level={result.urgency} /></div>
            {result.alreadyExpired
              ? <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#ff4d00' }}>Graduate Visa Expired</div>
              : <>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: result.urgency === 'green' ? '#c8ff00' : result.urgency === 'amber' ? '#ffc800' : '#ff4d00', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                    {result.daysLeft > 0 ? `${result.daysLeft} days left` : 'Expired'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', marginBottom: '0.5rem' }}>Visa expires {fmtDate(result.expiryDate)}</div>
                  {!result.pastSafeDeadline && <div style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.35)' }}>Safe CoS deadline: <strong style={{ color: '#ffc800' }}>{fmtDate(result.safeDeadline)}</strong></div>}
                </>
            }
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0ede8', marginBottom: '1rem' }}>Your timeline</div>
            <ResultRow label="Graduate visa granted"   value={fmtDate(result.startDate)} />
            <ResultRow label="Visa duration"           value={`${result.visaDurationMonths} months`} color={result.appliedBeforeNewRule ? '#c8ff00' : '#ffc800'} />
            <ResultRow label="18-month rule applies"   value={result.appliedBeforeNewRule ? 'No - applied before Jan 2027' : 'Yes - 18 months only'} color={result.appliedBeforeNewRule ? '#c8ff00' : '#ff4d00'} />
            <ResultRow label="Visa expiry date"        value={fmtDate(result.expiryDate)} color={result.urgency === 'green' ? '#c8ff00' : result.urgency === 'amber' ? '#ffc800' : '#ff4d00'} />
            <ResultRow label="Safe CoS deadline"       value={result.pastSafeDeadline ? 'Passed - act immediately' : fmtDate(result.safeDeadline)} color={result.pastSafeDeadline ? '#ff4d00' : '#ffc800'} />
            {result.hasOffer === 'yes' && result.salaryNum > 0 && <ResultRow label="Salary threshold" value={result.meetsThreshold ? `✓ Meets ${fmt(NEW_ENTRANT_THRESHOLD)} new entrant rate` : `✗ ${fmt(Math.abs(result.salaryGap))} below threshold`} color={result.meetsThreshold ? '#c8ff00' : '#ff4d00'} />}
          </div>

          {result.appliedBeforeNewRule
            ? <InfoBox><strong style={{ color: '#c8ff00', display: 'block', marginBottom: '0.3rem' }}>ℹ The 18-month rule doesn't affect you</strong>You applied before 1 January 2027 so the full 2-year (or 3-year PhD) duration applies.</InfoBox>
            : <InfoBox color="rgba(255,140,0,0.8)" bg="rgba(255,140,0,0.04)" border="rgba(255,140,0,0.2)"><strong style={{ color: '#ff8c00', display: 'block', marginBottom: '0.3rem' }}>⚠ 18-month rule applies to you</strong>Your Graduate visa is 18 months only. Start your job search immediately.</InfoBox>
          }

          <div style={{ marginTop: '1rem', background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)', borderRadius: 22, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>What to do now</div>
            {[
              result.urgency === 'green' && 'You have time - but start now. The average sponsored job search takes 3–6 months.',
              result.urgency === 'amber' && 'Apply immediately - only target companies on the sponsor register. Every week counts.',
              result.urgency === 'red'   && 'This is urgent. Reach out directly to HR teams at licensed sponsors only.',
              result.alreadyExpired      && 'Your visa has expired. Stop working and seek urgent legal advice today.',
              'Only apply to companies on the GOV.UK sponsor register - the Sponsrr directory has all 121,000+',
              result.hasOffer !== 'yes'  && 'Your employer must assign a CoS before your visa expires - not after',
              (result.hasOffer === 'yes' && !result.meetsThreshold) && `Salary needs to increase by ${fmt(Math.abs(result.salaryGap))} to meet the new entrant threshold`,
            ].filter(Boolean).map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                <span style={{ color: '#c8ff00', fontSize: '0.7rem', flexShrink: 0, marginTop: '0.15rem' }}>→</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.55)', lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="primary-btn" style={primaryBtn} onClick={() => navigate('/companies')}>See Directory →</button>
<button className="secondary-btn" style={secondaryBtn} onClick={onBack}>Other tools</button>
          </div>
          <div style={poweredBy}>Based on current Graduate visa rules and proposed 18-month changes · Powered by Sponsrr AI</div>
        </>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 2 - EXTENSION CHECKER
// ══════════════════════════════════════════════════════════════════════════════
function ExtensionChecker({ onBack }) {
  const [step, setStep]       = useState('input');
  const [result, setResult]   = useState(null);
  const [verdict, setVerdict] = useState('pass');
  const [showSocGuide, setShowSocGuide] = useState(false);
  const [cosDate, setCosDate] = useState('');
  const [salary, setSalary]   = useState('');
  const [socCode, setSocCode] = useState('');
  const [selectedSoc, setSelectedSoc] = useState(null);
  const [isHealthCare, setIsHealthCare] = useState('no');
  const [isNewEntrant, setIsNewEntrant] = useState('no');

  useEffect(() => {
    if (socCode.trim().length === 4) { const m = SOC_DATABASE.find(s => s.code === socCode.trim()); setSelectedSoc(m || null); }
    else setSelectedSoc(null);
  }, [socCode]);

  const canProceed = cosDate && salary;

  function getThreshold() {
    const isPreApril2024 = new Date(cosDate) < COS_TRANSITIONAL_CUTOFF;
    if (isHealthCare === 'yes') return { threshold: HEALTH_CARE_THRESHOLD, label: 'Health & Care (NHS pay scale)', note: 'NHS Agenda for Change minimum - £25,000. Extension permitted until at least December 2026.', isPreApril2024 };
    if (isPreApril2024) return { threshold: 31300, label: 'Transitional rate (pre-April 2024 CoS)', note: 'You benefit from the transitional rate of £31,300 because your CoS was issued before 4 April 2024. Valid until at least 1 December 2026.', isPreApril2024 };
    if (isNewEntrant === 'yes') return { threshold: 33400, label: 'New entrant rate', note: 'New entrant threshold of £33,400 or 70% of the going rate - whichever is higher.', isPreApril2024 };
    return { threshold: STANDARD_THRESHOLD, label: 'Standard rate (post-July 2025)', note: 'Standard threshold of £41,700, or the going rate for your SOC code - whichever is higher.', isPreApril2024 };
  }

  function calculate() {
    const salaryNum = Number(salary);
    const { threshold, label, note, isPreApril2024 } = getThreshold();
    const goingRate = selectedSoc?.rate || null;
    const effectiveThreshold = isNewEntrant === 'yes' ? threshold : Math.max(threshold, goingRate || 0);
    const passes  = salaryNum >= effectiveThreshold;
    const gap     = effectiveThreshold - salaryNum;
    const headroom = salaryNum - effectiveThreshold;
    const onTSL   = selectedSoc?.tier === 'medium';
    const vd      = passes ? 'pass' : salaryNum >= effectiveThreshold * 0.9 ? 'borderline' : 'fail';
    setVerdict(vd);
    setResult({ salaryNum, threshold, effectiveThreshold, thresholdLabel: label, thresholdNote: note, passes, gap, headroom, goingRate, isPreApril2024, isHealthCare, isNewEntrant, onTSL, selectedSoc, verdict: vd });
  }

  function handleCheck() {
    const salaryNum = Number(salary);
    const { threshold } = getThreshold();
    const goingRate = selectedSoc?.rate || null;
    const effectiveThreshold = isNewEntrant === 'yes' ? threshold : Math.max(threshold, goingRate || 0);
    const passes = salaryNum >= effectiveThreshold;
    const vd = passes ? 'pass' : salaryNum >= effectiveThreshold * 0.9 ? 'borderline' : 'fail';
    setVerdict(vd);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setStep('loading'), 300);
    setTimeout(() => { calculate(); window.scrollTo({ top: 0, behavior: 'instant' }); setStep('result'); }, 9300);
  }

  const STEPS = [
    { text: 'AI reading your Certificate of Sponsorship date...', label: 'CoS Date' },
    { text: 'Neural engine determining applicable threshold...', label: 'Threshold' },
    { text: 'AI comparing against 2026 extension rules...', label: 'Result' },
  ];

  return (
    <>
      {step === 'input' && (
        <>
          <BackBtn onClick={onBack} />
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>🔄 Extension Checker</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,5vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              Will your salary pass<br /><span style={{ color: '#c8ff00' }}>your extension?</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>Pre-2024 and post-2024 CoS holders get different rates. Find out exactly what applies to you.</p>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={lbl}>Date your Certificate of Sponsorship (CoS) was issued</label>
              <input style={inp} type="date" value={cosDate} onChange={e => setCosDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              {cosDate && <div style={{ ...hint, color: new Date(cosDate) < COS_TRANSITIONAL_CUTOFF ? 'rgba(200,255,0,0.7)' : 'rgba(240,237,232,0.35)' }}>{new Date(cosDate) < COS_TRANSITIONAL_CUTOFF ? '✓ Pre-April 2024 CoS - transitional rates apply (£31,300 not £41,700)' : 'Post-April 2024 CoS - standard 2026 thresholds apply'}</div>}
            </div>

            <div>
              <label style={lbl}>Current annual salary (£)</label>
              <input style={inp} type="number" placeholder="e.g. 38000" value={salary} onChange={e => setSalary(e.target.value)} min="0" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ ...lbl, margin: 0 }}>SOC code</label>
                <button style={socLinkStyle} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setShowSocGuide(true), 400); }}>Find yours →</button>
              </div>
              <input style={inp} type="text" placeholder="e.g. 2134" maxLength={4} value={socCode} onChange={e => setSocCode(e.target.value.replace(/\D/g, ''))} />
              {selectedSoc && <div style={{ ...hint, color: 'rgba(200,255,0,0.7)' }}>✓ {selectedSoc.title} · Going rate {fmt(selectedSoc.rate)}/yr</div>}
            </div>

            <div>
              <label style={lbl}>Are you on the Health & Care Worker visa (NHS / social care)?</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ ...tog, ...(isHealthCare === 'yes' ? togOn : togOff) }} onClick={() => setIsHealthCare('yes')}>Yes</button>
                <button style={{ ...tog, ...(isHealthCare === 'no'  ? togOn : togOff) }} onClick={() => setIsHealthCare('no')}>No</button>
              </div>
            </div>

            {isHealthCare === 'no' && (
              <div>
                <label style={lbl}>Do you qualify as a new entrant? (under 26, or switching from Graduate/Student visa)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ ...tog, ...(isNewEntrant === 'yes' ? togOn : togOff) }} onClick={() => setIsNewEntrant('yes')}>Yes</button>
                  <button style={{ ...tog, ...(isNewEntrant === 'no'  ? togOn : togOff) }} onClick={() => setIsNewEntrant('no')}>No / Not sure</button>
                </div>
              </div>
            )}

            <button className="primary-btn" style={{...primaryBtn, marginTop: '0.5rem'}} onClick={handleCheck} disabled={!canProceed}>Check extension threshold →</button>
          </div>
        </>
      )}

      {step === 'loading' && <WaveformLoader steps={STEPS} title="AI is checking your extension threshold" subtitle="Against 2026 Home Office extension rules · Powered by Sponsrr AI" verdict={verdict} />}

      {step === 'result' && result && (
        <>
          <BackBtn onClick={() => setStep('input')} />
          <div style={{ background: '#111', border: `1px solid ${result.passes ? 'rgba(200,255,0,0.2)' : 'rgba(255,77,0,0.2)'}`, borderRadius: 22, padding: '2rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
  {result.passes ? '✅' : result.verdict === 'borderline' ? '⚠️' : '❌'}
</div>
<div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: result.passes ? '#c8ff00' : result.verdict === 'borderline' ? '#ffc800' : '#ff4d00', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
  {result.passes ? 'Extension Eligible' : result.verdict === 'borderline' ? 'Check Required' : 'Below Threshold'}
</div>
            <div style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.65, maxWidth: 380, margin: '0 auto 1rem' }}>
              {result.passes ? `${fmt(result.salaryNum)} meets the ${result.thresholdLabel} of ${fmt(result.effectiveThreshold)}.` : `${fmt(result.salaryNum)} is ${fmt(result.gap)} below the required ${fmt(result.effectiveThreshold)}.`}
            </div>
            <div style={{ display: 'inline-block', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 100, padding: '0.3rem 0.9rem', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700 }}>{result.thresholdLabel}</div>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0ede8', marginBottom: '1rem' }}>Threshold breakdown</div>
            <ResultRow label="Your salary"          value={fmt(result.salaryNum)} color="#c8ff00" />
            <ResultRow label="Applicable threshold" value={fmt(result.threshold)} />
            {result.goingRate && result.goingRate > result.threshold && <ResultRow label="Going rate (SOC)" value={fmt(result.goingRate)} color="#ffc800" />}
            <ResultRow label="Effective minimum"    value={fmt(result.effectiveThreshold)} color={result.passes ? '#c8ff00' : '#ff4d00'} />
            <ResultRow label={result.passes ? 'Headroom' : 'Shortfall'} value={result.passes ? `+${fmt(result.headroom)}` : `-${fmt(result.gap)}`} color={result.passes ? '#c8ff00' : '#ff4d00'} />
            <ResultRow label="CoS rule applied"     value={result.isPreApril2024 ? 'Pre-April 2024 (transitional)' : 'Post-April 2024 (standard)'} color={result.isPreApril2024 ? '#ffc800' : 'rgba(240,237,232,0.6)'} />
          </div>

          <InfoBox><strong style={{ color: '#c8ff00', display: 'block', marginBottom: '0.3rem' }}>ℹ Why this threshold?</strong>{result.thresholdNote}</InfoBox>

          {result.onTSL && <div style={{ marginTop: '1rem' }}><InfoBox color="rgba(255,140,0,0.8)" bg="rgba(255,140,0,0.04)" border="rgba(255,140,0,0.2)"><strong style={{ color: '#ff8c00', display: 'block', marginBottom: '0.3rem' }}>⚠ Temporary Shortage List role</strong>Extensions permitted until 31 December 2026. The MAC must recommend continuation after this date.</InfoBox></div>}

          {!result.passes && (
            <div style={{ marginTop: '1rem', background: 'rgba(255,77,0,0.04)', border: '1px solid rgba(255,77,0,0.15)', borderRadius: 22, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>How to fix this before extending</div>
              {[`Negotiate a salary increase of at least ${fmt(result.gap)} before your extension application`, result.isNewEntrant === 'no' ? 'Check if you qualify as a new entrant - this could reduce your threshold to £33,400' : null, 'Apply as early as possible - your current conditions remain while the extension is decided', 'Your employer needs to assign a new CoS at the higher salary before you can apply'].filter(Boolean).map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#c8ff00', fontSize: '0.7rem', flexShrink: 0, marginTop: '0.15rem' }}>→</span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.55)', lineHeight: 1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="primary-btn" style={primaryBtn} onClick={() => setStep('input')}>Recalculate →</button>
            <button className="secondary-btn" style={secondaryBtn} onClick={onBack}>Other tools</button>
          </div>
          <div style={poweredBy}>Based on 2026 CoS transitional and standard rates · Powered by Sponsrr AI</div>
        </>
      )}

      {showSocGuide && <SocGuideModal onClose={() => setShowSocGuide(false)} onSelect={soc => { setSelectedSoc(soc); setSocCode(soc.code); setShowSocGuide(false); }} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 3 - ILR TIMELINE
// ══════════════════════════════════════════════════════════════════════════════
function ILRCalculator({ onBack }) {
  const [step, setStep]           = useState('input');
  const [result, setResult]       = useState(null);
  const [visaType, setVisaType]   = useState('');
  const [firstUKDate, setFirstUKDate] = useState('');
  const [salary, setSalary]       = useState('');
  const [roleLevel, setRoleLevel] = useState('');
  const [residenceGaps, setResidenceGaps] = useState('no');

  const canProceed = visaType && firstUKDate && roleLevel;

  function calculate() {
  const startDate = new Date(firstUKDate);
  const today = new Date();
  const salaryNum = Number(salary) || 0;
  const yearsInUK = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
  const hasGaps = residenceGaps === 'yes';

  // Current law - 5-year base
  const qualifyingYears5 = roleLevel === 'below_rfq6' ? 15 : 5;
  const effectiveYears5 = qualifyingYears5 + (hasGaps ? 0.5 : 0);
  const ilrDate5yr = addYears(startDate, effectiveYears5);
  const daysRemaining5 = daysBetween(today, ilrDate5yr);
  const monthsRemaining5 = monthsBetween(today, ilrDate5yr);
  const alreadyEligible = ilrDate5yr <= today;

  // Proposed 10-year rule
  const qualifyingYears10 = salaryNum >= ILR_FAST_TRACK_HIGH ? 3 : salaryNum >= ILR_FAST_TRACK_MID ? 5 : 10;
  const effectiveYears10 = qualifyingYears10 + (hasGaps ? 0.5 : 0);
  const ilrDate10yr = addYears(startDate, effectiveYears10);
  const monthsRemaining10 = monthsBetween(today, ilrDate10yr);
  const tenYrWorse = ilrDate10yr > ilrDate5yr;

  setResult({
    startDate, today, salaryNum, yearsInUK,
    qualifyingYears: qualifyingYears5,
    effectiveYears: effectiveYears5,
    ilrEligibleDate: ilrDate5yr,
    daysRemaining: daysRemaining5,
    monthsRemaining: monthsRemaining5,
    alreadyEligible, hasGaps, roleLevel,
    ilrDate10yr, monthsRemaining10, tenYrWorse,
    fastTrackApplies: salaryNum >= ILR_FAST_TRACK_MID,
  });
}

  function handleCheck() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setStep('loading'), 300);
    setTimeout(() => { calculate(); window.scrollTo({ top: 0, behavior: 'instant' }); setStep('result'); }, 9300);
  }

  const STEPS = [
    { text: 'AI parsing your UK residence and visa history...', label: 'Residence' },
    { text: 'Neural engine applying 2026 ILR qualifying rules...', label: 'ILR Rules' },
    { text: 'AI computing your precise eligibility date...', label: 'Timeline' },
  ];

  return (
    <>
      {step === 'input' && (
        <>
          <BackBtn onClick={onBack} />
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem' }}>🏠 ILR Timeline Calculator</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,5vw,2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              When can you get<br /><span style={{ color: '#c8ff00' }}>permanent residence?</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>Calculate your exact ILR eligibility date and whether the proposed 10-year rule affects you.</p>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={lbl}>Current visa type</label>
              <select style={sel} value={visaType} onChange={e => setVisaType(e.target.value)}>
                {VISA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Date your first UK work visa was granted</label>
              <input style={inp} type="date" value={firstUKDate} onChange={e => setFirstUKDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              {firstUKDate && <div style={hint}>{`You've been on a UK work visa for approximately ${((new Date() - new Date(firstUKDate)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)} years`}</div>}
            </div>

            <div>
              <label style={lbl}>Is your role RQF Level 6 or above? (degree level)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ ...tog, ...(roleLevel === 'rfq6' ? togOn : togOff) }} onClick={() => setRoleLevel('rfq6')}>Yes - degree level</button>
                <button style={{ ...tog, ...(roleLevel === 'below_rfq6' ? togOn : togOff) }} onClick={() => setRoleLevel('below_rfq6')}>No - below degree</button>
              </div>
              {roleLevel === 'below_rfq6' && <div style={{ ...hint, color: 'rgba(255,140,0,0.75)' }}>⚠ From July 2025, below RQF6 roles are restricted. Your ILR route may be significantly longer.</div>}
            </div>

            <div>
              <label style={lbl}>Current annual salary (£) <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>- optional, affects fast-track</span></label>
              <input style={inp} type="number" placeholder="e.g. 55000" value={salary} onChange={e => setSalary(e.target.value)} min="0" />
              {salary && Number(salary) >= ILR_FAST_TRACK_MID && <div style={{ ...hint, color: 'rgba(200,255,0,0.7)' }}>✓ Above £{ILR_FAST_TRACK_MID.toLocaleString()} - may qualify for fast-track settlement under new earned settlement rules</div>}
            </div>

            <div>
              <label style={lbl}>Have you had gaps in continuous UK residence? (180+ days outside UK in any 12-month period)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ ...tog, ...(residenceGaps === 'no'  ? togOn : togOff) }} onClick={() => setResidenceGaps('no')}>No gaps</button>
                <button style={{ ...tog, ...(residenceGaps === 'yes' ? togOn : togOff) }} onClick={() => setResidenceGaps('yes')}>Yes, I had gaps</button>
              </div>
            </div>

            <InfoBox color="rgba(255,140,0,0.8)" bg="rgba(255,140,0,0.04)" border="rgba(255,140,0,0.2)">
              <strong style={{ color: '#ff8c00' }}>⚠ Important:</strong> The government proposed extending ILR from 5 to 10 years from April 2026. Not yet law but may affect you. We'll show both scenarios.
            </InfoBox>

            <button className="primary-btn" style={{...primaryBtn, marginTop: '0.5rem'}} onClick={handleCheck} disabled={!canProceed}>Calculate my ILR date →</button>
          </div>
        </>
      )}

      {step === 'loading' && <BinaryRainLoader steps={STEPS} title="AI is calculating your ILR timeline" subtitle="Cross-referencing Home Office settlement records · Powered by Sponsrr AI" />}

      {step === 'result' && result && (
        <>
          <BackBtn onClick={() => setStep('input')} />
          <div style={{ background: '#111', border: `1px solid ${result.alreadyEligible ? 'rgba(200,255,0,0.25)' : 'rgba(240,237,232,0.08)'}`, borderRadius: 22, padding: '2rem', marginBottom: '1.25rem', textAlign: 'center' }}>
  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{result.alreadyEligible ? '🏠' : '📅'}</div>
  {result.alreadyEligible
    ? <><div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#c8ff00', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>Eligible Now</div><div style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.65 }}>You may already qualify to apply for ILR. Check on Sponsrr first, then verify on GOV.UK.</div></>
    : <>
        {/* Current law */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c8ff00', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>UNDER CURRENT 5-YEAR RULE</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#c8ff00', letterSpacing: '-0.04em', marginBottom: '0.2rem' }}>{fmtDate(result.ilrEligibleDate)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.3rem 0.85rem', borderRadius: 100, fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700 }}>
            {result.monthsRemaining > 0 ? `${result.monthsRemaining} months to go` : 'Eligible now'}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(240,237,232,0.06)', margin: '0 0 1.25rem' }} />

        {/* Proposed 10-year rule */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: result.tenYrWorse ? '#ffc800' : '#c8ff00', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>IF 10-YEAR RULE PASSES</div>
          {result.tenYrWorse
  ? <>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#ffc800', letterSpacing: '-0.04em', marginBottom: '0.2rem' }}>{fmtDate(result.ilrDate10yr)}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.2)', padding: '0.3rem 0.85rem', borderRadius: 100, fontSize: '0.72rem', color: '#ffc800', fontWeight: 700 }}>
        {result.monthsRemaining10 > 0 ? `${result.monthsRemaining10} months to go` : 'Eligible now'}
      </div>
    </>
  : result.ilrDate10yr < result.ilrEligibleDate
    ? <>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#c8ff00', letterSpacing: '-0.04em', marginBottom: '0.2rem' }}>{fmtDate(result.ilrDate10yr)}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.3rem 0.85rem', borderRadius: 100, fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '0.4rem' }}>
          {result.monthsRemaining10 > 0 ? `${result.monthsRemaining10} months to go` : 'Eligible now'}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(200,255,0,0.7)', marginTop: '0.4rem' }}>🚀 Fast-track eligible - better than current rules</div>
      </>
    : <>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#c8ff00', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>Same as above</div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(200,255,0,0.6)' }}>This proposal wouldn't change your timeline</div>
      </>
}
        </div>
      </>
  }
</div>

          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0ede8', marginBottom: '1rem' }}>Your ILR breakdown</div>
            <ResultRow label="UK visa start date"    value={fmtDate(result.startDate)} />
            <ResultRow label="Years in UK so far"    value={`${result.yearsInUK.toFixed(1)} years`} />
            <ResultRow label="Qualifying period"     value={`${result.effectiveYears} years`} color="#c8ff00" />
<ResultRow label="Rule applied"          value={result.roleLevel === 'below_rfq6' ? '15-year route (below RQF6)' : '5-year standard route'} color="#c8ff00" />
            <ResultRow label="Residence gaps"        value={result.hasGaps ? '+6 months added' : 'No gaps - good'} color={result.hasGaps ? '#ffc800' : '#c8ff00'} />
            {result.salaryNum > 0 && <ResultRow label="Salary fast-track" value={result.salaryNum >= ILR_FAST_TRACK_HIGH ? '3-year track eligible' : result.salaryNum >= ILR_FAST_TRACK_MID ? '5-year track eligible' : 'Standard track'} color={result.salaryNum >= ILR_FAST_TRACK_MID ? '#c8ff00' : 'rgba(240,237,232,0.4)'} />}
            <ResultRow label="ILR eligibility date"  value={fmtDate(result.ilrEligibleDate)} color="#c8ff00" />
          </div>

          {result.tenYrWorse
  ? <InfoBox color="rgba(255,140,0,0.8)" bg="rgba(255,140,0,0.04)" border="rgba(255,140,0,0.2)">
      <strong style={{ color: '#ff8c00', display: 'block', marginBottom: '0.35rem' }}>⚠ The proposed 10-year rule would affect you</strong>
      If passed, your ILR date moves from {fmtDate(result.ilrEligibleDate)} to {fmtDate(result.ilrDate10yr)} - {result.monthsRemaining10 - result.monthsRemaining} extra months.
      {result.fastTrackApplies ? ` Your salary qualifies for fast-track - ${result.salaryNum >= ILR_FAST_TRACK_HIGH ? '3-year' : '5-year'} track under the new rules.` : ' Earning above £50,270 would reduce this to 5 years under the proposal.'}
      {' '}Sponsrr updates automatically when the law changes - check here before GOV.UK.
    </InfoBox>
  : <InfoBox>
      <strong style={{ color: '#c8ff00', display: 'block', marginBottom: '0.35rem' }}>✓ Proposed 10-year rule won't affect you</strong>
      Your salary or start date means this proposal wouldn't change your ILR timeline. Sponsrr updates automatically if the law changes - check here before GOV.UK.
    </InfoBox>
}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="primary-btn" style={primaryBtn} onClick={() => setStep('input')}>Recalculate →</button>
            <button className="secondary-btn" style={secondaryBtn} onClick={onBack}>Other tools</button>
          </div>
          <div style={poweredBy}>Based on current and proposed 2026 Home Office rules. Sponsrr updates automatically when the law changes - check here before GOV.UK · Powered by Sponsrr AI</div>
        </>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function Calculator() {
  const navigate = useNavigate();
  const [screen, setScreen]           = useState('home');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setAuthLoading(false);
    }
    check();
  }, [navigate]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [screen]);

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
          @keyframes fu { from{opacity:0} to{opacity:1} }
.fu { animation: fu 0.45s ease forwards; }
          .calc-home-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; align-items:stretch; }
          .tool-card { background:#111; border:1px solid rgba(240,237,232,0.08); border-radius:20px; padding:1.5rem; text-align:left; cursor:pointer; font-family:inherit; transition:all 0.2s ease; display:flex; flex-direction:column; width:100%; position:relative; min-height:280px; }
          .tool-card:hover { border-color:rgba(200,255,0,0.25); transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }
          @media(max-width:768px){ .calc-home-grid{ grid-template-columns:1fr !important; } .tool-card{ min-height:230px !important; } }
          input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.4); cursor:pointer; }
          input:focus, select:focus { border-color:rgba(200,255,0,0.4) !important; outline:none; }
          input::placeholder { color:rgba(240,237,232,0.25); }
          button:disabled { opacity:0.35; cursor:not-allowed; }
          select option { background:#111; color:#f0ede8; }
          .primary-btn:hover { background:#aee600 !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(200,255,0,0.25); }
.secondary-btn:hover { background:rgba(240,237,232,0.08) !important; border-color:rgba(240,237,232,0.7) !important; transform:translateY(-2px); }
        `}</style>

        <div style={{ maxWidth: screen === 'home' ? 920 : 600, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>
          <div className="fu" key={screen}>
            {screen === 'home'      && <HomeScreen onSelect={setScreen} />}
            {screen === 'graduate'  && <GraduateSwitchWindow onBack={() => setScreen('home')} navigate={navigate} />}
            {screen === 'extension' && <ExtensionChecker onBack={() => setScreen('home')} />}
            {screen === 'ilr'       && <ILRCalculator onBack={() => setScreen('home')} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}