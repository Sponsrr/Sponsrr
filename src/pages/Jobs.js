import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

const SECTORS = [
  'Technology & IT', 'Healthcare & Medical', 'Finance & Banking',
  'Education', 'Engineering', 'Construction & Architecture',
  'Hospitality & Food', 'Retail & Fashion', 'Legal', 'Creative & Design',
  'Science & Research', 'Transport & Logistics', 'Social Care',
  'Marketing & Communications', 'Accounting & Consulting',
  'Sport & Fitness', 'Charity & Non-profit', 'Recruitment & HR', 'Security',
];

const SECTOR_KEYWORDS = {
  'Technology & IT':             ['software','developer','engineer','data','cloud','devops','react','java','python','tech','it','cyber','ai','machine learning','frontend','backend','fullstack','mobile','ios','android'],
  'Healthcare & Medical':        ['nurse','doctor','medical','healthcare','clinical','pharmacy','nhs','care','health','gp','surgeon','therapist','radiographer','midwife','paramedic','dentist'],
  'Finance & Banking':           ['finance','banking','accountant','analyst','investment','treasury','risk','compliance','audit','insurance','fintech','trading'],
  'Education':                   ['teacher','education','tutor','lecturer','academic','school','university','training','teaching','curriculum','sen'],
  'Engineering':                 ['engineer','mechanical','electrical','civil','structural','manufacturing','aerospace','automotive','chemical','process'],
  'Construction & Architecture': ['construction','architect','surveyor','quantity','site','planning','building','cad','bim'],
  'Hospitality & Food':          ['chef','hospitality','hotel','restaurant','catering','food','beverage','kitchen','barista','front of house'],
  'Retail & Fashion':            ['retail','fashion','buyer','merchandiser','store','ecommerce','visual'],
  'Legal':                       ['lawyer','solicitor','legal','paralegal','compliance','barrister','conveyancing'],
  'Creative & Design':           ['designer','creative','ux','ui','graphic','motion','art','brand','content','copywriter','video','photography'],
  'Science & Research':          ['scientist','research','laboratory','biology','chemistry','physics','r&d','clinical trials'],
  'Transport & Logistics':       ['logistics','transport','supply chain','warehouse','driver','freight','operations','fleet'],
  'Social Care':                 ['social worker','care','support worker','mental health','community','charity','vulnerable'],
  'Marketing & Communications':  ['marketing','seo','ppc','social media','communications','pr','growth','digital','campaign'],
  'Accounting & Consulting':     ['accountant','consultant','strategy','management','advisory','cpa','cfo','audit'],
  'Sport & Fitness':             ['sport','fitness','coach','personal trainer','physio','athlete','leisure'],
  'Charity & Non-profit':        ['charity','non-profit','ngo','fundraising','volunteer','third sector'],
  'Recruitment & HR':            ['recruiter','hr','human resources','talent','people','recruitment','payroll','l&d'],
  'Security':                    ['security','guard','surveillance','protection','vetting','cctv'],
};

const SYNONYMS = {
  'nurse':      ['nurse','nursing','rn','rgn','healthcare assistant','hca','staff nurse'],
  'doctor':     ['doctor','physician','gp','consultant','registrar','medical officer'],
  'developer':  ['developer','programmer','engineer','coder','software'],
  'accountant': ['accountant','finance','cpa','chartered','aca','acca'],
  'teacher':    ['teacher','tutor','lecturer','educator','instructor'],
  'chef':       ['chef','cook','kitchen','culinary','sous chef','head chef'],
};

const LOCATION_PROXIMITY = {
  'london':      ['london','greater london','city of london','east london','west london','south london','north london','canary wharf'],
  'manchester':  ['manchester','greater manchester','salford','stockport','trafford','oldham'],
  'birmingham':  ['birmingham','west midlands','solihull','wolverhampton','coventry'],
  'leeds':       ['leeds','west yorkshire','bradford','wakefield','harrogate'],
  'edinburgh':   ['edinburgh','lothian','glasgow','scotland'],
  'glasgow':     ['glasgow','scotland','edinburgh','lanarkshire'],
  'bristol':     ['bristol','bath','somerset','avon'],
  'liverpool':   ['liverpool','merseyside','wirral','chester'],
  'sheffield':   ['sheffield','south yorkshire','rotherham','doncaster'],
  'cardiff':     ['cardiff','wales','newport','swansea'],
  'nottingham':  ['nottingham','derby','leicester','east midlands'],
  'cambridge':   ['cambridge','peterborough','ely','suffolk'],
  'oxford':      ['oxford','oxfordshire','reading','berkshire'],
};

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest first' },
  { value: 'oldest',      label: 'Oldest first' },
  { value: 'salary_high', label: 'Salary: High to Low' },
  { value: 'salary_low',  label: 'Salary: Low to High' },
];

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const SPONSOR_TIERS = [
  { value: 'all',       label: 'All jobs' },
  { value: 'confirmed', label: '✓ Confirmed sponsors' },
  { value: 'possible',  label: '◎ May sponsor' },
];

const PER_PAGE = 20;

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = n => `£${Number(n).toLocaleString('en-GB')}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return `~${fmt(min || max)}`;
}

function getSalaryLabel(job) {
  const sal = formatSalary(job.salary_min, job.salary_max);
  if (sal) return { text: sal, real: true };
  const title = (job.title || '').toLowerCase();
  if (title.includes('senior') || title.includes('lead') || title.includes('principal')) return { text: 'Typically £50k–£80k+', real: false };
  if (title.includes('manager') || title.includes('director')) return { text: 'Typically £45k–£75k+', real: false };
  if (title.includes('junior') || title.includes('graduate') || title.includes('trainee')) return { text: 'Typically £22k–£35k', real: false };
  if (title.includes('nurse') || title.includes('doctor') || title.includes('nhs')) return { text: 'NHS pay scale', real: false };
  if (title.includes('teacher') || title.includes('lecturer')) return { text: 'MPS/UPS scale', real: false };
  return { text: 'Competitive', real: false };
}

function detectWorkType(description) {
  if (!description) return 'On-site';
  const d = description.toLowerCase();
  if (d.includes('fully remote') || d.includes('100% remote') || d.includes('remote only') || d.includes('work from home') || d.includes('wfh')) return 'Remote';
  if (d.includes('hybrid') || d.includes('flexible working') || d.includes('part remote') || d.includes('2 days')) return 'Hybrid';
  return 'On-site';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function expandSearch(term) {
  const t = term.toLowerCase().trim();
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (syns.some(s => t.includes(s)) || t.includes(key)) return syns;
  }
  return [term];
}

function expandLocation(loc) {
  const l = loc.toLowerCase().trim();
  for (const [key, nearby] of Object.entries(LOCATION_PROXIMITY)) {
    if (l.includes(key) || key.includes(l)) return nearby;
  }
  return [loc];
}

export default function Jobs() {
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [location, setLocation]       = useState('');
  const [remoteOnly, setRemoteOnly]   = useState(false);
  const [sectors, setSectors]         = useState([]);
  const [workTypes, setWorkTypes]     = useState([]);
  const [sponsorTier, setSponsorTier] = useState('all');
  const [sort, setSort]               = useState('newest');
  const [salaryMin, setSalaryMin]     = useState('');
  const [salaryMax, setSalaryMax]     = useState('');
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [error, setError]             = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sectorDropOpen, setSectorDropOpen] = useState(false);
  const sectorDropRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (sectorDropRef.current && !sectorDropRef.current.contains(e.target)) {
        setSectorDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (search.trim()) {
        const terms = expandSearch(search.trim());
        const orParts = terms.flatMap(t => [
          `title.ilike.%${t}%`,
          `description.ilike.%${t}%`,
          `company_name.ilike.%${t}%`,
        ]);
        query = query.or(orParts.join(','));
      }

      if (location.trim() && !remoteOnly) {
        const locs = expandLocation(location.trim());
        query = query.or(locs.map(l => `location.ilike.%${l}%`).join(','));
      }

      if (sectors.length > 0) {
        const kws = sectors.flatMap(s => SECTOR_KEYWORDS[s] || []);
        const secOr = kws.map(k => `title.ilike.%${k}%`).join(',');
        if (secOr) query = query.or(secOr);
      }

      if (sponsorTier !== 'all') query = query.eq('sponsorship_tier', sponsorTier);
      if (salaryMin) query = query.gte('salary_min', parseInt(salaryMin));
      if (salaryMax) query = query.lte('salary_max', parseInt(salaryMax));

      if (sort === 'newest')      query = query.order('posted_at', { ascending: false });
      if (sort === 'oldest')      query = query.order('posted_at', { ascending: true });
      if (sort === 'salary_high') query = query.order('salary_max', { ascending: false, nullsFirst: false });
      if (sort === 'salary_low')  query = query.order('salary_min', { ascending: true, nullsFirst: false });

      query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      const { data, count, error: err } = await query;
      if (err) throw err;

      let results = data || [];
      if (workTypes.length > 0 || remoteOnly) {
        const allowed = remoteOnly ? ['Remote'] : workTypes;
        results = results.filter(j => allowed.includes(detectWorkType(j.description)));
      }

      setJobs(results);
      setTotal(count || 0);
    } catch (e) {
      console.error(e);
      setError('Could not load jobs. Please try again.');
      setJobs([]);
    }
    setLoading(false);
  }, [search, location, remoteOnly, sectors, workTypes, sponsorTier, sort, salaryMin, salaryMax, page]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 350);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  useEffect(() => { setPage(1); }, [search, location, remoteOnly, sectors, workTypes, sponsorTier, sort, salaryMin, salaryMax]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const activeFilterCount = sectors.length + workTypes.length + (sponsorTier !== 'all' ? 1 : 0) + (salaryMin ? 1 : 0) + (salaryMax ? 1 : 0) + (remoteOnly ? 1 : 0);

  function toggleSector(s) { setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); }
  function toggleWorkType(w) { setWorkTypes(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]); }
  function clearAllFilters() { setSectors([]); setWorkTypes([]); setSponsorTier('all'); setSalaryMin(''); setSalaryMax(''); setRemoteOnly(false); }

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <Navbar />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
          .live-dot { animation: blink 1.4s ease infinite; }

          .job-card { transition: border-color 0.2s ease, transform 0.2s ease; }
          .job-card:hover { border-color: rgba(200,255,0,0.22) !important; transform: translateY(-1px); }

          .apply-btn { transition: background 0.2s, color 0.2s, border-color 0.2s; }
          .apply-btn:hover { background: #080808 !important; color: #c8ff00 !important; border-color: #c8ff00 !important; }

          .pills-scroll {
            display: flex; gap: 0.45rem; overflow-x: auto;
            scrollbar-width: none; -ms-overflow-style: none;
            padding-bottom: 2px; min-width: 0;
          }
          .pills-scroll::-webkit-scrollbar { display: none; }
          .pill-btn { transition: all 0.18s; white-space: nowrap; flex-shrink: 0; }

          .filter-input {
            background: rgba(240,237,232,0.06);
            border: 1px solid rgba(240,237,232,0.1);
            border-radius: 10px; padding: 0.65rem 1rem;
            color: #f0ede8; font-size: 0.85rem; outline: none;
            width: 100%; transition: border-color 0.2s; font-family: inherit;
          }
          .filter-input:focus { border-color: rgba(200,255,0,0.4); }
          .filter-input::placeholder { color: rgba(240,237,232,0.28); }
          .filter-input:disabled { opacity: 0.35; cursor: not-allowed; }

          .filter-select {
            background: rgba(240,237,232,0.06);
            border: 1px solid rgba(240,237,232,0.1);
            border-radius: 10px; padding: 0.65rem 2.2rem 0.65rem 0.9rem;
            color: #f0ede8; font-size: 0.82rem; outline: none;
            width: 100%; cursor: pointer; font-family: inherit;
            appearance: none; -webkit-appearance: none;
          }
          .filter-select option { background: #1a1a1a; color: #f0ede8; }

          .select-wrap { position: relative; }
          .select-wrap::after {
            content: '↓'; position: absolute; right: 0.75rem; top: 50%;
            transform: translateY(-50%); color: rgba(240,237,232,0.4);
            font-size: 0.72rem; pointer-events: none;
          }

          .sidebar-label {
            font-size: 0.66rem; font-weight: 600; letter-spacing: 0.1em;
            text-transform: uppercase; color: rgba(240,237,232,0.3);
            margin-bottom: 0.55rem; display: block;
          }

          .sidebar-filter-btn {
            width: 100%; text-align: left; border-radius: 8px;
            padding: 0.48rem 0.85rem; font-size: 0.81rem; cursor: pointer;
            font-family: inherit; transition: all 0.18s;
            border: 1px solid rgba(240,237,232,0.08);
            background: rgba(240,237,232,0.04); color: rgba(240,237,232,0.55);
          }
          .sidebar-filter-btn.active {
            background: rgba(200,255,0,0.08); border-color: rgba(200,255,0,0.25);
            color: #c8ff00; font-weight: 600;
          }
          .sidebar-filter-btn:hover:not(.active) { background: rgba(240,237,232,0.07); color: rgba(240,237,232,0.8); }

          .sector-dropdown {
            position: absolute; top: calc(100% + 6px); left: 0; right: 0;
            background: #1c1c1c; border: 1px solid rgba(240,237,232,0.1);
            border-radius: 14px; padding: 0.6rem; z-index: 200;
            max-height: 260px; overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          }
          .sector-dropdown::-webkit-scrollbar { width: 4px; }
          .sector-dropdown::-webkit-scrollbar-thumb { background: rgba(240,237,232,0.1); border-radius: 2px; }

          .sector-check-row {
            display: flex; align-items: center; gap: 0.5rem;
            padding: 0.38rem 0.4rem; border-radius: 7px;
            cursor: pointer; transition: background 0.15s;
          }
          .sector-check-row:hover { background: rgba(240,237,232,0.05); }

          .filter-sheet {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #141414; border-top: 1px solid rgba(240,237,232,0.1);
            border-radius: 22px 22px 0 0; padding: 1.5rem 1.5rem 2.5rem;
            z-index: 1001; max-height: 88vh; overflow-y: auto;
          }

          .page-inner {
            width: 100%; max-width: 1200px; margin: 0 auto;
            padding-left: 1.5rem; padding-right: 1.5rem;
          }

          .jobs-layout { display: flex; gap: 2rem; align-items: flex-start; width: 100%; }
          .jobs-list-area { flex: 1; min-width: 0; width: 100%; overflow: hidden; }

          /* ── DESKTOP ONLY ── */
          @media(min-width: 901px) {
            .mobile-only { display: none !important; }

            /* Hero heading — force two lines */
            .hero-line-1 { display: block; color: #f0ede8; }
            .hero-line-2 { display: block; color: #c8ff00; }

            /* PC search row: search 50%, location 25%, sort 15% + gap */
            .pc-search-row { display: flex; gap: 0.6rem; margin-bottom: 1.25rem; }
            .pc-search-row .search-input { flex: 10; }
            .pc-search-row .location-input { flex: 5; }
            .pc-search-row .sort-wrap-pc { flex: 3; position: relative; }
            .pc-search-row .sort-wrap-pc::after {
              content: '↓'; position: absolute; right: 0.75rem; top: 50%;
              transform: translateY(-50%); color: rgba(240,237,232,0.4);
              font-size: 0.72rem; pointer-events: none;
            }
          }

          /* ── MOBILE ONLY ── */
          @media(max-width: 900px) {
            .desktop-sidebar { display: none !important; }
            .jobs-layout { flex-direction: column; }
            .pc-search-row { display: none !important; }

            /* Hero heading — normal flow on mobile */
            .hero-line-1 { color: #f0ede8; }
            .hero-line-2 { color: #c8ff00; }
          }
        `}</style>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="page-inner" style={{ paddingTop: '6rem', paddingBottom: 0 }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600, marginBottom: '1rem' }}>
              <span className="live-dot" style={{ width: 6, height: 6, background: '#c8ff00', borderRadius: '50%', display: 'inline-block' }} />
              Live sponsored jobs
            </div>
            {/* Hero heading — two explicit lines on desktop */}
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '0.5rem' }}>
              <span className="hero-line-1">Jobs that will</span>
              <span className="hero-line-2"> actually sponsor you.</span>
            </h1>
            <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.92rem' }}>
              Every listing cross-referenced against 121,000+ verified UK visa sponsors.
            </p>
          </div>

          {/* ── PC SEARCH ROW: search + location + sort in one line ── */}
          <div className="pc-search-row">
            <input
              className="filter-input search-input"
              placeholder="Job title, skill or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <input
              className="filter-input location-input"
              placeholder="Location..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              disabled={remoteOnly}
            />
            <div className="sort-wrap-pc">
              <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── MOBILE SEARCH ROW: search + location only, 60:40 ── */}
          <div className="mobile-only" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', width: '100%' }}>
            <input className="filter-input" placeholder="Job title, skill or keyword..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 3 }} />
            <input className="filter-input" placeholder="Location..." value={location} onChange={e => setLocation(e.target.value)} disabled={remoteOnly} style={{ flex: 2 }} />
          </div>

          {/* ── MOBILE: horizontal pills + filters button ── */}
          <div className="mobile-only" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
            <div className="pills-scroll" style={{ flex: 1 }}>
              {SECTORS.map(s => (
                <button key={s} className="pill-btn" onClick={() => toggleSector(s)} style={{
                  background: sectors.includes(s) ? '#c8ff00' : 'rgba(240,237,232,0.07)',
                  color: sectors.includes(s) ? '#080808' : 'rgba(240,237,232,0.55)',
                  border: 'none', borderRadius: '100px', padding: '0.38rem 0.85rem',
                  fontSize: '0.73rem', fontWeight: sectors.includes(s) ? 700 : 400, cursor: 'pointer',
                }}>
                  {s}
                </button>
              ))}
            </div>
            <button
              className="pill-btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: activeFilterCount > 0 ? 'rgba(200,255,0,0.12)' : 'rgba(240,237,232,0.07)',
                color: activeFilterCount > 0 ? '#c8ff00' : 'rgba(240,237,232,0.6)',
                border: activeFilterCount > 0 ? '1px solid rgba(200,255,0,0.28)' : '1px solid rgba(240,237,232,0.1)',
                borderRadius: '10px', padding: '0.5rem 0.9rem',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>

        {/* ── MAIN LAYOUT ──────────────────────────────────────────────────── */}
        <div className="page-inner" style={{ paddingTop: 0, paddingBottom: '2rem' }}>
          <div className="jobs-layout">

            {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
            <aside className="desktop-sidebar" style={{ width: 232, flexShrink: 0, position: 'sticky', top: '5.5rem' }}>

              {/* Sector */}
              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Sector</span>
                <div ref={sectorDropRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setSectorDropOpen(o => !o)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: 'rgba(240,237,232,0.06)',
                      border: `1px solid ${sectors.length > 0 ? 'rgba(200,255,0,0.3)' : 'rgba(240,237,232,0.1)'}`,
                      borderRadius: 10, padding: '0.62rem 2.2rem 0.62rem 0.9rem',
                      color: sectors.length > 0 ? '#c8ff00' : 'rgba(240,237,232,0.45)',
                      fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
                    }}
                  >
                    {sectors.length > 0 ? `${sectors.length} sector${sectors.length > 1 ? 's' : ''} selected` : 'All sectors'}
                    <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: `translateY(-50%) rotate(${sectorDropOpen ? '180deg' : '0deg'})`, transition: 'transform 0.2s', color: 'rgba(240,237,232,0.4)', fontSize: '0.72rem' }}>↓</span>
                  </button>
                  {sectorDropOpen && (
                    <div className="sector-dropdown">
                      {SECTORS.map(s => (
                        <label key={s} className="sector-check-row">
                          <input type="checkbox" checked={sectors.includes(s)} onChange={() => toggleSector(s)} style={{ accentColor: '#c8ff00', width: 13, height: 13, cursor: 'pointer', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: sectors.includes(s) ? '#c8ff00' : 'rgba(240,237,232,0.65)' }}>{s}</span>
                        </label>
                      ))}
                      {sectors.length > 0 && (
                        <button onClick={() => setSectors([])} style={{ marginTop: '0.5rem', width: '100%', background: 'none', border: 'none', color: 'rgba(240,237,232,0.3)', fontSize: '0.73rem', cursor: 'pointer', padding: '0.3rem', fontFamily: 'inherit' }}>
                          Clear selection
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Work type */}
              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Work type</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {WORK_TYPES.map(w => (
                    <button key={w} className={`sidebar-filter-btn${workTypes.includes(w) ? ' active' : ''}`} onClick={() => toggleWorkType(w)}>{w}</button>
                  ))}
                </div>
              </div>

              {/* Sponsor status */}
              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Sponsor status</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {SPONSOR_TIERS.map(t => (
                    <button key={t.value} className={`sidebar-filter-btn${sponsorTier === t.value ? ' active' : ''}`} onClick={() => setSponsorTier(t.value)}>{t.label}</button>
                  ))}
                </div>
              </div>

              {/* Salary range */}
              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Salary range</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="filter-input" placeholder="Min £" type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} style={{ width: '50%' }} />
                  <input className="filter-input" placeholder="Max £" type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} style={{ width: '50%' }} />
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters}
                  style={{ width: '100%', background: 'none', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 8, padding: '0.5rem', color: 'rgba(240,237,232,0.35)', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,0,0.3)'; e.currentTarget.style.color = '#ff4d00'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,237,232,0.1)'; e.currentTarget.style.color = 'rgba(240,237,232,0.35)'; }}
                >
                  Clear all filters
                </button>
              )}
            </aside>

            {/* ── JOBS LIST ───────────────────────────────────────────────── */}
            <div className="jobs-list-area">

              {/* Results count */}
              <div style={{ marginBottom: '1.1rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.4)' }}>
                  {loading ? 'Searching...' : (
                    <>
                      <span style={{ color: '#c8ff00', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{total.toLocaleString()}</span>
                      <span> jobs found</span>
                      {location && !remoteOnly && <span style={{ color: 'rgba(240,237,232,0.28)' }}> near {location}</span>}
                      {remoteOnly && <span style={{ color: 'rgba(240,237,232,0.28)' }}> · Remote only</span>}
                    </>
                  )}
                </span>
              </div>

              {error && (
                <div style={{ background: 'rgba(255,77,0,0.07)', border: '1px solid rgba(255,77,0,0.18)', borderRadius: 14, padding: '1.1rem', color: 'rgba(240,237,232,0.55)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.84rem' }}>
                  {error}
                </div>
              )}

              {/* Loading skeletons */}
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 18, padding: '1.4rem', opacity: 1 - i * 0.12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                        <div style={{ height: 15, width: '42%', background: 'rgba(240,237,232,0.07)', borderRadius: 6 }} />
                        <div style={{ height: 15, width: '16%', background: 'rgba(200,255,0,0.07)', borderRadius: 6 }} />
                      </div>
                      <div style={{ height: 11, width: '28%', background: 'rgba(240,237,232,0.04)', borderRadius: 6, marginBottom: '0.8rem' }} />
                      <div style={{ height: 10, width: '88%', background: 'rgba(240,237,232,0.03)', borderRadius: 6, marginBottom: '0.35rem' }} />
                      <div style={{ height: 10, width: '72%', background: 'rgba(240,237,232,0.03)', borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {jobs.map(job => {
                      const workType = detectWorkType(job.description);
                      const salary = getSalaryLabel(job);
                      return (
                        <div key={job.id} className="job-card" style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 18, padding: '1.25rem 1.4rem', width: '100%', overflow: 'hidden' }}>

                          {/* Title + salary */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.28rem' }}>
                            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.98rem', color: '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1.3, margin: 0, flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                              {job.title}
                            </h3>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: salary.real ? '#c8ff00' : 'rgba(240,237,232,0.3)', whiteSpace: 'nowrap' }}>
                                {salary.text}
                              </div>
                            </div>
                          </div>

                          {/* Company · Location + time */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.38)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                              {[job.company_name, job.location].filter(Boolean).join(' · ')}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.22)', flexShrink: 0, marginLeft: '0.75rem' }}>
                              {timeAgo(job.posted_at)}
                            </span>
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.35)', lineHeight: 1.65, margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {job.description?.replace(/<[^>]*>/g, '') || ''}
                          </p>

                          {/* Divider */}
                          <div style={{ height: 1, background: 'rgba(240,237,232,0.05)', marginBottom: '0.85rem' }} />

                          {/* Footer — pills layout differs mobile vs desktop */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.75rem' }}>

                            {/* Mobile: stacked pills | Desktop: side by side pills */}
                            <div className="card-badges-mobile mobile-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                              {job.sponsorship_tier === 'confirmed' ? (
                                <span style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(200,255,0,0.2)' }}>✓ Confirmed Sponsor</span>
                              ) : (
                                <span style={{ background: 'transparent', color: 'rgba(240,237,232,0.3)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(240,237,232,0.1)' }}>◎ May Sponsor</span>
                              )}
                              <span style={{ background: 'rgba(240,237,232,0.04)', color: 'rgba(240,237,232,0.32)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '100px' }}>{workType}</span>
                            </div>

                            <div className="card-badges-desktop desktop-sidebar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {job.sponsorship_tier === 'confirmed' ? (
                                <span style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(200,255,0,0.2)', whiteSpace: 'nowrap' }}>✓ Confirmed Sponsor</span>
                              ) : (
                                <span style={{ background: 'transparent', color: 'rgba(240,237,232,0.3)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(240,237,232,0.1)', whiteSpace: 'nowrap' }}>◎ May Sponsor</span>
                              )}
                              <span style={{ background: 'rgba(240,237,232,0.04)', color: 'rgba(240,237,232,0.32)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '100px', whiteSpace: 'nowrap' }}>{workType}</span>
                            </div>

                            <a href="/pricing" className="apply-btn" style={{ background: '#c8ff00', color: '#080808', padding: '0.45rem 1.1rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', border: '1px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              Upgrade to Apply →
                            </a>
                          </div>

                        </div>
                      );
                    })}

                    {jobs.length === 0 && !loading && !error && (
                      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'rgba(240,237,232,0.45)', marginBottom: '0.4rem' }}>No jobs found</div>
                        <div style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.28)' }}>Try broader keywords or clear some filters.</div>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn(false, page === 1)}>←</button>
                        {getPageNumbers(page, totalPages).map((p, i) =>
                          p === '...'
                            ? <span key={i} style={{ color: 'rgba(240,237,232,0.25)', padding: '0 0.25rem', fontSize: '0.82rem' }}>…</span>
                            : <button key={p} onClick={() => setPage(p)} style={pageBtn(p === page, false)}>{p}</button>
                        )}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtn(false, page === totalPages)}>→</button>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '0.73rem', color: 'rgba(240,237,232,0.18)', marginTop: '0.6rem' }}>
                        Page {page} of {totalPages.toLocaleString()}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── DISCLAIMER — full width, outside page-inner ──────────────────── */}
        <div style={{ width: '100%', padding: '1.1rem 2rem', borderTop: '1px solid rgba(240,237,232,0.05)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.18)', flexShrink: 0, lineHeight: 1.65 }}>ℹ</span>
            <p style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.2)', lineHeight: 1.65, margin: 0 }}>
              Job listings on Sponsrr are sourced automatically from hundreds of recruiter databases and updated every 24 hours. While we do our best to keep information accurate, we can make mistakes — incorrect salaries, outdated listings, or mismatched sponsor status can occasionally occur. This is not us getting things wrong, it's the data provided to us by third-party sources. Always verify sponsorship directly with the employer before applying.
            </p>
          </div>
        </div>

        {/* ── MOBILE FILTER SHEET ──────────────────────────────────────────── */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000 }} />
            <div className="filter-sheet">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0ede8' }}>Filters</div>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.4)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
              </div>

              <span className="sidebar-label">Work type</span>
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
                {WORK_TYPES.map(w => (
                  <button key={w} className="pill-btn" onClick={() => toggleWorkType(w)} style={{
                    background: workTypes.includes(w) ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.07)',
                    color: workTypes.includes(w) ? '#c8ff00' : 'rgba(240,237,232,0.6)',
                    border: workTypes.includes(w) ? '1px solid rgba(200,255,0,0.25)' : '1px solid rgba(240,237,232,0.1)',
                    borderRadius: 100, padding: '0.42rem 1rem', fontSize: '0.8rem',
                    fontWeight: workTypes.includes(w) ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{w}</button>
                ))}
              </div>

              <span className="sidebar-label">Sponsor status</span>
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
                {SPONSOR_TIERS.map(t => (
                  <button key={t.value} className="pill-btn" onClick={() => setSponsorTier(t.value)} style={{
                    background: sponsorTier === t.value ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.07)',
                    color: sponsorTier === t.value ? '#c8ff00' : 'rgba(240,237,232,0.6)',
                    border: sponsorTier === t.value ? '1px solid rgba(200,255,0,0.25)' : '1px solid rgba(240,237,232,0.1)',
                    borderRadius: 100, padding: '0.42rem 1rem', fontSize: '0.78rem',
                    fontWeight: sponsorTier === t.value ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{t.label}</button>
                ))}
              </div>

              <span className="sidebar-label">Sort by</span>
              <div className="select-wrap" style={{ marginBottom: '1.4rem' }}>
                <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <span className="sidebar-label">Salary range</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input className="filter-input" placeholder="Min £" type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} style={{ width: '50%' }} />
                <input className="filter-input" placeholder="Max £" type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} style={{ width: '50%' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {activeFilterCount > 0 && (
                  <button onClick={() => { clearAllFilters(); setSidebarOpen(false); }} style={{ flex: 1, background: 'none', border: '1px solid rgba(240,237,232,0.12)', borderRadius: 12, padding: '0.75rem', color: 'rgba(240,237,232,0.45)', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Clear
                  </button>
                )}
                <button onClick={() => setSidebarOpen(false)} style={{ flex: 2, background: '#c8ff00', border: 'none', borderRadius: 12, padding: '0.75rem', color: '#080808', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Show {total.toLocaleString()} jobs
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}

function getPageNumbers(current, total) {
  const pages = [];
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  pages.push(1);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('...');
  if (total > 1) pages.push(total);
  return pages;
}

function pageBtn(active, disabled) {
  return {
    background: active ? '#c8ff00' : 'rgba(240,237,232,0.06)',
    color: active ? '#080808' : disabled ? 'rgba(240,237,232,0.15)' : 'rgba(240,237,232,0.6)',
    border: 'none', borderRadius: '8px', width: 34, height: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Syne, sans-serif', fontWeight: active ? 700 : 400,
    fontSize: '0.82rem', cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.2s', opacity: disabled ? 0.3 : 1,
  };
}