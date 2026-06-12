import React, { useState, useRef } from 'react';

const QuestionInput = ({ onSubmit, isLoading = false }) => {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (typeof onSubmit === 'function') onSubmit(trimmed);
    setQuestion('');
    setTimeout(() => textareaRef.current?.focus(), 20);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && question.trim()) handleSubmit();
    }
  };

  const outer = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    background: '#F8FAFC',
    padding: '18px 20px',
    boxShadow: '0 -6px 24px rgba(12,18,30,0.06)'
  };

  const inner = {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end'
  };

  const textareaStyle = {
    flex: 1,
    minHeight: 56,
    maxHeight: 220,
    borderRadius: 12,
    border: '1px solid rgba(15,23,42,0.06)',
    padding: '12px 14px',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical'
  };

  const buttonStyle = {
    background: isLoading ? '#A78BFA' : '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 16px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    boxShadow: '0 6px 18px rgba(79,70,229,0.12)'
  };

  return (
    <div style={outer}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={inner}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What decision are you facing today?"
          disabled={isLoading}
          style={textareaStyle}
          aria-label="Ask the board"
        />

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isLoading || question.trim() === ''}
          style={buttonStyle}
        >
          {isLoading ? 'Thinking...' : 'Ask the Board'}
        </button>
      </form>
    </div>
  );
};

export default QuestionInput;