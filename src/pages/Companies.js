import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';
import Layout from '../components/Layout';

const SECTORS = [
  'All', 'Technology & IT', 'Healthcare & Medical', 'Finance & Banking',
  'Education', 'Engineering', 'Construction & Architecture',
  'Hospitality & Food', 'Retail & Fashion', 'Legal', 'Creative & Design',
  'Science & Research', 'Transport & Logistics', 'Social Care',
  'Marketing & Communications', 'Accounting & Consulting',
  'Sport & Fitness', 'Charity & Non-profit', 'Recruitment & HR', 'Security'
];

const SORT_OPTIONS = [
  { label:'A → Z', value:'name_asc' },
  { label:'Z → A', value:'name_desc' },
  { label:'Newest listed', value:'created_asc' },
  { label:'Oldest listed', value:'created_desc' },
];

const PER_PAGE = 50;

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
      window.scrollTo({ top:0, behavior:'smooth' });
    }, 400);
    return () => clearTimeout(timer);
  }, [sector, sort, page, search, location]);

  async function fetchCompanies() {
    setLoading(true);
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;
    const [sortCol, sortDir] = sort === 'name_asc' ? ['name', true]
      : sort === 'name_desc' ? ['name', false]
      : sort === 'created_asc' ? ['created_at', false]
      : ['created_at', true];

    let query = supabase.from('companies').select('*', { count:'exact' })
      .eq('is_licensed_sponsor', true)
      .order(sortCol, { ascending:sortDir })
      .range(from, to);

    if (sector !== 'All') query = query.eq('sector', sector);
    if (search) query = query.ilike('name', `%${search}%`);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data, error, count } = await query;
    if (!error) { setCompanies(data || []); setTotal(count || 0); }
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  function handleSectorChange(s) { setSector(s); setPage(1); }
  function handleSortChange(e) { setSort(e.target.value); setPage(1); }
  function handleSearchChange(e) { setSearch(e.target.value); setPage(1); }
  function handleLocationChange(e) { setLocation(e.target.value); setPage(1); }

  return (
    <Layout>
      <div style={{ background:'#080808', minHeight:'100vh' }}>
        <Navbar />
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'6rem 2rem 4rem' }}>

          <div style={{ marginBottom:'2.5rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', padding:'0.35rem 1rem', borderRadius:'100px', fontSize:'0.75rem', color:'#c8ff00', fontWeight:600, marginBottom:'1rem' }}>
              <span style={{ width:6, height:6, background:'#c8ff00', borderRadius:'50%', display:'inline-block' }} />
              {total.toLocaleString()} verified sponsors
            </div>
            <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(2rem, 5vw, 3.5rem)', letterSpacing:'-0.04em', color:'#f0ede8', lineHeight:1 }}>
              Find your <span style={{ color:'#c8ff00' }}>Sponsrr.</span>
            </h1>
            <p style={{ color:'rgba(240,237,232,0.5)', marginTop:'0.8rem', fontSize:'1rem' }}>
              Every company below holds a valid UK visa sponsor licence.
            </p>
          </div>

          <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
            <input placeholder="Search companies..." value={search} onChange={handleSearchChange} style={inputStyle} />
            <input placeholder="Location (e.g. London)" value={location} onChange={handleLocationChange} style={{ ...inputStyle, maxWidth:220 }} />
            <select value={sort} onChange={handleSortChange} style={{ ...inputStyle, maxWidth:180, cursor:'pointer', appearance:'none', WebkitAppearance:'none', border:'1px solid rgba(200,255,0,0.3)', color:'#c8ff00', fontWeight:600, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c8ff00' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 1rem center', paddingRight:'2.5rem' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'2.5rem' }}>
            {SECTORS.map(s => (
              <button key={s} onClick={() => handleSectorChange(s)} style={{ background: sector === s ? '#c8ff00' : 'rgba(240,237,232,0.06)', color: sector === s ? '#080808' : 'rgba(240,237,232,0.6)', border:'none', borderRadius:'100px', padding:'0.4rem 1rem', fontSize:'0.78rem', fontWeight: sector === s ? 700 : 400, cursor:'pointer', transition:'all 0.2s' }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ fontSize:'0.8rem', color:'rgba(240,237,232,0.35)', marginBottom:'1.5rem' }}>
            {loading ? 'Searching...' : `Showing ${((page-1)*PER_PAGE)+1}–${Math.min(page*PER_PAGE, total)} of ${total.toLocaleString()} sponsors${sector !== 'All' ? ` in ${sector}` : ''}${search ? ` matching "${search}"` : ''}${location ? ` in ${location}` : ''}`}
          </div>

          {loading ? (
            <div style={{ color:'rgba(240,237,232,0.4)', textAlign:'center', padding:'4rem' }}>Searching sponsors...</div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
                {companies.map(company => <JobCard key={company.id} company={company} />)}
                {companies.length === 0 && <div style={{ color:'rgba(240,237,232,0.4)', padding:'2rem' }}>No sponsors found. Try a different search.</div>}
              </div>

              {totalPages > 1 && (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem', marginTop:'3rem', flexWrap:'wrap' }}>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={pageBtn(false, page===1)}>←</button>
                  {getPageNumbers(page, totalPages).map((p,i) =>
                    p === '...' ? <span key={i} style={{ color:'rgba(240,237,232,0.3)', padding:'0 0.5rem' }}>...</span>
                    : <button key={p} onClick={() => setPage(p)} style={pageBtn(p===page, false)}>{p}</button>
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={pageBtn(false, page===totalPages)}>→</button>
                </div>
              )}

              {totalPages > 1 && (
                <div style={{ textAlign:'center', fontSize:'0.78rem', color:'rgba(240,237,232,0.25)', marginTop:'1rem' }}>
                  Page {page} of {totalPages.toLocaleString()}
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
    border:'none', borderRadius:'8px', width:36, height:36,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'Syne, sans-serif', fontWeight: active ? 700 : 400,
    fontSize:'0.85rem', cursor: disabled ? 'default' : 'pointer',
    transition:'all 0.2s', opacity: disabled ? 0.4 : 1,
  };
}

const inputStyle = {
  background:'rgba(240,237,232,0.06)',
  border:'1px solid rgba(240,237,232,0.1)',
  borderRadius:'12px', padding:'0.75rem 1.2rem',
  color:'#f0ede8', fontSize:'0.9rem',
  outline:'none', flex:1, minWidth:'200px',
};

export default Companies;