import { useState } from 'react';

const ModeratorPanel = ({ summary, isLoading }) => {
  const [copied, setCopied] = useState(false);

  if (!isLoading && !summary) return null;

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="verdict" aria-labelledby="verdict-heading">
      <div className="verdict__header">
        <div>
          <p className="verdict__eyebrow">Moderator synthesis</p>
          <h2 id="verdict-heading" className="verdict__title">Board Verdict</h2>
        </div>
        {!isLoading && summary && (
          <button
            type="button"
            className={`verdict__copy-btn${copied ? ' verdict__copy-btn--copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? 'Copied to clipboard' : 'Copy verdict'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="verdict__skeleton" aria-label="Loading verdict">
          <div className="skeleton">
            <div className="skeleton__bar" style={{ width: '35%' }} />
            <div className="skeleton__bar" style={{ width: '95%' }} />
            <div className="skeleton__bar" style={{ width: '82%' }} />
            <div className="skeleton__bar" style={{ width: '68%' }} />
          </div>
        </div>
      ) : (
        <div className="verdict__body">
          <p className="verdict__text">{summary}</p>
        </div>
      )}
    </section>
  );
};

export default ModeratorPanel;
