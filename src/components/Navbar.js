import React, { useState } from 'react';

function Navbar() {
  const [open, setOpen] = useState(false);
  const current = window.location.pathname;

  function linkStyle(path) {
    const isActive = current === path;
    return {
      color: isActive ? '#c8ff00' : 'rgba(240,237,232,0.55)',
      textDecoration: 'none',
      fontSize: '0.88rem',
      fontWeight: isActive ? 700 : 500,
      paddingBottom: '2px',
      borderBottom: isActive ? '2px solid #c8ff00' : '2px solid transparent',
      transition: 'all 0.2s',
    };
  }

  return (
    <>
      <style>{`
        .nav-cta {
          background: #c8ff00;
          color: #080808;
          padding: 0.5rem 1.2rem;
          border-radius: 100px;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-cta:hover {
          background: transparent;
          color: #c8ff00;
          box-shadow: 0 0 0 2px #c8ff00;
        }
        .nav-text-link:hover {
          color: #c8ff00 !important;
          border-bottom-color: #c8ff00 !important;
        }
        .hamburger-btn { display: none; }
        @media(max-width:768px) {
          .desktop-nav-links { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>

      <nav style={{ position:'fixed', top:0, left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.2rem 2rem', background:'rgba(8,8,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000 }}>
        <a href="/" style={{ textDecoration:'none' }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
            Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
          </div>
        </a>

        {/* Desktop links */}
        <div className="desktop-nav-links" style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
          <a href="/jobs" className="nav-text-link" style={linkStyle('/jobs')}>Jobs</a>
          <a href="/companies" className="nav-text-link" style={linkStyle('/companies')}>Companies</a>
          <a href="/login" className="nav-text-link" style={linkStyle('/login')}>Login</a>
          <a href="/signup" className="nav-cta">Get Started</a>
        </div>

        {/* Hamburger */}
        <button className="hamburger-btn" onClick={() => setOpen(!open)} style={{ background:'none', border:'none', cursor:'pointer', padding:'0.5rem', flexDirection:'column', gap:5 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ display:'block', width:22, height:2, background:'#f0ede8', borderRadius:2, transition:'all 0.3s',
              transform: open ? (i===0 ? 'rotate(45deg) translate(5px,5px)' : i===2 ? 'rotate(-45deg) translate(5px,-5px)' : 'scaleX(0)') : 'none'
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ position:'fixed', top:60, left:0, right:0, background:'#0f0f0f', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:999, padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.8rem' }}>
          {[{label:'Jobs',path:'/jobs'},{label:'Companies',path:'/companies'},{label:'Login',path:'/login'}].map(item => (
            <a key={item.label} href={item.path} onClick={() => setOpen(false)} style={{ color: current === item.path ? '#c8ff00' : 'rgba(240,237,232,0.7)', textDecoration:'none', fontSize:'1.1rem', fontWeight: current === item.path ? 700 : 600, fontFamily:'Syne, sans-serif', padding:'0.5rem 0', borderBottom:'1px solid rgba(240,237,232,0.06)' }}>{item.label}</a>
          ))}
          <a href="/signup" onClick={() => setOpen(false)} style={{ background:'#c8ff00', color:'#080808', padding:'0.85rem', borderRadius:'12px', fontWeight:700, fontSize:'0.95rem', textDecoration:'none', textAlign:'center', marginTop:'0.5rem' }}>Get Started</a>
        </div>
      )}
    </>
  );
}

export default Navbar;