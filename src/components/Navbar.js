import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

// ── UNIVERSAL NAVBAR ──────────────────────────────────────────────────────────
// Two states:
//   Logged out — logo + Sign in + Get Started (landing page only uses this)
//   Logged in  — logo + nav links + Upgrade pill + avatar dropdown
//               Mobile: top bar (logo + avatar) + bottom tab bar
//
// Usage: <Navbar /> on every page. Auth state is detected automatically.
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const path       = location.pathname;

  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
    setProfile(data);
    setLoading(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); setDropdownOpen(false); }, [path]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  // Avatar — first letter of name or email
  const avatarLetter = profile?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || '?';

  // Active tab check
  function isActive(href) {
    if (href === '/dashboard') return path === '/dashboard';
    return path.startsWith(href);
  }

  // ── LOGGED OUT NAVBAR ─────────────────────────────────────────────────────
  if (!loading && !user) {
    return (
      <>
        <style>{`
          .nl-link { color:rgba(240,237,232,0.55); text-decoration:none; font-size:0.88rem; font-weight:500; transition:color 0.2s; }
          .nl-link:hover { color:#f0ede8; }
          .nl-cta { background:#c8ff00; color:#080808; text-decoration:none; padding:0.55rem 1.25rem; border-radius:100px; font-weight:700; font-size:0.85rem; transition:all 0.2s ease; display:inline-block; }
          .nl-cta:hover { background:#aee600; transform:translateY(-1px); box-shadow:0 6px 20px rgba(200,255,0,0.25); }
        `}</style>
        <nav style={{ position:'fixed', top:0, left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 2rem', background:'rgba(8,8,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000 }}>
          <a href="/" style={{ textDecoration:'none' }}>
            <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
              Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
            </div>
          </a>
          <div style={{ display:'flex', alignItems:'center', gap:'1.75rem' }}>
            <a href="/login" className="nl-link">Sign in</a>
            <a href="/login" className="nl-cta">Get Started</a>
          </div>
        </nav>
      </>
    );
  }

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <nav style={{ position:'fixed', top:0, left:0, right:0, height:65, background:'rgba(8,8,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000, display:'flex', alignItems:'center', padding:'0 2rem' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
      </nav>
    );
  }

  // ── NAV LINKS CONFIG ──────────────────────────────────────────────────────
  const navLinks = [
    { href:'/jobs',      label:'Jobs'      },
    { href:'/companies', label:'Companies' },
    { href:'/score',     label:'Score'     },
    { href:'/salary', label:'Salary' },
  ];

  // Bottom tab bar items (mobile only)
  const tabItems = [
    { href:'/dashboard', label:'Home',      icon:'⊞' },
    { href:'/jobs',      label:'Jobs',      icon:'💼' },
    { href:'/companies', label:'Sponsors',  icon:'🏢' },
    { href:'/score',     label:'Score',     icon:'🏆' },
  ];

  // ── LOGGED IN NAVBAR ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* Shared */
        .nav-link-auth { color:rgba(240,237,232,0.5); text-decoration:none; font-size:0.88rem; font-weight:500; transition:color 0.2s; position:relative; padding-bottom:2px; }
        .nav-link-auth:hover { color:#f0ede8; }
        .nav-link-auth.active { color:#c8ff00; font-weight:700; }
        .nav-link-auth.active::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:#c8ff00; border-radius:100px; }

        /* Upgrade pill */
        .upgrade-pill-nav { background:rgba(200,255,0,0.1); color:#c8ff00; border:1px solid rgba(200,255,0,0.25); padding:0.38rem 1rem; border-radius:100px; font-weight:700; font-size:0.8rem; text-decoration:none; transition:all 0.2s ease; white-space:nowrap; }
        .upgrade-pill-nav:hover { background:rgba(200,255,0,0.2); transform:translateY(-1px); }

        /* Avatar */
        .avatar-btn-nav { width:36px; height:36px; border-radius:50%; background:#c8ff00; color:#080808; border:none; cursor:pointer; font-family:'Syne',sans-serif; font-weight:800; font-size:0.88rem; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; }
        .avatar-btn-nav:hover { transform:scale(1.08); box-shadow:0 0 0 2px rgba(200,255,0,0.5); }

        /* Dropdown */
        .nav-dropdown { position:absolute; top:calc(100% + 10px); right:0; background:#111; border:1px solid rgba(240,237,232,0.1); border-radius:16px; padding:0.5rem; min-width:200px; box-shadow:0 16px 48px rgba(0,0,0,0.6); z-index:2000; }
        .nav-drop-item { display:flex; align-items:center; gap:0.65rem; padding:0.6rem 0.85rem; border-radius:10px; color:rgba(240,237,232,0.7); text-decoration:none; font-size:0.84rem; font-weight:500; font-family:inherit; background:none; border:none; width:100%; text-align:left; cursor:pointer; transition:all 0.15s; }
        .nav-drop-item:hover { background:rgba(240,237,232,0.06); color:#f0ede8; }
        .nav-drop-danger:hover { background:rgba(255,77,0,0.08); color:#ff4d00; }
        .nav-drop-divider { height:1px; background:rgba(240,237,232,0.07); margin:0.35rem 0; }

        /* Mobile hamburger top bar — visible < 768px */
        .mob-top-bar { display:none; }
        .desk-nav    { display:flex; }

        /* Bottom tab bar */
        .bottom-tab-bar { display:none; position:fixed; bottom:0; left:0; right:0; background:rgba(8,8,8,0.97); backdropFilter:blur(20px); borderTop:1px solid rgba(240,237,232,0.08); z-index:999; padding:0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom)); }
        .tab-item { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.2rem; text-decoration:none; padding:0.35rem 0; transition:all 0.15s; border:none; background:none; cursor:pointer; }
        .tab-icon { font-size:1.15rem; line-height:1; }
        .tab-label { font-size:0.58rem; font-weight:600; letter-spacing:0.03em; text-transform:uppercase; font-family:'DM Sans',sans-serif; }

        /* Mobile menu overlay */
        .mob-menu-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1998; backdrop-filter:blur(4px); }
        .mob-menu-panel { display:none; position:fixed; top:0; right:0; bottom:0; width:min(320px, 85vw); background:#111; border-left:1px solid rgba(240,237,232,0.1); z-index:1999; padding:2rem 1.5rem; flex-direction:column; gap:0; overflow-y:auto; }
        .mob-menu-link { display:flex; align-items:center; gap:0.75rem; color:rgba(240,237,232,0.7); text-decoration:none; font-size:1rem; font-weight:600; font-family:'Syne',sans-serif; padding:0.85rem 0; border-bottom:1px solid rgba(240,237,232,0.06); transition:color 0.2s; }
        .mob-menu-link:hover { color:#c8ff00; }
        .mob-menu-link.active { color:#c8ff00; }

        @media(max-width:768px) {
          .desk-nav     { display:none !important; }
          .mob-top-bar  { display:flex !important; }
          .bottom-tab-bar { display:flex !important; }
          .mob-menu-overlay { display:block; }
          .mob-menu-panel   { display:flex; }
        }
        @media(min-width:769px) {
          .mob-top-bar      { display:none !important; }
          .bottom-tab-bar   { display:none !important; }
          .mob-menu-overlay { display:none !important; }
          .mob-menu-panel   { display:none !important; }
        }
      `}</style>

      {/* ── DESKTOP NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:65, background:'rgba(8,8,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(240,237,232,0.08)', zIndex:1000 }}>

        {/* Logo */}
        <a href="/dashboard" style={{ textDecoration:'none', flexShrink:0 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.3rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
            Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
          </div>
        </a>

        {/* Desktop nav links */}
        <div className="desk-nav" style={{ alignItems:'center', gap:'1.75rem' }}>
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              className={`nav-link-auth${isActive(l.href) ? ' active' : ''}`}>
              {l.label}
            </a>
          ))}
          <a href="/pricing" className="upgrade-pill-nav">Upgrade</a>

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} style={{ position:'relative' }}>
            <button className="avatar-btn-nav" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {avatarLetter}
            </button>
            {dropdownOpen && (
              <div className="nav-dropdown">
                {/* User info */}
                <div style={{ padding:'0.6rem 0.85rem 0.5rem', borderBottom:'1px solid rgba(240,237,232,0.07)', marginBottom:'0.35rem' }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#f0ede8', fontFamily:'Syne, sans-serif' }}>
                    {profile?.full_name || user?.email?.split('@')[0] || 'Account'}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'rgba(240,237,232,0.35)', marginTop:'0.1rem' }}>
                    {user?.email}
                  </div>
                  <div style={{ marginTop:'0.4rem', display:'inline-flex', alignItems:'center', gap:'0.3rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', borderRadius:100, padding:'0.15rem 0.55rem', fontSize:'0.62rem', color:'#c8ff00', fontWeight:700 }}>
                    Free plan
                  </div>
                </div>

                <a href="/dashboard" className="nav-drop-item">🏠 Dashboard</a>
                <a href="/profile/edit" className="nav-drop-item">👤 Edit profile</a>
                <a href="/score" className="nav-drop-item">🏆 Sponsrr Score</a>
                <a href="/salary" className="nav-drop-item">💷 Salary Checker</a>

                <div className="nav-drop-divider" />

                <a href="/pricing" className="nav-drop-item" style={{ color:'#c8ff00', fontWeight:600 }}>⚡ Upgrade plan</a>

                <div className="nav-drop-divider" />

                <button className="nav-drop-item nav-drop-danger" onClick={handleSignOut}>
                  🚪 Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE TOP BAR (logo + avatar only) ──────────────────────── */}
        <div className="mob-top-bar" style={{ alignItems:'center', justifyContent:'space-between', width:'100%', display:'none' }}>
          {/* Logo already rendered above — this is just the avatar side */}
          <div ref={dropdownRef} style={{ position:'relative', marginLeft:'auto' }}>
            <button className="avatar-btn-nav" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {avatarLetter}
            </button>
            {dropdownOpen && (
              <div className="nav-dropdown">
                <div style={{ padding:'0.6rem 0.85rem 0.5rem', borderBottom:'1px solid rgba(240,237,232,0.07)', marginBottom:'0.35rem' }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#f0ede8', fontFamily:'Syne, sans-serif' }}>
                    {profile?.full_name || user?.email?.split('@')[0] || 'Account'}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'rgba(240,237,232,0.35)', marginTop:'0.1rem' }}>{user?.email}</div>
                  <div style={{ marginTop:'0.4rem', display:'inline-flex', alignItems:'center', gap:'0.3rem', background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.2)', borderRadius:100, padding:'0.15rem 0.55rem', fontSize:'0.62rem', color:'#c8ff00', fontWeight:700 }}>
                    Free plan
                  </div>
                </div>
                <a href="/dashboard"      className="nav-drop-item">🏠 Dashboard</a>
                <a href="/profile/edit"   className="nav-drop-item">👤 Edit profile</a>
                <a href="/score"          className="nav-drop-item">🏆 Sponsrr Score</a>
                <a href="/salary" className="nav-drop-item">💷 Salary Checker</a>
                <div className="nav-drop-divider" />
                <a href="/pricing" className="nav-drop-item" style={{ color:'#c8ff00', fontWeight:600 }}>⚡ Upgrade plan</a>
                <div className="nav-drop-divider" />
                <button className="nav-drop-item nav-drop-danger" onClick={handleSignOut}>🚪 Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM TAB BAR ─────────────────────────────────────────── */}
      <div className="bottom-tab-bar" style={{ display:'none' }}>
        {tabItems.map(t => {
          const active = isActive(t.href);
          return (
            <a key={t.href} href={t.href} className="tab-item" style={{ color: active ? '#c8ff00' : 'rgba(240,237,232,0.35)' }}>
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
              {active && <span style={{ width:4, height:4, borderRadius:'50%', background:'#c8ff00', marginTop:1 }} />}
            </a>
          );
        })}
      </div>

      {/* Spacer so content doesn't hide behind bottom tabs on mobile */}
      <div className="bottom-tab-bar" style={{ display:'none', position:'static', height:65, background:'transparent', border:'none', padding:0 }} />
    </>
  );
}