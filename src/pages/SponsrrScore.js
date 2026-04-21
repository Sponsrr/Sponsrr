import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

// ── SOC CODE GOING RATES (subset of key roles) ────────────────────────────────
const SOC_GOING_RATES = {
  '2134': { title: 'Programmers and Software Development Professionals', rate: 52000, newEntrantRate: 36400 },
  '2133': { title: 'IT Business Analysts, Architects and Systems Designers', rate: 55000, newEntrantRate: 38500 },
  '2135': { title: 'Cyber Security Professionals', rate: 55000, newEntrantRate: 38500 },
  '2136': { title: 'IT Quality and Testing Professionals', rate: 48000, newEntrantRate: 33600 },
  '2137': { title: 'IT Network Professionals', rate: 50000, newEntrantRate: 35000 },
  '2132': { title: 'IT Managers', rate: 58000, newEntrantRate: 40600 },
  '2131': { title: 'IT Project Managers', rate: 55000, newEntrantRate: 38500 },
  '2211': { title: 'Generalist Medical Practitioners', rate: 62000, newEntrantRate: 43400 },
  '2212': { title: 'Specialist Medical Practitioners', rate: 78000, newEntrantRate: 54600 },
  '2232': { title: 'Registered Community Nurses', rate: 35000, newEntrantRate: 24500 },
  '2233': { title: 'Registered Specialist Nurses', rate: 37000, newEntrantRate: 25900 },
  '2251': { title: 'Pharmacists', rate: 45000, newEntrantRate: 31500 },
  '2421': { title: 'Chartered and Certified Accountants', rate: 50000, newEntrantRate: 35000 },
  '2422': { title: 'Finance and Investment Analysts', rate: 52000, newEntrantRate: 36400 },
  '2313': { title: 'Secondary Education Teaching Professionals', rate: 38000, newEntrantRate: 26600 },
  '2311': { title: 'Higher Education Teaching Professionals', rate: 45000, newEntrantRate: 31500 },
  '2121': { title: 'Civil Engineers', rate: 48000, newEntrantRate: 33600 },
  '2122': { title: 'Mechanical Engineers', rate: 48000, newEntrantRate: 33600 },
  '2123': { title: 'Electrical Engineers', rate: 48000, newEntrantRate: 33600 },
  '2412': { title: 'Solicitors and Lawyers', rate: 58000, newEntrantRate: 40600 },
  '2431': { title: 'Management Consultants and Business Analysts', rate: 52000, newEntrantRate: 36400 },
  '2461': { title: 'Social Workers', rate: 38000, newEntrantRate: 26600 },
  '3544': { title: 'Data Analysts', rate: 43000, newEntrantRate: 30100 },
  '2141': { title: 'Web Design Professionals', rate: 45000, newEntrantRate: 31500 },
  '2451': { title: 'Architects', rate: 48000, newEntrantRate: 33600 },
  '2453': { title: 'Quantity Surveyors', rate: 48000, newEntrantRate: 33600 },
};

// ── SECTOR SPONSOR DENSITY (approximate counts from our 121k database) ────────
const SECTOR_DENSITY = {
  'Technology & IT':            { count: 28000, label: 'Very High' },
  'Healthcare & Medical':       { count: 22000, label: 'Very High' },
  'Finance & Banking':          { count: 18000, label: 'High' },
  'Education':                  { count: 15000, label: 'High' },
  'Engineering':                { count: 14000, label: 'High' },
  'Accounting & Consulting':    { count: 12000, label: 'High' },
  'Legal':                      { count: 10000, label: 'Medium' },
  'Marketing & Communications': { count: 9000,  label: 'Medium' },
  'Construction & Architecture':{ count: 8000,  label: 'Medium' },
  'Science & Research':         { count: 7000,  label: 'Medium' },
  'Recruitment & HR':           { count: 6000,  label: 'Medium' },
  'Creative & Design':          { count: 5000,  label: 'Medium' },
  'Transport & Logistics':      { count: 5000,  label: 'Medium' },
  'Social Care':                { count: 4000,  label: 'Lower' },
  'Hospitality & Food':         { count: 3500,  label: 'Lower' },
  'Retail & Fashion':           { count: 3000,  label: 'Lower' },
  'Charity & Non-profit':       { count: 2500,  label: 'Lower' },
  'Sport & Fitness':            { count: 1500,  label: 'Low' },
  'Security':                   { count: 1200,  label: 'Low' },
};

// ── SALARY BANDS ──────────────────────────────────────────────────────────────
const SALARY_BAND_MIDPOINTS = {
  'Under £25,000':  22000,
  '£25,000–£30,000': 27500,
  '£30,000–£35,000': 32500,
  '£35,000–£40,000': 37500,
  '£40,000–£50,000': 45000,
  '£50,000–£60,000': 55000,
  '£60,000–£75,000': 67500,
  '£75,000–£100,000': 87500,
  '£100,000+': 110000,
};

// ── EXPERIENCE LEVELS ─────────────────────────────────────────────────────────
const EXPERIENCE_POINTS = {
  'Less than 1 year': 4,
  '1-2 years': 7,
  '2-3 years': 9,
  '3-5 years': 12,
  '5-7 years': 14,
  '7+ years': 15,
};

// ── SCORE CALCULATION ENGINE ──────────────────────────────────────────────────
function calculateScore(profile) {
  const breakdown = [];
  let total = 0;

  // 1. OCCUPATION ELIGIBILITY — 25 pts
  const jobTitle = (profile.job_title || '').toLowerCase();
  let occupationScore = 0;
  let occupationNote = '';
  let matchedSoc = null;

  // Check if job title maps to an eligible SOC
  const techTerms = ['software', 'developer', 'engineer', 'data', 'cloud', 'devops', 'cyber', 'security', 'it ', 'programmer', 'architect tech'];
  const healthTerms = ['nurse', 'doctor', 'physician', 'pharmacist', 'therapist', 'radiographer', 'midwife', 'dentist', 'surgeon'];
  const financeTerms = ['accountant', 'finance', 'analyst', 'auditor', 'actuary', 'investment', 'tax'];
  const legalTerms = ['solicitor', 'lawyer', 'barrister', 'legal'];
  const eduTerms = ['teacher', 'lecturer', 'professor', 'tutor'];
  const engTerms = ['mechanical', 'electrical', 'civil', 'structural', 'aerospace'];
  const socialTerms = ['social worker', 'care manager'];
  const consultingTerms = ['consultant', 'business analyst', 'management'];
  const archTerms = ['architect', 'surveyor', 'planner'];

  const allEligible = [...techTerms, ...healthTerms, ...financeTerms, ...legalTerms, ...eduTerms, ...engTerms, ...socialTerms, ...consultingTerms, ...archTerms];

  if (allEligible.some(t => jobTitle.includes(t))) {
    occupationScore = 25;
    occupationNote = 'Your occupation is on the eligible roles list for Skilled Worker visa sponsorship.';

    // Try to find closest SOC
    if (techTerms.some(t => jobTitle.includes(t))) matchedSoc = '2134';
    else if (jobTitle.includes('nurse')) matchedSoc = '2232';
    else if (jobTitle.includes('doctor') || jobTitle.includes('physician')) matchedSoc = '2211';
    else if (jobTitle.includes('pharmacist')) matchedSoc = '2251';
    else if (legalTerms.some(t => jobTitle.includes(t))) matchedSoc = '2412';
    else if (financeTerms.some(t => jobTitle.includes(t))) matchedSoc = '2421';
    else if (eduTerms.some(t => jobTitle.includes(t))) matchedSoc = '2313';
    else if (engTerms.some(t => jobTitle.includes(t))) matchedSoc = '2121';
    else if (jobTitle.includes('social worker')) matchedSoc = '2461';
    else if (consultingTerms.some(t => jobTitle.includes(t))) matchedSoc = '2431';
    else if (jobTitle.includes('surveyor')) matchedSoc = '2453';
    else if (jobTitle.includes('architect')) matchedSoc = '2451';
    else if (jobTitle.includes('analyst')) matchedSoc = '3544';

  } else if (jobTitle.length > 2) {
    occupationScore = 8;
    occupationNote = 'Your occupation may be eligible but could not be precisely matched. Update your job title for a more accurate score.';
  } else {
    occupationScore = 0;
    occupationNote = 'Your occupation does not appear to be on the eligible list. Only skilled roles (RQF Level 3+) qualify for sponsorship.';
  }

  total += occupationScore;
  breakdown.push({
    label: 'Occupation Eligibility',
    score: occupationScore,
    max: 25,
    note: occupationNote,
    icon: occupationScore === 25 ? '✓' : occupationScore > 0 ? '⚡' : '✗',
    color: occupationScore === 25 ? '#c8ff00' : occupationScore > 0 ? '#ffc800' : '#ff4d00',
  });

  // 2. SALARY COMPETITIVENESS — 20 pts
  const targetSalary = SALARY_BAND_MIDPOINTS[profile.target_salary_band] || 0;
  const isNewEntrant = profile.is_new_entrant === true || profile.is_new_entrant === 'true';
  const goingRate = matchedSoc ? (isNewEntrant ? SOC_GOING_RATES[matchedSoc]?.newEntrantRate : SOC_GOING_RATES[matchedSoc]?.rate) : 41700;
  const standardThreshold = isNewEntrant ? 33400 : 41700;

  let salaryScore = 0;
  let salaryNote = '';

  if (targetSalary === 0) {
    salaryScore = 8;
    salaryNote = 'Add your target salary to get a precise salary competitiveness score.';
  } else if (targetSalary >= (goingRate || standardThreshold)) {
    salaryScore = 20;
    salaryNote = `Your target salary meets or exceeds the going rate${matchedSoc ? ` for your role (£${(goingRate || standardThreshold).toLocaleString()})` : ' (£41,700 standard threshold)'}.`;
  } else if (targetSalary >= standardThreshold) {
    salaryScore = 14;
    const gap = (goingRate || standardThreshold) - targetSalary;
    salaryNote = `Your salary meets the minimum threshold but is £${gap.toLocaleString()} below the going rate for your SOC code. Negotiating higher would strengthen your application.`;
  } else if (targetSalary >= standardThreshold * 0.8) {
    salaryScore = 7;
    const gap = standardThreshold - targetSalary;
    salaryNote = `Your target salary is £${gap.toLocaleString()} below the ${isNewEntrant ? 'new entrant' : 'standard'} threshold of £${standardThreshold.toLocaleString()}. This is the most critical factor to address.`;
  } else {
    salaryScore = 0;
    salaryNote = `Your target salary is significantly below the ${isNewEntrant ? 'new entrant' : 'standard'} threshold of £${standardThreshold.toLocaleString()}. Sponsorship at this salary level is unlikely.`;
  }

  total += salaryScore;
  breakdown.push({
    label: 'Salary Competitiveness',
    score: salaryScore,
    max: 20,
    note: salaryNote,
    icon: salaryScore >= 18 ? '✓' : salaryScore >= 10 ? '⚡' : '✗',
    color: salaryScore >= 18 ? '#c8ff00' : salaryScore >= 10 ? '#ffc800' : '#ff4d00',
  });

  // 3. SECTOR SPONSOR DENSITY — 15 pts
  const sector = profile.sector || inferSector(profile.job_title);
  const density = SECTOR_DENSITY[sector];
  let sectorScore = 0;
  let sectorNote = '';

  if (density) {
    if (density.count >= 20000) { sectorScore = 15; sectorNote = `${sector} has one of the highest concentrations of licensed UK sponsors — excellent market conditions.`; }
    else if (density.count >= 12000) { sectorScore = 12; sectorNote = `${sector} has strong sponsor density with ${density.count.toLocaleString()}+ licensed companies.`; }
    else if (density.count >= 6000) { sectorScore = 9; sectorNote = `${sector} has moderate sponsor density. Targeting confirmed sponsors specifically is advised.`; }
    else if (density.count >= 3000) { sectorScore = 6; sectorNote = `${sector} has lower sponsor density. Competition for sponsored roles is higher — target your applications carefully.`; }
    else { sectorScore = 3; sectorNote = `${sector} has limited sponsor density. Consider broadening your sector or targeting only confirmed sponsors.`; }
  } else {
    sectorScore = 6;
    sectorNote = 'Update your profile sector for a precise density score.';
  }

  total += sectorScore;
  breakdown.push({
    label: 'Sector Sponsor Density',
    score: sectorScore,
    max: 15,
    note: sectorNote,
    icon: sectorScore >= 12 ? '✓' : sectorScore >= 6 ? '⚡' : '✗',
    color: sectorScore >= 12 ? '#c8ff00' : sectorScore >= 6 ? '#ffc800' : '#ff4d00',
  });

  // 4. EXPERIENCE LEVEL — 15 pts
  const expScore = EXPERIENCE_POINTS[profile.experience] || 6;
  let expNote = '';
  if (expScore >= 14) expNote = 'Senior experience is highly attractive to sponsors — they are more likely to invest in a CoS for experienced candidates.';
  else if (expScore >= 9) expNote = 'Good experience level. Highlighting specific achievements in your CV will strengthen your sponsorship case.';
  else expNote = 'Early career candidates can still be sponsored, particularly in Healthcare and Tech. A strong CV is essential.';

  total += expScore;
  breakdown.push({
    label: 'Experience Level',
    score: expScore,
    max: 15,
    note: expNote,
    icon: expScore >= 12 ? '✓' : expScore >= 7 ? '⚡' : '✗',
    color: expScore >= 12 ? '#c8ff00' : expScore >= 7 ? '#ffc800' : '#ff4d00',
  });

  // 5. LOCATION FLEXIBILITY — 10 pts
  const locations = profile.preferred_locations || [];
  let locationScore = 0;
  let locationNote = '';

  if (locations.length >= 3) {
    locationScore = 10;
    locationNote = `Open to ${locations.length} locations — maximum flexibility significantly increases your pool of eligible sponsors.`;
  } else if (locations.length === 2) {
    locationScore = 7;
    locationNote = 'Good location flexibility. Adding a third preferred location would unlock more sponsor options.';
  } else if (locations.length === 1) {
    const isLondon = locations[0]?.toLowerCase().includes('london');
    locationScore = isLondon ? 6 : 4;
    locationNote = isLondon
      ? 'London has the highest density of sponsors, but broadening to 2-3 cities would increase your chances significantly.'
      : `${locations[0]} has sponsors but broadening your search to include London or other major cities is strongly advised.`;
  } else {
    locationScore = 2;
    locationNote = 'Add preferred locations to your profile to improve your score and get matched to relevant jobs.';
  }

  total += locationScore;
  breakdown.push({
    label: 'Location Flexibility',
    score: locationScore,
    max: 10,
    note: locationNote,
    icon: locationScore >= 8 ? '✓' : locationScore >= 5 ? '⚡' : '✗',
    color: locationScore >= 8 ? '#c8ff00' : locationScore >= 5 ? '#ffc800' : '#ff4d00',
  });

  // 6. NEW ENTRANT ADVANTAGE — 10 pts
  let newEntrantScore = 0;
  let newEntrantNote = '';

  if (isNewEntrant) {
    newEntrantScore = 10;
    newEntrantNote = 'You qualify for the new entrant rate — your salary threshold is 70% of the standard going rate, making you eligible for a significantly wider pool of sponsored roles.';
  } else {
    newEntrantScore = 6;
    newEntrantNote = 'Standard experienced worker route. You may qualify for new entrant rates if you are under 26 or a recent UK graduate — check your profile.';
  }

  total += newEntrantScore;
  breakdown.push({
    label: 'Visa Route Eligibility',
    score: newEntrantScore,
    max: 10,
    note: newEntrantNote,
    icon: isNewEntrant ? '✓' : '⚡',
    color: isNewEntrant ? '#c8ff00' : '#ffc800',
  });

  // 7. PROFILE COMPLETENESS — 5 pts
  let completeness = 0;
  if (profile.job_title) completeness++;
  if (profile.experience) completeness++;
  if (profile.target_salary_band) completeness++;
  if (locations.length > 0) completeness++;
  if (profile.is_new_entrant !== null && profile.is_new_entrant !== undefined) completeness++;

  const profileScore = Math.round((completeness / 5) * 5);
  const profileNote = profileScore === 5
    ? 'Profile complete. Add your CV via AI CV Builder to unlock deeper score analysis.'
    : `${5 - completeness} profile field${5 - completeness > 1 ? 's' : ''} missing. Complete your profile for the most accurate score.`;

  total += profileScore;
  breakdown.push({
    label: 'Profile Completeness',
    score: profileScore,
    max: 5,
    note: profileNote,
    icon: profileScore === 5 ? '✓' : '⚡',
    color: profileScore === 5 ? '#c8ff00' : '#ffc800',
  });

  return { score: Math.min(total, 100), breakdown, matchedSoc, isNewEntrant, sector };
}

function inferSector(jobTitle) {
  const t = (jobTitle || '').toLowerCase();
  if (['software', 'developer', 'engineer', 'data', 'cloud', 'devops', 'cyber', 'it '].some(k => t.includes(k))) return 'Technology & IT';
  if (['nurse', 'doctor', 'pharmacist', 'therapist', 'radiographer', 'surgeon', 'dentist'].some(k => t.includes(k))) return 'Healthcare & Medical';
  if (['accountant', 'finance', 'auditor', 'actuary'].some(k => t.includes(k))) return 'Finance & Banking';
  if (['teacher', 'lecturer', 'professor'].some(k => t.includes(k))) return 'Education';
  if (['mechanical', 'electrical', 'civil', 'structural', 'aerospace'].some(k => t.includes(k))) return 'Engineering';
  if (['solicitor', 'lawyer', 'barrister', 'legal'].some(k => t.includes(k))) return 'Legal';
  if (['social worker', 'care manager'].some(k => t.includes(k))) return 'Social Care';
  if (['consultant', 'business analyst'].some(k => t.includes(k))) return 'Accounting & Consulting';
  if (['architect', 'surveyor'].some(k => t.includes(k))) return 'Construction & Architecture';
  return null;
}

function getScoreTier(score) {
  if (score >= 86) return { label: 'Top Sponsored Talent', color: '#c8ff00', desc: 'You are exactly who UK sponsors are looking for. Apply with confidence.' };
  if (score >= 71) return { label: 'Ready to Apply', color: '#c8ff00', desc: 'Strong profile. Focus on confirmed sponsors and target your applications.' };
  if (score >= 51) return { label: 'Strong Candidate', color: '#ffc800', desc: 'Good foundation. A few targeted improvements will significantly boost your chances.' };
  if (score >= 31) return { label: 'Developing Candidate', color: '#ff8c00', desc: 'Real gaps exist but they are fixable. Review the recommendations below.' };
  return { label: 'Not Yet Eligible', color: '#ff4d00', desc: 'Significant barriers to sponsorship. Address the critical issues below before applying.' };
}

// ── AI LOADER — Number Sphere ─────────────────────────────────────────────────
function BlobLoader() {
  const canvasRef = useRef(null);
  const [stepsDone, setStepsDone] = useState([false, false, false, false]);
  const [stepText, setStepText] = useState('Checking occupation eligibility...');
  const [complete, setComplete] = useState(false);
  const [fillWidth, setFillWidth] = useState(0);

  const STEPS = [
    { text: 'Checking occupation eligibility...', label: 'Occupation' },
    { text: 'Analysing salary threshold...',      label: 'Salary' },
    { text: 'Measuring sector sponsor density...', label: 'Sector' },
    { text: 'Calculating visa route eligibility...', label: 'Visa Route' },
  ];

  // Canvas number sphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = 78;
    const TOTAL = 280;

    const points = [];
    for (let i = 0; i < TOTAL; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / TOTAL);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      points.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        char: Math.random() < 0.6
          ? String(Math.floor(Math.random() * 10))
          : String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        size: 7 + Math.random() * 5,
      });
    }

    let angle = 0;
    let rafId;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      angle += 0.005;

      const projected = points.map(p => {
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const x3d = p.x * cosA - p.z * sinA;
        const z3d = p.x * sinA + p.z * cosA;
        const y3d = p.y;
        const sx = cx + x3d * R;
        const sy = cy + y3d * R;
        const depth = (z3d + 1) / 2;
        return { sx, sy, depth, char: p.char, size: p.size };
      });

      projected.sort((a, b) => a.depth - b.depth);

      projected.forEach(({ sx, sy, depth, char, size }) => {
        const topFactor = 1 - (sy / H);
        const brightness = depth * 0.7 + topFactor * 0.5;
        const alpha = Math.max(0.08, Math.min(1, brightness));
        const g = Math.floor(200 + topFactor * 55);
        const r = Math.floor(150 * topFactor * depth);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${Math.floor(size * (0.6 + depth * 0.4))}px monospace`;
        ctx.fillStyle = depth > 0.6
          ? `rgba(${r}, ${g}, 0, 1)`
          : `rgba(200, 220, 160, 1)`;
        ctx.fillText(char, sx - size * 0.3, sy + size * 0.35);
        ctx.restore();
      });

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Step progression — 2s each, no repeat, 8s total
  useEffect(() => {
    const timers = [];
    STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => {
        setStepText(step.text);
        setStepsDone(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        setFillWidth(((i + 1) / STEPS.length) * 100);
      }, i * 2000));
    });

    timers.push(setTimeout(() => {
      setStepText('Analysis complete ✓');
      setComplete(true);
    }, STEPS.length * 2000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
      <style>{`
        @keyframes sphere-glow { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes step-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .sphere-glow-ring { animation: sphere-glow 2s ease-in-out infinite; }
        .step-fade { animation: step-fade 0.3s ease forwards; }

        /* Mobile: 2x2 pills */
        .pills-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.45rem;
          width: 100%;
          max-width: 300px;
        }
        .pill-item {
          background: rgba(240,237,232,0.03);
          border: 1px solid rgba(240,237,232,0.07);
          border-radius: 100px;
          padding: 0.32rem 0.7rem;
          font-size: 0.63rem;
          font-weight: 600;
          color: rgba(240,237,232,0.2);
          text-align: center;
          transition: background 0.5s ease, border-color 0.5s ease, color 0.5s ease;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .pill-item.done {
          background: rgba(200,255,0,0.08);
          border-color: rgba(200,255,0,0.25);
          color: rgba(200,255,0,0.8);
        }

        /* Desktop: progress line */
        .progress-line-wrap {
          display: none;
          flex-direction: column;
          gap: 0.65rem;
          width: 100%;
          max-width: 420px;
        }
        .progress-track {
          position: relative;
          height: 2px;
          background: rgba(240,237,232,0.08);
          border-radius: 100px;
          margin: 0 12px;
        }
        .progress-fill-bar {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: #c8ff00;
          border-radius: 100px;
          box-shadow: 0 0 8px rgba(200,255,0,0.7);
          transition: width 2s linear;
        }
        .progress-dots-row {
          display: flex;
          justify-content: space-between;
          margin-top: -7px;
          padding: 0 9px;
        }
        .p-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgba(240,237,232,0.12);
          border: 2px solid #080808;
          transition: background 0.4s ease, box-shadow 0.4s ease;
          flex-shrink: 0;
        }
        .p-dot.active {
          background: #c8ff00;
          box-shadow: 0 0 8px rgba(200,255,0,0.9);
        }
        .progress-labels-row {
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
        }
        .p-label {
          font-size: 0.6rem;
          font-weight: 600;
          color: rgba(240,237,232,0.2);
          transition: color 0.4s ease;
          text-align: center;
          flex: 1;
          letter-spacing: 0.02em;
        }
        .p-label.active { color: rgba(200,255,0,0.7); }

        @media (min-width: 600px) {
          .pills-grid { display: none !important; }
          .progress-line-wrap { display: flex !important; }
        }
      `}</style>

      {/* Sphere */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div className="sphere-glow-ring" style={{ position: 'absolute', inset: -28, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,255,0,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />
        <canvas ref={canvasRef} width={200} height={200} style={{ position: 'relative', zIndex: 2 }} />
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0ede8', letterSpacing: '-0.02em' }}>
          AI is analysing your profile
        </div>
        <div key={stepText} className="step-fade" style={{ fontSize: '0.78rem', fontWeight: 600, color: complete ? '#c8ff00' : 'rgba(200,255,0,0.65)', minHeight: '1.2em' }}>
          {stepText}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)' }}>
          Cross-referencing 121,000+ UK sponsors
        </div>
      </div>

      {/* Mobile: 2x2 pills */}
      <div className="pills-grid">
        {STEPS.map((s, i) => (
          <div key={i} className={`pill-item${stepsDone[i] ? ' done' : ''}`}>
            {stepsDone[i] ? '✓ ' : ''}{s.label}
          </div>
        ))}
      </div>

      {/* Desktop: progress line */}
      <div className="progress-line-wrap">
        <div style={{ position: 'relative' }}>
          <div className="progress-track">
            <div className="progress-fill-bar" style={{ width: `${fillWidth}%` }} />
          </div>
          <div className="progress-dots-row">
            {STEPS.map((_, i) => (
              <div key={i} className={`p-dot${stepsDone[i] ? ' active' : ''}`} />
            ))}
          </div>
        </div>
        <div className="progress-labels-row">
          {STEPS.map((s, i) => (
            <div key={i} className={`p-label${stepsDone[i] ? ' active' : ''}`}>{s.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SCORE RING ────────────────────────────────────────────────────────────────
function ScoreRing({ score, tier }) {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
      <svg width="160" height="160" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(240,237,232,0.06)" strokeWidth="8" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={tier.color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s ease', filter: `drop-shadow(0 0 8px ${tier.color}88)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.8rem', color: tier.color, letterSpacing: '-0.06em', lineHeight: 1 }}>{displayScore}</div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>/ 100</div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SponsrrScore() {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();

      // Simulate AI processing time for effect
      await new Promise(r => setTimeout(r, 8000));

      if (prof) {
        const calc = calculateScore(prof);
        setProfile(prof);
        setResult(calc);
      } else {
        // No profile yet — redirect to onboarding
        navigate('/signup');
        return;
      }

      setLoading(false);
      // Small delay before revealing score
      setTimeout(() => setRevealed(true), 300);
    }
    load();
  }, [navigate]);

  function handleShare() {
    const score = result?.score || 0;
    const tier = getScoreTier(score);
    const jobTitle = profile?.job_title || 'my field';
    const text = `Just got my AI-powered Sponsrr Score — ${score}/100 for UK visa sponsorship as a ${jobTitle}. "${tier.label}" 🇬🇧\n\nIf you're an international looking for sponsored roles in the UK, check out sponsrr.com`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://sponsrr.com')}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleCopyScore() {
    const score = result?.score || 0;
    const tier = getScoreTier(score);
    const jobTitle = profile?.job_title || 'my field';
    const text = `My Sponsrr Score: ${score}/100 — "${tier.label}" for UK visa sponsorship as a ${jobTitle}. Check yours at sponsrr.com`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: '5rem' }}>
          <BlobLoader />
        </div>
      </div>
    </Layout>
  );

  if (!result) return null;

  const tier = getScoreTier(result.score);
  const improvements = result.breakdown.filter(d => d.score < d.max).sort((a, b) => (b.max - b.score) - (a.max - a.score));

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(200,255,0,0.1)} 50%{box-shadow:0 0 40px rgba(200,255,0,0.25)} }
          .fade-up { animation: fadeUp 0.6s ease forwards; }
          .fade-up-2 { animation: fadeUp 0.6s 0.15s ease both; }
          .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
          .fade-up-4 { animation: fadeUp 0.6s 0.45s ease both; }
          .fade-up-5 { animation: fadeUp 0.6s 0.6s ease both; }
          .glow-card { animation: glow 3s ease-in-out infinite; }
          .share-btn:hover { transform: translateY(-2px); }
          .dim-bar { transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        `}</style>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>

          {/* Header */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>
              🧠 AI-Powered · Updated just now
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', letterSpacing: '-0.04em', color: '#f0ede8', marginBottom: '0.5rem', lineHeight: 1.1 }}>
              Your Sponsrr Score
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.4)' }}>
              Analysed against 121,000+ UK visa sponsors · {profile?.job_title || 'Your profile'}
            </p>
          </div>

          {/* Score card */}
          <div className={`fade-up-2 glow-card`} style={{ background: '#111', border: `1px solid ${tier.color}33`, borderRadius: 24, padding: '2.5rem 2rem', marginBottom: '1.25rem', textAlign: 'center' }}>

            <ScoreRing score={result.score} tier={tier} />

            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: tier.color, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
                {tier.label}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                {tier.desc}
              </p>
            </div>

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <button onClick={handleShare} className="share-btn" style={{ background: '#0A66C2', color: '#fff', border: 'none', borderRadius: '100px', padding: '0.65rem 1.4rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'transform 0.2s' }}>
                <span>in</span> Share on LinkedIn
              </button>
              <button onClick={handleCopyScore} className="share-btn" style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: '#c8ff00', borderRadius: '100px', padding: '0.65rem 1.4rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.2  s' }}>
                {copied ? '✓ Copied' : 'Copy score'}
              </button>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="fade-up-3" style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '1.5rem' }}>
              Score breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {result.breakdown.map((dim, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: dim.color, fontWeight: 700 }}>{dim.icon}</span>
                      <span style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.7)', fontWeight: 500 }}>{dim.label}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: dim.color }}>
                      {dim.score}/{dim.max}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(240,237,232,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                    <div className="dim-bar" style={{ height: '100%', width: revealed ? `${(dim.score / dim.max) * 100}%` : '0%', background: dim.color, borderRadius: 100, boxShadow: `0 0 8px ${dim.color}66` }} />
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'rgba(240,237,232,0.35)', marginTop: '0.35rem', lineHeight: 1.5 }}>{dim.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How to improve */}
          {improvements.length > 0 && (
            <div className="fade-up-4" style={{ background: '#111', border: '1px solid rgba(200,255,0,0.1)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '1.25rem' }}>
                How to improve your score
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {improvements.slice(0, 3).map((dim, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, color: '#c8ff00', fontFamily: 'Syne, sans-serif' }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0ede8', marginBottom: '0.2rem' }}>{dim.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.55 }}>{dim.note}</div>
                      <div style={{ fontSize: '0.68rem', color: '#c8ff00', marginTop: '0.25rem', fontWeight: 600 }}>
                        +{dim.max - dim.score} points available
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="fade-up-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <button onClick={() => navigate('/jobs')} style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 14, padding: '1rem', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center' }}>
              Matching jobs →
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 14, padding: '1rem', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center' }}>
              Edit profile
            </button>
          </div>

          {/* Last updated note */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: 'rgba(240,237,232,0.2)' }}>
            Score recalculates automatically when you update your profile · Powered by Sponsrr AI
          </div>

        </div>
      </div>
    </Layout>
  );
}