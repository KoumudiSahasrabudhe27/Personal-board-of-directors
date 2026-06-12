const STEPS = [
  { id: 'question', label: 'Question' },
  { id: 'deliberation', label: 'Board Deliberation' },
  { id: 'verdict', label: 'Final Verdict' }
];

const BoardProgress = ({ phase }) => {
  const activeIndex = phase === 'complete'
    ? STEPS.length
    : STEPS.findIndex((s) => s.id === phase);

  return (
    <nav className="board-progress" aria-label="Session progress">
      <ol className="board-progress__list">
        {STEPS.map((step, i) => {
          const isComplete = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li
              key={step.id}
              className={[
                'board-progress__step',
                isComplete && 'board-progress__step--complete',
                isActive && 'board-progress__step--active'
              ].filter(Boolean).join(' ')}
            >
              <span className="board-progress__marker" aria-hidden>
                {isComplete ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="board-progress__dot" />
                )}
              </span>
              <span className="board-progress__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BoardProgress;
