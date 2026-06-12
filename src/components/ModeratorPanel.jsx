import React from 'react';

const ModeratorPanel = ({ summary, isLoading }) => {
  if (!isLoading && !summary) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '18px auto', padding: '0 20px' }}>
      <div style={{ color: '#C4B5FF', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Board's Verdict</div>

      {isLoading ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 6px 18px rgba(12,18,30,0.06)' }}>
          <div style={{ height: 12, background: '#F1F5F9', borderRadius: 6, width: '40%', marginBottom: 10 }} />
          <div style={{ height: 12, background: '#F1F5F9', borderRadius: 6, width: '92%', marginBottom: 10 }} />
          <div style={{ height: 12, background: '#F1F5F9', borderRadius: 6, width: '76%', marginBottom: 10 }} />
        </div>
      ) : (
        <div style={{ background: '#3C3489', color: '#FFFFFF', padding: '18px 20px', borderRadius: 14, boxShadow: '0 10px 30px rgba(60,48,137,0.18)', fontSize: 15, lineHeight: 1.6 }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
        </div>
      )}
    </div>
  );
};

export default ModeratorPanel;