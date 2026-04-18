import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const SECTOR_KEYWORDS = {
  'Technology & IT':             ['software','developer','engineer','data','cloud','devops','react','java','python','tech','it','cyber','ai'],
  'Healthcare & Medical':        ['nurse','doctor','medical','healthcare','clinical','pharmacy','nhs','care','health','gp','surgeon','therapist'],
  'Finance & Banking':           ['finance','banking','accountant','analyst','investment','treasury','risk','compliance','audit','insurance'],
  'Education':                   ['teacher','education','tutor','lecturer','academic','school','university','training'],
  'Engineering':                 ['engineer','mechanical','electrical','civil','structural','manufacturing','aerospace'],
  'Construction & Architecture': ['construction','architect','surveyor','quantity','site','planning','building'],
  'Hospitality & Food':          ['chef','hospitality','hotel','restaurant','catering','food','beverage','kitchen'],
  'Retail & Fashion':            ['retail','fashion','buyer','merchandiser','store','ecommerce'],
  'Legal':                       ['lawyer','solicitor','legal','paralegal','compliance','barrister'],
  'Creative & Design':           ['designer','creative','ux','ui','graphic','motion','art','brand','content','copywriter'],
  'Science & Research':          ['scientist','research','laboratory','biology','chemistry','physics'],
  'Transport & Logistics':       ['logistics','transport','supply chain','warehouse','driver','freight','operations'],
  'Social Care':                 ['social worker','care','support worker','mental health','community'],
  'Marketing & Communications':  ['marketing','seo','ppc','social media','communications','pr','growth','digital'],
  'Accounting & Consulting':     ['accountant','consultant','strategy','management','advisory'],
  'Sport & Fitness':             ['sport','fitness','coach','personal trainer','physio'],
  'Charity & Non-profit':        ['charity','non-profit','ngo','fundraising','volunteer'],
  'Recruitment & HR':            ['recruiter','hr','human resources','talent','people','recruitment'],
  'Security':                    ['security','guard','surveillance','protection','vetting'],
};

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = n => `£${Number(n).toLocaleString('en-GB')}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return `~${fmt(min || max)}`;
}

function getSalaryLabel(job) {
  const sal = formatSalary(job.salary_min, job.salary_max);
  if (sal) return { text: sal, real: true };
  const t = (job.title || '').toLowerCase();
  if (t.includes('senior') || t.includes('lead') || t.includes('principal')) return { text: 'Typically £50k–£80k+', real: false };
  if (t.includes('manager') || t.includes('director'))                        return { text: 'Typically £45k–£75k+', real: false };
  if (t.includes('junior') || t.includes('graduate') || t.includes('trainee')) return { text: 'Typically £22k–£35k', real: false };
  if (t.includes('nurse') || t.includes('doctor') || t.includes('nhs'))       return { text: 'NHS pay scale', real: false };
  if (t.includes('teacher') || t.includes('lecturer'))                         return { text: 'MPS/UPS scale', real: false };
  return { text: 'Competitive salary', real: false };
}

function detectWorkType(desc) {
  if (!desc) return 'On-site';
  const d = desc.toLowerCase();
  if (d.includes('fully remote') || d.includes('100% remote') || d.includes('work from home') || d.includes('wfh')) return 'Remote';
  if (d.includes('hybrid') || d.includes('flexible working') || d.includes('part remote')) return 'Hybrid';
  return 'On-site';
}

function getWorkIcon(type) {
  if (type === 'Remote') return '🏠';
  if (type === 'Hybrid') return '🔄';
  return '📍';
}

function getCoSRoute(job) {
  const t = (job.title || '').toLowerCase();
  if (t.includes('nurse') || t.includes('doctor') || t.includes('nhs') || t.includes('care') || t.includes('health')) return 'Health & Care';
  if (t.includes('teacher') || t.includes('lecturer')) return 'Education';
  if (t.includes('chef') || t.includes('cook') || t.includes('hospitality')) return 'Hospitality';
  return 'Skilled Worker';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'Today';
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 90) return `${Math.floor(days / 30)}mo ago`;
  return 'Recently';
}

function isRecent(dateStr) {
  return dateStr && Date.now() - new Date(dateStr).getTime() < 86400000;
}

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getCompanyDomain(name) {
  if (!name) return null;
  const cleaned = name.toLowerCase()
    .replace(/\b(ltd|limited|plc|inc|llc|group|uk|the|and|&|recruitment|consulting|services|solutions)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/)[0];
  return cleaned ? `${cleaned}.com` : null;
}

function CompanyLogo({ name, size = 44 }) {
  const [failed, setFailed] = useState(false);
  const domain   = getCompanyDomain(name);
  const initials = getInitials(name);
  if (!domain || failed) {
    return (
      <div style={{ width: size, height: size, borderRadius: 10, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size * 0.32 + 'px', color: '#c8ff00' }}>
        {initials}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      <img src={`https://logo.clearbit.com/${domain}`} alt={name} onError={() => setFailed(true)} style={{ width: size * 0.65, height: size * 0.65, objectFit: 'contain' }} />
    </div>
  );
}

// ── UPGRADE MODAL ─────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '24px 24px 0 0', padding: '2rem 1.5rem 3rem', zIndex: 2001, maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 40, height: 4, background: 'rgba(240,237,232,0.15)', borderRadius: 2, margin: '0 auto 1.5rem' }} />
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔓</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0ede8', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Unlock all sponsored jobs
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>
            Full search, filters, sorting and thousands of verified UK sponsorship jobs. Less than a meal deal a month.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          {[
            { plan: 'Monthly',   price: '£3.49', period: '/month',      tag: 'Most flexible',  saving: '12%',    perWeek: '87p/week',  highlight: false },
            { plan: 'Quarterly', price: '£9.99', period: '/quarter', tag: 'Most popular ⭐', saving: '24%',   perWeek: '77p/week',  highlight: true  },
            { plan: 'Annual',    price: '£34.99',period: '/year',    tag: 'Best value',      saving: '32%',   perWeek: '67p/week',  highlight: false },
          ].map(p => (
            <button
              key={p.plan}
              onClick={onUpgrade}
              style={{
                background: p.highlight ? '#c8ff00' : 'rgba(240,237,232,0.05)',
                border: p.highlight ? '2px solid #c8ff00' : '1px solid rgba(240,237,232,0.12)',
                borderRadius: 14, padding: '0.9rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: p.highlight ? '#080808' : '#f0ede8' }}>{p.plan}</span>
                  {p.saving && (
                    <span style={{ background: p.highlight ? 'rgba(8,8,8,0.15)' : 'rgba(200,255,0,0.12)', color: p.highlight ? '#080808' : '#c8ff00', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '100px' }}>Save {p.saving}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: p.highlight ? 'rgba(8,8,8,0.55)' : 'rgba(240,237,232,0.35)', marginTop: '0.15rem' }}>
                  {p.tag} · {p.perWeek}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: p.highlight ? '#080808' : '#c8ff00' }}>
                  {p.price}
                </div>
                <div style={{ fontSize: '0.65rem', color: p.highlight ? 'rgba(8,8,8,0.5)' : 'rgba(240,237,232,0.3)' }}>{p.period}</div>
              </div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)', textAlign: 'center' }}>Cancel anytime · Secure payment via Stripe</p>
      </div>
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Jobs() {
  const navigate = useNavigate();

  const [isPaid, setIsPaid]           = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [error, setError]             = useState(null);

  const [search, setSearch]           = useState('');
  const [location, setLocation]       = useState('');
  const [sectors, setSectors]         = useState([]);
  const [workTypes, setWorkTypes]     = useState([]);
  const [sponsorTier, setSponsorTier] = useState('all');
  const [sort, setSort]               = useState('newest');
  const [salaryMin, setSalaryMin]     = useState('');
  const [salaryMax, setSalaryMax]     = useState('');
  const [page, setPage]               = useState(1);

  const [showModal, setShowModal]         = useState(false);
  const [shakeTarget, setShakeTarget]     = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [sectorDropOpen, setSectorDropOpen] = useState(false);
  const sectorDropRef = useRef(null);

  const FREE_LIMIT = 20;
  const PER_PAGE   = 20;

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate('/login'); return; }
      const { data: sub } = await supabase
        .from('subscriptions').select('plan,status')
        .eq('user_id', u.id).in('status', ['active','trialing'])
        .in('plan', ['monthly','quarterly','annual']).limit(1).single();
      setIsPaid(!!sub);
      setAuthLoading(false);
    }
    checkAuth();
  }, [navigate]);

  const fetchJobs = useCallback(async () => {
    if (authLoading) return;
    setLoading(true); setError(null);
    try {
      let query = supabase.from('jobs').select('*', { count: 'exact' })
        .eq('is_active', true).order('posted_at', { ascending: false });

      if (isPaid) {
        if (search.trim()) query = query.or([`title.ilike.%${search.trim()}%`,`description.ilike.%${search.trim()}%`,`company_name.ilike.%${search.trim()}%`].join(','));
        if (location.trim()) query = query.ilike('location', `%${location.trim()}%`);
        if (sectors.length > 0) {
          const kws = sectors.flatMap(s => SECTOR_KEYWORDS[s] || []);
          if (kws.length > 0) query = query.or(kws.map(k => `title.ilike.%${k}%`).join(','));
        }
        if (sponsorTier !== 'all') query = query.eq('sponsorship_tier', sponsorTier);
        if (salaryMin) query = query.gte('salary_min', parseInt(salaryMin));
        if (salaryMax) query = query.lte('salary_max', parseInt(salaryMax));
        if (sort === 'salary_high') query = query.order('salary_max', { ascending: false, nullsFirst: false });
        if (sort === 'salary_low')  query = query.order('salary_min', { ascending: true,  nullsFirst: false });
        if (sort === 'oldest')      query = query.order('posted_at',  { ascending: true });
        query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
      } else {
        query = query.limit(FREE_LIMIT);
      }

      const { data, count, error: err } = await query;
      if (err) throw err;
      let results = data || [];
      if (isPaid && workTypes.length > 0) results = results.filter(j => workTypes.includes(detectWorkType(j.description)));
      setJobs(results); setTotal(count || 0);
    } catch (e) {
      console.error(e); setError('Could not load jobs. Please try again.');
    }
    setLoading(false);
  }, [authLoading, isPaid, search, location, sectors, workTypes, sponsorTier, sort, salaryMin, salaryMax, page]);

  useEffect(() => { const t = setTimeout(fetchJobs, 300); return () => clearTimeout(t); }, [fetchJobs]);
  useEffect(() => { setPage(1); }, [search, location, sectors, workTypes, sponsorTier, sort, salaryMin, salaryMax]);
  useEffect(() => {
    function h(e) { if (sectorDropRef.current && !sectorDropRef.current.contains(e.target)) setSectorDropOpen(false); }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const totalPages = Math.ceil(total / PER_PAGE);

  function handleLocked(id) {
    if (isPaid) return;
    setShakeTarget(id); setTimeout(() => setShakeTarget(null), 600); setShowModal(true);
  }

  if (authLoading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading...</div>
    </div>
  );

  // Fake page numbers to show free users what they're missing
  const fakePages = [1, 2, 3, 4, '...', Math.ceil(total / PER_PAGE)];

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh', overflowX: 'hidden' }}>
        <Navbar />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
          @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
          .live-dot { animation: blink 1.4s ease infinite; }
          .new-dot  { animation: blink 1.4s ease infinite; display:inline-block; width:5px; height:5px; background:#c8ff00; border-radius:50%; margin-right:3px; vertical-align:middle; }
          .do-shake { animation: shake 0.5s ease; }
          .job-card { transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; cursor: pointer; }
          .job-card:hover { border-color: rgba(200,255,0,0.28) !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
          .view-btn { transition: background 0.2s, color 0.2s, border-color 0.2s; }
          .view-btn:hover { background: #080808 !important; color: #c8ff00 !important; border-color: #c8ff00 !important; }
          .filter-input { background:rgba(240,237,232,0.06); border:1px solid rgba(240,237,232,0.1); border-radius:10px; padding:0.65rem 1rem; color:#f0ede8; font-size:0.85rem; outline:none; width:100%; transition:border-color 0.2s; font-family:inherit; }
          .filter-input:focus { border-color:rgba(200,255,0,0.4); }
          .filter-input::placeholder { color:rgba(240,237,232,0.28); }
          .filter-select { background:rgba(240,237,232,0.06); border:1px solid rgba(240,237,232,0.1); border-radius:10px; padding:0.65rem 2.2rem 0.65rem 0.9rem; color:#f0ede8; font-size:0.82rem; outline:none; width:100%; cursor:pointer; font-family:inherit; appearance:none; }
          .filter-select:disabled { opacity:0.38; cursor:not-allowed; }
          .filter-select option { background:#1a1a1a; color:#f0ede8; }
          .select-wrap { position:relative; }
          .select-wrap::after { content:'↓'; position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); color:rgba(240,237,232,0.4); font-size:0.72rem; pointer-events:none; }
          .sidebar-label { font-size:0.66rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:rgba(240,237,232,0.3); margin-bottom:0.55rem; display:block; }
          .sidebar-filter-btn { width:100%; text-align:left; border-radius:8px; padding:0.48rem 0.85rem; font-size:0.81rem; cursor:pointer; font-family:inherit; transition:all 0.18s; border:1px solid rgba(240,237,232,0.08); background:rgba(240,237,232,0.04); color:rgba(240,237,232,0.55); }
          .sidebar-filter-btn.active { background:rgba(200,255,0,0.08); border-color:rgba(200,255,0,0.25); color:#c8ff00; font-weight:600; }
          .sidebar-filter-btn.locked { opacity:0.35; cursor:not-allowed; }
          .sidebar-filter-btn:hover:not(.active):not(.locked) { background:rgba(240,237,232,0.07); color:rgba(240,237,232,0.8); }
          .sector-dropdown { position:absolute; top:calc(100% + 6px); left:0; right:0; background:#1c1c1c; border:1px solid rgba(240,237,232,0.1); border-radius:14px; padding:0.6rem; z-index:200; max-height:260px; overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
          .sector-check-row { display:flex; align-items:center; gap:0.5rem; padding:0.38rem 0.4rem; border-radius:7px; cursor:pointer; transition:background 0.15s; }
          .sector-check-row:hover { background:rgba(240,237,232,0.05); }
          .filter-sheet { position:fixed; bottom:0; left:0; right:0; background:#141414; border-top:1px solid rgba(240,237,232,0.1); border-radius:22px 22px 0 0; padding:1.5rem 1.5rem 2.5rem; z-index:1001; max-height:88vh; overflow-y:auto; }
          .page-inner { width:100%; max-width:1200px; margin:0 auto; padding-left:1.5rem; padding-right:1.5rem; }
          .jobs-layout { display:flex; gap:2rem; align-items:flex-start; width:100%; }
          .jobs-list-area { flex:1; min-width:0; width:100%; overflow:hidden; }
          .upgrade-banner { background:linear-gradient(135deg,rgba(200,255,0,0.07) 0%,rgba(200,255,0,0.03) 100%); border:1px solid rgba(200,255,0,0.15); border-radius:20px; padding:2rem 1.75rem; text-align:center; margin-top:1.5rem; }
          @media(min-width:901px) {
            .mobile-only { display:none !important; }
            .hero-line-2 { color:#c8ff00; display:block; }
            .pc-search-row { display:flex; gap:0.6rem; margin-bottom:1.25rem; }
            .pc-search-row .search-input { flex:10; }
            .pc-search-row .location-input { flex:5; }
            .pc-search-row .sort-wrap-pc { flex:3; position:relative; }
            .pc-search-row .sort-wrap-pc::after { content:'↓'; position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); color:rgba(240,237,232,0.4); font-size:0.72rem; pointer-events:none; }
          }
          @media(max-width:900px) {
            .desktop-sidebar { display:none !important; }
            .jobs-layout { flex-direction:column; }
            .pc-search-row { display:none !important; }
            .hero-line-2 { color:#c8ff00; }
          }
        `}</style>

        {/* HERO */}
        <div className="page-inner" style={{ paddingTop: '6rem', paddingBottom: 0 }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600, marginBottom: '1rem' }}>
              <span className="live-dot" style={{ width: 6, height: 6, background: '#c8ff00', borderRadius: '50%', display: 'inline-block' }} />
              Live sponsored jobs
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '0.5rem', color: '#f0ede8' }}>
              Jobs that will<span className="hero-line-2"> actually sponsor you.</span>
            </h1>
            <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.92rem' }}>
              {isPaid
                ? `${total.toLocaleString()} live UK visa sponsorship jobs. Updated every hour.`
                : 'Every listing cross-referenced against 121,000+ verified UK visa sponsors.'
              }
            </p>
          </div>

          {/* PC search */}
          <div className="pc-search-row">
            <input className={`filter-input search-input${!isPaid ? '' : ''}`} placeholder="Job title, skill or keyword..." value={search} onChange={isPaid ? e => setSearch(e.target.value) : undefined} {...(!isPaid ? { readOnly: true, onClick: () => handleLocked('search'), style: { cursor: 'not-allowed', opacity: 0.45 } } : {})} />
            <input className="filter-input location-input" placeholder="Location..." value={location} onChange={isPaid ? e => setLocation(e.target.value) : undefined} {...(!isPaid ? { readOnly: true, onClick: () => handleLocked('location'), style: { cursor: 'not-allowed', opacity: 0.45 } } : {})} />
            <div className="sort-wrap-pc" onClick={!isPaid ? () => handleLocked('sort') : undefined}>
              <select className="filter-select" value={sort} onChange={isPaid ? e => setSort(e.target.value) : undefined} disabled={!isPaid}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile search */}
          <div className="mobile-only" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', width: '100%' }}>
            <input className="filter-input" placeholder="Job title, skill or keyword..." value={search} onChange={isPaid ? e => setSearch(e.target.value) : undefined} {...(!isPaid ? { readOnly: true, onClick: () => handleLocked('search'), style: { flex: 3, cursor: 'not-allowed', opacity: 0.45 } } : { style: { flex: 3 } })} />
            <input className="filter-input" placeholder="Location..." value={location} onChange={isPaid ? e => setLocation(e.target.value) : undefined} {...(!isPaid ? { readOnly: true, onClick: () => handleLocked('location'), style: { flex: 2, cursor: 'not-allowed', opacity: 0.45 } } : { style: { flex: 2 } })} />
          </div>

          {/* Mobile pills + filters */}
          <div className="mobile-only" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', flex: 1, scrollbarWidth: 'none', paddingBottom: 2 }}>
              {SECTORS.map(s => (
                <button key={s}
                  onClick={isPaid ? () => setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]) : () => handleLocked('sector')}
                  style={{ background: sectors.includes(s) && isPaid ? '#c8ff00' : 'rgba(240,237,232,0.07)', color: sectors.includes(s) && isPaid ? '#080808' : 'rgba(240,237,232,0.55)', border: 'none', borderRadius: '100px', padding: '0.38rem 0.85rem', fontSize: '0.73rem', fontWeight: sectors.includes(s) && isPaid ? 700 : 400, cursor: isPaid ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, opacity: isPaid ? 1 : 0.45 }}
                >{s}</button>
              ))}
            </div>
            {/* Filters button — always clickable, opens sheet which shows locked state */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'rgba(240,237,232,0.07)', color: 'rgba(240,237,232,0.6)', border: '1px solid rgba(240,237,232,0.1)', borderRadius: '10px', padding: '0.5rem 0.9rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Filters
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="page-inner" style={{ paddingTop: 0, paddingBottom: '2rem' }}>
          <div className="jobs-layout">

            {/* DESKTOP SIDEBAR */}
            <aside className="desktop-sidebar" style={{ width: 232, flexShrink: 0, position: 'sticky', top: '5.5rem' }}>
              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Sector {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
                <div ref={sectorDropRef} style={{ position: 'relative' }}>
                  <button onClick={isPaid ? () => setSectorDropOpen(o => !o) : () => handleLocked('sector')} className={shakeTarget === 'sector' ? 'do-shake' : ''} style={{ width: '100%', textAlign: 'left', background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 10, padding: '0.62rem 2.2rem 0.62rem 0.9rem', color: 'rgba(240,237,232,0.45)', fontSize: '0.82rem', cursor: isPaid ? 'pointer' : 'not-allowed', fontFamily: 'inherit', position: 'relative', opacity: isPaid ? 1 : 0.45 }}>
                    {sectors.length > 0 && isPaid ? `${sectors.length} selected` : 'All sectors'}
                    <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: `translateY(-50%) rotate(${sectorDropOpen ? '180deg' : '0deg'})`, transition: 'transform 0.2s', color: 'rgba(240,237,232,0.4)', fontSize: '0.72rem' }}>↓</span>
                  </button>
                  {sectorDropOpen && isPaid && (
                    <div className="sector-dropdown">
                      {SECTORS.map(s => (
                        <label key={s} className="sector-check-row">
                          <input type="checkbox" checked={sectors.includes(s)} onChange={() => setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} style={{ accentColor: '#c8ff00', width: 13, height: 13, cursor: 'pointer', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: sectors.includes(s) ? '#c8ff00' : 'rgba(240,237,232,0.65)' }}>{s}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Work type {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {WORK_TYPES.map(w => <button key={w} onClick={isPaid ? () => setWorkTypes(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]) : () => handleLocked('worktype')} className={`sidebar-filter-btn${workTypes.includes(w) && isPaid ? ' active' : ''}${!isPaid ? ' locked' : ''} ${shakeTarget === 'worktype' ? 'do-shake' : ''}`}>{w}</button>)}
                </div>
              </div>

              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Sponsor status {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {SPONSOR_TIERS.map(t => <button key={t.value} onClick={isPaid ? () => setSponsorTier(t.value) : () => handleLocked('sponsor')} className={`sidebar-filter-btn${sponsorTier === t.value && isPaid ? ' active' : ''}${!isPaid ? ' locked' : ''} ${shakeTarget === 'sponsor' ? 'do-shake' : ''}`}>{t.label}</button>)}
                </div>
              </div>

              <div style={{ marginBottom: '1.6rem' }}>
                <span className="sidebar-label">Salary range {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="filter-input" placeholder="Min £" type="number" value={salaryMin} onChange={isPaid ? e => setSalaryMin(e.target.value) : undefined} {...(!isPaid ? { readOnly: true, onClick: () => handleLocked('salary') } : {})} style={{ width: '50%', opacity: isPaid ? 1 : 0.38, cursor: isPaid ? 'text' : 'not-allowed' }} />
                  <input className="filter-input" placeholder="Max £" type="number" value={salaryMax} onChange={isPaid ? e => setSalaryMax(e.target.value) : undefined} {...(!isPaid ? { readOnly: true, onClick: () => handleLocked('salary') } : {})} style={{ width: '50%', opacity: isPaid ? 1 : 0.38, cursor: isPaid ? 'text' : 'not-allowed' }} />
                </div>
              </div>

              {!isPaid && (
                <button onClick={() => setShowModal(true)} style={{ width: '100%', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 10, padding: '0.75rem', color: '#c8ff00', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.5 }}>
                  🔓 Unlock all filters<br /><span style={{ fontSize: '0.68rem', fontWeight: 400, color: 'rgba(200,255,0,0.6)' }}>From £3.49/mo</span>
                </button>
              )}
            </aside>

            {/* JOBS LIST */}
            <div className="jobs-list-area">
              <div style={{ marginBottom: '1.1rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.4)' }}>
                  {loading ? 'Loading...' : isPaid ? (
                    <><span style={{ color: '#c8ff00', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{total.toLocaleString()}</span><span> jobs found</span></>
                  ) : (
                    <>Showing <span style={{ color: '#c8ff00', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{Math.min(FREE_LIMIT, jobs.length)}</span> of <span style={{ color: '#f0ede8', fontWeight: 600 }}>{total.toLocaleString()}+</span> jobs</>
                  )}
                </span>
              </div>

              {error && <div style={{ background: 'rgba(255,77,0,0.07)', border: '1px solid rgba(255,77,0,0.18)', borderRadius: 14, padding: '1.1rem', color: 'rgba(240,237,232,0.55)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.84rem' }}>{error}</div>}

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 20, padding: '1.25rem 1.4rem', opacity: 1 - i * 0.12 }}>
                      <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(240,237,232,0.06)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 14, width: '55%', background: 'rgba(240,237,232,0.07)', borderRadius: 6, marginBottom: '0.4rem' }} />
                          <div style={{ height: 11, width: '35%', background: 'rgba(240,237,232,0.04)', borderRadius: 6 }} />
                        </div>
                      </div>
                      <div style={{ height: 10, width: '88%', background: 'rgba(240,237,232,0.03)', borderRadius: 6, marginBottom: '0.35rem' }} />
                      <div style={{ height: 10, width: '65%', background: 'rgba(240,237,232,0.03)', borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {jobs.map(job => {
                      const workType = detectWorkType(job.description);
                      const salary   = getSalaryLabel(job);
                      const recent   = isRecent(job.posted_at);
                      const route    = getCoSRoute(job);
                      return (
                        <div key={job.id} className="job-card" onClick={() => job.slug && navigate(`/jobs/${job.slug}`)} style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 20, padding: '1.25rem 1.4rem', width: '100%', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
                            <CompanyLogo name={job.company_name} size={44} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.98rem', color: '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1.25, margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</h3>
                              <p style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.38)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[job.company_name, job.location].filter(Boolean).join(' · ')}</p>
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {recent
                                ? <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#c8ff00' }}><span className="new-dot" />{timeAgo(job.posted_at)}</span>
                                : <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.25)' }}>{timeAgo(job.posted_at)}</span>
                              }
                            </div>
                          </div>
                          <div style={{ marginBottom: '0.6rem' }}>
                            {salary.real ? <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#c8ff00' }}>{salary.text}</span> : <span style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.28)' }}>{salary.text}</span>}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.35)', lineHeight: 1.6, margin: '0 0 0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {job.description?.replace(/<[^>]*>/g, '') || ''}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'rgba(240,237,232,0.4)' }}><span>{getWorkIcon(workType)}</span>{workType}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'rgba(240,237,232,0.4)' }}><span>⏱</span>Full-time</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'rgba(240,237,232,0.4)' }}><span>🎓</span>Degree req.</span>
                          </div>
                          <div style={{ height: 1, background: 'rgba(240,237,232,0.05)', marginBottom: '0.85rem' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {job.sponsorship_tier === 'confirmed'
                                ? <span style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(200,255,0,0.2)', whiteSpace: 'nowrap' }}>✓ Confirmed Sponsor</span>
                                : <span style={{ background: 'transparent', color: 'rgba(240,237,232,0.3)', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(240,237,232,0.1)', whiteSpace: 'nowrap' }}>◎ May Sponsor</span>
                              }
                              <span style={{ background: 'rgba(255,200,0,0.08)', color: 'rgba(255,200,0,0.7)', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.22rem 0.6rem', borderRadius: '100px', border: '1px solid rgba(255,200,0,0.15)', whiteSpace: 'nowrap' }}>{route}</span>
                            </div>
                            <button onClick={e => { e.stopPropagation(); job.slug && navigate(`/jobs/${job.slug}`); }} className="view-btn" style={{ background: '#c8ff00', color: '#080808', padding: '0.45rem 1.1rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.78rem', border: '1px solid transparent', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                              View →
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {jobs.length === 0 && !loading && !error && (
                      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'rgba(240,237,232,0.45)', marginBottom: '0.4rem' }}>No jobs found</div>
                        <div style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.28)' }}>Try different keywords or clear filters.</div>
                      </div>
                    )}
                  </div>

                  {/* PAGINATION — both free and paid */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                    {/* Prev */}
                    <button
                      onClick={isPaid ? () => setPage(p => Math.max(1, p - 1)) : () => handleLocked('page')}
                      disabled={isPaid && page === 1}
                      style={{ ...pageBtn(false, isPaid && page === 1), opacity: !isPaid ? 0.35 : (page === 1 ? 0.3 : 1), cursor: !isPaid ? 'not-allowed' : (page === 1 ? 'default' : 'pointer') }}
                    >←</button>

                    {isPaid
                      ? getPageNumbers(page, totalPages).map((p, i) =>
                          p === '...'
                            ? <span key={i} style={{ color: 'rgba(240,237,232,0.25)', padding: '0 0.25rem' }}>…</span>
                            : <button key={p} onClick={() => setPage(p)} style={pageBtn(p === page, false)}>{p}</button>
                        )
                      : fakePages.map((p, i) =>
                          p === '...'
                            ? <span key={i} style={{ color: 'rgba(240,237,232,0.25)', padding: '0 0.25rem' }}>…</span>
                            : <button key={i} onClick={() => handleLocked('page')} style={{ ...pageBtn(p === 1, false), opacity: p === 1 ? 1 : 0.35, cursor: p === 1 ? 'default' : 'not-allowed' }}>{p}</button>
                        )
                    }

                    {/* Next */}
                    <button
                      onClick={isPaid ? () => setPage(p => Math.min(totalPages, p + 1)) : () => handleLocked('page')}
                      disabled={isPaid && page === totalPages}
                      style={{ ...pageBtn(false, isPaid && page === totalPages), opacity: !isPaid ? 0.35 : (page === totalPages ? 0.3 : 1), cursor: !isPaid ? 'not-allowed' : (page === totalPages ? 'default' : 'pointer') }}
                    >→</button>
                  </div>

                  {isPaid && totalPages > 1 && (
                    <div style={{ textAlign: 'center', fontSize: '0.73rem', color: 'rgba(240,237,232,0.18)', marginTop: '0.6rem' }}>
                      Page {page} of {totalPages.toLocaleString()}
                    </div>
                  )}

                  {/* FREE USER — upgrade banner AFTER pagination */}
                  {!isPaid && jobs.length > 0 && (
                    <div className="upgrade-banner">
                      <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🚀</div>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#f0ede8', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                        {total.toLocaleString()}+ jobs waiting for you
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 420, margin: '0 auto 1.5rem' }}>
                        Search by role, location, salary and sector. Filter confirmed sponsors only and set up instant alerts.
                      </p>
                      <button onClick={() => setShowModal(true)} style={{ background: '#c8ff00', color: '#080808', padding: '0.85rem 2rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Unlock all jobs · £3.49/mo
                      </button>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.2)', marginTop: '0.85rem' }}>Cancel anytime · No hidden fees</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* DISCLAIMER */}
        <div style={{ width: '100%', padding: '1rem 2rem', borderTop: '1px solid rgba(240,237,232,0.05)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.18)', flexShrink: 0 }}>ℹ</span>
            <p style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.2)', lineHeight: 1.65, margin: 0 }}>
              Job listings on Sponsrr are sourced automatically from hundreds of recruiter databases and updated every 24 hours. While we do our best to keep information accurate, we can make mistakes — incorrect salary range, outdated listings, or mismatched sponsor status can occasionally occur. This is not us getting things wrong, it's the data provided to us by third-party sources. Always verify sponsorship directly with the employer before applying.
            </p>
          </div>
        </div>

        {/* MOBILE FILTER SHEET — always opens, locked state shown inside */}
        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000 }} />
            <div className="filter-sheet">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#f0ede8' }}>Filters</div>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.4)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Lock notice for free users */}
              {!isPaid && (
                <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(200,255,0,0.8)' }}>🔒 Filters require Monthly plan</span>
                  <button onClick={() => { setSidebarOpen(false); setShowModal(true); }} style={{ background: '#c8ff00', color: '#080808', border: 'none', borderRadius: '100px', padding: '0.3rem 0.8rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Unlock</button>
                </div>
              )}

              <span className="sidebar-label">Work type {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
                {WORK_TYPES.map(w => (
                  <button key={w}
                    onClick={isPaid ? () => setWorkTypes(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]) : () => { setSidebarOpen(false); setShowModal(true); }}
                    style={{ background: workTypes.includes(w) && isPaid ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.07)', color: workTypes.includes(w) && isPaid ? '#c8ff00' : 'rgba(240,237,232,0.6)', border: workTypes.includes(w) && isPaid ? '1px solid rgba(200,255,0,0.25)' : '1px solid rgba(240,237,232,0.1)', borderRadius: 100, padding: '0.42rem 1rem', fontSize: '0.8rem', fontWeight: workTypes.includes(w) && isPaid ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', opacity: isPaid ? 1 : 0.45 }}
                  >{w}</button>
                ))}
              </div>

              <span className="sidebar-label">Sponsor status {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
                {SPONSOR_TIERS.map(t => (
                  <button key={t.value}
                    onClick={isPaid ? () => setSponsorTier(t.value) : () => { setSidebarOpen(false); setShowModal(true); }}
                    style={{ background: sponsorTier === t.value && isPaid ? 'rgba(200,255,0,0.1)' : 'rgba(240,237,232,0.07)', color: sponsorTier === t.value && isPaid ? '#c8ff00' : 'rgba(240,237,232,0.6)', border: sponsorTier === t.value && isPaid ? '1px solid rgba(200,255,0,0.25)' : '1px solid rgba(240,237,232,0.1)', borderRadius: 100, padding: '0.42rem 1rem', fontSize: '0.78rem', fontWeight: sponsorTier === t.value && isPaid ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', opacity: isPaid ? 1 : 0.45 }}
                  >{t.label}</button>
                ))}
              </div>

              <span className="sidebar-label">Sort by {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
              <div className="select-wrap" style={{ marginBottom: '1.4rem', opacity: isPaid ? 1 : 0.45 }}>
                <select className="filter-select" value={sort} onChange={isPaid ? e => setSort(e.target.value) : undefined} disabled={!isPaid} onClick={!isPaid ? () => { setSidebarOpen(false); setShowModal(true); } : undefined}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <span className="sidebar-label">Salary range {!isPaid && <span style={{ color: '#c8ff00', fontSize: '0.55rem' }}>· Monthly</span>}</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', opacity: isPaid ? 1 : 0.45 }}>
                <input className="filter-input" placeholder="Min £" type="number" value={salaryMin} onChange={isPaid ? e => setSalaryMin(e.target.value) : undefined} onClick={!isPaid ? () => { setSidebarOpen(false); setShowModal(true); } : undefined} readOnly={!isPaid} style={{ width: '50%', cursor: isPaid ? 'text' : 'not-allowed' }} />
                <input className="filter-input" placeholder="Max £" type="number" value={salaryMax} onChange={isPaid ? e => setSalaryMax(e.target.value) : undefined} onClick={!isPaid ? () => { setSidebarOpen(false); setShowModal(true); } : undefined} readOnly={!isPaid} style={{ width: '50%', cursor: isPaid ? 'text' : 'not-allowed' }} />
              </div>

              {isPaid ? (
                <button onClick={() => setSidebarOpen(false)} style={{ width: '100%', background: '#c8ff00', border: 'none', borderRadius: 12, padding: '0.85rem', color: '#080808', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Show {total.toLocaleString()} jobs
                </button>
              ) : (
                <button onClick={() => { setSidebarOpen(false); setShowModal(true); }} style={{ width: '100%', background: '#c8ff00', border: 'none', borderRadius: 12, padding: '0.85rem', color: '#080808', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Unlock all filters · £3.49/mo
                </button>
              )}
            </div>
          </>
        )}

        {/* UPGRADE MODAL */}
        {showModal && <UpgradeModal onClose={() => setShowModal(false)} onUpgrade={() => { setShowModal(false); navigate('/pricing'); }} />}
      </div>
    </Layout>
  );
}

function getPageNumbers(current, total) {
  const pages = [], delta = 2;
  const left = Math.max(2, current - delta), right = Math.min(total - 1, current + delta);
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