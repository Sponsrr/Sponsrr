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
    <div style={{
      background: '#080808',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          color: '#f0ede8',
          fontSize: '4rem',
          fontWeight: '800',
          letterSpacing: '-0.04em'
        }}>
          Sponsrr<span style={{ color: '#c8ff00' }}>.</span>
        </h1>
        <p style={{ color: 'rgba(240,237,232,0.5)', fontSize: '1.1rem', marginTop: '1rem' }}>
          Skip the Noise. Find your Sponsrr.
        </p>
        <a href="/jobs" style={{
          display: 'inline-block',
          marginTop: '2rem',
          background: '#c8ff00',
          color: '#080808',
          padding: '0.9rem 2rem',
          borderRadius: '100px',
          fontWeight: 700,
          fontSize: '0.95rem',
          textDecoration: 'none',
        }}>
          Find my Sponsrr →
        </a>
      </div>
    </div>
  );
}

export default App;