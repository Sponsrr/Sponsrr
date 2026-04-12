import React from 'react';

function JobCard({ company }) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(240,237,232,0.07)',
      borderRadius: '20px',
      padding: '1.8rem',
      transition: 'border-color 0.3s, transform 0.3s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(200,255,0,0.25)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(240,237,232,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Sector tag */}
      <div style={{
        display: 'inline-block',
        background: 'rgba(200,255,0,0.1)',
        color: '#c8ff00',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.22rem 0.65rem',
        borderRadius: '100px',
        marginBottom: '1rem',
      }}>
        {company.sector || 'Other'}
      </div>

      {/* Company name */}
      <h3 style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '1rem',
        color: '#f0ede8',
        letterSpacing: '-0.02em',
        marginBottom: '0.5rem',
        lineHeight: 1.3,
      }}>
        {company.name}
      </h3>

      {/* Location */}
      {company.location && (
        <p style={{
          fontSize: '0.82rem',
          color: 'rgba(240,237,232,0.4)',
          marginBottom: '1.2rem',
        }}>
          📍 {company.location}
        </p>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(240,237,232,0.07)',
        paddingTop: '1rem',
        marginTop: '0.5rem',
      }}>
        <span style={{
          fontSize: '0.72rem',
          color: 'rgba(240,237,232,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}>
          ✓ Licensed Sponsor
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: '#c8ff00',
          fontWeight: 600,
        }}>
          View →
        </span>
      </div>
    </div>
  );
}

export default JobCard;