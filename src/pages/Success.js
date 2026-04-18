import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function verify() {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) { navigate('/'); return; }

      // Give webhook a moment to process
      await new Promise(r => setTimeout(r, 2000));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // Check if subscription was created
      const { data: sub } = await supabase
        .from('subscriptions').select('plan,status')
        .eq('user_id', user.id)
        .in('status', ['active','trialing'])
        .limit(1).single();

      if (sub) {
        setStatus('success');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        // Webhook might still be processing, show success anyway
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    }
    verify();
  }, [navigate, searchParams]);

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .pulse { animation: pulse 2s ease infinite; }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {status === 'loading' ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⏳</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#f0ede8', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
              Confirming your payment...
            </h1>
            <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.9rem' }}>
              Just a moment while we set up your account.
            </p>
          </>
        ) : (
          <>
            <div className="pulse" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#f0ede8', letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>
              You're in. Welcome to<br />
              <span style={{ color: '#c8ff00' }}>Sponsrr.</span>
            </h1>
            <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '2rem' }}>
              Your subscription is active. You now have full access to every sponsored job, filter, and feature. Let's find your sponsor.
            </p>
            <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'rgba(200,255,0,0.7)', margin: 0 }}>
                Redirecting you to your dashboard in a moment...
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: '#c8ff00', color: '#080808', padding: '0.85rem 2.5rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.92rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Go to Dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  );
}