import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

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

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = n => `£${Number(n).toLocaleString('en-GB')}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return `~${fmt(min || max)}`;
}

function detectWorkType(desc) {
  if (!desc) return 'On-site';
  const d = desc.toLowerCase();
  if (d.includes('fully remote') || d.includes('100% remote') || d.includes('work from home') || d.includes('wfh')) return 'Remote';
  if (d.includes('hybrid') || d.includes('flexible working') || d.includes('part remote')) return 'Hybrid';
  return 'On-site';
}

function getCoSRoute(job) {
  const t = (job.title || '').toLowerCase();
  if (t.includes('nurse') || t.includes('doctor') || t.includes('nhs') || t.includes('care') || t.includes('health')) return 'Health & Care';
  if (t.includes('teacher') || t.includes('lecturer')) return 'Education';
  if (t.includes('chef') || t.includes('cook') || t.includes('hospitality')) return 'Hospitality';
  return 'Skilled Worker';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'Today';
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 90) return `${Math.floor(days / 30)} months ago`;
  return 'Recently';
}

function CompanyLogo({ name, size = 64 }) {
  const [failed, setFailed] = useState(false);
  const domain   = getCompanyDomain(name);
  const initials = getInitials(name);
  if (!domain || failed) {
    return (
      <div style={{ width: size, height: size, borderRadius: 14, background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size * 0.3 + 'px', color: '#c8ff00', flexShrink: 0 }}>
        {initials}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 14, background: 'rgba(240,237,232,0.06)', border: '1px solid rgba(240,237,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      <img src={`https://logo.clearbit.com/${domain}`} alt={name} onError={() => setFailed(true)} style={{ width: size * 0.62, height: size * 0.62, objectFit: 'contain' }} />
    </div>
  );
}

function PlansModal({ onClose, onUpgrade }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '24px 24px 0 0', padding: '2rem 1.5rem 3rem', zIndex: 2001, maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 40, height: 4, background: 'rgba(240,237,232,0.15)', borderRadius: 2, margin: '0 auto 1.5rem' }} />
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔓</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0ede8', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Unlock all sponsored jobs</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>Full search, filters, sorting and thousands of verified UK sponsorship jobs. Less than a meal deal a month.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          {[
            { plan: 'Monthly',   price: '£3.49',  period: '/month',   tag: 'Most flexible',  saving: '12%', perWeek: '87p/week', highlight: false },
            { plan: 'Quarterly', price: '£9.99',  period: '/quarter', tag: 'Most popular ⭐', saving: '24%', perWeek: '77p/week', highlight: true  },
            { plan: 'Annual',    price: '£34.99', period: '/year',    tag: 'Best value',      saving: '32%', perWeek: '67p/week', highlight: false },
          ].map(p => (
            <button key={p.plan} onClick={onUpgrade} style={{ background: p.highlight ? '#c8ff00' : 'rgba(240,237,232,0.05)', border: p.highlight ? '2px solid #c8ff00' : '1px solid rgba(240,237,232,0.12)', borderRadius: 14, padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: p.highlight ? '#080808' : '#f0ede8' }}>{p.plan}</span>
                  {p.saving && <span style={{ background: p.highlight ? 'rgba(8,8,8,0.15)' : 'rgba(200,255,0,0.12)', color: p.highlight ? '#080808' : '#c8ff00', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '100px' }}>Save {p.saving}</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: p.highlight ? 'rgba(8,8,8,0.55)' : 'rgba(240,237,232,0.35)', marginTop: '0.15rem' }}>{p.tag} · {p.perWeek}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: p.highlight ? '#080808' : '#c8ff00' }}>{p.price}</div>
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

export default function JobDetail() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const [job, setJob]             = useState(null);
  const [company, setCompany]     = useState(null);
  const [related, setRelated]     = useState([]);
  const [isPaid, setIsPaid]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: sub } = await supabase
        .from('subscriptions').select('plan, status')
        .eq('user_id', user.id).in('status', ['active', 'trialing'])
        .in('plan', ['monthly', 'quarterly', 'annual']).limit(1).single();
      setIsPaid(!!sub);

      const { data: jobData } = await supabase
        .from('jobs').select('*').eq('slug', slug).single();
      if (!jobData) { navigate('/jobs'); return; }
      setJob(jobData);

      if (jobData.company_id) {
        const { data: co } = await supabase
          .from('companies').select('*').eq('id', jobData.company_id).single();
        setCompany(co);
      }

      const { data: rel } = await supabase
        .from('jobs')
        .select('id,title,company_name,location,salary_min,salary_max,slug,posted_at,sponsorship_tier')
        .eq('is_active', true).neq('id', jobData.id)
        .or(`company_name.ilike.%${jobData.company_name}%,title.ilike.%${(jobData.title || '').split(' ')[0]}%`)
        .limit(3);
      setRelated(rel || []);
      setLoading(false);
    }
    load();
  }, [slug, navigate]);

  if (loading) return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '7rem 1.5rem 4rem' }}>
          <div style={{ height: 24, width: '40%', background: 'rgba(240,237,232,0.06)', borderRadius: 8, marginBottom: '2rem' }} />
          {[...Array(3)].map((_, i) => <div key={i} style={{ height: 16, width: `${60 + i * 10}%`, background: 'rgba(240,237,232,0.04)', borderRadius: 6, marginBottom: '1rem', opacity: 1 - i * 0.25 }} />)}
        </div>
      </div>
    </Layout>
  );

  if (!job) return null;

  const workType  = detectWorkType(job.description);
  const salary    = formatSalary(job.salary_min, job.salary_max);
  const route     = getCoSRoute(job);
  const cleanDesc = job.description?.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n') || '';

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          .back-btn:hover { color: #c8ff00 !important; }
          .apply-btn-main { transition: background 0.2s, color 0.2s, transform 0.15s, border-color 0.2s; }
          .apply-btn-main:hover { background: #080808 !important; color: #c8ff00 !important; border-color: #c8ff00 !important; transform: translateY(-1px); }
          .unlock-btn-main { transition: background 0.2s, transform 0.15s; }
          .unlock-btn-main:hover { background: #aee600 !important; transform: translateY(-1px); }
          .related-card { transition: border-color 0.2s, transform 0.2s; cursor: pointer; }
          .related-card:hover { border-color: rgba(200,255,0,0.25) !important; transform: translateY(-1px); }
          .apply-cta-box { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
          @media(max-width: 600px) {
            .apply-cta-box { flex-direction: column; align-items: stretch; }
            .apply-cta-box .apply-btn-main { width: 100%; text-align: center; }
          }
        `}</style>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>

          {/* ── Back button — uses navigate(-1) to preserve filter state ── */}
          <button
            onClick={() => navigate(-1)}
            className="back-btn"
            style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.38)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', padding: 0, transition: 'color 0.2s' }}
          >
            ← Back to jobs
          </button>

          {/* Header card */}
          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '2rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <CompanyLogo name={job.company_name} size={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', color: '#f0ede8', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '0.4rem' }}>
                  {job.title}
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'rgba(240,237,232,0.5)', margin: '0 0 0.25rem' }}>
                  {[job.company_name, job.location].filter(Boolean).join(' · ')}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.25)', margin: 0 }}>
                  Posted {timeAgo(job.posted_at)}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Salary',         value: salary || 'Not specified', highlight: !!salary },
                { label: 'Work type',      value: workType },
                { label: 'CoS Route',      value: route },
                { label: 'Sponsor status', value: job.sponsorship_tier === 'confirmed' ? '✓ Confirmed' : '◎ Eligible', green: job.sponsorship_tier === 'confirmed' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(240,237,232,0.03)', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 12, padding: '0.8rem 1rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.28)', marginBottom: '0.28rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: item.green ? '#c8ff00' : item.highlight ? '#c8ff00' : 'rgba(240,237,232,0.7)', fontFamily: item.highlight ? 'Syne, sans-serif' : 'inherit' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {job.sponsorship_tier === 'confirmed'
                ? <span style={{ background: 'rgba(200,255,0,0.1)', color: '#c8ff00', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.28rem 0.8rem', borderRadius: '100px', border: '1px solid rgba(200,255,0,0.2)' }}>✓ Verified UK Visa Sponsor</span>
                : <span style={{ background: 'rgba(240,237,232,0.05)', color: 'rgba(240,237,232,0.4)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.28rem 0.8rem', borderRadius: '100px', border: '1px solid rgba(240,237,232,0.1)' }}>◎ Eligible Sponsor · Licence holder</span>
              }
              <span style={{ background: 'rgba(255,200,0,0.08)', color: 'rgba(255,200,0,0.7)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.28rem 0.8rem', borderRadius: '100px', border: '1px solid rgba(255,200,0,0.15)' }}>{route} Route</span>
            </div>
          </div>

          {/* Company info */}
          {company && (
            <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#c8ff00' }}>✓</span> Verified on UK Home Office Register
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.85rem' }}>
                {[
                  { label: 'Company',  value: company.name },
                  { label: 'Sector',   value: company.sector || 'Not listed' },
                  { label: 'Location', value: company.location || 'UK' },
                  { label: 'Status',   value: 'Licensed Sponsor ✓' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.28)', marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.84rem', color: 'rgba(240,237,232,0.65)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job description */}
          <div style={{ background: '#111', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '1.25rem' }}>Job Description</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(240,237,232,0.55)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '1.75rem' }}>
              {cleanDesc}
            </div>

            <div className="apply-cta-box" style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.12)', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginBottom: '0.2rem' }}>
                  {isPaid ? 'Interested to know more?' : 'Interested to know more?'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.4)' }}>
                  {isPaid ? 'Your plan gives you full access' : 'This job is part of your free plan'}
                </div>
              </div>
              {job.apply_url ? (
                <a href={job.apply_url} target="_blank" rel="noreferrer" className="apply-btn-main"
                  style={{ background: '#c8ff00', color: '#080808', padding: '0.75rem 1.8rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid transparent', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, display: 'block', textAlign: 'center' }}>
                  Direct Link →
                </a>
              ) : (
                <button onClick={() => navigate('/pricing')} className="apply-btn-main"
                  style={{ background: '#c8ff00', color: '#080808', padding: '0.75rem 1.8rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Direct Link →
                </button>
              )}
            </div>
          </div>

          {/* Upgrade box — free users only */}
          {!isPaid && (
            <div style={{ background: 'linear-gradient(135deg, rgba(200,255,0,0.06) 0%, rgba(200,255,0,0.02) 100%)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 22, padding: '1.75rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🔓</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0ede8', marginBottom: '0.4rem' }}>Thousands more like this one</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.4)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Search, filter and sort 6,500+ verified UK sponsorship jobs. Find exactly what matches your profile.
              </div>
              <button onClick={() => setShowPlans(true)} className="unlock-btn-main"
                style={{ background: '#c8ff00', color: '#080808', padding: '0.8rem 2rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}>
                Unlock all jobs · £3.49/mo →
              </button>
            </div>
          )}

          {/* Related jobs */}
          {related.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: 'rgba(240,237,232,0.4)', marginBottom: '0.85rem', letterSpacing: '-0.01em' }}>
                Similar jobs
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {related.map(rj => (
                  <div key={rj.id} className="related-card"
                    onClick={() => { navigate(`/jobs/${rj.slug}`); window.scrollTo(0, 0); }}
                    style={{ background: '#111', border: '1px solid rgba(240,237,232,0.07)', borderRadius: 16, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.86rem', color: '#f0ede8', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rj.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'rgba(240,237,232,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[rj.company_name, rj.location].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {formatSalary(rj.salary_min, rj.salary_max) && (
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.82rem', color: '#c8ff00' }}>{formatSalary(rj.salary_min, rj.salary_max)}</div>
                      )}
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: rj.sponsorship_tier === 'confirmed' ? '#c8ff00' : 'rgba(240,237,232,0.28)' }}>
                        {rj.sponsorship_tier === 'confirmed' ? '✓ Confirmed' : '◎ Eligible Sponsor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showPlans && <PlansModal onClose={() => setShowPlans(false)} onUpgrade={() => { setShowPlans(false); navigate('/pricing'); }} />}
      </div>
    </Layout>
  );
}