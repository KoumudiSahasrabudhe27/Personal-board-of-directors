import React, { useEffect, useState } from 'react';

const avatarStyles = {
  ceo: { background: '#CECBF6', color: '#3C3489' },
  investor: { background: '#C0DD97', color: '#27500A' },
  engineer: { background: '#B5D4F4', color: '#0C447C' },
  psychologist: { background: '#F4C0D1', color: '#72243E' },
  mentor: { background: '#FAC775', color: '#633806' },
  friend: { background: '#F5C4B3', color: '#712B13' }
};

const PersonaCard = ({ persona, response, isLoading }) => {
  const style = avatarStyles[persona.id] || { background: '#D3D1C7', color: '#444441' };
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (response) {
      // small delay so fade-in feels natural
      const t = setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [response]);

  const container = {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 8
  };

  const avatar = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: style.background,
    color: style.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(12,18,30,0.06)'
  };

  const label = {
    fontSize: 12,
    color: '#475569',
    margin: '0 0 8px'
  };

  const bubble = {
    background: '#FFFFFF',
    border: '1px solid rgba(15,23,42,0.06)',
    borderRadius: '0 18px 18px 18px', // sharp top-left
    padding: '12px 14px',
    boxShadow: '0 6px 18px rgba(12,18,30,0.04)',
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 1.6,
    transition: 'opacity 260ms ease, transform 260ms ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(6px)'
  };

  const skeletonBar = (w) => ({ height: 10, background: '#F1F5F9', borderRadius: 6, width: w, marginBottom: 8 });

  return (
    <div style={container}>
      <div style={avatar} aria-hidden>
        {persona.name.charAt(0)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={label}>{persona.name} · {persona.title}</div>

        <div style={bubble}>
          {isLoading && !response ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={skeletonBar('86%')} />
              <div style={skeletonBar('72%')} />
              <div style={skeletonBar('58%')} />
            </div>
          ) : response ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{response}</div>
          ) : (
            <div style={{ color: '#94A3B8', fontSize: 13 }}>Awaiting question…</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonaCard;