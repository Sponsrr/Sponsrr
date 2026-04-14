import React from 'react';

function Layout({ children }) {
  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1 }}>
        {children}
      </div>

      {/* TICKER */}
      <div style={{ background:'#c8ff00', padding:'0.65rem 0', overflow:'hidden', whiteSpace:'nowrap' }}>
        <div style={{ display:'inline-block', animation:'tick 28s linear infinite', whiteSpace:'nowrap' }}>
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
        <a href="/" style={{ textDecoration:'none' }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
            Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
          </div>
        </a>
        <div style={{ display:'flex', gap:'1.2rem', flexWrap:'wrap' }}>
          {['Privacy','Terms','Blog','Contact'].map(l => (
            <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.35)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
        <p style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.28)', margin:0 }}>© 2025 Sponsrr. Built for internationals.</p>
      </footer>

      <style>{`
        @keyframes tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>

    </div>
  );
}

export default Layout;