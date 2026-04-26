import React, { useState } from 'react';
import { supabase } from '../supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  // Signup state
  const [name, setName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverified(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('not confirmed')) {
        setUnverified(true);
      } else if (error.message.toLowerCase().includes('invalid login')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      window.location.href = '/welcome';
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password: signupPassword,
      options: { data: { full_name: name } }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSignupDone(true);
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
    setResendSent(true);
  }

  return (
    <div style={{ background:'#080808', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <style>{`
        .auth-input:focus { border-color: rgba(200,255,0,0.5) !important; outline: none; }
        .auth-btn:hover { background: #b8ef00 !important; }
        .switch-link { color: rgba(240,237,232,0.55); text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .switch-link:hover { color: #c8ff00; }
        .eye-btn { background: none; border: none; cursor: pointer; padding: 0; color: rgba(240,237,232,0.4); transition: color 0.2s; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); }
        .eye-btn:hover { color: #c8ff00; }
        .resend-btn { background: none; border: none; cursor: pointer; color: #c8ff00; font-size: 0.85rem; font-weight: 600; padding: 0; text-decoration: underline; }
        .resend-btn:hover { opacity: 0.8; }
      `}</style>

      {/* Logo */}
      <a href="/" style={{ textDecoration:'none', marginBottom:'2.5rem' }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.5rem', letterSpacing:'-0.04em', color:'#f0ede8' }}>
          Sponsrr<span style={{ color:'#c8ff00' }}>.</span>
        </div>
      </a>

      {/* Signup success -- check email */}
      {signupDone ? (
        <div style={{ background:'#111', border:'1px solid rgba(200,255,0,0.2)', borderRadius:24, padding:'2.5rem', width:'100%', maxWidth:420, textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📬</div>
          <h2 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#f0ede8', marginBottom:'0.75rem', letterSpacing:'-0.03em' }}>
            Check your email.
          </h2>
          <p style={{ fontSize:'0.9rem', color:'rgba(240,237,232,0.5)', lineHeight:1.65, marginBottom:'1.5rem' }}>
            We've sent a verification link to <strong style={{ color:'#c8ff00' }}>{email}</strong>. Click the link in the email to activate your account then come back to sign in.
          </p>
          <button onClick={() => { setSignupDone(false); setMode('login'); }} style={{ background:'#c8ff00', color:'#080808', border:'none', borderRadius:100, padding:'0.85rem 2rem', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', width:'100%' }}>
            Back to sign in →
          </button>
        </div>
      ) : (

      <div style={{ background:'#111', border:'1px solid rgba(240,237,232,0.07)', borderRadius:24, padding:'2.5rem', width:'100%', maxWidth:420 }}>

        {/* Tab switcher */}
        <div style={{ display:'flex', background:'rgba(240,237,232,0.05)', borderRadius:12, padding:'4px', marginBottom:'2rem' }}>
          {['login','signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setUnverified(false); }} style={{ flex:1, background: mode === m ? '#c8ff00' : 'transparent', color: mode === m ? '#080808' : 'rgba(240,237,232,0.5)', border:'none', borderRadius:10, padding:'0.6rem', fontWeight: mode === m ? 700 : 500, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' }}>
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <h1 style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.6rem', letterSpacing:'-0.04em', color:'#f0ede8', marginBottom:'0.4rem' }}>
          {mode === 'login' ? 'Welcome back.' : 'Join Sponsrr.'}
        </h1>
        <p style={{ fontSize:'0.88rem', color:'rgba(240,237,232,0.4)', marginBottom:'1.8rem' }}>
          {mode === 'login'
            ? 'Sign in to access your dashboard.'
            : 'Create your free account. No card required.'}
        </p>

        {/* Email not verified banner */}
        {unverified && (
          <div style={{ background:'rgba(200,255,0,0.06)', border:'1px solid rgba(200,255,0,0.15)', borderRadius:12, padding:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.88rem', color:'#c8ff00', fontWeight:600, marginBottom:'0.4rem' }}>
              📧 Please verify your email first.
            </div>
            <p style={{ fontSize:'0.82rem', color:'rgba(240,237,232,0.5)', lineHeight:1.6, margin:0 }}>
              Check your inbox for a verification email from Sponsrr. Click the link inside to activate your account.
            </p>
            {!resendSent ? (
              <div style={{ marginTop:'0.75rem' }}>
                <span style={{ fontSize:'0.82rem', color:'rgba(240,237,232,0.4)' }}>Didn't get it? </span>
                <button className="resend-btn" onClick={handleResend} disabled={resendLoading}>
                  {resendLoading ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            ) : (
              <div style={{ marginTop:'0.75rem', fontSize:'0.82rem', color:'#c8ff00' }}>
                ✓ Verification email resent. Check your inbox.
              </div>
            )}
          </div>
        )}

        {/* General error */}
        {error && (
          <div style={{ background:'rgba(255,77,0,0.08)', border:'1px solid rgba(255,77,0,0.2)', borderRadius:12, padding:'0.85rem 1rem', marginBottom:'1.5rem', fontSize:'0.85rem', color:'#ff4d00' }}>
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="auth-input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, paddingRight:'3rem' }} />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading} style={{ background:'#c8ff00', color:'#080808', border:'none', borderRadius:100, padding:'0.95rem', fontWeight:700, fontSize:'0.95rem', cursor: loading ? 'default' : 'pointer', marginTop:'0.5rem', transition:'background 0.2s', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input className="auth-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input className="auth-input" type={showSignupPassword ? 'text' : 'password'} value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} style={{ ...inputStyle, paddingRight:'3rem' }} />
                <button type="button" className="eye-btn" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                  {showSignupPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading} style={{ background:'#c8ff00', color:'#080808', border:'none', borderRadius:100, padding:'0.95rem', fontWeight:700, fontSize:'0.95rem', cursor: loading ? 'default' : 'pointer', marginTop:'0.5rem', transition:'background 0.2s', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>

            <p style={{ fontSize:'0.75rem', color:'rgba(240,237,232,0.25)', textAlign:'center', lineHeight:1.5 }}>
              By creating an account you agree to our Terms and Privacy Policy.
            </p>
          </form>
        )}

      </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize:'0.78rem',
  fontWeight:600,
  color:'rgba(240,237,232,0.5)',
  letterSpacing:'0.05em',
  textTransform:'uppercase',
  display:'block',
  marginBottom:'0.5rem',
};

const inputStyle = {
  width:'100%',
  background:'rgba(240,237,232,0.05)',
  border:'1px solid rgba(240,237,232,0.1)',
  borderRadius:12,
  padding:'0.85rem 1rem',
  color:'#f0ede8',
  fontSize:'0.95rem',
  boxSizing:'border-box',
  transition:'border-color 0.2s',
};

export default Login;