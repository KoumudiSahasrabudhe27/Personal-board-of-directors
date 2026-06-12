import { useState } from 'react';
import usePersonas from '../hooks/usePersonas';
import QuestionInput from '../components/QuestionInput';
import PersonaCard from '../components/PersonaCard';
import ModeratorPanel from '../components/ModeratorPanel';
import MemoryPanel from '../components/MemoryPanel';
import BoardProgress from '../components/BoardProgress';
import PageBackground from '../components/PageBackground';
import HomeLink from '../components/HomeLink';

const BoardSession = ({ onBack }) => {
  const { personas } = usePersonas();
  const [responses, setResponses] = useState({});
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [moderatorSummary, setModeratorSummary] = useState('');
  const [isLoadingModerator, setIsLoadingModerator] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [focusedId, setFocusedId] = useState(null);
  const [memoriesUsed, setMemoriesUsed] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (q) => {
    setResponses({});
    setModeratorSummary('');
    setMemoriesUsed([]);
    setError('');
    setLastQuestion(q);
    setFocusedId(null);
    setIsLoadingPersonas(true);

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Board request failed');

      setResponses(data.responses);
      setMemoriesUsed(data.memoriesUsed || []);
      setIsLoadingPersonas(false);
      setIsLoadingModerator(true);

      // Brief pause so verdict phase is visible in progress UI
      setModeratorSummary(data.verdict);
      setIsLoadingModerator(false);
    } catch (err) {
      setIsLoadingPersonas(false);
      setIsLoadingModerator(false);
      setError(err.message);
      console.error(err);
    }
  };

  const isLoading = isLoadingPersonas || isLoadingModerator;
  const hasSession = Boolean(lastQuestion);
  const respondedCount = Object.keys(responses).length;

  const phase = !hasSession
    ? 'question'
    : isLoadingPersonas
      ? 'deliberation'
      : isLoadingModerator
        ? 'verdict'
        : 'complete';

  return (
    <div className="session">
      <PageBackground />

      <header className="session-header">
        <div className="session-header__inner">
          <HomeLink onClick={onBack} variant="header" />

          <div className="session-header__center">
            <h1 className="session-header__title">Board Session</h1>
            <p className="session-header__subtitle">Live advisory counsel · Foundry IQ memory</p>
          </div>

          <div className="session-header__stats">
            <div className="session-header__stat">
              <span className="session-header__stat-value">{personas.length}</span>
              <span className="session-header__stat-label">Advisors</span>
            </div>
            {hasSession && (
              <div className="session-header__stat">
                <span className="session-header__stat-value">{respondedCount}/{personas.length}</span>
                <span className="session-header__stat-label">Responded</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="session-main">
        {!hasSession && (
          <div className="session-welcome">
            <h2 className="session-welcome__title">The board is assembled</h2>
            <p className="session-welcome__text">
              Present your decision below. Each advisor responds independently,
              grounded in past sessions via Foundry IQ, then the Moderator delivers
              a final recommendation.
            </p>
          </div>
        )}

        <BoardProgress phase={phase} />

        {error && (
          <div className="app-error" role="alert">
            {error}. Make sure the API server is running (<code>npm run dev</code>) and Foundry IQ is configured.
          </div>
        )}

        {lastQuestion && (
          <div className="app-question">
            <span className="app-question__label">Agenda item</span>
            <blockquote className="app-question__text">{lastQuestion}</blockquote>
            {focusedId && (
              <button
                type="button"
                className="app-question__clear-focus"
                onClick={() => setFocusedId(null)}
              >
                Show all advisors
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="app-status-bar" role="status">
            <span className="app-status-bar__pulse" aria-hidden />
            <span>
              {isLoadingPersonas
                ? `Retrieving Foundry IQ memory · collecting ${personas.length} perspectives`
                : 'Moderator synthesizing final recommendation'}
            </span>
          </div>
        )}

        <MemoryPanel memories={memoriesUsed} isLoading={isLoadingPersonas && hasSession} />

        <section className="persona-grid" aria-live="polite">
          {personas.map((p, i) => (
            <PersonaCard
              key={`${p.id}-${lastQuestion}`}
              persona={p}
              index={i}
              isLoading={isLoadingPersonas}
              response={responses[p.id]}
              isFocused={focusedId === null ? undefined : focusedId === p.id}
              onFocus={setFocusedId}
              onBlur={() => setFocusedId(null)}
            />
          ))}
        </section>

        {hasSession && <div className="section-divider" />}

        <ModeratorPanel isLoading={isLoadingModerator} summary={moderatorSummary} />
      </main>

      <QuestionInput onSubmit={handleSubmit} isLoading={isLoading} onHome={onBack} />
    </div>
  );
};

export default BoardSession;
