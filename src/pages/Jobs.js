import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const SECTORS = [
  'All', 'Technology & IT', 'Healthcare & Medical', 'Finance & Banking',
  'Education', 'Engineering', 'Construction & Architecture',
  'Hospitality & Food', 'Retail & Fashion', 'Legal', 'Creative & Design',
  'Science & Research', 'Transport & Logistics', 'Social Care',
  'Marketing & Communications', 'Accounting & Consulting',
  'Sport & Fitness', 'Charity & Non-profit', 'Recruitment & HR', 'Security'
];

const REED_KEY = 'e77e52ab-e146-446f-bd33-ef5c473e1203';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [sector, setSector] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const PER_PAGE = 25;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, location, sector, page]);

  async function fetchJobs() {
    setLoading(true);
    try {
      const keywords = search || (sector !== 'All' ? sector : 'software engineer');

      const params = new URLSearchParams({
        keywords,
        locationName: location || 'London',
        resultsToTake: PER_PAGE,
        resultsToSkip: (page - 1) * PER_PAGE,
      });

      const res = await fetch(
        `https://www.reed.co.uk/api/1.0/search?${params}`,
        {
          headers: {
            'Authorization': 'Basic ' + btoa(REED_KEY + ':'),
          }
        }
      );
      const data = await res.json();
      setJobs(data.results || []);
      setTotal(data.totalResults || 0);
    } catch (e) {
      console.error(e);
      setJobs([]);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  function handleSectorChange(s) {
    setSector(s);
    setPage(1);
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh' }}>
      <Navbar />

      <style>{`
        @keyframes tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .live-dot { animation: blink 1.4s ease infinite; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
            padding: '0.35rem 1rem', borderRadius: '100px',
            fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600,
            marginBottom: '1rem'
          }}>
            <span className="live-dot" style={{
              width: 6, height: 6, background: '#c8ff00',
              borderRadius: '50%', display: 'inline-block'
            }} />
            Live sponsored jobs
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1
          }}>
            Jobs that will <span style={{ color: '#c8ff00' }}>actually sponsor you.</span>
          </h1>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginTop: '0.8rem', fontSize: '1rem' }}>
            Live listings from verified UK visa sponsors only.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            placeholder="Search jobs or companies..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={inputStyle}
          />
          <input
            placeholder="Location (e.g. London)"
            value={location}
            onChange={e => { setLocation(e.target.value); setPage(1); }}
            style={{ ...inputStyle, maxWidth: 220 }}
          />
        </div>

        {/* Sector pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {SECTORS.map(s => (
            <button key={s} onClick={() => handleSectorChange(s)} style={{
              background: sector === s ? '#c8ff00' : 'rgba(240,237,232,0.06)',
              color: sector === s ? '#080808' : 'rgba(240,237,232,0.6)',
              border: 'none', borderRadius: '100px',
              padding: '0.4rem 1rem', fontSize: '0.78rem',
              fontWeight: sector === s ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* Results info */}
        <div style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.35)', marginBottom: '1.5rem' }}>
          {loading ? 'Searching...' : `${total.toLocaleString()} sponsored jobs found${location ? ` in ${location}` : ' in London'}`}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div style={{ color: 'rgba(240,237,232,0.4)', textAlign: 'center', padding: '4rem' }}>
            Loading jobs...
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {jobs.map(job => (
                <div key={job.jobId} style={{
                  background: '#111',
                  border: '1px solid rgba(240,237,232,0.07)',
                  borderRadius: 20, padding: '1.8rem',
                  transition: 'border-color 0.3s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,255,0,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(240,237,232,0.07)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        fontSize: '1.05rem', color: '#f0ede8',
                        letterSpacing: '-0.02em', marginBottom: '0.4rem'
                      }}>{job.jobTitle}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.5)' }}>
                        {job.employerName} · {job.locationName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {job.minimumSalary ? (
                        <div style={{
                          fontFamily: 'Syne, sans-serif', fontWeight: 700,
                          fontSize: '1rem', color: '#c8ff00'
                        }}>
                          £{job.minimumSalary.toLocaleString()}
                          {job.maximumSalary ? ` — £${job.maximumSalary.toLocaleString()}` : '+'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.3)' }}>Salary not specified</div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.3)', marginTop: '0.2rem' }}>
                        {job.date ? new Date(job.date).toLocaleDateString('en-GB') : ''}
                      </div>
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.84rem', color: 'rgba(240,237,232,0.45)',
                    lineHeight: 1.6, marginTop: '1rem',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {job.jobDescription}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(200,255,0,0.1)', color: '#c8ff00',
                        fontSize: '0.65rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        padding: '0.22rem 0.65rem', borderRadius: '100px'
                      }}>✓ Visa Sponsor</span>
                      {job.expirationDate && new Date(job.expirationDate) > new Date() && (
                        <span style={{
                          background: 'rgba(240,237,232,0.06)', color: 'rgba(240,237,232,0.4)',
                          fontSize: '0.65rem', fontWeight: 600,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '0.22rem 0.65rem', borderRadius: '100px'
                        }}>
                          Expires {new Date(job.expirationDate).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                    <a href={job.jobUrl} target="_blank" rel="noreferrer" style={{
                      background: '#c8ff00', color: '#080808',
                      padding: '0.5rem 1.2rem', borderRadius: '100px',
                      fontWeight: 700, fontSize: '0.82rem',
                      textDecoration: 'none',
                    }}>Apply →</a>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && !loading && (
                <div style={{ color: 'rgba(240,237,232,0.4)', textAlign: 'center', padding: '4rem' }}>
                  No jobs found. Try a different search or location.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'center', gap: '0.5rem',
                marginTop: '3rem', flexWrap: 'wrap',
              }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn(false, page === 1)}>←</button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={i} style={{ color: 'rgba(240,237,232,0.3)', padding: '0 0.5rem' }}>...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)} style={pageBtn(p === page, false)}>{p}</button>
                  )
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtn(false, page === totalPages)}>→</button>
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(240,237,232,0.25)', marginTop: '1rem' }}>
                Page {page} of {totalPages.toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>

      {/* TICKER */}
      <div style={{ background: '#c8ff00', padding: '0.7rem 0', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '4rem' }}>
        <div style={{ display: 'inline-block', animation: 'tick 28s linear infinite', whiteSpace: 'nowrap' }}>
          {['Visa Verified', 'CV Builder', 'Sponsrr Score', 'Salary Checker', 'Job Alerts', 'Company Insights', 'Application Tracker', 'Home Office Data',
            'Visa Verified', 'CV Builder', 'Sponsrr Score', 'Salary Checker', 'Job Alerts', 'Company Insights', 'Application Tracker', 'Home Office Data'].map((t, i) => (
            <span key={i} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#080808', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 2rem' }}>
              {t} <span style={{ opacity: 0.35 }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* CTA STRIP */}
      <div style={{ background: '#0f0f0f', padding: '3rem 2.5rem', textAlign: 'center', borderBottom: '1px solid rgba(240,237,232,0.06)' }}>
        <p style={{ fontSize: '0.9rem', color: 'rgba(240,237,232,0.4)', marginBottom: '0.5rem' }}>
          Every listing is from a company that can actually sponsor your visa.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.25)' }}>
          No maybes. No "visa considered". Just real opportunities.
        </p>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(240,237,232,0.06)', padding: '2rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#080808' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.04em', color: '#f0ede8' }}>
          Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacy', 'Terms', 'Blog', 'Contact'].map(l => (
            <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.35)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.28)' }}>© 2025 Sponsrr. Built for internationals.</p>
      </footer>

    </div>
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
    border: 'none', borderRadius: '8px',
    width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Syne, sans-serif',
    fontWeight: active ? 700 : 400,
    fontSize: '0.85rem',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.4 : 1,
  };
}

const inputStyle = {
  background: 'rgba(240,237,232,0.06)',
  border: '1px solid rgba(240,237,232,0.1)',
  borderRadius: '12px',
  padding: '0.75rem 1.2rem',
  color: '#f0ede8',
  fontSize: '0.9rem',
  outline: 'none',
  flex: 1,
  minWidth: '200px',
};

export default Jobs;