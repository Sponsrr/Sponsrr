import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, []);

  if (loading) return (
    <div style={{ background:'#080808', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'rgba(240,237,232,0.4)', fontSize:'0.9rem' }}>Loading...</div>
    </div>
  );


  const features = [
    {
      icon:'🏢', label:'Sponsor Directory',
      desc:'Browse 121,000+ verified UK sponsors across 19 different sectors.',
      href:'/companies',
      tag:'Core', tagColor:'rgba(240,237,232,0.07)', tagText:'rgba(240,237,232,0.4)',
      backBg:'rgba(200,255,0,0.04)', backBorder:'rgba(200,255,0,0.15)',
      dotColor:'#c8ff00', accessText:'Free access', accessColor:'rgba(200,255,0,0.7)',
    },
    {
      icon:'⚡', label:'Live Job Feed',
      desc:'Live job listings. Full descriptions and direct apply requires Monthly & above.',
      href:'/jobs',
      tag:'Core', tagColor:'rgba(240,237,232,0.07)', tagText:'rgba(240,237,232,0.4)',
      backBg:'rgba(200,255,0,0.04)', backBorder:'rgba(200,255,0,0.15)',
      dotColor:'rgba(200,255,0,0.5)', accessText:'Free - limited access', accessColor:'rgba(200,255,0,0.45)',
    },
    {
      icon:'🎯', label:'Visa Calculator',
      desc:'Check your visa eligibility instantly by answering easy questions.',
      href:'/calculator',
      tag:'Core', tagColor:'rgba(240,237,232,0.07)', tagText:'rgba(240,237,232,0.4)',
      backBg:'rgba(200,255,0,0.04)', backBorder:'rgba(200,255,0,0.15)',
      dotColor:'#c8ff00', accessText:'Free access', accessColor:'rgba(200,255,0,0.7)',
    },
    {
      icon:'🏆', label:'Sponsrr Score',
      desc:'Your personalised visa match score. Flex it on LinkedIn.',
      href:'/score',
      tag:'Flagship', tagColor:'rgba(255,77,0,0.1)', tagText:'#ff4d00bf',
      backBg:'rgba(240,237,232,0.03)', backBorder:'rgba(240,237,232,0.1)',
      dotColor:'rgba(240,237,232,0.4)', accessText:'Requires Weekly & above', accessColor:'rgba(240,237,232,0.38)',
    },
    {
      icon:'🔔', label:'Smart Job Alerts',
      desc:'Instant alerts for matching & eligible job roles via E-mail',
      href:'/alerts',
      tag:'Core', tagColor:'rgba(240,237,232,0.07)', tagText:'rgba(240,237,232,0.4)',
      backBg:'rgba(240,237,232,0.03)', backBorder:'rgba(240,237,232,0.1)',
      dotColor:'rgba(240,237,232,0.4)', accessText:'Requires Weekly & above', accessColor:'rgba(240,237,232,0.38)',
    },
    {
      icon:'📄', label:'AI CV Builder',
      desc:'Visa-optimised and ATS friendly CV built under minutes.',
      href:'/cv-builder',
      tag:'Exclusive', tagColor:'rgba(255,77,0,0.1)', tagText:'#ff4d00bf',
      backBg:'rgba(255,200,0,0.05)', backBorder:'rgba(255,200,0,0.2)',
      dotColor:'#ffc800', accessText:'Requires Monthly & above', accessColor:'rgba(255,200,0,0.8)',
    },
    {
      icon:'💷', label:'Salary Checker',
      desc:'Check if a job meets salary threshold for the required visa.',
      href:'/salary',
      tag:'Exclusive', tagColor:'rgba(255,77,0,0.1)', tagText:'#ff4d00bf',
      backBg:'rgba(255,200,0,0.05)', backBorder:'rgba(255,200,0,0.2)',
      dotColor:'#ffc800', accessText:'Requires Monthly & above', accessColor:'rgba(255,200,0,0.8)',
    },
    {
      icon:'📊', label:'Application Tracker',
      desc:'Track every job application you filled and the status in one click.',
      href:'/tracker',
      tag:'Core', tagColor:'rgba(240,237,232,0.07)', tagText:'rgba(240,237,232,0.4)',
      backBg:'rgba(255,200,0,0.05)', backBorder:'rgba(255,200,0,0.2)',
      dotColor:'#ffc800', accessText:'Requires Monthly & above', accessColor:'rgba(255,200,0,0.8)',
    },
    {
      icon:'🏢', label:'Company Deep Dives',
      desc:'CoS history, salaries, sponsor activity and latest updates.',
      href:'/deep-dives',
      tag:'Exclusive', tagColor:'rgba(255,77,0,0.1)', tagText:'#ff4d00bf',
      backBg:'rgba(255,77,0,0.05)', backBorder:'rgba(255,77,0,0.2)',
      dotColor:'#ff4d00', accessText:'Requires Quarterly & above', accessColor:'rgba(255,77,0,0.75)',
    },
    {
      icon:'📝', label:'1-on-1 CV Review',
      desc:'CV review + guidance by top Sponsrr users and industry experts.',
      href:'/cv-review',
      tag:'Exclusive', tagColor:'rgba(255,77,0,0.1)', tagText:'#ff4d00bf',
      backBg:'rgba(180,100,255,0.05)', backBorder:'rgba(180,100,255,0.2)',
      dotColor:'#b46fff', accessText:'Requires Annual plan', accessColor:'rgba(180,100,255,0.75)',
    },
  ];

  return (
    <Layout>
      <div style={{ background:'#080808', minHeight:'100vh' }}>
        <Navbar />
        <style>{`
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
          .dash-blink { animation: blink 1.6s ease infinite; }

          /* ── HOVER STATES ───────────────────────────────────── */
          .cta-plan-btn { transition: background 0.2s, color 0.2s, border 0.2s !important; }
          .cta-plan-btn:hover { background: #080808 !important; color: #c8ff00 !important; border: 1px solid #c8ff00 !important; }
          .upgrade-pill { transition: background 0.2s !important; }
          .upgrade-pill:hover { background: rgba(200,255,0,0.22) !important; }
          .avatar-btn { transition: transform 0.2s, box-shadow 0.2s !important; }
          .avatar-btn:hover { transform: scale(1.09) !important; box-shadow: 0 0 0 2px #c8ff00 !important; }

          /* ── STACKED CARD SYSTEM ────────────────────────────── */
          :root {
            --card-h: 190px;
            --peek:    28px;
          }

          .feat-link {
            text-decoration: none;
            display: block;
            position: relative;
            height: calc(var(--card-h) + var(--peek));
          }

          .feat-front {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: var(--card-h);
            background: #111;
            border: 1px solid rgba(240,237,232,0.08);
            border-radius: 18px;
            padding: 1.3rem;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            z-index: 2;
            overflow: hidden;
            transition: border-color 0.25s ease, transform 0.25s ease;
          }

          .feat-back {
            position: absolute;
            top: var(--peek);
            left: 0; right: 0;
            height: var(--card-h);
            border-radius: 18px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 9px;
            box-sizing: border-box;
            transition: transform 0.25s ease;
          }

          .feat-link:hover .feat-front {
            border-color: rgba(200,255,0,0.25) !important;
            transform: translateY(-3px);
          }
          .feat-link:hover .feat-back {
            transform: translateY(-3px);
          }

          /* Grid */
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
            align-items: start;
          }

          @media(max-width:768px) {
            .dash-desktop-nav { display: none !important; }
            .dash-hamburger   { display: flex !important; }
            .feature-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 0.85rem !important;
            }
            :root {
              --card-h: 185px;
              --peek:   30px;
            }
          }

        `}</style>

        {/* Mobile menu */}

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'6rem 2rem 4rem' }}>

          {/* Header */}
          <div style={{ marginBottom:'2.5rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', padding:'0.35rem 1rem', borderRadius:'100px', fontSize:'0.75rem', color:'#c8ff00', fontWeight:600, marginBottom:'1rem' }}>
              <span className="dash-blink" style={{ width:6, height:6, background:'#c8ff00', borderRadius:'50%', display:'inline-block' }} />
              Your dashboard
            </div>
            <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing:'-0.04em', color:'#f0ede8', lineHeight:1.05 }}>
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.
            </h1>
            <p style={{ color:'rgba(240,237,232,0.45)', marginTop:'0.6rem', fontSize:'0.95rem' }}>
              Your visa sponsorship hub. Everything in one place.
            </p>
          </div>

          {/* Feature cards */}
          <div className="feature-grid">
            {features.map(item => (
              <a key={item.label} href={item.href} className="feat-link">

                {/* Back card — peeks out below front */}
                <div className="feat-back" style={{
                  background: item.backBg,
                  border: `1px solid ${item.backBorder}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:item.dotColor, flexShrink:0 }} />
                    <span style={{ fontSize:'0.62rem', color:item.accessColor, fontWeight:400 }}>{item.accessText}</span>
                  </div>
                </div>

                {/* Front card */}
                <div className="feat-front">
                  {/* Tag pill */}
                  <div style={{
                    position:'absolute', top:'1rem', right:'1rem',
                    background:item.tagColor, color:item.tagText,
                    fontSize:'0.55rem', fontWeight:600,
                    letterSpacing:'0.1em', textTransform:'uppercase',
                    padding:'0.2rem 0.5rem', borderRadius:'100px',
                  }}>
                    {item.tag}
                  </div>

                  <div style={{ fontSize:'1.4rem', marginBottom:'0.6rem' }}>{item.icon}</div>
                  <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.88rem', color:'#f0ede8', marginBottom:'0.3rem', lineHeight:1.2 }}>{item.label}</div>
                  <div style={{ fontSize:'0.74rem', color:'rgba(240,237,232,0.4)', lineHeight:1.5, fontWeight:400 }}>{item.desc}</div>
                </div>

              </a>
            ))}
          </div>

          {/* Upgrade CTA */}
          <div style={{ background:'linear-gradient(135deg, rgba(200,255,0,0.06) 0%, rgba(255,77,0,0.04) 100%)', border:'1px solid rgba(200,255,0,0.12)', borderRadius:20, padding:'2rem', marginBottom:'2.5rem' }}>
            <style>{`.cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; } .cta-btn { white-space: nowrap; } @media(max-width:768px) { .cta-inner { flex-direction: column; align-items: stretch; } .cta-btn { text-align: center; } }`}</style>
            <div className="cta-inner">
              <div>
                <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.1rem', color:'#f0ede8', marginBottom:'0.3rem' }}>Unlock the unfair advantage.</div>
                <div style={{ fontSize:'0.85rem', color:'rgba(240,237,232,0.45)' }}>Plans from 99p/week. Cancel anytime.</div>
              </div>
              <a href="/pricing" className="cta-btn cta-plan-btn" style={{ display:'block', background:'#c8ff00', color:'#080808', padding:'0.85rem 2rem', borderRadius:'100px', fontWeight:700, fontSize:'0.92rem', textDecoration:'none' }}>
                See plans →
              </a>
            </div>
          </div>

          {/* Profile summary */}
          {profile && (
            <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:20, padding:'1.8rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem' }}>
                <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'1rem', color:'#f0ede8' }}>Your profile</div>
                <a href="/profile" style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.35)', textDecoration:'none', border:'1px solid rgba(240,237,232,0.1)', padding:'0.3rem 0.8rem', borderRadius:'100px' }}>Edit</a>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'1rem' }}>
                {[
                  { label:'Job title', value: profile.job_title || 'Not set' },
                  { label:'Experience', value: profile.experience || 'Not set' },
                  { label:'Status', value: profile.is_new_entrant ? '✓ New entrant' : 'Experienced worker' },
                  { label:'Target salary', value: profile.target_salary_band || 'Not set' },
                  { label:'Locations', value: profile.preferred_locations?.join(', ') || 'Not set' },
                  { label:'University', value: profile.university || '—' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(240,237,232,0.35)', marginBottom:'0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize:'0.88rem', color:'rgba(240,237,232,0.7)', fontWeight:500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;