import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';
import { SOC_DATABASE } from './socData';

// ── SOC GOING RATES ───────────────────────────────────────────────────────────
const SOC_GOING_RATES = Object.fromEntries(
  SOC_DATABASE
    .filter(s => s.rate !== null)
    .map(s => [s.code, { title: s.title, rate: s.rate, newEntrantRate: s.lowerRate }])
);

// ── SECTOR SPONSOR DENSITY ────────────────────────────────────────────────────
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

// ── SALARY BAND MIDPOINTS ─────────────────────────────────────────────────────
const SALARY_BAND_MIDPOINTS = {
  'Under £25,000':     22000,
  '£25,000–£30,000':  27500,
  '£30,000–£35,000':  32500,
  '£35,000–£40,000':  37500,
  '£40,000–£45,000':  42500,
  '£45,000–£55,000':  50000,
  '£55,000–£70,000':  62500,
  '£70,000–£90,000':  80000,
  '£90,000+':        100000,
  // legacy bands (EditProfile may have saved these)
  '£40,000–£50,000':  45000,
  '£50,000–£60,000':  55000,
  '£60,000–£75,000':  67500,
  '£75,000–£100,000': 87500,
  '£100,000+':       110000,
};

const EXPERIENCE_POINTS = {
  'Less than 1 year': 4,
  '1-2 years': 7,
  '2-3 years': 9,
  '3-5 years': 12,
  '5-7 years': 14,
  '7+ years': 15,
  // onboarding values
  'student': 3,
  '0-2': 6,
  '2-5': 10,
  '5-10': 13,
  '10+': 15,
};

const EXPERIENCE_LABELS = {
  student: 'Student / No experience yet',
  '0-2':   '0–2 years',
  '2-5':   '2–5 years',
  '5-10':  '5–10 years',
  '10+':   '10+ years',
};

const VISA_LABELS = {
  graduate:       'Graduate Visa (PSW)',
  student:        'Student Visa (Tier 4)',
  skilled_worker: 'Skilled Worker Visa',
  health_care:    'Health & Care Worker Visa',
  no_uk_visa:     'No current UK visa',
  other:          'Other UK visa',
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
// Picks highest midpoint from array of salary bands
function getBestSalaryMidpoint(band) {
  if (!band) return 0;
  const bands = Array.isArray(band) ? band : [band];
  return Math.max(...bands.map(b => SALARY_BAND_MIDPOINTS[b] || 0));
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

// ── SCORE ENGINE ──────────────────────────────────────────────────────────────
function calculateScore(profile) {
  const breakdown = [];
  let total = 0;

  const jobTitle = (profile.job_title || '').toLowerCase();
  let occupationScore = 0;
  let occupationNote = '';
  let matchedSoc = null;

  const techTerms      = ['software', 'developer', 'engineer', 'data', 'cloud', 'devops', 'cyber', 'security', 'it ', 'programmer', 'architect tech'];
  const healthTerms    = ['nurse', 'doctor', 'physician', 'pharmacist', 'therapist', 'radiographer', 'midwife', 'dentist', 'surgeon'];
  const financeTerms   = ['accountant', 'finance', 'analyst', 'auditor', 'actuary', 'investment', 'tax'];
  const legalTerms     = ['solicitor', 'lawyer', 'barrister', 'legal'];
  const eduTerms       = ['teacher', 'lecturer', 'professor', 'tutor'];
  const engTerms       = ['mechanical', 'electrical', 'civil', 'structural', 'aerospace'];
  const socialTerms    = ['social worker', 'care manager'];
  const consultingTerms= ['consultant', 'business analyst', 'management'];
  const archTerms      = ['architect', 'surveyor', 'planner'];
  const allEligible    = [...techTerms, ...healthTerms, ...financeTerms, ...legalTerms, ...eduTerms, ...engTerms, ...socialTerms, ...consultingTerms, ...archTerms];

  if (allEligible.some(t => jobTitle.includes(t))) {
    occupationScore = 25;
    occupationNote  = 'Your occupation is on the eligible roles list for Skilled Worker visa sponsorship.';
    if (techTerms.some(t => jobTitle.includes(t)))        matchedSoc = '2134';
    else if (jobTitle.includes('nurse'))                   matchedSoc = '2232';
    else if (jobTitle.includes('doctor') || jobTitle.includes('physician')) matchedSoc = '2211';
    else if (jobTitle.includes('pharmacist'))              matchedSoc = '2251';
    else if (legalTerms.some(t => jobTitle.includes(t)))  matchedSoc = '2412';
    else if (financeTerms.some(t => jobTitle.includes(t)))matchedSoc = '2421';
    else if (eduTerms.some(t => jobTitle.includes(t)))    matchedSoc = '2313';
    else if (engTerms.some(t => jobTitle.includes(t)))    matchedSoc = '2121';
    else if (jobTitle.includes('social worker'))           matchedSoc = '2461';
    else if (consultingTerms.some(t => jobTitle.includes(t))) matchedSoc = '2431';
    else if (jobTitle.includes('surveyor'))                matchedSoc = '2453';
    else if (jobTitle.includes('architect'))               matchedSoc = '2451';
    else if (jobTitle.includes('analyst'))                 matchedSoc = '3544';
  } else if (jobTitle.length > 2) {
    occupationScore = 8;
    occupationNote  = 'Your occupation may be eligible but could not be precisely matched. Update your job title for a more accurate score.';
  } else {
    occupationScore = 0;
    occupationNote  = 'Your occupation does not appear to be on the eligible list. Only skilled roles (RQF Level 3+) qualify for sponsorship.';
  }

  // Use soc_code from profile if matched
  if (profile.soc_code && SOC_GOING_RATES[profile.soc_code]) matchedSoc = profile.soc_code;

  total += occupationScore;
  breakdown.push({ label: 'Occupation Eligibility', score: occupationScore, max: 25, note: occupationNote, icon: occupationScore === 25 ? '✓' : occupationScore > 0 ? '⚡' : '✗', color: occupationScore === 25 ? '#c8ff00' : occupationScore > 0 ? '#ffc800' : '#ff4d00' });

  // SALARY — 20 pts
  const targetSalary    = getBestSalaryMidpoint(profile.target_salary_band);
  const isNewEntrant    = profile.is_new_entrant === true || profile.is_new_entrant === 'true';
  const goingRate       = matchedSoc ? (isNewEntrant ? SOC_GOING_RATES[matchedSoc]?.newEntrantRate : SOC_GOING_RATES[matchedSoc]?.rate) : (isNewEntrant ? 33400 : 41700);
  const stdThreshold    = isNewEntrant ? 33400 : 41700;
  let salaryScore = 0, salaryNote = '';

  if (targetSalary === 0) {
    salaryScore = 8; salaryNote = 'Add your target salary to get a precise salary competitiveness score.';
  } else if (targetSalary >= (goingRate || stdThreshold)) {
    salaryScore = 20; salaryNote = `Your target salary meets or exceeds the going rate${matchedSoc ? ` for your role (£${(goingRate || stdThreshold).toLocaleString()})` : ''}.`;
  } else if (targetSalary >= stdThreshold) {
    salaryScore = 14;
    const gap = (goingRate || stdThreshold) - targetSalary;
    salaryNote = `Meets the minimum threshold but £${gap.toLocaleString()} below the going rate. Negotiating higher would strengthen your application.`;
  } else if (targetSalary >= stdThreshold * 0.8) {
    salaryScore = 7;
    const gap = stdThreshold - targetSalary;
    salaryNote = `£${gap.toLocaleString()} below the ${isNewEntrant ? 'new entrant' : 'standard'} threshold of £${stdThreshold.toLocaleString()}. Critical to address.`;
  } else {
    salaryScore = 0; salaryNote = `Significantly below the ${isNewEntrant ? 'new entrant' : 'standard'} threshold of £${stdThreshold.toLocaleString()}. Sponsorship at this level is unlikely.`;
  }

  total += salaryScore;
  breakdown.push({ label: 'Salary Competitiveness', score: salaryScore, max: 20, note: salaryNote, icon: salaryScore >= 18 ? '✓' : salaryScore >= 10 ? '⚡' : '✗', color: salaryScore >= 18 ? '#c8ff00' : salaryScore >= 10 ? '#ffc800' : '#ff4d00' });

  // SECTOR — 15 pts
  const sector  = profile.sector || inferSector(profile.job_title);
  const density = SECTOR_DENSITY[sector];
  let sectorScore = 0, sectorNote = '';
  if (density) {
    if (density.count >= 20000)      { sectorScore = 15; sectorNote = `${sector} has one of the highest concentrations of licensed UK sponsors.`; }
    else if (density.count >= 12000) { sectorScore = 12; sectorNote = `${sector} has strong sponsor density with ${density.count.toLocaleString()}+ licensed companies.`; }
    else if (density.count >= 6000)  { sectorScore = 9;  sectorNote = `${sector} has moderate sponsor density. Targeting confirmed sponsors is advised.`; }
    else if (density.count >= 3000)  { sectorScore = 6;  sectorNote = `${sector} has lower sponsor density. Target your applications carefully.`; }
    else                             { sectorScore = 3;  sectorNote = `${sector} has limited sponsor density. Consider broadening your sector.`; }
  } else { sectorScore = 6; sectorNote = 'Update your profile sector for a precise density score.'; }

  total += sectorScore;
  breakdown.push({ label: 'Sector Sponsor Density', score: sectorScore, max: 15, note: sectorNote, icon: sectorScore >= 12 ? '✓' : sectorScore >= 6 ? '⚡' : '✗', color: sectorScore >= 12 ? '#c8ff00' : sectorScore >= 6 ? '#ffc800' : '#ff4d00' });

  // EXPERIENCE — 15 pts
  const expScore = EXPERIENCE_POINTS[profile.experience] || 6;
  let expNote = '';
  if (expScore >= 14) expNote = 'Senior experience is highly attractive to sponsors.';
  else if (expScore >= 9) expNote = 'Good experience level. Highlighting achievements will strengthen your application.';
  else expNote = 'Early career candidates can still be sponsored, particularly in Healthcare and Tech.';

  total += expScore;
  breakdown.push({ label: 'Experience Level', score: expScore, max: 15, note: expNote, icon: expScore >= 12 ? '✓' : expScore >= 7 ? '⚡' : '✗', color: expScore >= 12 ? '#c8ff00' : expScore >= 7 ? '#ffc800' : '#ff4d00' });

  // LOCATION — 10 pts
  const locations = profile.preferred_locations || [];
  let locationScore = 0, locationNote = '';
  if (locations.length >= 3)      { locationScore = 10; locationNote = `Open to ${locations.length} locations — maximum flexibility increases your sponsor pool.`; }
  else if (locations.length === 2){ locationScore = 7;  locationNote = 'Good flexibility. Adding a third location would unlock more options.'; }
  else if (locations.length === 1){ const isLondon = locations[0]?.toLowerCase().includes('london'); locationScore = isLondon ? 6 : 4; locationNote = isLondon ? 'London has the highest sponsor density, but broadening to 2–3 cities would increase your chances.' : `Broadening to include London or other major cities is advised.`; }
  else                            { locationScore = 2;  locationNote = 'Add preferred locations to improve your score and get matched to relevant jobs.'; }

  total += locationScore;
  breakdown.push({ label: 'Location Flexibility', score: locationScore, max: 10, note: locationNote, icon: locationScore >= 8 ? '✓' : locationScore >= 5 ? '⚡' : '✗', color: locationScore >= 8 ? '#c8ff00' : locationScore >= 5 ? '#ffc800' : '#ff4d00' });

  // VISA ROUTE — 10 pts
  let newEntrantScore = 0, newEntrantNote = '';
  if (isNewEntrant) {
    newEntrantScore = 10; newEntrantNote = 'You qualify for the new entrant rate — 70% of the standard going rate, opening a wider pool of sponsored roles.';
  } else {
    newEntrantScore = 6; newEntrantNote = 'Standard experienced worker route. Check if you qualify for new entrant rates.';
  }
  total += newEntrantScore;
  breakdown.push({ label: 'Visa Route Eligibility', score: newEntrantScore, max: 10, note: newEntrantNote, icon: isNewEntrant ? '✓' : '⚡', color: isNewEntrant ? '#c8ff00' : '#ffc800' });

  // COMPLETENESS — 5 pts
  let completeness = 0;
  if (profile.job_title) completeness++;
  if (profile.experience) completeness++;
  if (profile.target_salary_band) completeness++;
  if (locations.length > 0) completeness++;
  if (profile.is_new_entrant !== null && profile.is_new_entrant !== undefined) completeness++;
  const profileScore = Math.round((completeness / 5) * 5);
  const profileNote  = profileScore === 5 ? 'Profile complete.' : `${5 - completeness} profile field${5 - completeness > 1 ? 's' : ''} missing. Complete your profile for the most accurate score.`;

  total += profileScore;
  breakdown.push({ label: 'Profile Completeness', score: profileScore, max: 5, note: profileNote, icon: profileScore === 5 ? '✓' : '⚡', color: profileScore === 5 ? '#c8ff00' : '#ffc800' });

  return { score: Math.min(total, 100), breakdown, matchedSoc, isNewEntrant, sector };
}

function getScoreTier(score) {
  if (score >= 86) return { label: 'Top Sponsored Talent', color: '#c8ff00', desc: 'You are exactly who UK sponsors are looking for. Apply with confidence.' };
  if (score >= 71) return { label: 'Ready to Apply',       color: '#c8ff00', desc: 'Strong profile. Focus on confirmed sponsors and target your applications.' };
  if (score >= 51) return { label: 'Strong Candidate',     color: '#ffc800', desc: 'Good foundation. A few targeted improvements will significantly boost your chances.' };
  if (score >= 31) return { label: 'Developing Candidate', color: '#ff8c00', desc: 'Real gaps exist but they are fixable. Review the recommendations below.' };
  return             { label: 'Not Yet Eligible',          color: '#ff4d00', desc: 'Significant barriers to sponsorship. Address the critical issues below before applying.' };
}

// ── PRE-GATE SCREEN ───────────────────────────────────────────────────────────
function GateScreen({ profile, onCalculate }) {
  const navigate = useNavigate();

  const isNewEntrant = profile.is_new_entrant === true || profile.is_new_entrant === 'true';
  const visaLabel    = VISA_LABELS[profile.current_visa] || profile.current_visa || 'Not set';
  const expLabel     = EXPERIENCE_LABELS[profile.experience] || profile.experience || 'Not set';

  const salaryBands  = Array.isArray(profile.target_salary_band)
    ? profile.target_salary_band
    : profile.target_salary_band ? [profile.target_salary_band] : [];

  const locations    = profile.preferred_locations || [];

  // Completeness — how many of the 5 key fields are filled
  const filledFields = [
    profile.job_title,
    profile.experience,
    profile.target_salary_band,
    locations.length > 0,
    profile.current_visa,
  ].filter(Boolean).length;
  const completePct  = Math.round((filledFields / 5) * 100);

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .g1 { animation: fadeUp 0.4s ease forwards; }
        .g2 { animation: fadeUp 0.4s 0.1s ease both; }
        .g3 { animation: fadeUp 0.4s 0.2s ease both; }
        .g4 { animation: fadeUp 0.4s 0.3s ease both; }
        .g5 { animation: fadeUp 0.4s 0.4s ease both; }

        .calc-btn {
          background: #c8ff00; color: #080808;
          border: none; border-radius: 100px;
          padding: 1rem 2rem; width: 100%;
          font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 0 28px rgba(200,255,0,0.18);
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .calc-btn:hover {
          background: #aee600; transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(200,255,0,0.3);
        }

        .field-row {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid rgba(240,237,232,0.06);
        }
        .field-row:last-child { border-bottom: none; padding-bottom: 0; }
        .field-label {
          font-size: 0.72rem; font-weight: 600;
          color: rgba(240,237,232,0.35);
          text-transform: uppercase; letter-spacing: 0.05em;
          min-width: 90px; padding-top: 0.1rem;
        }
        .field-value {
          font-size: 0.85rem; color: #f0ede8;
          font-weight: 500; text-align: right; flex: 1;
        }
        .field-value.empty {
          color: rgba(240,237,232,0.25); font-style: italic;
        }
        .chip {
          display: inline-block;
          padding: 0.2rem 0.6rem; border-radius: 100px;
          font-size: 0.7rem; font-weight: 700;
          margin: 0.15rem 0.15rem 0 0;
        }
      `}</style>

      {/* Minimal nav */}
      <nav style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.04em', color: '#f0ede8' }}>
          Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.35)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          Dashboard →
        </button>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1.5rem 3rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Header */}
          <div className="g1" style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            {/* Completeness ring */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', width: 64, height: 64 }}>
                <svg width={64} height={64} viewBox="0 0 64 64">
                  {/* Track */}
                  <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(240,237,232,0.07)" strokeWidth={5} />
                  {/* Fill */}
                  <circle cx={32} cy={32} r={26} fill="none"
                    stroke={completePct === 100 ? '#c8ff00' : '#c8ff00'}
                    strokeWidth={5}
                    strokeDasharray={`${2 * Math.PI * 26 * completePct / 100} ${2 * Math.PI * 26}`}
                    strokeLinecap="round" transform="rotate(-90 32 32)"
                    style={{
                      transition: 'stroke-dasharray 0.8s ease',
                      filter: completePct === 100 ? 'drop-shadow(0 0 6px rgba(200,255,0,0.6))' : 'none',
                    }}
                  />
                  {/* Checkmark at 100% — drawn as SVG path so it's crisp */}
                  {completePct === 100 && (
                    <path
                      d="M22 32 L29 39 L42 25"
                      fill="none"
                      stroke="#c8ff00"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(200,255,0,0.5))' }}
                    />
                  )}
                </svg>
                {/* Percentage shown only when not 100% */}
                {completePct < 100 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.88rem', color: '#c8ff00', lineHeight: 1 }}>
                      {completePct}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
              Ready to calculate<br /><span style={{ color: '#c8ff00' }}>your Sponsrr Score?</span>
            </h1>
            <p style={{ fontSize: '0.83rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.65, margin: 0 }}>
              Here's what we'll use. Make sure everything looks right before we run the analysis.
            </p>
          </div>

          {/* Profile summary card */}
          <div className="g2" style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 20, padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>

            <div className="field-row">
              <span className="field-label">Role</span>
              <span className={`field-value${!profile.job_title ? ' empty' : ''}`}>
                {profile.job_title || 'Not set'}
                {profile.soc_code && (
                  <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(240,237,232,0.3)', marginTop: '0.15rem' }}>
                    SOC {profile.soc_code}
                  </span>
                )}
              </span>
            </div>

            <div className="field-row">
              <span className="field-label">Visa</span>
              <div style={{ textAlign: 'right', flex: 1 }}>
                <span className={`field-value${!profile.current_visa ? ' empty' : ''}`}>
                  {visaLabel}
                </span>
                {/* New entrant badge */}
                <div style={{ marginTop: '0.3rem' }}>
                  <span className="chip" style={{
                    background: isNewEntrant ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.05)',
                    border: `1px solid ${isNewEntrant ? 'rgba(200,255,0,0.3)' : 'rgba(240,237,232,0.1)'}`,
                    color: isNewEntrant ? '#c8ff00' : 'rgba(240,237,232,0.35)',
                  }}>
                    {isNewEntrant ? '✓ New Entrant' : '◎ Standard Rate'}
                  </span>
                </div>
              </div>
            </div>

            <div className="field-row">
              <span className="field-label">Experience</span>
              <span className={`field-value${!profile.experience ? ' empty' : ''}`}>
                {expLabel}
              </span>
            </div>

            <div className="field-row">
              <span className="field-label">Salary</span>
              <div style={{ textAlign: 'right', flex: 1 }}>
                {salaryBands.length > 0 ? salaryBands.map(b => (
                  <span key={b} className="chip" style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', color: 'rgba(200,255,0,0.8)', display: 'inline-block' }}>
                    {b}
                  </span>
                )) : (
                  <span className="field-value empty">Not set</span>
                )}
              </div>
            </div>

            <div className="field-row">
              <span className="field-label">Locations</span>
              <div style={{ textAlign: 'right', flex: 1 }}>
                {locations.length > 0 ? locations.map(l => (
                  <span key={l} className="chip" style={{ background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.1)', color: 'rgba(240,237,232,0.6)', display: 'inline-block' }}>
                    {l}
                  </span>
                )) : (
                  <span className="field-value empty">Not set</span>
                )}
              </div>
            </div>
          </div>

          {/* Edit link */}
          <div className="g3" style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <button onClick={() => navigate('/profile/edit')} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.3)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Something wrong? Edit your profile →
            </button>
          </div>

          {/* Missing fields warning */}
          {filledFields < 4 && (
            <div className="g3" style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.2)', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#ff8c00', fontWeight: 600, marginBottom: '0.2rem' }}>
                ⚡ Your score will be estimated
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.55 }}>
                {5 - filledFields} key field{5 - filledFields > 1 ? 's are' : ' is'} missing. Complete your profile for a more accurate score.
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="g4">
            <button className="calc-btn" onClick={onCalculate}>
              Calculate my Sponsrr Score
              <span style={{ fontSize: '1.1rem' }}>→</span>
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: 'rgba(240,237,232,0.2)' }}>
              Takes about 8 seconds · Analysing 121,000+ sponsors
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.15)' }}>
          © Sponsrr. Made for Internationals.
        </div>
      </div>
    </div>
  );
}

// ── BLOB LOADER ───────────────────────────────────────────────────────────────
function BlobLoader() {
  const canvasRef = useRef(null);
  const [stepsDone, setStepsDone]   = useState([false, false, false, false]);
  const [stepText, setStepText]     = useState('Checking occupation eligibility...');
  const [complete, setComplete]     = useState(false);
  const [fillWidth, setFillWidth]   = useState(0);

  const STEPS = [
    { text: 'Checking occupation eligibility...',    label: 'Occupation' },
    { text: 'Analysing salary threshold...',         label: 'Salary' },
    { text: 'Measuring sector sponsor density...',   label: 'Sector' },
    { text: 'Calculating visa route eligibility...', label: 'Visa Route' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = 78, TOTAL = 280;
    const points = [];
    for (let i = 0; i < TOTAL; i++) {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / TOTAL);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      points.push({ x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi), char: Math.random() < 0.6 ? String(Math.floor(Math.random() * 10)) : String.fromCharCode(65 + Math.floor(Math.random() * 26)), size: 7 + Math.random() * 5 });
    }
    let angle = 0, rafId;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      angle += 0.005;
      const projected = points.map(p => {
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const x3d = p.x * cosA - p.z * sinA, z3d = p.x * sinA + p.z * cosA, y3d = p.y;
        return { sx: cx + x3d * R, sy: cy + y3d * R, depth: (z3d + 1) / 2, char: p.char, size: p.size };
      });
      projected.sort((a, b) => a.depth - b.depth);
      projected.forEach(({ sx, sy, depth, char, size }) => {
        const topFactor = 1 - (sy / H);
        const alpha = Math.max(0.08, Math.min(1, depth * 0.7 + topFactor * 0.5));
        const g = Math.floor(200 + topFactor * 55), r = Math.floor(150 * topFactor * depth);
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = `${Math.floor(size * (0.6 + depth * 0.4))}px monospace`;
        ctx.fillStyle = depth > 0.6 ? `rgba(${r},${g},0,1)` : `rgba(200,220,160,1)`;
        ctx.fillText(char, sx - size * 0.3, sy + size * 0.35);
        ctx.restore();
      });
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const timers = [];
    STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => {
        setStepText(step.text);
        setStepsDone(prev => { const n = [...prev]; n[i] = true; return n; });
        setFillWidth(((i + 1) / STEPS.length) * 100);
      }, i * 2000));
    });
    timers.push(setTimeout(() => { setStepText('Analysis complete ✓'); setComplete(true); }, STEPS.length * 2000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
      <style>{`
        @keyframes sphere-glow { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes step-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .sphere-glow-ring { animation: sphere-glow 2s ease-in-out infinite; }
        .step-fade { animation: step-fade 0.3s ease forwards; }
        .pills-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.45rem; width:100%; max-width:300px; }
        .pill-item { background:rgba(240,237,232,0.03); border:1px solid rgba(240,237,232,0.07); border-radius:100px; padding:0.32rem 0.7rem; font-size:0.63rem; font-weight:600; color:rgba(240,237,232,0.2); text-align:center; transition:background 0.5s,border-color 0.5s,color 0.5s; white-space:nowrap; letter-spacing:0.02em; }
        .pill-item.done { background:rgba(200,255,0,0.08); border-color:rgba(200,255,0,0.25); color:rgba(200,255,0,0.8); }
        .progress-line-wrap { display:none; flex-direction:column; gap:0.65rem; width:100%; max-width:420px; }
        .progress-track { position:relative; height:2px; background:rgba(240,237,232,0.08); border-radius:100px; margin:0 12px; }
        .progress-fill-bar { position:absolute; left:0; top:0; bottom:0; background:#c8ff00; border-radius:100px; box-shadow:0 0 8px rgba(200,255,0,0.7); transition:width 2s linear; }
        .progress-dots-row { display:flex; justify-content:space-between; margin-top:-7px; padding:0 9px; }
        .p-dot { width:10px; height:10px; border-radius:50%; background:rgba(240,237,232,0.12); border:2px solid #080808; transition:background 0.4s,box-shadow 0.4s; flex-shrink:0; }
        .p-dot.active { background:#c8ff00; box-shadow:0 0 8px rgba(200,255,0,0.9); }
        .progress-labels-row { display:flex; justify-content:space-between; padding:0 4px; }
        .p-label { font-size:0.6rem; font-weight:600; color:rgba(240,237,232,0.2); transition:color 0.4s; text-align:center; flex:1; letter-spacing:0.02em; }
        .p-label.active { color:rgba(200,255,0,0.7); }
        @media(min-width:600px){ .pills-grid{display:none!important} .progress-line-wrap{display:flex!important} }
      `}</style>
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div className="sphere-glow-ring" style={{ position: 'absolute', inset: -28, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,255,0,0.12) 0%,transparent 70%)', filter: 'blur(20px)' }} />
        <canvas ref={canvasRef} width={200} height={200} style={{ position: 'relative', zIndex: 2 }} />
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0ede8', letterSpacing: '-0.02em' }}>AI is analysing your profile</div>
        <div key={stepText} className="step-fade" style={{ fontSize: '0.78rem', fontWeight: 600, color: complete ? '#c8ff00' : 'rgba(200,255,0,0.65)', minHeight: '1.2em' }}>{stepText}</div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)' }}>Cross-referencing 121,000+ UK sponsors</div>
      </div>
      <div className="pills-grid">
        {STEPS.map((s, i) => <div key={i} className={`pill-item${stepsDone[i] ? ' done' : ''}`}>{stepsDone[i] ? '✓ ' : ''}{s.label}</div>)}
      </div>
      <div className="progress-line-wrap">
        <div style={{ position: 'relative' }}>
          <div className="progress-track"><div className="progress-fill-bar" style={{ width: `${fillWidth}%` }} /></div>
          <div className="progress-dots-row">{STEPS.map((_, i) => <div key={i} className={`p-dot${stepsDone[i] ? ' active' : ''}`} />)}</div>
        </div>
        <div className="progress-labels-row">{STEPS.map((s, i) => <div key={i} className={`p-label${stepsDone[i] ? ' active' : ''}`}>{s.label}</div>)}</div>
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
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / 1800, 1);
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

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SponsrrScore() {
  const navigate = useNavigate();

  // gate → loading → result
  const [phase, setPhase]     = useState('gate');   // 'gate' | 'loading' | 'result'
  const [profile, setProfile] = useState(null);
  const [result, setResult]   = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  // Load profile once on mount — just for the gate screen
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();

      if (!prof?.job_title) { navigate('/onboarding'); return; }

      setProfile(prof);
    }
    load();
  }, [navigate]);

  // Triggered when user clicks "Calculate" on gate screen
  async function handleCalculate() {
    setPhase('loading');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 8s animation plays, calculation runs in parallel
    await new Promise(r => setTimeout(r, 8000));

    const calc = calculateScore(profile);
    setResult(calc);
    setPhase('result');
    setTimeout(() => setRevealed(true), 300);
  }

  function handleShare() {
    const score    = result?.score || 0;
    const tier     = getScoreTier(score);
    const jobTitle = profile?.job_title || 'my field';
    const text     = `Just got my AI-powered Sponsrr Score — ${score}/100 for UK visa sponsorship as a ${jobTitle}. "${tier.label}" 🇬🇧\n\nIf you're an international looking for sponsored roles in the UK, check out sponsrr.com`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://sponsrr.com')}&summary=${encodeURIComponent(text)}`, '_blank');
  }

  // ── GATE ──
  if (phase === 'gate') {
    if (!profile) return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading...</div>
      </div>
    );
    return <GateScreen profile={profile} onCalculate={handleCalculate} />;
  }

  // ── LOADING ──
  if (phase === 'loading') return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: '5rem' }}>
          <BlobLoader />
        </div>
      </div>
    </Layout>
  );

  // ── RESULT ──
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
          .fade-up  { animation: fadeUp 0.6s ease forwards; }
          .fade-up-2{ animation: fadeUp 0.6s 0.15s ease both; }
          .fade-up-3{ animation: fadeUp 0.6s 0.3s  ease both; }
          .fade-up-4{ animation: fadeUp 0.6s 0.45s ease both; }
          .fade-up-5{ animation: fadeUp 0.6s 0.6s  ease both; }
          .glow-card{ animation: glow 3s ease-in-out infinite; }
          .share-btn:hover{ transform:translateY(-2px); }
          .dim-bar  { transition: width 1.2s cubic-bezier(0.34,1.56,0.64,1); }
        `}</style>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>

          {/* Header */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.72rem', color: '#c8ff00', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.05em' }}>
              🧠 AI-Powered · Updated just now
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem,5vw,2.5rem)', letterSpacing: '-0.04em', color: '#f0ede8', marginBottom: '0.5rem', lineHeight: 1.1 }}>
              Your Sponsrr Score
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'rgba(240,237,232,0.4)' }}>
              Analysed against 121,000+ UK visa sponsors · {profile?.job_title || 'Your profile'}
            </p>
          </div>

          {/* Score card */}
          <div className="fade-up-2 glow-card" style={{ background: '#111', border: `1px solid ${tier.color}33`, borderRadius: 24, padding: '2.5rem 2rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <ScoreRing score={result.score} tier={tier} />
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: tier.color, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>{tier.label}</div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>{tier.desc}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <button onClick={handleShare} className="share-btn" style={{ background: '#0A66C2', color: '#fff', border: 'none', borderRadius: '100px', padding: '0.65rem 1.4rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'transform 0.2s' }}>
                <span>in</span> Share on LinkedIn
              </button>
            </div>
          </div>

          {/* ── SCORE BREAKDOWN ── */}
          <div className="fade-up-3" style={{ marginBottom: '1.25rem' }}>

            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.25rem' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0ede8' }}>Score breakdown</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: 'rgba(240,237,232,0.3)', fontWeight: 600 }}>{result.score}/100</span>
            </div>

            {/* Each dimension as its own card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {result.breakdown.map((dim, i) => (
                <div key={i} style={{
                  background: '#111',
                  border: `1px solid rgba(240,237,232,0.07)`,
                  borderLeft: `3px solid ${dim.color}`,
                  borderRadius: 16,
                  padding: '1.1rem 1.25rem',
                }}>
                  {/* Top row: label + score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span style={{ fontSize: '0.8rem', color: dim.color }}>{dim.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}>{dim.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: dim.color, lineHeight: 1 }}>{dim.score}</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)', fontFamily: 'DM Sans, sans-serif' }}>/{dim.max}</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div style={{ height: 7, background: 'rgba(240,237,232,0.05)', borderRadius: 100, overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div className="dim-bar" style={{
                      height: '100%',
                      width: revealed ? `${(dim.score / dim.max) * 100}%` : '0%',
                      background: `linear-gradient(90deg, ${dim.color}99, ${dim.color})`,
                      borderRadius: 100,
                      boxShadow: `0 0 10px ${dim.color}55`,
                    }} />
                  </div>

                  {/* Note — indented, clearly secondary */}
                  <p style={{
                    margin: 0,
                    fontSize: '0.76rem',
                    color: 'rgba(240,237,232,0.4)',
                    lineHeight: 1.6,
                    paddingLeft: '0.1rem',
                  }}>{dim.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW TO IMPROVE ── */}
          {improvements.length > 0 && (
            <div className="fade-up-4" style={{ marginBottom: '1.25rem' }}>

              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.25rem' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0ede8' }}>How to improve</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(240,237,232,0.07)' }} />
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: 'rgba(200,255,0,0.4)', fontWeight: 600 }}>
                  +{improvements.slice(0, 3).reduce((acc, d) => acc + (d.max - d.score), 0)} pts possible
                </span>
              </div>

              {/* Each improvement as its own card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {improvements.slice(0, 3).map((dim, i) => (
                  <div key={i} style={{
                    background: '#111',
                    border: '1px solid rgba(200,255,0,0.08)',
                    borderRadius: 16,
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}>
                    {/* Number badge */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(200,255,0,0.07)',
                      border: '1px solid rgba(200,255,0,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                      fontSize: '0.85rem', color: '#c8ff00',
                    }}>
                      {i + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Label + points pill on same row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}>{dim.label}</span>
                        <span style={{
                          background: 'rgba(200,255,0,0.1)',
                          border: '1px solid rgba(200,255,0,0.2)',
                          borderRadius: 100,
                          padding: '0.18rem 0.6rem',
                          fontSize: '0.65rem', fontWeight: 700,
                          color: '#c8ff00', whiteSpace: 'nowrap',
                          fontFamily: 'Geist Mono, monospace',
                        }}>
                          +{dim.max - dim.score} pts
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.6 }}>{dim.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="fade-up-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <button onClick={() => navigate('/jobs')}
              onMouseEnter={e => { e.currentTarget.style.background='#aee600'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(200,255,0,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#c8ff00'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 14, padding: '1rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease' }}>
              Matching jobs →
            </button>
            <button onClick={() => navigate('/profile/edit')}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(240,237,232,0.08)'; e.currentTarget.style.borderColor='rgba(240,237,232,0.7)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(240,237,232,0.05)'; e.currentTarget.style.borderColor='rgba(240,237,232,0.1)'; e.currentTarget.style.transform='translateY(0)'; }}
              style={{ background: 'rgba(240,237,232,0.05)', color: '#f0ede8', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 14, padding: '1rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease' }}>
              Edit profile
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: 'rgba(240,237,232,0.2)' }}>
            Score recalculates automatically when you update your profile · Powered by Sponsrr AI
          </div>
        </div>
      </div>
    </Layout>
  );
}