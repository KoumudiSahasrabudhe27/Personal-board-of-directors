import { useState } from 'react';

const PersonaCard = ({
  persona,
  response,
  isLoading,
  index = 0,
  isFocused,
  onFocus,
  onBlur
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasResponse = Boolean(response);
  const isLong = response && response.length > 220;

  const status = isLoading && !response ? 'deliberating' : hasResponse ? 'responded' : 'idle';

  const handleCardClick = (e) => {
    if (e.target.closest('.persona-card__copy')) return;
    onFocus?.(persona.id);
    if (hasResponse && isLong) setExpanded((v) => !v);
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const cardClass = [
    'persona-card',
    `persona-card--${persona.id}`,
    hasResponse && 'persona-card--has-response',
    expanded && 'persona-card--expanded',
    isFocused && 'persona-card--focused',
    !isFocused && isFocused !== undefined && 'persona-card--dimmed'
  ].filter(Boolean).join(' ');

  const bubbleClass = [
    'persona-card__body',
    hasResponse && 'persona-card__body--visible',
    hasResponse && isLong && !expanded && 'persona-card__body--collapsed'
  ].filter(Boolean).join(' ');

  return (
    <article
      className={cardClass}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
        if (e.key === 'Escape') onBlur?.();
      }}
      tabIndex={0}
      aria-label={`${persona.name}, ${persona.title}`}
      aria-expanded={hasResponse && isLong ? expanded : undefined}
    >
      <div className="persona-card__accent" aria-hidden />

      <header className="persona-card__header">
        <div className="persona-card__avatar" aria-hidden>
          {persona.initials}
        </div>

        <div className="persona-card__meta">
          <div className="persona-card__name-row">
            <h3 className="persona-card__name">{persona.name}</h3>
            <span className={`persona-card__status persona-card__status--${status}`}>
              {status === 'deliberating' && 'Deliberating'}
              {status === 'responded' && 'Responded'}
              {status === 'idle' && 'Standby'}
            </span>
          </div>
          <p className="persona-card__title">{persona.title}</p>
        </div>

        {hasResponse && (
          <button
            type="button"
            className={`persona-card__copy${copied ? ' persona-card__copy--done' : ''}`}
            onClick={handleCopy}
            aria-label={`Copy ${persona.name}'s response`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </header>

      <div
        className={bubbleClass}
        style={hasResponse ? { animationDelay: `${80 + index * 60}ms` } : undefined}
      >
        {isLoading && !response ? (
          <div className="skeleton" aria-label="Loading response">
            <div className="skeleton__bar" style={{ width: '88%' }} />
            <div className="skeleton__bar" style={{ width: '74%' }} />
            <div className="skeleton__bar" style={{ width: '60%' }} />
          </div>
        ) : response ? (
          <p className="persona-card__text">{response}</p>
        ) : (
          <p className="persona-card__empty">Awaiting session start</p>
        )}
      </div>

      {hasResponse && isLong && (
        <button
          type="button"
          className={`persona-card__toggle${expanded ? ' persona-card__toggle--open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Show less' : 'Read full response'}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </article>
  );
};

export default PersonaCard;
