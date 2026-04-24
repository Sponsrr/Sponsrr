import React, { useState, useEffect, useRef } from 'react';
import { SOC_DATABASE } from './socData';

function fmt(n) {
  if (!n && n !== 0) return null;
  return `£${Number(n).toLocaleString('en-GB')}`;
}

function getTierStyle(tier) {
  if (tier === 'higher')     return { label: 'Higher Skilled', short: 'Higher',     color: '#c8ff00', bg: 'rgba(200,255,0,0.1)',  border: 'rgba(200,255,0,0.25)'  };
  if (tier === 'medium')     return { label: 'Medium Skilled', short: 'Medium',     color: '#ffc800', bg: 'rgba(255,200,0,0.1)',  border: 'rgba(255,200,0,0.25)'  };
  if (tier === 'ineligible') return { label: 'Not Eligible',   short: 'Ineligible', color: '#ff4d00', bg: 'rgba(255,77,0,0.08)', border: 'rgba(255,77,0,0.2)'   };
  return { label: 'Unknown', short: '?', color: 'rgba(240,237,232,0.4)', bg: 'transparent', border: 'rgba(240,237,232,0.1)' };
}

// ── DETAIL POPUP ──────────────────────────────────────────────────────────────
function SocDetailPopup({ soc, onClose, onSelect }) {
  const t = getTierStyle(soc.tier);
  const canSelect = soc.tier !== 'ineligible';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 4000, backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#141414', border: `1px solid ${t.border}`,
        borderRadius: 22, padding: '1.75rem',
        zIndex: 4001, width: 'calc(100% - 2rem)', maxWidth: 500,
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: t.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
              SOC {soc.code}
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: '#f0ede8', marginTop: '0.35rem', lineHeight: 1.35 }}>
              {soc.title}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.25rem' }}>{soc.sector}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(240,237,232,0.07)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: 'rgba(240,237,232,0.5)', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: t.color, marginBottom: '0.3rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.label}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.55 }}>
            {soc.tier === 'higher'     && 'RQF Level 6+ — Fully eligible for the Skilled Worker visa. Standard and lower going rates apply.'}
            {soc.tier === 'medium'     && 'RQF Level 3–5 — Restricted from July 2025. Not eligible for new applications. Existing holders may extend in the same occupation only.'}
            {soc.tier === 'ineligible' && 'This occupation is not on the Home Office Skilled Worker eligible list. Sponsorship is not possible for this role.'}
          </div>
        </div>

        {(soc.rate || soc.lowerRate) && (
          <div style={{ marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.3)', marginBottom: '0.6rem' }}>Going rates (37.5hr week)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '0.8rem 0.9rem' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(200,255,0,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Standard rate</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#c8ff00' }}>{fmt(soc.rate) || '—'}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(240,237,232,0.3)', marginTop: '0.2rem' }}>CoS from April 2024</div>
              </div>
              <div style={{ background: 'rgba(240,237,232,0.03)', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 12, padding: '0.8rem 0.9rem' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(240,237,232,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Lower rate</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'rgba(240,237,232,0.65)' }}>{fmt(soc.lowerRate) || '—'}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(240,237,232,0.3)', marginTop: '0.2rem' }}>Pre-April 2024 / H&C</div>
              </div>
            </div>
            {soc.sector === 'Healthcare & Medical' && !soc.rate && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.68rem', color: 'rgba(200,255,0,0.6)', background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.12)', borderRadius: 10, padding: '0.55rem 0.85rem' }}>
                ℹ NHS and education roles use national pay scales set by independent bodies, not the standard going rate table.
              </div>
            )}
          </div>
        )}

        {soc.relatedTitles && soc.relatedTitles.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.3)', marginBottom: '0.6rem' }}>Related job titles</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {soc.relatedTitles.map(title => (
                <span key={title} style={{ background: 'rgba(240,237,232,0.05)', border: '1px solid rgba(240,237,232,0.1)', borderRadius: 100, padding: '0.2rem 0.6rem', fontSize: '0.68rem', color: 'rgba(240,237,232,0.5)' }}>
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: '0.62rem', color: 'rgba(240,237,232,0.2)', marginBottom: '1.1rem' }}>
          Source: GOV.UK Skilled Worker visa eligible occupations · July 2025
        </div>

        {canSelect ? (
          <button onClick={() => { onSelect(soc); onClose(); }}
            style={{ width: '100%', background: '#c8ff00', color: '#080808', border: 'none', borderRadius: 100, padding: '0.85rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            Use SOC {soc.code} for my calculation →
          </button>
        ) : (
          <div style={{ background: 'rgba(255,77,0,0.06)', border: '1px solid rgba(255,77,0,0.15)', borderRadius: 12, padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,77,0,0.8)' }}>
            This occupation is not eligible for UK visa sponsorship
          </div>
        )}
      </div>
    </>
  );
}

// ── MAIN MODAL ────────────────────────────────────────────────────────────────
export default function SocGuideModal({ onClose, onSelect }) {
  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState('all');
  const [results, setResults]   = useState([]);
  const [expanded, setExpanded] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  useEffect(() => {
    let list = [...SOC_DATABASE];
    if (filter !== 'all') list = list.filter(s => s.tier === filter);
    if (query.trim().length >= 1) {
      const q = query.toLowerCase().trim();
      list = list.filter(s =>
        s.code.includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        (s.relatedTitles && s.relatedTitles.some(t => t.toLowerCase().includes(q)))
      );
    }
    setResults(list);
  }, [query, filter]);

  const counts = {
    all:        SOC_DATABASE.length,
    higher:     SOC_DATABASE.filter(s => s.tier === 'higher').length,
    medium:     SOC_DATABASE.filter(s => s.tier === 'medium').length,
    ineligible: SOC_DATABASE.filter(s => s.tier === 'ineligible').length,
  };

  const filterTabs = [
    { value: 'all',        label: 'All codes',      count: counts.all        },
    { value: 'higher',     label: '✓ Eligible',     count: counts.higher     },
    { value: 'medium',     label: '⚡ Restricted',  count: counts.medium     },
    { value: 'ineligible', label: '✗ Not eligible', count: counts.ineligible },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 3000, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#141414',
        border: '1px solid rgba(200,255,0,0.2)',
        borderRadius: '24px 24px 0 0',
        zIndex: 3001,
        maxWidth: 620, margin: '0 auto',
        height: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <style>{`
          .soc-pills { display:flex; gap:0.35rem; overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; padding-bottom:2px; }
          .soc-pills::-webkit-scrollbar { display:none; }
          .soc-legend { display:flex; gap:1rem; overflow-x:auto; scrollbar-width:none; padding-bottom:1px; }
          .soc-legend::-webkit-scrollbar { display:none; }
          .soc-row { display:flex; align-items:stretch; border-radius:12px; cursor:pointer; width:100%; background:rgba(240,237,232,0.03); border:1px solid rgba(240,237,232,0.07); margin-bottom:0.3rem; overflow:hidden; outline:none; }
          .soc-row:hover { background:rgba(240,237,232,0.06); border-color:rgba(240,237,232,0.13); }
          .soc-row:active { background:rgba(240,237,232,0.08); }
        `}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(240,237,232,0.15)', borderRadius: 2, margin: '1rem auto 0', flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: '0.85rem 1.25rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#f0ede8' }}>SOC Code Guide</div>
              <div style={{ fontSize: '0.67rem', color: 'rgba(240,237,232,0.4)', marginTop: '0.15rem' }}>
                {results.length} of {counts.all} · Tap any row for going rates & details
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(240,237,232,0.07)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: 'rgba(240,237,232,0.5)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* Search */}
          <input ref={searchRef} type="text"
            placeholder="Search job title, SOC code or keyword..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ background: 'rgba(240,237,232,0.07)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 10, padding: '0.65rem 1rem', color: '#f0ede8', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', width: '100%', marginBottom: '0.7rem' }} />

          {/* Filter pills — swipeable single line */}
          <div className="soc-pills" style={{ marginBottom: '0.65rem' }}>
            {filterTabs.map(f => (
              <button key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  flexShrink: 0, borderRadius: 100,
                  padding: '0.28rem 0.75rem',
                  fontSize: '0.67rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: filter === f.value ? 'rgba(200,255,0,0.12)' : 'rgba(240,237,232,0.05)',
                  border: `1px solid ${filter === f.value ? 'rgba(200,255,0,0.3)' : 'rgba(240,237,232,0.1)'}`,
                  color: filter === f.value ? '#c8ff00' : 'rgba(240,237,232,0.5)',
                  transition: 'all 0.15s',
                }}>
                {f.label}
                <span style={{
                  background: filter === f.value ? 'rgba(200,255,0,0.18)' : 'rgba(240,237,232,0.08)',
                  borderRadius: 100, padding: '0.03rem 0.42rem',
                  fontSize: '0.6rem',
                  color: filter === f.value ? '#c8ff00' : 'rgba(240,237,232,0.3)',
                }}>
                  {filter === f.value ? results.length : counts[f.value]}
                </span>
              </button>
            ))}
          </div>

          {/* Legend — compact single horizontal line, no wrap */}
          <div className="soc-legend" style={{ marginBottom: '0.7rem' }}>
            {[
              { color: '#c8ff00', label: 'Higher Skilled' },
              { color: '#ffc800', label: 'Medium Skilled' },
              { color: '#ff4d00', label: 'Not Eligible'   },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.63rem', color: 'rgba(240,237,232,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable list — no limit */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 1.25rem 2rem' }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.82rem' }}>No occupations found. Try a different keyword.</div>
            </div>
          ) : (
            results.map(soc => {
              const t = getTierStyle(soc.tier);
              return (
                <button key={soc.code} className="soc-row" onClick={() => setExpanded(soc)}>

                  {/* SOC code — coloured by tier, DM Sans bold, vertical divider */}
                  <div style={{
                    flexShrink: 0, width: 64,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRight: '1px solid rgba(240,237,232,0.07)',
                    padding: '0.7rem 0',
                  }}>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: t.color,
                      letterSpacing: '0.02em',
                    }}>
                      {soc.code}
                    </span>
                  </div>

                  {/* Title + sector + rate */}
                  <div style={{ flex: 1, minWidth: 0, padding: '0.7rem 0.6rem', textAlign: 'left' }}>
                    <div style={{
                      fontSize: '0.78rem', fontWeight: 600,
                      color: soc.tier === 'ineligible' ? 'rgba(240,237,232,0.38)' : '#f0ede8',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.3, marginBottom: '0.12rem',
                    }}>
                      {soc.title}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(240,237,232,0.28)', display: 'flex', gap: '0.3rem', overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{soc.sector}</span>
                      {soc.rate && <span style={{ color: 'rgba(200,255,0,0.4)', flexShrink: 0 }}>· {fmt(soc.rate)}/yr</span>}
                    </div>
                  </div>

                  {/* Tier badge + arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.7rem 0.65rem 0.7rem 0', flexShrink: 0 }}>
                    <span style={{
                      background: t.bg, border: `1px solid ${t.border}`,
                      borderRadius: 100, padding: '0.16rem 0.48rem',
                      fontSize: '0.57rem', fontWeight: 700, color: t.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {t.short}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: t.color, opacity: 0.45 }}>›</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.6rem 1.25rem', borderTop: '1px solid rgba(240,237,232,0.06)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.6rem', color: 'rgba(240,237,232,0.2)', textAlign: 'center' }}>
            All {counts.all} SOC codes · GOV.UK · July 2025 · Tap any row for full details
          </div>
        </div>
      </div>

      {expanded && (
        <SocDetailPopup
          soc={expanded}
          onClose={() => setExpanded(null)}
          onSelect={soc => { onSelect(soc); onClose(); }}
        />
      )}
    </>
  );
}