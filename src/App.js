import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Companies from './pages/Companies';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs/:slug" element={<JobDetail />} />
      </Routes>
    </Router>
  );
}

function Home() {
  const [testiIndex, setTestiIndex] = useState(0);
  const [priceIndex, setPriceIndex] = useState(2);

  const testimonials = [
    { initials:'AK', name:'Arjun K.', role:'Software Engineer · Mumbai → London', quote:'I wasted six months on LinkedIn applying to jobs that \'might consider\' sponsorship. Found my role in three weeks on Sponsrr. Genuinely life-changing.' },
    { initials:'FM', name:'Fatima M.', role:'Marketing Manager · Lagos → Manchester', quote:'The Sponsrr Score told me my profile was weak on salary threshold. I negotiated my offer up before signing. That feature alone is worth the subscription.' },
    { initials:'JL', name:'Ji-ho L.', role:'Data Analyst · Seoul → Birmingham', quote:'The company insights showed me which firms were actively issuing CoS certificates. I targeted them specifically. Got three interviews in my first week.' },
  ];

  const plans = [
    {
      period:'Weekly', price:'0.99', per:'wk', equiv:'Full flexibility', save:null, best:false,
      features:[
        'Job cards from verified sponsors',
        'Sponsor directory — browse free',
        'Visa Eligibility Calculator',
        'Sponsrr Score',
        'Basic job alerts',
      ]
    },
    {
      period:'Monthly', price:'3.49', per:'mo', equiv:'≈ 87p per week', save:'Save 12%', best:false,
      features:[
        'Everything in Weekly',
        'Full job descriptions + apply',
        'AI CV Builder',
        'Salary threshold checker',
        'Application tracker',
      ]
    },
    {
      period:'Quarterly', price:'9.99', per:'qtr', equiv:'≈ 77p per week', save:'Save 24%', best:true,
      features:[
        'Everything in Monthly',
        'Company deep dives',
        'Priority job alerts',
        'Profile badge',
      ]
    },
    {
      period:'Annually', price:'34.99', per:'yr', equiv:'≈ 67p per week', save:'Save 32%', best:false,
      features:[
        'Everything in Quarterly',
        '1-on-1 CV review',
        'Early feature access',
        'Sponsrr verified badge',
      ]
    },
  ];

  const features = [
    { icon:'🔍', title:'Verified Sponsor Directory', desc:'Every company cross-referenced with the Home Office register. If they\'re here, they can sponsor.', tag:'Core', tagColor:'rgba(240,237,232,0.08)', tagText:'rgba(240,237,232,0.5)' },
    { icon:'⚡', title:'Real-time Job Feed', desc:'Live listings filtered by sponsor status, salary threshold, and your occupation code.', tag:'Core', tagColor:'rgba(240,237,232,0.08)', tagText:'rgba(240,237,232,0.5)' },
    { icon:'🏆', title:'Sponsrr Score', desc:'A personalised match score based on your role, sector, experience, and salary. Only on Sponsrr.', tag:'Only on Sponsrr', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
    { icon:'📄', title:'AI CV Builder', desc:'Build a visa-optimised CV in minutes. Highlights what sponsors actually care about.', tag:'Exclusive', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
    { icon:'💷', title:'Salary Threshold Checker', desc:'Instantly check if a job meets the Skilled Worker visa salary requirement.', tag:'Exclusive', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
    { icon:'🔔', title:'Smart Job Alerts', desc:'We ping you the moment a verified sponsor posts a matching job. Be first. Be fast.', tag:'Core', tagColor:'rgba(240,237,232,0.08)', tagText:'rgba(240,237,232,0.5)' },
    { icon:'🏢', title:'Company Deep Dives', desc:'See CoS history, sponsor activity, average salaries and more for any company.', tag:'Exclusive', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
    { icon:'📊', title:'Application Tracker', desc:'Track every application in one clean board. Stay organised. Stay focused. Stay ahead.', tag:'Core', tagColor:'rgba(240,237,232,0.08)', tagText:'rgba(240,237,232,0.5)' },
  ];

  const stats = [
    { num:'121,000+', label:'Licensed UK sponsors' },
    { num:'19', label:'Sectors covered' },
    { num:'0', label:'Unverified listings. Ever.' },
    { num:'99p', label:'From per week' },
  ];

  return (
    <div style={{ background:'#080808', minHeight:'100vh', overflowX:'hidden' }}>
      <style>{`
        @keyframes tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes strike { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        .ticker { animation: tick 28s linear infinite; display: inline-block; white-space: nowrap; }
        .blink { animation: blink 1.6s ease infinite; }
        .strike { position:absolute; left:0; right:0; top:52%; height:5px; background:#ff4d00; border-radius:3px; transform-origin:left; animation:strike 1s 0.8s ease forwards; transform:scaleX(0); display:block; }
        .feat-card:hover { border-color: rgba(200,255,0,0.25) !important; transform: translateY(-3px); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); width: 100%; border: 1px solid rgba(240,237,232,0.08); border-radius: 16px; overflow: hidden; margin-top: 3.5rem; }
        .stat-box-0 { background: rgba(240,237,232,0.03); border-right: 1px solid rgba(240,237,232,0.08); }
        .stat-box-1 { background: transparent; border-right: 1px solid rgba(240,237,232,0.08); }
        .stat-box-2 { background: rgba(240,237,232,0.03); border-right: 1px solid rgba(240,237,232,0.08); }
        .stat-box-3 { background: transparent; }
        @media(max-width:768px) {
          .hero-title { font-size: 2.6rem !important; line-height: 1.05 !important; }
          .hero-pad { padding: 5rem 1.5rem 2rem !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }
          .feat-card { padding: 1.2rem !important; }
          .feat-card p { font-size: 0.78rem !important; }
          .score-wrap { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .testi-desktop { display: none !important; }
          .testi-mobile { display: block !important; }
          .price-desktop { display: none !important; }
          .price-mobile { display: block !important; }
          .section-pad { padding: 3.5rem 1.5rem !important; }
          .hero-buttons { flex-direction: column !important; }
          .hero-buttons a { text-align: center !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stat-box-0 { background: rgba(240,237,232,0.04) !important; border-right: 1px solid rgba(240,237,232,0.08) !important; border-bottom: 1px solid rgba(240,237,232,0.08) !important; }
          .stat-box-1 { background: transparent !important; border-right: none !important; border-bottom: 1px solid rgba(240,237,232,0.08) !important; }
          .stat-box-2 { background: transparent !important; border-right: 1px solid rgba(240,237,232,0.08) !important; border-bottom: none !important; }
          .stat-box-3 { background: rgba(240,237,232,0.04) !important; border-right: none !important; border-bottom: none !important; }
        }
        @media(min-width:769px) {
          .testi-mobile { display: none !important; }
          .price-mobile { display: none !important; }
        }
      `}</style>

      {/* NAV -- landing page: logo + Get Started only */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.2rem 2rem', background:'rgba(8,8,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000 }}>
        <a href="/" style={{ textDecoration:'none' }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
            Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
          </div>
        </a>
        <a href="/login" style={{ background:'#c8ff00', color:'#080808', padding:'0.5rem 1.4rem', borderRadius:'100px', fontWeight:700, fontSize:'0.85rem', textDecoration:'none', whiteSpace:'nowrap' }}>
          Get Started
        </a>
      </nav>

      {/* HERO */}
      <div className="hero-pad" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'8rem 2.5rem 4rem', position:'relative' }}>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)', top:-80, right:-100, pointerEvents:'none', zIndex:0 }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', padding:'0.38rem 1rem', borderRadius:'100px', fontSize:'0.75rem', color:'#c8ff00', fontWeight:600, marginBottom:'1.5rem', width:'fit-content' }}>
            <span className="blink" style={{ width:6, height:6, background:'#c8ff00', borderRadius:'50%', display:'inline-block' }} />
            UK's #1 visa sponsorship platform
          </div>

          <h1 className="hero-title" style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(2.6rem, 7vw, 6.5rem)', lineHeight:0.95, letterSpacing:'-0.045em', color:'#f0ede8', maxWidth:900, textAlign:'left' }}>
            Skip the{' '}
            <span style={{ color:'rgba(240,237,232,0.3)', position:'relative', display:'inline-block' }}>
              noise.<span className="strike" />
            </span>
            <br />
            <span style={{ color:'#c8ff00' }}>Find your Sponsrr.</span>
          </h1>

          <p style={{ fontSize:'1rem', color:'rgba(240,237,232,0.5)', maxWidth:460, lineHeight:1.65, marginTop:'1.5rem', fontWeight:300, textAlign:'left' }}>
            Every job, every company — 100% verified UK visa sponsors. No guesswork. No LinkedIn rabbit holes. Just the roles that will actually get you here.
          </p>

          <div className="hero-buttons" style={{ display:'flex', gap:'1rem', marginTop:'2rem', flexWrap:'wrap', justifyContent:'flex-start' }}>
            <a href="/jobs" style={{ background:'#c8ff00', color:'#080808', padding:'0.9rem 2rem', borderRadius:'100px', fontWeight:700, fontSize:'0.95rem', textDecoration:'none', boxShadow:'0 0 40px rgba(200,255,0,0.2)' }}>Find my Sponsrr →</a>
            <a href="#features" style={{ color:'#f0ede8', padding:'0.9rem 1.5rem', borderRadius:'100px', fontWeight:500, fontSize:'0.9rem', textDecoration:'none', border:'1px solid rgba(240,237,232,0.15)' }}>See how it works</a>
          </div>

          {/* STATS */}
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={s.num} className={`stat-box-${i}`} style={{ padding:'2rem 1rem', textAlign:'center' }}>
                <div style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(1.5rem, 3vw, 2rem)', fontWeight:800, color:'#c8ff00', letterSpacing:'-0.05em' }}>{s.num}</div>
                <div style={{ fontSize:'0.73rem', color:'rgba(240,237,232,0.45)', marginTop:'0.4rem', lineHeight:1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background:'#c8ff00', padding:'0.65rem 0', overflow:'hidden', whiteSpace:'nowrap' }}>
        <div className="ticker">
          {['Visa Verified','CV Builder','Sponsrr Score','Salary Checker','Job Alerts','Company Insights','Application Tracker','Home Office Data',
            'Visa Verified','CV Builder','Sponsrr Score','Salary Checker','Job Alerts','Company Insights','Application Tracker','Home Office Data'].map((t,i) => (
            <span key={i} style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.75rem', color:'#080808', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 1.5rem' }}>
              {t} <span style={{ opacity:0.35 }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="section-pad" style={{ padding:'5rem 2.5rem', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1rem' }}>What you get</div>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(1.8rem, 4vw, 3rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.05, color:'#f0ede8', marginBottom:'2.5rem' }}>
          Built different.<br /><span style={{ color:'#c8ff00' }}>For internationals</span><br />who are done waiting.
        </h2>
        <div className="features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'1rem' }}>
          {features.map(f => (
            <div key={f.title} className="feat-card" style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:18, padding:'1.5rem', transition:'all 0.3s', cursor:'pointer' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:'0.8rem' }}>{f.icon}</div>
              <h3 style={{ fontFamily:'Syne, sans-serif', fontSize:'0.92rem', fontWeight:700, letterSpacing:'-0.02em', marginBottom:'0.5rem', color:'#f0ede8' }}>{f.title}</h3>
              <p style={{ fontSize:'0.82rem', color:'rgba(240,237,232,0.5)', lineHeight:1.65, fontWeight:300 }}>{f.desc}</p>
              <span style={{ display:'inline-block', background:f.tagColor, color:f.tagText, fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.2rem 0.6rem', borderRadius:'100px', marginTop:'1rem' }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SPONSRR SCORE */}
      <div style={{ background:'#0f0f0f', padding:'5rem 2.5rem' }}>
        <div className="score-wrap" style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1rem' }}>Only on Sponsrr</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(1.8rem, 4vw, 3rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.05, color:'#f0ede8' }}>
              Your <span style={{ color:'#c8ff00' }}>Sponsrr Score.</span><br />Know your chances<br />before you apply.
            </h2>
            <p style={{ fontSize:'0.92rem', color:'rgba(240,237,232,0.5)', lineHeight:1.7, fontWeight:300, marginTop:'1.2rem', maxWidth:400 }}>
              Stop sending CVs into a black hole. Your Sponsrr Score analyses your profile and tells you exactly how likely you are to land a sponsored role.
            </p>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.6rem', marginTop:'1.5rem' }}>
              {['Built from real Home Office sponsorship data','Updates as you improve your profile','Sector-specific scoring','Shareable on LinkedIn'].map(b => (
                <li key={b} style={{ fontSize:'0.84rem', color:'rgba(240,237,232,0.6)', display:'flex', gap:'0.6rem', alignItems:'flex-start' }}>
                  <span style={{ color:'#c8ff00', fontSize:'0.65rem', marginTop:'0.25rem', flexShrink:0 }}>✦</span>{b}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:24, padding:'2rem' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(240,237,232,0.4)', marginBottom:'1.5rem' }}>Your Sponsrr Score</div>
            <div style={{ position:'relative', width:140, height:140, margin:'0 auto 1.5rem' }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform:'rotate(-90deg)', position:'absolute', top:0, left:0 }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(240,237,232,0.07)" strokeWidth="9" />
                <circle cx="70" cy="70" r="60" fill="none" stroke="#c8ff00" strokeWidth="9" strokeLinecap="round" strokeDasharray="377" strokeDashoffset="94" style={{ filter:'drop-shadow(0 0 8px rgba(200,255,0,0.5))' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'Syne, sans-serif', fontSize:'2.5rem', fontWeight:800, color:'#c8ff00', letterSpacing:'-0.06em', lineHeight:1 }}>74</div>
                <div style={{ fontSize:'0.62rem', color:'rgba(240,237,232,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>/ 100</div>
              </div>
            </div>
            {[{label:'Sector',pct:'88%'},{label:'Salary',pct:'72%'},{label:'Experience',pct:'65%'},{label:'CV Match',pct:'80%'}].map(f => (
              <div key={f.label} style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'0.8rem' }}>
                <div style={{ fontSize:'0.72rem', color:'rgba(240,237,232,0.45)', width:72, flexShrink:0 }}>{f.label}</div>
                <div style={{ flex:1, height:4, background:'rgba(240,237,232,0.07)', borderRadius:100, overflow:'hidden' }}>
                  <div style={{ width:f.pct, height:'100%', background:'#c8ff00', borderRadius:100 }} />
                </div>
                <div style={{ fontSize:'0.7rem', color:'rgba(240,237,232,0.4)', width:28, textAlign:'right' }}>{f.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="section-pad" style={{ padding:'5rem 2.5rem', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1rem' }}>Pricing</div>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(1.8rem, 4vw, 3rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.05, color:'#f0ede8', marginBottom:'2.5rem' }}>
          The unfair advantage.<br /><span style={{ color:'#c8ff00' }}>Priced fairly.</span>
        </h2>

        {/* Desktop */}
        <div className="price-desktop" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem' }}>
          {plans.map(p => <PriceCard key={p.period} p={p} />)}
        </div>

        {/* Mobile carousel */}
        <div className="price-mobile">
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', marginBottom:'1.2rem' }}>
            {plans.map((p,i) => (
              <button key={i} onClick={() => setPriceIndex(i)} style={{ width: i === priceIndex ? 24 : 8, height:8, borderRadius:100, background: i === priceIndex ? '#c8ff00' : 'rgba(240,237,232,0.2)', border:'none', cursor:'pointer', transition:'all 0.3s', padding:0 }} />
            ))}
          </div>
          <PriceCard p={plans[priceIndex]} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1rem' }}>
            <button onClick={() => setPriceIndex(i => Math.max(0, i-1))} disabled={priceIndex===0} style={{ background:'rgba(240,237,232,0.08)', border:'none', color: priceIndex===0 ? 'rgba(240,237,232,0.2)' : '#f0ede8', borderRadius:'100px', padding:'0.6rem 1.4rem', cursor: priceIndex===0 ? 'default' : 'pointer', fontSize:'0.85rem', fontWeight:600 }}>← Prev</button>
            <span style={{ fontSize:'0.78rem', color:'rgba(240,237,232,0.4)', alignSelf:'center' }}>{plans[priceIndex].period}</span>
            <button onClick={() => setPriceIndex(i => Math.min(plans.length-1, i+1))} disabled={priceIndex===plans.length-1} style={{ background:'rgba(240,237,232,0.08)', border:'none', color: priceIndex===plans.length-1 ? 'rgba(240,237,232,0.2)' : '#f0ede8', borderRadius:'100px', padding:'0.6rem 1.4rem', cursor: priceIndex===plans.length-1 ? 'default' : 'pointer', fontSize:'0.85rem', fontWeight:600 }}>Next →</button>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ background:'#0f0f0f', padding:'5rem 2.5rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1rem' }}>Real people. Real results.</div>
          <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(1.8rem, 4vw, 3rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.05, color:'#f0ede8', marginBottom:'2.5rem' }}>
            They skipped the noise.<br /><span style={{ color:'#c8ff00' }}>You can too.</span>
          </h2>
          <div className="testi-desktop" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
            {testimonials.map(t => <TestiCard key={t.name} t={t} />)}
          </div>
          <div className="testi-mobile">
            <TestiCard t={testimonials[testiIndex]} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1.2rem' }}>
              <button onClick={() => setTestiIndex(i => Math.max(0, i-1))} disabled={testiIndex===0} style={{ background:'rgba(240,237,232,0.08)', border:'none', color: testiIndex===0 ? 'rgba(240,237,232,0.2)' : '#f0ede8', borderRadius:'100px', padding:'0.6rem 1.4rem', cursor: testiIndex===0 ? 'default' : 'pointer', fontSize:'0.85rem', fontWeight:600 }}>← Prev</button>
              <div style={{ display:'flex', gap:'0.4rem' }}>
                {testimonials.map((_,i) => (
                  <div key={i} onClick={() => setTestiIndex(i)} style={{ width:8, height:8, borderRadius:'50%', background: i===testiIndex ? '#c8ff00' : 'rgba(240,237,232,0.2)', cursor:'pointer', transition:'all 0.3s' }} />
                ))}
              </div>
              <button onClick={() => setTestiIndex(i => Math.min(testimonials.length-1, i+1))} disabled={testiIndex===testimonials.length-1} style={{ background:'rgba(240,237,232,0.08)', border:'none', color: testiIndex===testimonials.length-1 ? 'rgba(240,237,232,0.2)' : '#f0ede8', borderRadius:'100px', padding:'0.6rem 1.4rem', cursor: testiIndex===testimonials.length-1 ? 'default' : 'pointer', fontSize:'0.85rem', fontWeight:600 }}>Next →</button>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="section-pad" style={{ padding:'7rem 2.5rem', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 60%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2.4rem, 7vw, 5.5rem)', fontWeight:800, letterSpacing:'-0.045em', lineHeight:0.95, maxWidth:800, margin:'0 auto 1.5rem', color:'#f0ede8' }}>
          Your visa.<br />Their job.<br /><span style={{ color:'#c8ff00' }}>Let's go.</span>
        </h2>
        <p style={{ fontSize:'0.95rem', color:'rgba(240,237,232,0.45)', marginBottom:'2rem' }}>
          Join thousands of internationals who stopped guessing and started getting sponsored.
        </p>
        <a href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#c8ff00', color:'#080808', padding:'0.95rem 2.2rem', borderRadius:'100px', fontWeight:700, fontSize:'0.95rem', textDecoration:'none', boxShadow:'0 0 50px rgba(200,255,0,0.25)' }}>
          Find my Sponsrr →
        </a>
      </div>

      {/* TICKER */}
      <div style={{ background:'#c8ff00', padding:'0.65rem 0', overflow:'hidden', whiteSpace:'nowrap' }}>
        <div className="ticker">
          {['Visa Verified','CV Builder','Sponsrr Score','Salary Checker','Job Alerts','Company Insights','Application Tracker','Home Office Data',
            'Visa Verified','CV Builder','Sponsrr Score','Salary Checker','Job Alerts','Company Insights','Application Tracker','Home Office Data'].map((t,i) => (
            <span key={i} style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.75rem', color:'#080808', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 1.5rem' }}>
              {t} <span style={{ opacity:0.35 }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(240,237,232,0.06)', padding:'2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', background:'#080808' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
        <div style={{ display:'flex', gap:'1.2rem', flexWrap:'wrap' }}>
          {['Privacy','Terms','Blog','Contact'].map(l => (
            <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.35)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
        <p style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.28)', margin:0 }}>© 2025 Sponsrr. Built for internationals.</p>
      </footer>

    </div>
  );
}

function PriceCard({ p }) {
  return (
    <div style={{ background: p.best ? 'linear-gradient(160deg, rgba(200,255,0,0.07) 0%, #111 55%)' : '#111', border: p.best ? '1px solid rgba(200,255,0,0.4)' : '1px solid rgba(240,237,232,0.07)', borderRadius:20, padding:'1.8rem 1.5rem', position:'relative' }}>
      {p.best && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#c8ff00', color:'#080808', fontSize:'0.6rem', fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0.25rem 0.75rem', borderRadius:'100px', whiteSpace:'nowrap' }}>Most popular</div>}
      <div style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(240,237,232,0.4)', marginBottom:'0.8rem' }}>{p.period}</div>
      <div style={{ fontFamily:'Syne, sans-serif', fontSize:'2.4rem', fontWeight:800, letterSpacing:'-0.05em', lineHeight:1, color:'#f0ede8' }}>
        <sup style={{ fontSize:'1rem', verticalAlign:'super' }}>£</sup>{p.price}
        <sub style={{ fontSize:'0.8rem', fontWeight:400, color:'rgba(240,237,232,0.4)', verticalAlign:'baseline' }}>/{p.per}</sub>
      </div>
      <div style={{ fontSize:'0.73rem', color:'rgba(240,237,232,0.35)', marginTop:'0.3rem' }}>{p.equiv}</div>
      {p.save && <div style={{ display:'inline-block', background:'rgba(255,77,0,0.14)', color:'#ff4d00', fontSize:'0.66rem', fontWeight:700, padding:'0.18rem 0.55rem', borderRadius:'100px', marginTop:'0.6rem' }}>{p.save}</div>}
      <div style={{ height:1, background:'rgba(240,237,232,0.07)', margin:'1.2rem 0' }} />
      <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.55rem' }}>
        {p.features.map(f => (
          <li key={f} style={{ fontSize:'0.8rem', color:'rgba(240,237,232,0.6)', display:'flex', gap:'0.5rem', alignItems:'flex-start', lineHeight:1.5 }}>
            <span style={{ color:'#c8ff00', fontWeight:700, fontSize:'0.72rem', flexShrink:0, marginTop:'0.1rem' }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <a href="/login" style={{ display:'block', textAlign:'center', marginTop:'1.3rem', padding:'0.7rem', borderRadius:'100px', fontWeight:600, fontSize:'0.82rem', textDecoration:'none', background: p.best ? '#c8ff00' : 'transparent', color: p.best ? '#080808' : '#f0ede8', border: p.best ? '1px solid #c8ff00' : '1px solid rgba(240,237,232,0.15)' }}>
        Start {p.period.toLowerCase()}
      </a>
    </div>
  );
}

function TestiCard({ t }) {
  return (
    <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:20, padding:'1.8rem' }}>
      <div style={{ color:'#c8ff00', fontSize:'0.75rem', letterSpacing:'0.1em', marginBottom:'1rem' }}>★★★★★</div>
      <p style={{ fontSize:'0.9rem', color:'rgba(240,237,232,0.65)', lineHeight:1.7, fontWeight:300 }}>"{t.quote}"</p>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'1.5rem' }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg, #c8ff00, #ff4d00)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'0.75rem', color:'#080808', flexShrink:0 }}>{t.initials}</div>
        <div>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.85rem', letterSpacing:'-0.02em', color:'#f0ede8' }}>{t.name}</div>
          <div style={{ fontSize:'0.72rem', color:'rgba(240,237,232,0.35)', marginTop:'0.1rem' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export default App;