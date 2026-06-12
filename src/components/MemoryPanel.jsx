const MemoryPanel = ({ memories, isLoading }) => {
  if (!isLoading && (!memories || memories.length === 0)) return null;

  return (
    <section className="memory-panel" aria-labelledby="memory-heading">
      <div className="memory-panel__header">
        <p className="memory-panel__eyebrow">Foundry IQ</p>
        <h2 id="memory-heading" className="memory-panel__title">Past decisions referenced</h2>
      </div>

      {isLoading ? (
        <div className="memory-panel__skeleton skeleton" aria-label="Loading memory">
          <div className="skeleton__bar" style={{ width: '70%' }} />
          <div className="skeleton__bar" style={{ width: '55%' }} />
        </div>
      ) : (
        <ul className="memory-panel__list">
          {memories.map((m) => (
            <li key={m.id} className="memory-panel__item">
              <p className="memory-panel__question">{m.question}</p>
              <p className="memory-panel__verdict">{m.verdict}</p>
              {m.timestamp && (
                <time className="memory-panel__date" dateTime={m.timestamp}>
                  {new Date(m.timestamp).toLocaleDateString()}
                </time>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MemoryPanel;
