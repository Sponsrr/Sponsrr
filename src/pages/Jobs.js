import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

const SECTORS = [
  'All', 'Technology & IT', 'Healthcare & Medical', 'Finance & Banking',
  'Education', 'Engineering', 'Construction & Architecture',
  'Hospitality & Food', 'Retail & Fashion', 'Legal', 'Creative & Design',
  'Science & Research', 'Transport & Logistics', 'Social Care',
  'Marketing & Communications', 'Accounting & Consulting',
  'Sport & Fitness', 'Charity & Non-profit', 'Recruitment & HR', 'Security'
];

const SECTOR_KEYWORDS = {
  'Technology & IT':           ['software','developer','engineer','data','cloud','devops','react','java','python','tech','it','cyber','ai','machine learning'],
  'Healthcare & Medical':      ['nurse','doctor','medical','healthcare','clinical','pharmacy','nhs','care','health','gp','surgeon','therapist'],
  'Finance & Banking':         ['finance','banking','accountant','analyst','investment','treasury','risk','compliance','audit','insurance'],
  'Education':                 ['teacher','education','tutor','lecturer','academic','school','university','training'],
  'Engineering':               ['engineer','mechanical','electrical','civil','structural','manufacturing','aerospace'],
  'Construction & Architecture':['construction','architect','surveyor','quantity','site','planning','building'],
  'Hospitality & Food':        ['chef','hospitality','hotel','restaurant','catering','food','beverage','kitchen'],
  'Retail & Fashion':          ['retail','fashion','buyer','merchandiser','store','ecommerce'],
  'Legal':                     ['lawyer','solicitor','legal','paralegal','compliance','barrister'],
  'Creative & Design':         ['designer','creative','ux','ui','graphic','motion','art','brand','content','copywriter'],
  'Science & Research':        ['scientist','research','laboratory','biology','chemistry','physics'],
  'Transport & Logistics':     ['logistics','transport','supply chain','warehouse','driver','freight','operations'],
  'Social Care':               ['social worker','care','support worker','mental health','community'],
  'Marketing & Communications':['marketing','seo','ppc','social media','communications','pr','growth','digital'],
  'Accounting & Consulting':   ['accountant','consultant','strategy','management','advisory'],
  'Sport & Fitness':           ['sport','fitness','coach','personal trainer','physio'],
  'Charity & Non-profit':      ['charity','non-profit','ngo','fundraising'],
  'Recruitment & HR':          ['recruiter','hr','human resources','talent','people','recruitment'],
  'Security':                  ['security','guard','surveillance','protection'],
};

const PER_PAGE = 20;

function Jobs() {
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [location, setLocation] = useState('');
  const [sector, setSector]     = useState('All');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [error, setError]       = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('posted_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      // Search filter
      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,company_name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
      }

      // Location filter
      if (location.trim()) {
        query = query.ilike('location', `%${location.trim()}%`);
      }

      // Sector filter — match keywords against title + description
      if (sector !== 'All' && SECTOR_KEYWORDS[sector]) {
        const keywords = SECTOR_KEYWORDS[sector];
        const orClause = keywords.map(k => `title.ilike.%${k}%`).join(',');
        query = query.or(orClause);
      }

      const { data, count, error: err } = await query;
      if (err) throw err;

      setJobs(data || []);
      setTotal(count || 0);
    } catch (e) {
      console.error(e);
      setError('Could not load jobs right now. Please try again.');
      setJobs([]);
    }
    setLoading(false);
  }, [search, location, sector, page]);

  useEffect(() => {
    const t = setTimeout(() => fetchJobs(), 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  useEffect(() => { setPage(1); }, [search, location, sector]);

  const totalPages = Math.ceil(total / PER_PAGE);

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

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />

        <style>{`
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
          .live-dot { animation: blink 1.4s ease infinite; }
          .job-card { transition: border-color 0.2s, transform 0.2s; }
          .job-card:hover { border-color: rgba(200,255,0,0.25) !important; transform: translateY(-1px); }
          .apply-btn { transition: background 0.2s, color 0.2s, border 0.2s; }
          .apply-btn:hover { background: #080808 !important; color: #c8ff00 !important; border: 1px solid #c8ff00 !important; }
          .sector-btn { transition: all 0.2s; }
          .sector-btn:hover { background: rgba(200,255,0,0.12) !important; color: #c8ff00 !important; }
          input:focus { border-color: rgba(200,255,0,0.4) !important; outline: none; }
          @media(max-width:768px) {
            .search-row { flex-direction: column !important; }
            .search-row input { width: 100% !important; max-width: unset !important; }
          }
        `}</style>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600, marginBottom: '1rem' }}>
              <span className="live-dot" style={{ width: 6, height: 6, background: '#c8ff00', borderRadius: '50%', display: 'inline-block' }} />
              Live sponsored jobs
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1.05 }}>
              Jobs that will <span style={{ color: '#c8ff00' }}>actually sponsor you.</span>
            </h1>
            <p style={{ color: 'rgba(240,237,232,0.5)', marginTop: '0.8rem', fontSize: '1rem' }}>
              Every listing is cross-referenced against 121,000+ verified UK visa sponsors.
            </p>
          </div>

          {/* Search */}
          <div className="search-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              placeholder="Search job title, company or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Location (e.g. London)"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ ...inputStyle, maxWidth: 240, flex: '0 0 auto' }}
            />
          </div>

          {/* Sector filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {SECTORS.map(s => (
              <button key={s} className="sector-btn" onClick={() => setSector(s)} style={{
                background: sector === s ? '#c8ff00' : 'rgba(240,237,232,0.06)',
                color: sector === s ? '#080808' : 'rgba(240,237,232,0.55)',
                border: 'none', borderRadius: '100px',
                padding: '0.38rem 0.9rem', fontSize: '0.76rem',
                fontWeight: sector === s ? 700 : 400,
                cursor: 'pointer',
              }}>
                {s}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.35)', marginBottom: '1.5rem' }}>
            {loading ? 'Searching...' : (
              <span>
                <span style={{ color: '#c8ff00', fontWeight: 600 }}>{total.toLocaleString()}</span> sponsored jobs found
                {location ? ` near ${location}` : ''}
                {sector !== 'All' ? ` in ${sector}` : ''}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 16, padding: '1.5rem', color: 'rgba(240,237,232,0.6)', textAlign: 'center', marginBottom: '2rem' }}>
              {error}
            </div>
          )}

          {/* Loading skeletons */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 20, padding: '1.8rem', opacity: 1 - i * 0.15 }}>
                  <div style={{ height: 18, width: '45%', background: 'rgba(240,237,232,0.06)', borderRadius: 8, marginBottom: '0.75rem' }} />
                  <div style={{ height: 13, width: '28%', background: 'rgba(240,237,232,0.04)', borderRadius: 8, marginBottom: '1rem' }} />
                  <div style={{ height: 12, width: '85%', background: 'rgba(240,237,232,0.03)', borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map(job => (
                  <div key={job.id} className="job-card" style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 20, padding: '1.6rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#f0ede8', letterSpacing: '-0.02em', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                          {job.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)' }}>
                          {job.company_name}{job.location ? ` · ${job.location}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {job.salary_min ? (
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#c8ff00' }}>
                            £{job.salary_min.toLocaleString()}{job.salary_max ? ` – £${job.salary_max.toLocaleString()}` : '+'}
                          </div>
                        ) : null}
                        <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)', marginTop: '0.2rem' }}>
                          {timeAgo(job.posted_at)}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.83rem', color: 'rgba(240,237,232,0.4)', lineHeight: 1.65, marginTop: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.description?.replace(/<[^>]*>/g, '') || ''}
                    </p>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {job.sponsorship_tier === 'confirmed' ? (
                          <span style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.65rem', borderRadius: '100px' }}>
                            ✓ Confirmed Sponsor
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(240,237,232,0.06)', color: 'rgba(240,237,232,0.5)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.22rem 0.65rem', borderRadius: '100px' }}>
                            ◎ May Sponsor
                          </span>
                        )}
                      </div>
                      <a href={job.apply_url} target="_blank" rel="noreferrer" className="apply-btn" style={{ background: '#c8ff00', color: '#080808', padding: '0.5rem 1.3rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', border: '1px solid transparent' }}>
                        Apply →
                      </a>
                    </div>

                  </div>
                ))}

                {jobs.length === 0 && !loading && !error && (
                  <div style={{ color: 'rgba(240,237,232,0.35)', textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'rgba(240,237,232,0.5)', marginBottom: '0.5rem' }}>No jobs found</div>
                    <div style={{ fontSize: '0.85rem' }}>Try a different search term, location or sector.</div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn(false, page === 1)}>←</button>
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === '...'
                      ? <span key={i} style={{ color: 'rgba(240,237,232,0.3)', padding: '0 0.4rem' }}>…</span>
                      : <button key={p} onClick={() => setPage(p)} style={pageBtn(p === page, false)}>{p}</button>
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtn(false, page === totalPages)}>→</button>
                </div>
              )}

              {totalPages > 1 && (
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(240,237,232,0.25)', marginTop: '1rem' }}>
                  Page {page} of {totalPages}
                </div>
              )}
            </>
          )}
        </div>
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
    color: active ? '#080808' : disabled ? 'rgba(240,237,232,0.2)' : 'rgba(240,237,232,0.7)',
    border: 'none', borderRadius: '8px', width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Syne, sans-serif', fontWeight: active ? 700 : 400,
    fontSize: '0.85rem', cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.2s', opacity: disabled ? 0.4 : 1,
  };
}

const inputStyle = {
  background: 'rgba(240,237,232,0.06)',
  border: '1px solid rgba(240,237,232,0.1)',
  borderRadius: '12px', padding: '0.75rem 1.2rem',
  color: '#f0ede8', fontSize: '0.9rem',
  outline: 'none', flex: 1, minWidth: '200px',
  transition: 'border-color 0.2s',
};

export default Jobs;