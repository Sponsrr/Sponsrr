import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';

const SECTORS = [
  'All', 'Technology & IT', 'Healthcare & Medical', 'Finance & Banking',
  'Education', 'Engineering', 'Construction & Architecture',
  'Hospitality & Food', 'Retail & Fashion', 'Legal', 'Creative & Design',
  'Science & Research', 'Transport & Logistics', 'Social Care',
  'Marketing & Communications', 'Accounting & Consulting',
  'Sport & Fitness', 'Charity & Non-profit', 'Recruitment & HR', 'Security'
];

function Jobs() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, [sector]);

  async function fetchCompanies() {
    setLoading(true);
    let query = supabase
      .from('companies')
      .select('*')
      .eq('is_licensed_sponsor', true)
      .limit(50);

    if (sector !== 'All') {
      query = query.eq('sector', sector);
    }

    const { data, error } = await query;
    if (!error) setCompanies(data || []);
    setLoading(false);
  }

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchLocation = location === '' || 
      (c.location && c.location.toLowerCase().includes(location.toLowerCase()));
    return matchSearch && matchLocation;
  });

  return (
    <div style={{ background: '#080808', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ paddingTop: '6rem', maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem 2rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)',
            padding: '0.35rem 1rem', borderRadius: '100px',
            fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600,
            marginBottom: '1rem'
          }}>
            <span style={{ width: 6, height: 6, background: '#c8ff00', borderRadius: '50%', display: 'inline-block' }}></span>
            {companies.length.toLocaleString()} verified sponsors
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            letterSpacing: '-0.04em', color: '#f0ede8', lineHeight: 1
          }}>
            Find your <span style={{ color: '#c8ff00' }}>Sponsrr.</span>
          </h1>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginTop: '0.8rem', fontSize: '1rem' }}>
            Every company below holds a valid UK visa sponsor licence.
          </p>
        </div>

        {/* Search and Filters */}
        <div style={{
          display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'
        }}>
          <input
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Location (e.g. London)"
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Sector Pills */}
        <div style={{
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem'
        }}>
          {SECTORS.map(s => (
            <button key={s} onClick={() => setSector(s)} style={{
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

        {/* Results */}
        {loading ? (
          <div style={{ color: 'rgba(240,237,232,0.4)', textAlign: 'center', padding: '4rem' }}>
            Loading sponsors...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {filtered.map(company => (
              <JobCard key={company.id} company={company} />
            ))}
            {filtered.length === 0 && (
              <div style={{ color: 'rgba(240,237,232,0.4)', padding: '2rem' }}>
                No sponsors found. Try a different search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
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