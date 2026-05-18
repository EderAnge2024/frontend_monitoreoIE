import React from 'react';

const PagePlaceholder = ({ title, description }) => (
  <div className="fade-in">
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{description}</p>
    </div>
    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p>Módulo en desarrollo para el rol correspondiente.</p>
    </div>
  </div>
);

export default PagePlaceholder;
