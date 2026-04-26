import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const path      = location.pathname;

  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [dropdown, setDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── AUTH ────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', uid).single();
    setProfile(data);
    setLoading(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdown(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Close everything on route change
  useEffect(() => { setDropdown(false); setMenuOpen(false); }, [path]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const avatarLetter = profile?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase() || '?';
  const displayName  = profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const email        = user?.email || '';

  function isActive(href) {
    if (href === '/dashboard') return path === '/dashboard';
    return path.startsWith(href);
  }

  // ── LOGGED OUT ───────────────────────────────────────────────────────────
  if (!loading && !user) {
    return (
      <>
        <style>{`
          .nl-link { color:rgba(240,237,232,0.55); text-decoration:none; font-size:0.88rem; font-weight:500; transition:color 0.2s; }
          .nl-link:hover { color:#f0ede8; }
          .nl-cta { background:#c8ff00; color:#080808; text-decoration:none; padding:0.55rem 1.25rem; border-radius:100px; font-weight:700; font-size:0.85rem; transition:all 0.2s ease; display:inline-block; }
          .nl-cta:hover { background:#aee600; transform:translateY(-1px); box-shadow:0 6px 20px rgba(200,255,0,0.25); }
        `}</style>
        <nav style={{ position:'fixed', top:0, left:0, right:0, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', background:'rgba(8,8,8,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000 }}>
          <a href="/" style={{ textDecoration:'none' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
              Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
            </div>
          </a>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
            <a href="/login" className="nl-link">Sign in</a>
            <a href="/login" className="nl-cta">Get Started</a>
          </div>
        </nav>
      </>
    );
  }

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <nav style={{ position:'fixed', top:0, left:0, right:0, height:64, background:'rgba(8,8,8,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000, display:'flex', alignItems:'center', padding:'0 2rem' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
      </nav>
    );
  }

  // ── LOGGED IN ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* Nav links */
        .nav-lnk { color:rgba(240,237,232,0.5); text-decoration:none; font-size:0.88rem; font-weight:500; transition:color 0.2s; }
        .nav-lnk:hover { color:#f0ede8; }
        .nav-lnk.on { color:#c8ff00; font-weight:700; }

        /* Upgrade pill */
        .upg-pill { background:rgba(200,255,0,0.1); color:#c8ff00; border:1px solid rgba(200,255,0,0.25); padding:0.38rem 1rem; border-radius:100px; font-weight:700; font-size:0.8rem; text-decoration:none; transition:all 0.2s ease; white-space:nowrap; cursor:pointer; font-family:inherit; display:inline-block; }
        .upg-pill:hover { background:rgba(200,255,0,0.2); transform:translateY(-1px); }

        /* Avatar */
        .av-btn { width:36px; height:36px; border-radius:50%; background:#c8ff00; color:#080808; border:none; cursor:pointer; font-family:'Syne',sans-serif; font-weight:800; font-size:0.9rem; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; }
        .av-btn:hover { transform:scale(1.08); box-shadow:0 0 0 2.5px rgba(200,255,0,0.5); }

        /* Dropdown */
        .dd { position:absolute; top:calc(100% + 10px); right:0; background:#111; border:1px solid rgba(240,237,232,0.1); border-radius:16px; padding:0.5rem; min-width:210px; box-shadow:0 16px 48px rgba(0,0,0,0.7); z-index:2000; animation:ddIn 0.15s ease; }
        @keyframes ddIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .dd-item { display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.85rem; border-radius:10px; color:rgba(240,237,232,0.7); text-decoration:none; font-size:0.84rem; font-weight:500; font-family:inherit; background:none; border:none; width:100%; text-align:left; cursor:pointer; transition:all 0.15s; }
        .dd-item:hover { background:rgba(240,237,232,0.06); color:#f0ede8; }
        .dd-danger:hover { background:rgba(255,77,0,0.08); color:#ff4d00; }
        .dd-divider { height:1px; background:rgba(240,237,232,0.07); margin:0.35rem 0; }

        /* Hamburger icon */
        .hb-btn { background:none; border:none; cursor:pointer; padding:0.4rem; display:flex; flex-direction:column; gap:5px; }
        .hb-bar { display:block; width:22px; height:2px; background:#f0ede8; border-radius:2px; transition:all 0.28s ease; transform-origin:center; }
        .hb-btn.open .hb-bar:nth-child(1) { transform:rotate(45deg) translate(5px,5px); }
        .hb-btn.open .hb-bar:nth-child(2) { transform:scaleX(0); opacity:0; }
        .hb-btn.open .hb-bar:nth-child(3) { transform:rotate(-45deg) translate(5px,-5px); }

        /* Mobile overlay — covers everything below the panel */
        .mob-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:1998; backdrop-filter:blur(5px); animation:fadeIn 0.22s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        /* Mobile panel — drops from top, 72% height */
        .mob-panel { position:fixed; top:0; left:0; right:0; height:72vh; background:#141414; border-bottom:1px solid rgba(240,237,232,0.1); z-index:1999; display:flex; flex-direction:column; overflow-y:auto; animation:dropDown 0.28s cubic-bezier(0.32,0.72,0,1); box-shadow:0 24px 60px rgba(0,0,0,0.7); }
        @keyframes dropDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }

        /* Panel nav rows */
        .panel-row { display:flex; align-items:center; gap:0.85rem; padding:0.95rem 1.5rem; color:rgba(240,237,232,0.65); text-decoration:none; font-size:0.95rem; font-weight:500; font-family:'DM Sans',sans-serif; background:transparent; border:none; width:100%; text-align:left; cursor:pointer; transition:all 0.15s; }
        .panel-row:hover { color:#f0ede8; background:rgba(240,237,232,0.03); }
        .panel-row.on { color:#c8ff00; font-weight:700; background:rgba(200,255,0,0.04); border-left:3px solid #c8ff00; padding-left:calc(1.5rem - 3px); }
        .panel-row:not(.on) { border-left:3px solid transparent; }

        /* Responsive show/hide */
        .desk-only { display:flex !important; }
        .mob-only  { display:none !important; }
        @media(max-width:768px) {
          .desk-only { display:none !important; }
          .mob-only  { display:flex !important; }
        }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.75rem', background:'rgba(8,8,8,0.96)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000 }}>

        {/* Logo */}
        <a href="/dashboard" style={{ textDecoration:'none', flexShrink:0 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
            Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
          </div>
        </a>

        {/* ── DESKTOP right side ───────────────────────────────────────── */}
        <div className="desk-only" style={{ alignItems:'center', gap:'1.75rem' }}>
          <a href="/jobs"       className={`nav-lnk${isActive('/jobs')       ? ' on' : ''}`}>Jobs</a>
          <a href="/companies"  className={`nav-lnk${isActive('/companies')  ? ' on' : ''}`}>Companies</a>
          <a href="/pricing"    className="upg-pill">Upgrade</a>

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} style={{ position:'relative' }}>
            <button className="av-btn" onClick={() => setDropdown(!dropdown)}>
              {avatarLetter}
            </button>
            {dropdown && (
              <div className="dd">
                {/* User info */}
                <div style={{ padding:'0.65rem 0.85rem 0.6rem', borderBottom:'1px solid rgba(240,237,232,0.07)', marginBottom:'0.35rem' }}>
                  <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#f0ede8', fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'rgba(240,237,232,0.35)', marginTop:'0.1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {email}
                  </div>
                  <div style={{ marginTop:'0.45rem', display:'inline-flex', alignItems:'center', gap:'0.3rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', borderRadius:100, padding:'0.15rem 0.55rem', fontSize:'0.62rem', color:'#c8ff00', fontWeight:700 }}>
                    Free plan
                  </div>
                </div>

                <a href="/dashboard"    className="dd-item">🏠 Dashboard</a>
                <a href="/profile/edit" className="dd-item">👤 Edit profile</a>

                <div className="dd-divider" />

                <button className="dd-item dd-danger" onClick={handleSignOut}>
                  🚪 Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE right side — hamburger only ───────────────────────── */}
        <button
          className={`hb-btn mob-only${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          style={{ display:'none' }}>
          <span className="hb-bar" />
          <span className="hb-bar" />
          <span className="hb-bar" />
        </button>
      </nav>

      {/* ── MOBILE PANEL — drops from top ───────────────────────────── */}
      {menuOpen && (
        <>
          {/* Overlay below panel — tap to close */}
          <div className="mob-overlay" onClick={() => setMenuOpen(false)} style={{ top:0 }} />

          <div className="mob-panel">

            {/* ── TOP BAR inside panel — logo + X button ─────────── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', height:64, flexShrink:0, borderBottom:'1px solid rgba(240,237,232,0.07)' }}>
              <a href="/dashboard" style={{ textDecoration:'none' }} onClick={() => setMenuOpen(false)}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
                  Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
                </div>
              </a>
              {/* X button — same position as hamburger */}
              <button onClick={() => setMenuOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:'0.4rem', display:'flex', flexDirection:'column', gap:5 }}>
                <span style={{ display:'block', width:22, height:2, background:'#f0ede8', borderRadius:2, transform:'rotate(45deg) translate(5px,5px)', transition:'all 0.28s ease' }} />
                <span style={{ display:'block', width:22, height:2, background:'#f0ede8', borderRadius:2, transform:'scaleX(0)', opacity:0, transition:'all 0.28s ease' }} />
                <span style={{ display:'block', width:22, height:2, background:'#f0ede8', borderRadius:2, transform:'rotate(-45deg) translate(5px,-5px)', transition:'all 0.28s ease' }} />
              </button>
            </div>

            {/* ── USER IDENTITY ───────────────────────────────────── */}
            <div style={{ padding:'1.5rem 1.5rem 1.25rem', borderBottom:'1px solid rgba(240,237,232,0.07)', flexShrink:0 }}>
              {/* Avatar */}
              <div style={{ width:52, height:52, borderRadius:'50%', background:'#c8ff00', color:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', marginBottom:'0.75rem' }}>
                {avatarLetter}
              </div>
              {/* Name */}
              <div style={{ fontSize:'0.95rem', fontWeight:700, color:'#f0ede8', fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'0.2rem' }}>
                {displayName}
              </div>
              {/* Email */}
              <div style={{ fontSize:'0.72rem', color:'rgba(240,237,232,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'0.65rem' }}>
                {email}
              </div>
              {/* Plan badge — under email */}
              <div style={{ display:'inline-flex', alignItems:'center', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.18)', borderRadius:100, padding:'0.22rem 0.75rem', fontSize:'0.65rem', color:'#c8ff00', fontWeight:700, letterSpacing:'0.04em' }}>
                Free plan
              </div>
            </div>

            {/* ── NAVIGATION ROWS ─────────────────────────────────── */}
            <div style={{ flex:1, paddingTop:'0.4rem' }}>
              {[
                { href:'/jobs',         label:'Jobs',         emoji:'💼' },
                { href:'/companies',    label:'Companies',    emoji:'🏢' },
                { href:'/dashboard',    label:'Dashboard',    emoji:'🏠' },
                { href:'/profile/edit', label:'Edit profile', emoji:'👤' },
              ].map(item => (
                <a key={item.href} href={item.href}
                  className={`panel-row${isActive(item.href) ? ' on' : ''}`}
                  onClick={() => setMenuOpen(false)}>
                  <span style={{ fontSize:'1.1rem', lineHeight:1, flexShrink:0 }}>{item.emoji}</span>
                  {item.label}
                </a>
              ))}
            </div>

            {/* ── CTAs ────────────────────────────────────────────── */}
            <div style={{ padding:'1.25rem 1.5rem', borderTop:'1px solid rgba(240,237,232,0.07)', display:'flex', flexDirection:'column', gap:'0.65rem', flexShrink:0 }}>
              {/* Upgrade — filled green */}
              <a href="/pricing" onClick={() => setMenuOpen(false)} style={{
                display:'block', textAlign:'center',
                background:'#c8ff00', color:'#080808',
                padding:'0.85rem', borderRadius:100,
                fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.9rem',
                textDecoration:'none', transition:'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#aee600'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#c8ff00'; }}
              >
                ⚡ Upgrade plan
              </a>
              {/* Sign out — red outlined */}
              <button onClick={handleSignOut} style={{
                background:'transparent',
                border:'1px solid rgba(255,77,0,0.4)',
                color:'rgba(255,77,0,0.8)',
                borderRadius:100, padding:'0.85rem',
                fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.9rem',
                cursor:'pointer', width:'100%', transition:'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,77,0,0.07)'; e.currentTarget.style.borderColor='rgba(255,77,0,0.7)'; e.currentTarget.style.color='#ff4d00'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,77,0,0.4)'; e.currentTarget.style.color='rgba(255,77,0,0.8)'; }}
              >
                Sign out
              </button>
            </div>

          </div>
        </>
      )}
    </>
  );
}