import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import { supabase } from '../supabase';

const PLANS = [
  {
    id:       'weekly',
    name:     'Weekly',
    price:    '£0.99',
    period:   'per week',
    perWeek:  '99p/week',
    saving:   null,
    highlight: false,
    features: [
      'Live job feed (20 jobs)',
      'Sponsor directory access',
      'Visa eligibility calculator',
      'Sponsrr Score',
      'Smart job alerts',
    ],
  },
  {
    id:       'monthly',
    name:     'Monthly',
    price:    '£3.49',
    period:   'per month',
    perWeek:  '87p/week',
    saving:   null,
    highlight: false,
    features: [
      'Everything in Weekly',
      'Full job feed — all listings',
      'Search, filter & sort jobs',
      'AI CV Builder',
      'Salary threshold checker',
      'Application tracker',
    ],
  },
  {
    id:       'quarterly',
    name:     'Quarterly',
    price:    '£9.99',
    period:   'per quarter',
    perWeek:  '77p/week',
    saving:   'Save 24%',
    highlight: true,
    features: [
      'Everything in Monthly',
      'Company deep dives',
      'CoS history & sponsor activity',
      'Priority job alerts',
      'Profile badge',
    ],
  },
  {
    id:       'annual',
    name:     'Annual',
    price:    '£34.99',
    period:   'per year',
    perWeek:  '67p/week',
    saving:   'Save 32%',
    highlight: false,
    features: [
      'Everything in Quarterly',
      '1-on-1 CV review',
      'Early access to new features',
      'Verified badge on profile',
    ],
  },
];

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldm50amF5eXZwemJwanB6d2xtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzQ1NjEsImV4cCI6MjA5MTUxMDU2MX0.TuFcFEnCU4wTLVqrESNKXFPdQlhMqnKNFRBTsQWoMts';

export default function Pricing() {
  const navigate  = useNavigate();
  const [user, setUser]               = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [error, setError]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: sub } = await supabase
          .from('subscriptions').select('plan,status')
          .eq('user_id', u.id).in('status', ['active','trialing'])
          .limit(1).single();
        if (sub) setCurrentPlan(sub.plan);
      }
      setAuthLoading(false);
    }
    checkAuth();
  }, []);

  async function handleSelectPlan(planId) {
    if (!user) { navigate('/login'); return; }
    if (currentPlan === planId) return;

    setLoadingPlan(planId);
    setError(null);

    try {
      // Get fresh session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        // Try refreshing
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!refreshed.session) {
          navigate('/login');
          return;
        }
      }

      const token = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token;

      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(
        'https://vevntjayyvpzbpjpzwlm.supabase.co/functions/v1/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan:      planId,
            userId:    user.id,
            userEmail: user.email,
            returnUrl: window.location.origin,
          }),
        }
      );

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data);
        setError(data.error || 'Could not create checkout session. Please try again.');
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setError('Something went wrong. Please try again.');
    }

    setLoadingPlan(null);
  }

  if (authLoading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.85rem' }}>Loading...</div>
    </div>
  );

  return (
    <Layout>
      <div style={{ background: '#080808', minHeight: '100vh' }}>
        <Navbar />

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          .plan-card { transition: border-color 0.2s, transform 0.2s; }
          .plan-card:hover { transform: translateY(-3px); }
          .plan-btn { transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s; }
          .plan-btn:hover:not(:disabled) { transform: translateY(-1px); }
          .check { color: #c8ff00; margin-right: 0.5rem; font-size: 0.75rem; }
        `}</style>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.75rem', color: '#c8ff00', fontWeight: 600, marginBottom: '1.25rem' }}>
              Simple pricing
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.04em', color: '#f0ede8', marginBottom: '0.75rem', lineHeight: 1.1 }}>
              The unfair advantage.<br />
              <span style={{ color: '#c8ff00' }}>Priced fairly.</span>
            </h1>
            <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.95rem' }}>
              Less than a bag of crisps a month. Cancel anytime.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)', borderRadius: 14, padding: '1rem 1.5rem', color: '#ff4d00', textAlign: 'center', marginBottom: '2rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Plans grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
            {PLANS.map(plan => {
              const isCurrentPlan = currentPlan === plan.id;
              const isLoading     = loadingPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className="plan-card"
                  style={{
                    background: plan.highlight ? 'rgba(200,255,0,0.05)' : '#111',
                    border: plan.highlight
                      ? '2px solid rgba(200,255,0,0.35)'
                      : isCurrentPlan
                        ? '1px solid rgba(200,255,0,0.2)'
                        : '1px solid rgba(240,237,232,0.08)',
                    borderRadius: 22,
                    padding: '1.75rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#c8ff00', color: '#080808', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 1rem', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                      Most popular ⭐
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(200,255,0,0.15)', color: '#c8ff00', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 1rem', borderRadius: '100px', border: '1px solid rgba(200,255,0,0.3)', whiteSpace: 'nowrap' }}>
                      Your current plan ✓
                    </div>
                  )}

                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#f0ede8', marginBottom: '0.25rem' }}>{plan.name}</div>

                  {plan.saving && (
                    <div style={{ display: 'inline-block', background: 'rgba(200,255,0,0.1)', color: '#c8ff00', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '100px', marginBottom: '0.75rem', width: 'fit-content' }}>
                      {plan.saving}
                    </div>
                  )}

                  <div style={{ marginBottom: '0.25rem', marginTop: plan.saving ? 0 : '0.75rem' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.2rem', color: '#c8ff00', letterSpacing: '-0.04em' }}>{plan.price}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(240,237,232,0.4)', marginLeft: '0.35rem' }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.3)', marginBottom: '1.5rem' }}>{plan.perWeek}</div>

                  <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
                        <span className="check">✓</span>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(240,237,232,0.6)', lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || !!loadingPlan}
                    className="plan-btn"
                    style={{
                      width: '100%',
                      background: isCurrentPlan ? 'rgba(200,255,0,0.06)' : plan.highlight ? '#c8ff00' : 'rgba(200,255,0,0.08)',
                      color: isCurrentPlan ? 'rgba(200,255,0,0.5)' : plan.highlight ? '#080808' : '#c8ff00',
                      border: isCurrentPlan ? '1px solid rgba(200,255,0,0.15)' : plan.highlight ? 'none' : '1px solid rgba(200,255,0,0.2)',
                      borderRadius: '100px',
                      padding: '0.85rem',
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isCurrentPlan || !!loadingPlan ? 'default' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? 'Loading...' : isCurrentPlan ? 'Current plan' : `Get ${plan.name} →`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.3)', marginBottom: '0.5rem' }}>
              All plans include a 7-day money back guarantee · Cancel anytime · Secure payment via Stripe
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.2)' }}>
              Prices shown in GBP. VAT may apply.
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
}