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
const HEALTH_CARE_THRESHOLD = 31300;

const CURRENT_VISA_OPTIONS = [
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
  { value: 'none',      label: 'No degree' },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return '—';
  return `£${Number(n).toLocaleString('en-GB')}`;
}

function getNewEntrantStatus({ age, currentVisa, gradYear, ukUniversity, degree }) {
  if (currentVisa === 'graduate') return { qualifies: true, reason: 'You are on a Graduate (PSW) visa — you qualify as a new entrant.' };
  if (currentVisa === 'student')  return { qualifies: true, reason: 'You are on a Student visa — you qualify as a new entrant.' };
  if (currentVisa === 'skilled_worker') return { qualifies: false, reason: 'Skilled Worker visa holders do not qualify as new entrants.' };

  const ageNum = parseInt(age);
  if (!isNaN(ageNum) && ageNum < 26) return { qualifies: true, reason: `At ${ageNum} you qualify as a new entrant (under 26 at time of application).` };

  if (ukUniversity === 'yes' && gradYear) {
    const yearsAgo = new Date().getFullYear() - parseInt(gradYear);
    if (yearsAgo <= 2) return { qualifies: true, reason: `UK graduate within ${yearsAgo <= 1 ? 'the last year' : '2 years'} — qualifies as a new entrant.` };
    if (yearsAgo <= 4) return { qualifies: false, reason: `Graduated ${yearsAgo} years ago. The 2-year graduate window has closed.` };
  }

  if (degree === 'phd_stem' || degree === 'phd_other') {
    return { qualifies: false, reason: 'PhD holders get a reduced threshold but are not classed as new entrants.', phd: true };
  }

  return { qualifies: false, reason: 'Based on the information provided, you do not qualify as a new entrant.' };
}

function getEffectiveThreshold({ newEntrant, isHealthCare, degree, goingRate }) {
  const base = isHealthCare ? HEALTH_CARE_THRESHOLD : newEntrant ? NEW_ENTRANT_THRESHOLD : STANDARD_THRESHOLD;
  let effectiveGoingRate = goingRate || 0;
  if (goingRate) {
    if (newEntrant)                  effectiveGoingRate = Math.round(goingRate * 0.7);
    else if (degree === 'phd_stem')  effectiveGoingRate = Math.round(goingRate * 0.8);
    else if (degree === 'phd_other') effectiveGoingRate = Math.round(goingRate * 0.9);
    else                             effectiveGoingRate = goingRate;
  }
  return Math.max(base, effectiveGoingRate);
}

function getVerdict(salary, required, goingRate) {
  if (!salary || isNaN(salary)) return null;
  if (salary >= (goingRate || 0) && salary >= required) return { pass: true, level: 'excellent', headroom: salary - required };
  if (salary >= required) return { pass: true, level: 'eligible', headroom: salary - required };
  return { pass: false, level: 'fail', gap: required - salary, neededSalary: required };
}

function getTierLabel(tier) {
  if (tier === 'higher')     return { label: 'Higher Skilled — Eligible',    color: '#c8ff00', bg: 'rgba(200,255,0,0.08)',  border: 'rgba(200,255,0,0.2)'  };
  if (tier === 'medium')     return { label: 'Medium Skilled — Restricted',  color: '#ffc800', bg: 'rgba(255,200,0,0.08)',  border: 'rgba(255,200,0,0.2)'  };
  if (tier === 'ineligible') return { label: 'Not Eligible for Sponsorship', color: '#ff4d00', bg: 'rgba(255,77,0,0.08)',   border: 'rgba(255,77,0,0.2)'   };
  return { label: 'Unknown', color: 'rgba(240,237,232,0.4)', bg: 'transparent', border: 'rgba(240,237,232,0.1)' };
}

function getVisaRoute(soc) {
  if (!soc) return 'Skilled Worker';
  if (soc.sector === 'Healthcare & Medical' || soc.sector === 'Social Care') return 'Health & Care Worker';
  if (soc.sector === 'Education') return 'Skilled Worker (Education)';
  return 'Skilled Worker';
}

// ── AI LOADER ─────────────────────────────────────────────────────────────────
function SalaryLoader() {
  const canvasRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [stepsDone, setStepsDone]   = useState([false, false, false]);
  const [fillWidth, setFillWidth]   = useState(0);
  const [complete, setComplete]     = useState(false);

  // 6 seconds total — 3 steps × 2s each
  const STEPS = [
    { text: 'Matching SOC code to Home Office register...', label: 'SOC Match'  },
    { text: 'Fetching going rate for your occupation...',   label: 'Going Rate' },
    { text: 'Comparing against 2026 thresholds...',         label: 'Threshold'  },
  ];
  const STEP_MS = 2000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let rafId, frame = 0;

    const scanBars = [
      { y: H * 0.3,  speed: 1.8, color: 'rgba(200,255,0,0.55)', delay: 0  },
      { y: H * 0.55, speed: 1.3, color: 'rgba(200,255,0,0.35)', delay: 15 },
      { y: H * 0.78, speed: 2.0, color: 'rgba(200,255,0,0.45)', delay: 8  },
    ];

    const markers = [
      { x: W * 0.30, label: 'New entrant' },
      { x: W * 0.55, label: 'Standard'    },
      { x: W * 0.82, label: 'Going rate'  },
    ];

    function draw() {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(240,237,232,0.06)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.9);
      ctx.lineTo(W, H * 0.9);
      ctx.stroke();

      markers.forEach((m, i) => {
        const a = 0.25 + 0.2 * Math.sin(frame * 0.05 + i * 1.2);
        ctx.save();
        ctx.strokeStyle = `rgba(200,255,0,${a})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(m.x, H * 0.15);
        ctx.lineTo(m.x, H * 0.88);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(200,255,0,${a + 0.1})`;
        ctx.font = '600 9px DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, m.x, H * 0.12);
        ctx.restore();
      });

      scanBars.forEach(bar => {
        if (frame < bar.delay) return;
        const progress = ((frame - bar.delay) * bar.speed) % (W * 2.8);
        const bW = 55;
        const xPos = progress - bW;
        if (xPos < W + bW) {
          const g = ctx.createLinearGradient(xPos, 0, xPos + bW, 0);
          g.addColorStop(0, 'transparent');
          g.addColorStop(0.45, bar.color);
          g.addColorStop(0.55, bar.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.fillRect(xPos, bar.y - 2, bW, 4);
          ctx.save();
          ctx.shadowColor = '#c8ff00';
          ctx.shadowBlur = 10;
          ctx.fillStyle = 'rgba(200,255,0,0.9)';
          ctx.fillRect(xPos + bW * 0.45, bar.y - 1, bW * 0.1, 2);
          ctx.restore();
        }
      });

      frame++;
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const timers = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActiveStep(i);
        setStepsDone(prev => { const n = [...prev]; n[i] = true; return n; });
        setFillWidth(((i + 1) / STEPS.length) * 100);
      }, i * STEP_MS));
    });
    timers.push(setTimeout(() => setComplete(true), STEPS.length * STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  const currentText = complete ? 'Analysis complete ✓' : STEPS[activeStep]?.text;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
      <style>{`
        @keyframes ss-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .ss-in { animation: ss-in 0.3s ease forwards; }
        .sp { background:rgba(240,237,232,0.03); border:1px solid rgba(240,237,232,0.07); border-radius:100px; padding:0.28rem 0.7rem; font-size:0.62rem; font-weight:600; color:rgba(240,237,232,0.2); white-space:nowrap; transition:all 0.5s ease; }
        .sp.done { background:rgba(200,255,0,0.08); border-color:rgba(200,255,0,0.25); color:rgba(200,255,0,0.8); }
        .pl { display:none; flex-direction:column; gap:0.6rem; width:100%; max-width:360px; }
        .pl-track { position:relative; height:2px; background:rgba(240,237,232,0.08); border-radius:100px; margin:0 10px; }
        .pl-fill { position:absolute; left:0;top:0;bottom:0; background:#c8ff00; border-radius:100px; box-shadow:0 0 8px rgba(200,255,0,0.7); transition:width 2s linear; }
        .pl-dots { display:flex; justify-content:space-between; margin-top:-6px; padding:0 7px; }
        .pl-dot { width:9px;height:9px; border-radius:50%; background:rgba(240,237,232,0.12); border:2px solid #080808; transition:all 0.4s; flex-shrink:0; }
        .pl-dot.on { background:#c8ff00; box-shadow:0 0 8px rgba(200,255,0,0.9); }
        .pl-lbls { display:flex; justify-content:space-between; padding:0 4px; }
        .pl-lbl { font-size:0.6rem; font-weight:600; color:rgba(240,237,232,0.2); transition:color 0.4s; text-align:center; flex:1; }
        .pl-lbl.on { color:rgba(200,255,0,0.7); }
        @media(min-width:600px){ .mob-pills{display:none!important} .pl{display:flex!important} }
        @media(max-width:599px){ .pl{display:none!important} .mob-pills{display:flex!important} }
      `}</style>

      <div style={{ position: 'relative', width: 280, height: 90 }}>
        <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(ellipse, rgba(200,255,0,0.07) 0%, transparent 70%)', filter: 'blur(14px)' }} />
        <canvas ref={canvasRef} width={280} height={90} style={{ position: 'relative', zIndex: 2 }} />
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#f0ede8', letterSpacing: '-0.02em' }}>AI is checking your salary</div>
        <div key={currentText} className="ss-in" style={{ fontSize: '0.78rem', fontWeight: 600, color: complete ? '#c8ff00' : 'rgba(200,255,0,0.65)', minHeight: '1.2em' }}>{currentText}</div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.25)' }}>Against 2026 Home Office thresholds</div>
      </div>

      <div className="mob-pills" style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
        {STEPS.map((s, i) => <div key={i} className={`sp${stepsDone[i] ? ' done' : ''}`}>{stepsDone[i] ? '✓ ' : ''}{s.label}</div>)}
      </div>

      <div className="pl">
        <div style={{ position: 'relative' }}>
          <div className="pl-track"><div className="pl-fill" style={{ width: `${fillWidth}%` }} /></div>
          <div className="pl-dots">{STEPS.map((_, i) => <div key={i} className={`pl-dot${stepsDone[i] ? ' on' : ''}`} />)}</div>
        </div>
        <div className="pl-lbls">{STEPS.map((s, i) => <div key={i} className={`pl-lbl${stepsDone[i] ? ' on' : ''}`}>{s.label}</div>)}</div>
      </div>
    </div>
  );
}

// ── THRESHOLD BAR ─────────────────────────────────────────────────────────────
// Salary pill removed — dot on track shows position, legend below shows values
function ThresholdBar({ salary, goingRate, newEntrantThreshold, standardThreshold }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 400); return () => clearTimeout(t); }, []);

  const maxVal = Math.max(goingRate || 0, salary || 0, standardThreshold || 0) * 1.2;
  const pct = val => Math.min(95, Math.max(2, (val / maxVal) * 100));
  const pass = salary >= standardThreshold;
  const dotColor = pass ? '#c8ff00' : '#ff4d00';

  // Build markers for the track
  const markers = [];
  if (newEntrantThreshold && newEntrantThreshold !== standardThreshold) {
    markers.push({ val: newEntrantThreshold, color: '#4dd9ff', label: 'New entrant' });
  }
  markers.push({ val: standardThreshold, color: '#c8ff00', label: 'Standard' });
  if (goingRate && goingRate > standardThreshold) {
    markers.push({ val: goingRate, color: '#ff8c00', label: 'Going rate' });
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Track */}
      <div style={{ position: 'relative', height: 28, marginBottom: '0.75rem' }}>
        {/* Base line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 6, background: 'rgba(240,237,232,0.06)', borderRadius: 100 }} />

        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          height: 6, borderRadius: 100,
          width: animated ? `${pct(salary || 0)}%` : '0%',
          background: pass
            ? 'linear-gradient(90deg, rgba(200,255,0,0.25), #c8ff00)'
            : 'linear-gradient(90deg, rgba(255,77,0,0.25), #ff4d00)',
          boxShadow: `0 0 8px ${dotColor}44`,
          transition: 'width 1.3s cubic-bezier(0.34,1.56,0.64,1)',
        }} />

        {/* Threshold tick marks */}
        {markers.map((m, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${pct(m.val)}%`,
            top: '50%', transform: 'translate(-50%, -50%)',
            width: 2, height: 14,
            background: m.color,
            borderRadius: 1,
          }} />
        ))}

        {/* Salary position dot — no pill label */}
        <div style={{
          position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
          left: animated ? `${pct(salary || 0)}%` : '0%',
          transition: 'left 1.3s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 3,
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 12px ${dotColor}`,
            border: '2px solid #111',
          }} />
        </div>
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'rgba(240,237,232,0.2)', marginBottom: '0.85rem' }}>
        <span>£0</span>
        <span>{fmt(Math.round(maxVal))}</span>
      </div>

      {/* Legend below — no overlap possible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {/* Your salary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.55)', flex: 1 }}>Your salary</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: dotColor }}>{fmt(salary)}</span>
        </div>
        {/* Threshold markers */}
        {markers.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 2, height: 12, background: m.color, borderRadius: 1, flexShrink: 0, marginLeft: 4 }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', flex: 1 }}>{m.label} threshold</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: m.color }}>{fmt(m.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SalaryChecker() {
  const navigate = useNavigate();
  const [step, setStep]               = useState('input');
  const [showSocGuide, setShowSocGuide] = useState(false);
  const [isPaid, setIsPaid]           = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [jobTitle, setJobTitle]         = useState('');
  const [socCode, setSocCode]           = useState('');
  const [selectedSoc, setSelectedSoc]   = useState(null);
  const [salary, setSalary]             = useState('');
  const [age, setAge]                   = useState('');
  const [currentVisa, setCurrentVisa]   = useState('');
  const [degree, setDegree]             = useState('');
  const [ukUniversity, setUkUniversity] = useState('');
  const [gradYear, setGradYear]         = useState('');
  const [university, setUniversity]     = useState('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data: sub } = await supabase.from('subscriptions').select('plan,status').eq('user_id', user.id).in('status', ['active','trialing']).limit(1).single();
      setIsPaid(!!sub);
      setAuthLoading(false);
    }
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (socCode.trim().length === 4) {
      const match = SOC_DATABASE.find(s => s.code === socCode.trim());
      if (match) { setSelectedSoc(match); setJobTitle(match.title); }
      else setSelectedSoc(null);
    } else if (socCode.length < 4) {
      setSelectedSoc(null);
    }
  }, [socCode]);

  const neStatus  = getNewEntrantStatus({ age, currentVisa, gradYear, ukUniversity, degree });
  const salaryNum = Number(salary);
  const isHealthCare = selectedSoc?.sector === 'Healthcare & Medical' || selectedSoc?.sector === 'Social Care';
  const required  = getEffectiveThreshold({ newEntrant: neStatus.qualifies, isHealthCare, degree, goingRate: selectedSoc?.rate });
  const verdict   = step === 'result' ? getVerdict(salaryNum, required, selectedSoc?.rate) : null;
  const tierInfo  = selectedSoc ? getTierLabel(selectedSoc.tier) : null;
  const visaRoute = getVisaRoute(selectedSoc);

  function handleSocSelect(soc) { setSelectedSoc(soc); setJobTitle(soc.title); setSocCode(soc.code); }

  function handleCheck() {
    if (!isPaid) { setShowUpgrade(true); return; }
    if (!salary || isNaN(Number(salary))) return;
    // Scroll to top before switching step so animation is centred
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Delay step change so scroll completes before animation mounts
    setTimeout(() => setStep('loading'), 300);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setStep('result');
    }, 6300); // 6s animation + 300ms scroll delay
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
          @keyframes ri { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
          .fu  { animation: fu 0.5s ease forwards; }
          .fu2 { animation: fu 0.5s 0.1s ease both; }
          .fu3 { animation: fu 0.5s 0.2s ease both; }
          .ri  { animation: ri 0.5s ease forwards; }
          .fl { font-size:0.76rem; font-weight:600; color:rgba(240,237,232,0.55); margin-bottom:0.5rem; display:block; }
          .fi { background:rgba(240,237,232,0.06); border:1px solid rgba(240,237,232,0.1); border-radius:12px; padding:0.8rem 1rem; color:#f0ede8; font-size:0.88rem; font-family:inherit; outline:none; width:100%; transition:border-color 0.2s; }
          .fi:focus { border-color:rgba(200,255,0,0.4); }
          .fi::placeholder { color:rgba(240,237,232,0.25); }
          .fs { background:rgba(240,237,232,0.06); border:1px solid rgba(240,237,232,0.1); border-radius:12px; padding:0.8rem 2.2rem 0.8rem 1rem; color:#f0ede8; font-size:0.88rem; font-family:inherit; outline:none; width:100%; appearance:none; cursor:pointer; }
          .fs:focus { border-color:rgba(200,255,0,0.4); }
          .sw { position:relative; }
          .sw::after { content:'↓'; position:absolute; right:0.9rem; top:50%; transform:translateY(-50%); color:rgba(240,237,232,0.3); font-size:0.72rem; pointer-events:none; }
          .sl { background:none; border:none; color:rgba(200,255,0,0.7); font-size:0.72rem; font-weight:600; cursor:pointer; font-family:inherit; text-decoration:underline; text-underline-offset:3px; padding:0; }
          .sl:hover { color:#c8ff00; }
          .cb { background:#c8ff00; color:#080808; border:none; border-radius:100px; padding:0.85rem 2rem; font-family:'DM Sans',sans-serif; font-weight:700; font-size:0.92rem; cursor:pointer; width:100%; transition:background 0.2s,transform 0.15s; }
          .cb:hover { background:#aee600; transform:translateY(-1px); }
          .cb:disabled { opacity:0.35; cursor:not-allowed; transform:none; }
          .tb { flex:1; padding:0.65rem; border-radius:10px; font-size:0.82rem; font-weight:600; font-family:inherit; cursor:pointer; transition:all 0.2s; }
          .tb.on  { background:#c8ff00; color:#080808; border:1px solid #c8ff00; }
          .tb.off { background:rgba(240,237,232,0.04); color:rgba(240,237,232,0.5); border:1px solid rgba(240,237,232,0.1); }
          .bdr { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid rgba(240,237,232,0.05); }
          .bdr:last-child { border-bottom:none; }
          .bdl { font-size:0.72rem; color:rgba(240,237,232,0.4); font-weight:500; }
          .bdv { font-size:0.82rem; font-weight:700; font-family:'Syne',sans-serif; text-align:right; }
          .hint { font-size:0.7rem; margin-top:0.4rem; line-height:1.5; }
        `}</style>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>

          {/* ── INPUT ── */}
          {step === 'input' && (
            <>
              <div className="fu" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, letterSpacing: '0.05em' }}>
                    💷 AI-Powered · 2026 Thresholds
                  </div>
                </div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                  Salary Threshold<br /><span style={{ color: '#c8ff00' }}>Checker</span>
                </h1>
                <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>
                  Does your salary qualify for a UK Skilled Worker visa? Find out in seconds.
                </p>
              </div>

              <div className="fu2" style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* SOC code — no "optional" label */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="fl" style={{ margin: 0 }}>SOC code</label>
                    <button className="sl" onClick={() => setShowSocGuide(true)}>Don't know yours? Open SOC guide →</button>
                  </div>
                  <input className="fi" type="text" placeholder="e.g. 2134" maxLength={4} value={socCode}
                    onChange={e => setSocCode(e.target.value.replace(/\D/g, ''))} />
                  {selectedSoc && (
                    <div className="hint" style={{ color: 'rgba(200,255,0,0.7)' }}>
                      ✓ Matched: {selectedSoc.title} · Going rate {fmt(selectedSoc.rate)}/yr
                    </div>
                  )}
                </div>

                {/* Job title */}
                <div>
                  <label className="fl">Job title</label>
                  <input className="fi" type="text" placeholder="e.g. Software Engineer, Staff Nurse, Solicitor..." value={jobTitle}
                    onChange={e => { setJobTitle(e.target.value); if (!socCode) setSelectedSoc(null); }} />
                </div>

                {/* Salary */}
                <div>
                  <label className="fl">Annual salary offered (£)</label>
                  <input className="fi" type="number" placeholder="e.g. 45000" value={salary} onChange={e => setSalary(e.target.value)} min="0" />
                </div>

                {/* Age */}
                <div>
                  <label className="fl">Your age</label>
                  <input className="fi" type="number" placeholder="e.g. 24" value={age} onChange={e => setAge(e.target.value)} min="16" max="70" />
                  {age && !isNaN(parseInt(age)) && (
                    <div className="hint" style={{ color: parseInt(age) < 26 ? 'rgba(200,255,0,0.7)' : 'rgba(240,237,232,0.35)' }}>
                      {parseInt(age) < 26 ? '✓ Under 26 — qualifies as a new entrant' : 'Over 26 — eligibility depends on visa or graduate status below'}
                    </div>
                  )}
                </div>

                {/* Current visa */}
                <div>
                  <label className="fl">Current UK visa</label>
                  <div className="sw">
                    <select className="fs" value={currentVisa} onChange={e => setCurrentVisa(e.target.value)}>
                      {CURRENT_VISA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {currentVisa && (
                    <div className="hint" style={{ color: (currentVisa === 'graduate' || currentVisa === 'student') ? 'rgba(200,255,0,0.7)' : currentVisa === 'skilled_worker' ? 'rgba(255,77,0,0.7)' : 'rgba(240,237,232,0.35)' }}>
                      {currentVisa === 'graduate'       && '✓ Graduate (PSW) visa — qualifies as new entrant'}
                      {currentVisa === 'student'        && '✓ Student visa — qualifies as new entrant'}
                      {currentVisa === 'skilled_worker' && '✗ Skilled Worker visa — does not qualify as new entrant'}
                      {currentVisa === 'health_care'    && 'Health & Care route — separate lower thresholds apply'}
                      {currentVisa === 'no_uk_visa'     && 'Age and education will determine new entrant eligibility'}
                      {currentVisa === 'other'          && 'Check with an immigration adviser for your specific route'}
                    </div>
                  )}
                </div>

                {/* Degree */}
                <div>
                  <label className="fl">Highest qualification</label>
                  <div className="sw">
                    <select className="fs" value={degree} onChange={e => setDegree(e.target.value)}>
                      {DEGREE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {(degree === 'phd_stem' || degree === 'phd_other') && (
                    <div className="hint" style={{ color: 'rgba(200,255,0,0.7)' }}>
                      ✓ PhD discount applies — {degree === 'phd_stem' ? '80% of going rate or £33,400 minimum' : '90% of going rate or £37,500 minimum'}
                    </div>
                  )}
                </div>

                {/* UK university */}
                {degree && degree !== 'none' && (
                  <div>
                    <label className="fl">Did you study at a UK university?</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className={`tb ${ukUniversity === 'yes' ? 'on' : 'off'}`} onClick={() => setUkUniversity('yes')}>Yes</button>
                      <button className={`tb ${ukUniversity === 'no'  ? 'on' : 'off'}`} onClick={() => setUkUniversity('no')}>No</button>
                    </div>
                  </div>
                )}

                {/* University + grad year */}
                {ukUniversity === 'yes' && (
                  <>
                    <div>
                      <label className="fl">University name <span style={{ fontWeight: 400, color: 'rgba(240,237,232,0.3)' }}>(Optional)</span></label>
                      <input className="fi" type="text" placeholder="e.g. University of Manchester" value={university} onChange={e => setUniversity(e.target.value)} />
                    </div>
                    <div>
                      <label className="fl">Year of graduation</label>
                      <input className="fi" type="number" placeholder="e.g. 2023" value={gradYear} onChange={e => setGradYear(e.target.value)} min="2000" max={new Date().getFullYear()} />
                      {gradYear && (
                        <div className="hint" style={{ color: (() => { const y = new Date().getFullYear() - parseInt(gradYear); return y <= 2 ? 'rgba(200,255,0,0.7)' : 'rgba(240,237,232,0.35)'; })() }}>
                          {(() => {
                            const y = new Date().getFullYear() - parseInt(gradYear);
                            if (y <= 0) return '✓ Current student — qualifies as a new entrant';
                            if (y <= 2) return `✓ Graduated ${y <= 1 ? 'within the last year' : '2 years ago'} — qualifies as a new entrant`;
                            return `Graduated ${y} years ago — the 2-year graduate window has closed`;
                          })()}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* New entrant summary */}
                <div style={{ background: neStatus.qualifies ? 'rgba(200,255,0,0.05)' : 'rgba(240,237,232,0.03)', border: `1px solid ${neStatus.qualifies ? 'rgba(200,255,0,0.2)' : 'rgba(240,237,232,0.08)'}`, borderRadius: 12, padding: '0.9rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: neStatus.qualifies ? '#c8ff00' : 'rgba(240,237,232,0.4)', marginBottom: '0.25rem' }}>
                    {neStatus.qualifies ? '✓ New Entrant — Eligible' : '◎ New Entrant — Not Eligible'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.55 }}>{neStatus.reason}</div>
                  {neStatus.qualifies && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: 'rgba(200,255,0,0.6)' }}>
                      Your threshold: {fmt(NEW_ENTRANT_THRESHOLD)} or 70% of going rate — whichever is higher
                    </div>
                  )}
                </div>

                <button className="cb" onClick={handleCheck} disabled={!salary || !jobTitle.trim()}>
                  Check my salary →
                </button>

                {!isPaid && (
                  <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(240,237,232,0.3)' }}>
                    🔒 Full results require Monthly plan or above
                  </div>
                )}
              </div>

              <div className="fu3" style={{ marginTop: '1rem', background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.1)', borderRadius: 14, padding: '0.85rem 1.1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.65 }}>
                  <strong style={{ color: 'rgba(200,255,0,0.65)' }}>2026 thresholds:</strong> Standard £41,700 · New entrant £33,400 · Health & Care £31,300. Going rates vary by SOC code and are updated annually by the Home Office.
                </div>
              </div>
            </>
          )}

          {/* ── LOADING ── */}
          {step === 'loading' && <SalaryLoader />}

          {/* ── RESULT ── */}
          {step === 'result' && verdict && (
            <div className="ri">
              <button onClick={() => { setStep('input'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0 }}>
                ← Check another salary
              </button>

              {/* Verdict */}
              <div style={{ background: '#111', border: `1px solid ${verdict.pass ? 'rgba(200,255,0,0.2)' : 'rgba(255,77,0,0.2)'}`, borderRadius: 22, padding: '2rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{verdict.pass ? '✅' : '❌'}</div>

                {verdict.level === 'excellent' && (
                  <>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#c8ff00', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Excellent</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0ede8', marginTop: '0.25rem', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Above Going Rate</div>
                  </>
                )}
                {verdict.level === 'eligible' && (
                  <>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#c8ff00', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Eligible</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0ede8', marginTop: '0.25rem', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Meets Threshold</div>
                  </>
                )}
                {verdict.level === 'fail' && (
                  <>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.7rem', color: '#ff4d00', letterSpacing: '-0.04em', lineHeight: 1.1 }}>Below Threshold</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0ede8', marginTop: '0.25rem', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Visa Not Possible at This Salary</div>
                  </>
                )}

                <p style={{ fontSize: '0.84rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 380, margin: '0 auto 1.5rem' }}>
                  {verdict.pass
                    ? verdict.level === 'excellent'
                      ? `${fmt(salaryNum)} exceeds the going rate. Sponsors will find you straightforward to hire.`
                      : `${fmt(salaryNum)} meets the ${neStatus.qualifies ? 'new entrant' : 'standard'} threshold. You are eligible for sponsorship.`
                    : `${fmt(salaryNum)} is ${fmt(verdict.gap)} below the required threshold. You would need at least ${fmt(verdict.neededSalary)}.`
                  }
                </p>

                {/* LinkedIn share only — copy button removed */}
                <button onClick={() => {
                  const text = verdict.pass
                    ? `Just checked my salary on Sponsrr — I ${verdict.level === 'excellent' ? 'exceed the going rate' : 'meet the threshold'} for a UK Skilled Worker visa 🇬🇧 sponsrr.com`
                    : `Used Sponsrr to check my salary — need ${fmt(verdict.gap)} more to meet the UK visa threshold. sponsrr.com`;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://sponsrr.com')}&summary=${encodeURIComponent(text)}`, '_blank');
                }} style={{ background: '#0A66C2', color: '#fff', border: 'none', borderRadius: '100px', padding: '0.65rem 1.6rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  in Share on LinkedIn
                </button>
              </div>

              {/* Threshold bar — no floating pill, legend below */}
              <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '0.3rem' }}>Where your salary sits</div>
                {selectedSoc && <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.3)', marginBottom: '1rem' }}>SOC {selectedSoc.code} · {selectedSoc.title}</div>}
                <ThresholdBar
                  salary={salaryNum}
                  goingRate={selectedSoc?.rate}
                  newEntrantThreshold={neStatus.qualifies ? NEW_ENTRANT_THRESHOLD : null}
                  standardThreshold={isHealthCare ? HEALTH_CARE_THRESHOLD : neStatus.qualifies ? NEW_ENTRANT_THRESHOLD : STANDARD_THRESHOLD}
                />
              </div>

              {/* Breakdown */}
              <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>Breakdown</div>
                {[
                  { label: 'Your salary',           value: fmt(salaryNum),                                 color: '#c8ff00'                },
                  { label: 'Required threshold',     value: fmt(required),                                  color: '#f0ede8'                },
                  { label: 'SOC going rate',         value: selectedSoc?.rate ? fmt(selectedSoc.rate) : '—', color: '#f0ede8'              },
                  { label: 'New entrant threshold',  value: fmt(NEW_ENTRANT_THRESHOLD),                     color: '#f0ede8'                },
                  { label: 'Visa route',             value: visaRoute,                                      color: '#f0ede8'                },
                  { label: 'New entrant status',     value: neStatus.qualifies ? '✓ Eligible' : 'Not eligible', color: neStatus.qualifies ? '#c8ff00' : 'rgba(240,237,232,0.4)' },
                  { label: verdict.pass ? 'Headroom' : 'Shortfall', value: verdict.pass ? `+${fmt(verdict.headroom)}` : `-${fmt(verdict.gap)}`, color: verdict.pass ? '#c8ff00' : '#ff4d00' },
                  { label: 'SOC code',               value: selectedSoc ? `SOC ${selectedSoc.code}` : 'Not matched', color: '#f0ede8'    },
                  selectedSoc ? { label: 'Occupation eligibility', value: tierInfo?.label || '—', color: tierInfo?.color || '#f0ede8' } : null,
                ].filter(Boolean).map(item => (
                  <div key={item.label} className="bdr">
                    <span className="bdl">{item.label}</span>
                    <span className="bdv" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Fail tips */}
              {!verdict.pass && (
                <div style={{ background: 'rgba(255,77,0,0.04)', border: '1px solid rgba(255,77,0,0.15)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#f0ede8', marginBottom: '1rem' }}>How to fix this</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {[
                      `Negotiate your offer to at least ${fmt(verdict.neededSalary)}`,
                      !neStatus.qualifies && parseInt(age) >= 26 ? `If you hold or recently held a Graduate or Student visa, your threshold drops to ${fmt(NEW_ENTRANT_THRESHOLD)}` : null,
                      `Target larger companies — they typically offer salaries above the going rate`,
                      !(degree === 'phd_stem' || degree === 'phd_other') ? `A relevant STEM PhD reduces your threshold to ${fmt(33400)} minimum` : null,
                    ].filter(Boolean).map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#c8ff00', fontSize: '0.7rem', flexShrink: 0, marginTop: '0.15rem' }}>→</span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.55)', lineHeight: 1.6 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button onClick={() => navigate('/jobs')}
  onMouseEnter={e => { e.currentTarget.style.background='#aee600'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(200,255,0,0.25)'; }}
  onMouseLeave={e => { e.currentTarget.style.background='#c8ff00'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
  style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 14, padding: '0.9rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
  Matching jobs →
</button>
<button onClick={() => navigate('/score')}
  onMouseEnter={e => { e.currentTarget.style.background='rgba(240,237,232,0.08)'; e.currentTarget.style.borderColor='rgba(240,237,232,0.7)'; e.currentTarget.style.transform='translateY(-2px)'; }}
  onMouseLeave={e => { e.currentTarget.style.background='rgba(240,237,232,0.05)'; e.currentTarget.style.borderColor='rgba(240,237,232,0.1)'; e.currentTarget.style.transform='translateY(0)'; }}
  style={{ background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 14, padding: '0.9rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
  Check Sponsrr Score
</button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.2)' }}>
                Based on 2026 Home Office going rates · Powered by Sponsrr AI
              </div>
            </div>
          )}
        </div>

        {showSocGuide && <SocGuideModal onClose={() => setShowSocGuide(false)} onSelect={handleSocSelect} />}

        {showUpgrade && (
          <>
            <div onClick={() => setShowUpgrade(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '24px 24px 0 0', padding: '2rem 1.5rem 3rem', zIndex: 2001, maxWidth: 520, margin: '0 auto' }}>
              <div style={{ width: 40, height: 4, background: 'rgba(240,237,232,0.15)', borderRadius: 2, margin: '0 auto 1.5rem' }} />
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem' }}>💷</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#f0ede8', marginBottom: '0.4rem' }}>Unlock Salary Checker</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65 }}>Full threshold analysis, SOC going rates, new entrant calculator and actionable tips. Monthly plan and above.</div>
              </div>
              <button onClick={() => { setShowUpgrade(false); navigate('/pricing'); }}
                style={{ width: '100%', background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.9rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                Unlock now · £3.49/mo →
              </button>
              <button onClick={() => setShowUpgrade(false)}
                style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(240,237,232,0.35)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}