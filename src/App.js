import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Jobs from './pages/Jobs';
import Companies from './pages/Companies';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return (
    <div style={{ background: '#080808', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes strike { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes ringfill { from{stroke-dashoffset:440} to{stroke-dashoffset:110} }
        @keyframes barfill { from{width:0} }
        .ticker { animation: tick 28s linear infinite; display: inline-block; white-space: nowrap; }
        .blink { animation: blink 1.6s ease infinite; }
        .strike { position:absolute; left:0; right:0; top:52%; height:5px; background:#ff4d00; border-radius:3px; transform-origin:left; animation:strike 1s 0.8s ease forwards; transform:scaleX(0); display:block; }
        .ring-fg { animation: ringfill 2s 0.5s ease both; }
        .feat:hover { border-color: rgba(200,255,0,0.25) !important; transform: translateY(-5px); }
        .price-card:hover { transform: translateY(-5px); }
        @media(max-width:768px) {
          .hero-title { font-size: 2.8rem !important; }
          .stats-grid { gap: 2rem !important; }
          .hero-pad { padding: 7rem 1.5rem 3rem !important; }
          .nav-links { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .score-wrap { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .pricing-grid { grid-template-columns: 1fr 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
        }
        @media(max-width:520px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.2rem 2.5rem', background:'rgba(8,8,8,0.85)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:100 }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
        <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
          <a href="/jobs" style={navLink}>Jobs</a>
          <a href="/companies" style={navLink}>Companies</a>
          <a href="/login" style={navLink}>Login</a>
          <a href="/signup" style={{ background:'#c8ff00', color:'#080808', padding:'0.5rem 1.2rem', borderRadius:'100px', fontWeight:700, fontSize:'0.85rem', textDecoration:'none' }}>Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-pad" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'8rem 2.5rem 4rem', position:'relative' }}>
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,255,0,0.1) 0%, transparent 70%)', top:-100, right:-150, pointerEvents:'none' }} />

        <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', padding:'0.38rem 1rem', borderRadius:'100px', fontSize:'0.75rem', color:'#c8ff00', fontWeight:600, marginBottom:'2rem', width:'fit-content' }}>
          <span className="blink" style={{ width:6, height:6, background:'#c8ff00', borderRadius:'50%', display:'inline-block' }} />
          UK's #1 visa sponsorship platform
        </div>

        <h1 className="hero-title" style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'clamp(2.8rem, 7vw, 6.5rem)', lineHeight:0.95, letterSpacing:'-0.045em', color:'#f0ede8', maxWidth:900, textAlign:'left' }}>
          Skip the{' '}
          <span style={{ color:'rgba(240,237,232,0.3)', position:'relative', display:'inline-block' }}>
            noise.<span className="strike" />
          </span>
          <br />
          <span style={{ color:'#c8ff00' }}>Find your Sponsrr.</span>
        </h1>

        <p style={{ fontSize:'1.05rem', color:'rgba(240,237,232,0.5)', maxWidth:480, lineHeight:1.65, marginTop:'1.8rem', fontWeight:300, textAlign:'left' }}>
          Every job, every company — 100% verified UK visa sponsors. No guesswork. No LinkedIn rabbit holes. Just the roles that will actually get you here.
        </p>

        <div style={{ display:'flex', gap:'1rem', marginTop:'2.5rem', flexWrap:'wrap', justifyContent:'flex-start' }}>
          <a href="/jobs" style={{ background:'#c8ff00', color:'#080808', padding:'0.95rem 2.2rem', borderRadius:'100px', fontWeight:700, fontSize:'0.95rem', textDecoration:'none', boxShadow:'0 0 40px rgba(200,255,0,0.25)' }}>Find my Sponsrr →</a>
          <a href="#features" style={{ color:'#f0ede8', padding:'0.95rem 1.6rem', borderRadius:'100px', fontWeight:500, fontSize:'0.9rem', textDecoration:'none', border:'1px solid rgba(240,237,232,0.15)' }}>See how it works</a>
        </div>

        <div className="stats-grid" style={{ display:'flex', justifyContent:'center', gap:'5rem', flexWrap:'wrap', marginTop:'4.5rem', paddingTop:'3rem', borderTop:'1px solid rgba(240,237,232,0.08)', width:'100%' }}>
          {[{num:'121,000+',label:'Licensed UK sponsors'},{num:'99p',label:'From per week'},{num:'0',label:'Unverified listings. Ever.'},{num:'19',label:'Sectors covered'}].map(s => (
            <div key={s.num} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:'2.2rem', fontWeight:800, color:'#c8ff00', letterSpacing:'-0.05em' }}>{s.num}</div>
              <div style={{ fontSize:'0.78rem', color:'rgba(240,237,232,0.45)', marginTop:'0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background:'#c8ff00', padding:'0.7rem 0', overflow:'hidden', whiteSpace:'nowrap' }}>
        <div className="ticker">
          {['Visa Verified','CV Builder','Sponsrr Score','Salary Checker','Job Alerts','Company Insights','Application Tracker','Home Office Data','Visa Verified','CV Builder','Sponsrr Score','Salary Checker','Job Alerts','Company Insights','Application Tracker','Home Office Data'].map((t,i) => (
            <span key={i} style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.78rem', color:'#080808', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 2rem' }}>{t} <span style={{ opacity:0.35 }}>●</span></span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding:'6rem 2.5rem', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1.2rem' }}>What you get</div>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2rem, 4vw, 3.2rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.02, maxWidth:680, color:'#f0ede8' }}>
          Built different.<br /><span style={{ color:'#c8ff00' }}>For internationals</span><br />who are done waiting.
        </h2>

        <div className="features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1rem', marginTop:'3.5rem' }}>
          {[
            { icon:'🔍', title:'Verified Sponsor Directory', desc:'Every company on Sponsrr is cross-referenced with the Home Office register of licensed sponsors. If they\'re here, they can sponsor. Simple.', tag:'Core', tagColor:'rgba(200,255,0,0.1)', tagText:'#c8ff00' },
            { icon:'⚡', title:'Real-time Job Feed', desc:'Live listings filtered by sponsor status, salary threshold, and your occupation code. No refreshing LinkedIn at midnight wondering if they sponsor.', tag:'Core', tagColor:'rgba(200,255,0,0.1)', tagText:'#c8ff00' },
            { icon:'🏆', title:'Your Sponsrr Score', desc:'A personalised match score that shows how likely you are to get sponsored — based on your role, sector, experience, and salary. Only on Sponsrr.', tag:'Only on Sponsrr', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
            { icon:'📄', title:'AI CV Builder', desc:'Build a visa-optimised CV in minutes. Our AI highlights the experience sponsors actually care about and flags anything that could get you filtered out.', tag:'Exclusive', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
            { icon:'💷', title:'Salary Threshold Checker', desc:'Instantly check if a job meets the Skilled Worker visa salary requirement. Know before you apply — don\'t waste your time on roles that won\'t qualify.', tag:'Exclusive', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
            { icon:'🔔', title:'Smart Job Alerts', desc:'Set your role, sector, and location. We ping you the moment a verified sponsor posts a job that matches. Be first. Be fast.', tag:'Core', tagColor:'rgba(200,255,0,0.1)', tagText:'#c8ff00' },
            { icon:'🏢', title:'Company Deep Dives', desc:'See how many CoS a company has issued, which roles they sponsor most, their average sponsored salary, and how active they\'ve been recently.', tag:'Exclusive', tagColor:'rgba(255,77,0,0.12)', tagText:'#ff4d00' },
            { icon:'📊', title:'Application Tracker', desc:'Track every application in one clean board. Know what\'s live, what needs a follow-up, and what to let go. Stay organised. Stay focused.', tag:'Core', tagColor:'rgba(200,255,0,0.1)', tagText:'#c8ff00' },
          ].map(f => (
            <div key={f.title} className="feat" style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:20, padding:'2rem', transition:'border-color 0.3s, transform 0.3s', cursor:'pointer' }}>
              <div style={{ fontSize:'1.8rem', marginBottom:'1.2rem' }}>{f.icon}</div>
              <h3 style={{ fontFamily:'Syne, sans-serif', fontSize:'1rem', fontWeight:700, letterSpacing:'-0.02em', marginBottom:'0.6rem', color:'#f0ede8' }}>{f.title}</h3>
              <p style={{ fontSize:'0.86rem', color:'rgba(240,237,232,0.5)', lineHeight:1.7, fontWeight:300 }}>{f.desc}</p>
              <span style={{ display:'inline-block', background:f.tagColor, color:f.tagText, fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.22rem 0.65rem', borderRadius:'100px', marginTop:'1.2rem' }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SPONSRR SCORE */}
      <div style={{ background:'#0f0f0f', padding:'6rem 2.5rem' }}>
        <div className="score-wrap" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5rem', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1.2rem' }}>Only on Sponsrr</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2rem, 4vw, 3.2rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.02, color:'#f0ede8' }}>
              Your <span style={{ color:'#c8ff00' }}>Sponsrr Score.</span><br />Know your chances<br />before you apply.
            </h2>
            <p style={{ fontSize:'0.95rem', color:'rgba(240,237,232,0.5)', lineHeight:1.7, fontWeight:300, marginTop:'1.5rem', maxWidth:420 }}>
              Stop sending CVs into a black hole. Your Sponsrr Score analyses your profile — role, sector, salary level, experience — and tells you exactly how likely you are to land a sponsored role. Then it tells you how to improve it.
            </p>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'2rem' }}>
              {['Built from real Home Office sponsorship data','Updates as you improve your profile','Sector-specific scoring — not one-size-fits-all','Shareable — flex it on LinkedIn'].map(b => (
                <li key={b} style={{ fontSize:'0.85rem', color:'rgba(240,237,232,0.6)', display:'flex', alignItems:'flex-start', gap:'0.75rem', lineHeight:1.5 }}>
                  <span style={{ color:'#c8ff00', fontSize:'0.65rem', marginTop:'0.2rem', flexShrink:0 }}>✦</span>{b}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:28, padding:'2.5rem', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 65%)', top:-100, right:-100, pointerEvents:'none' }} />
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(240,237,232,0.4)', marginBottom:'1.5rem' }}>Your Sponsrr Score</div>

            <div style={{ display:'flex', justifyContent:'center', marginBottom:'2rem', position:'relative' }}>
              <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(240,237,232,0.07)" strokeWidth="10" />
                <circle className="ring-fg" cx="80" cy="80" r="70" fill="none" stroke="#c8ff00" strokeWidth="10" strokeLinecap="round" strokeDasharray="440" strokeDashoffset="110" style={{ filter:'drop-shadow(0 0 10px rgba(200,255,0,0.6))' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'Syne, sans-serif', fontSize:'2.8rem', fontWeight:800, color:'#c8ff00', letterSpacing:'-0.06em', lineHeight:1 }}>74</div>
                <div style={{ fontSize:'0.65rem', color:'rgba(240,237,232,0.4)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'0.2rem' }}>/ 100</div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {[{label:'Sector',pct:'88%'},{label:'Salary',pct:'72%'},{label:'Experience',pct:'65%'},{label:'CV Match',pct:'80%'}].map(f => (
                <div key={f.label} style={{ display:'flex', alignItems:'center', gap:'0.8rem' }}>
                  <div style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.45)', width:80, flexShrink:0 }}>{f.label}</div>
                  <div style={{ flex:1, height:5, background:'rgba(240,237,232,0.07)', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ width:f.pct, height:'100%', background:'#c8ff00', borderRadius:100, animation:'barfill 1.5s ease both' }} />
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'rgba(240,237,232,0.45)', width:30, textAlign:'right' }}>{f.pct}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div style={{ padding:'6rem 2.5rem', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1.2rem' }}>Pricing</div>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2rem, 4vw, 3.2rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.02, color:'#f0ede8' }}>
          Less than a<br /><span style={{ color:'#c8ff00' }}>bag of chips.</span>
        </h2>

        <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginTop:'3.5rem' }}>
          {[
            { period:'Weekly', price:'0.99', per:'wk', equiv:'Full flexibility', save:null, features:['Verified job listings','Sponsor directory','Basic job alerts','Sponsrr Score'], best:false },
            { period:'Monthly', price:'3.49', per:'mo', equiv:'≈ 87p per week', save:'Save 12%', features:['Everything in Weekly','AI CV Builder','Salary checker','Application tracker'], best:false },
            { period:'Quarterly', price:'9.99', per:'qtr', equiv:'≈ 77p per week', save:'Save 24%', features:['Everything in Monthly','Company deep dives','Priority alerts','Profile badge'], best:true },
            { period:'Annually', price:'34.99', per:'yr', equiv:'≈ 67p per week', save:'Save 32%', features:['Everything in Quarterly','1-on-1 CV review','Early feature access','Sponsrr verified badge'], best:false },
          ].map(p => (
            <div key={p.period} className="price-card" style={{ background: p.best ? 'linear-gradient(160deg, rgba(200,255,0,0.07) 0%, #111 55%)' : '#111', border: p.best ? '1px solid rgba(200,255,0,0.4)' : '1px solid rgba(240,237,232,0.07)', borderRadius:22, padding:'2rem 1.7rem', position:'relative', transition:'transform 0.3s' }}>
              {p.best && <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'#c8ff00', color:'#080808', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0.28rem 0.8rem', borderRadius:'100px', whiteSpace:'nowrap' }}>Most popular</div>}
              <div style={{ fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(240,237,232,0.4)', marginBottom:'0.9rem' }}>{p.period}</div>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:'2.6rem', fontWeight:800, letterSpacing:'-0.05em', lineHeight:1, color:'#f0ede8' }}>
                <sup style={{ fontSize:'1.1rem', verticalAlign:'super', letterSpacing:0 }}>£</sup>{p.price}
                <sub style={{ fontSize:'0.85rem', fontWeight:400, color:'rgba(240,237,232,0.4)', verticalAlign:'baseline', letterSpacing:0 }}>/{p.per}</sub>
              </div>
              <div style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.35)', marginTop:'0.4rem' }}>{p.equiv}</div>
              {p.save && <div style={{ display:'inline-block', background:'rgba(255,77,0,0.14)', color:'#ff4d00', fontSize:'0.68rem', fontWeight:700, padding:'0.2rem 0.6rem', borderRadius:'100px', marginTop:'0.7rem' }}>{p.save}</div>}
              <div style={{ height:1, background:'rgba(240,237,232,0.07)', margin:'1.5rem 0' }} />
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize:'0.82rem', color:'rgba(240,237,232,0.6)', display:'flex', alignItems:'flex-start', gap:'0.5rem', lineHeight:1.5 }}>
                    <span style={{ color:'#c8ff00', fontWeight:700, fontSize:'0.75rem', flexShrink:0, marginTop:'0.1rem' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="/signup" style={{ display:'block', textAlign:'center', marginTop:'1.5rem', padding:'0.75rem', borderRadius:'100px', fontWeight:600, fontSize:'0.84rem', textDecoration:'none', background: p.best ? '#c8ff00' : 'transparent', color: p.best ? '#080808' : '#f0ede8', border: p.best ? '1px solid #c8ff00' : '1px solid rgba(240,237,232,0.15)' }}>
                Start {p.period.toLowerCase()}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ background:'#0f0f0f', padding:'6rem 2.5rem' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#c8ff00', marginBottom:'1.2rem' }}>Real people. Real results.</div>
          <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2rem, 4vw, 3.2rem)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.02, color:'#f0ede8' }}>
            They skipped the noise.<br /><span style={{ color:'#c8ff00' }}>You can too.</span>
          </h2>
          <div className="testi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginTop:'3.5rem' }}>
            {[
              { initials:'AK', name:'Arjun K.', role:'Software Engineer · Mumbai → London', quote:'I wasted six months on LinkedIn applying to jobs that \'might consider\' sponsorship. Found my role in three weeks on Sponsrr. Genuinely life-changing.' },
              { initials:'FM', name:'Fatima M.', role:'Marketing Manager · Lagos → Manchester', quote:'The Sponsrr Score told me my profile was weak on salary threshold. I negotiated my offer up before signing. That feature alone is worth the subscription.' },
              { initials:'JL', name:'Ji-ho L.', role:'Data Analyst · Seoul → Birmingham', quote:'The company insights showed me which firms were actively issuing CoS certificates. I targeted them specifically. Got three interviews in my first week.' },
            ].map(t => (
              <div key={t.name} style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:22, padding:'1.8rem' }}>
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
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ padding:'9rem 2.5rem', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:900, height:900, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 60%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2.8rem, 7vw, 6rem)', fontWeight:800, letterSpacing:'-0.045em', lineHeight:0.95, maxWidth:850, margin:'0 auto 2rem', color:'#f0ede8' }}>
          Your visa.<br />Their job.<br /><span style={{ color:'#c8ff00' }}>Let's go.</span>
        </h2>
        <p style={{ fontSize:'1rem', color:'rgba(240,237,232,0.45)', marginBottom:'2.5rem' }}>
          Join thousands of internationals who stopped guessing and started getting sponsored.
        </p>
        <a href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'#c8ff00', color:'#080808', padding:'0.95rem 2.2rem', borderRadius:'100px', fontWeight:700, fontSize:'0.95rem', textDecoration:'none', boxShadow:'0 0 60px rgba(200,255,0,0.3)' }}>
          Find my Sponsrr →
        </a>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(240,237,232,0.06)', padding:'2rem 2.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
        <div style={{ display:'flex', gap:'1.5rem' }}>
          {['Privacy','Terms','Blog','Contact'].map(l => (
            <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.35)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
        <p style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.28)' }}>© 2025 Sponsrr. Built for internationals.</p>
      </footer>

    </div>
  );
}

const navLink = {
  color: 'rgba(240,237,232,0.55)',
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: 500,
};

export default App;