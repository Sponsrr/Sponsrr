import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.2rem 2.5rem',
      background: 'rgba(8,8,8,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(240,237,232,0.08)',
      zIndex: 100,
    }}>
      <Link to="/" style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '1.3rem',
        letterSpacing: '-0.04em',
        color: '#f0ede8',
        textDecoration: 'none',
      }}>
        Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/jobs" style={linkStyle}>Jobs</Link>
        <Link to="/companies" style={linkStyle}>Companies</Link>
        <Link to="/login" style={linkStyle}>Login</Link>
        <Link to="/signup" style={{
          background: '#c8ff00',
          color: '#080808',
          padding: '0.5rem 1.2rem',
          borderRadius: '100px',
          fontWeight: 700,
          fontSize: '0.85rem',
          textDecoration: 'none',
        }}>Get Started</Link>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: 'rgba(240,237,232,0.55)',
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: 500,
};

export default Navbar;