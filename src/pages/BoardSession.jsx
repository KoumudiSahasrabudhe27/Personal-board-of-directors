import { useState } from 'react';
import personas from '../agents/personas';
import QuestionInput from '../components/QuestionInput';
import PersonaCard from '../components/PersonaCard';
import ModeratorPanel from '../components/ModeratorPanel';
import BoardProgress from '../components/BoardProgress';
import PageBackground from '../components/PageBackground';
import HomeLink from '../components/HomeLink';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function extractTextFromAnthropic(data) {
  if (data?.content?.[0]?.text) return data.content[0].text;
  return 'No response received.';
}

const BoardSession = ({ onBack }) => {
  const [responses, setResponses] = useState({});
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [moderatorSummary, setModeratorSummary] = useState('');
  const [isLoadingModerator, setIsLoadingModerator] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [focusedId, setFocusedId] = useState(null);

  const anthKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const callAnthropic = async (systemPrompt, userMessage) => {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 300
      })
    });
    const data = await res.json();
    return extractTextFromAnthropic(data).trim();
  };

  const handleSubmit = async (q) => {
    setResponses({});
    setModeratorSummary('');
    setLastQuestion(q);
    setFocusedId(null);
    setIsLoadingPersonas(true);

    if (!anthKey) {
      setIsLoadingPersonas(false);
      alert('Missing Anthropic API key. Set VITE_ANTHROPIC_API_KEY in your .env file.');
      return;
    }

    try {
      const results = await Promise.all(
        personas.map(async (p) => {
          try {
            const text = await callAnthropic(p.systemPrompt, q);
            return { id: p.id, text };
          } catch (err) {
            return { id: p.id, text: `Error: ${err.message}` };
          }
        })
      );

      const newResponses = results.reduce((acc, r) => {
        acc[r.id] = r.text;
        return acc;
      }, {});

      setResponses(newResponses);
      setIsLoadingPersonas(false);
      setIsLoadingModerator(true);

      const combined = personas
        .map((p) => `--- ${p.name} (${p.title}):\n${newResponses[p.id] || ''}`)
        .join('\n\n');

      const modText = await callAnthropic(
        'You are the Moderator. Synthesize the six advisors responses into one clear recommendation in 3-4 sentences. Summarize trade-offs and give one clear next step.',
        `User question: ${q}\n\nAdvisor responses:\n${combined}`
      );

      setModeratorSummary(modText);
      setIsLoadingModerator(false);
    } catch (err) {
      setIsLoadingPersonas(false);
      setIsLoadingModerator(false);
      console.error(err);
      alert('An unexpected error occurred. See console for details.');
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
            <p className="session-header__subtitle">Live advisory counsel</p>
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
              Present your decision below. Each advisor will respond independently,
              then the Moderator will deliver a final recommendation.
            </p>
          </div>
        )}

        <BoardProgress phase={phase} />

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
                ? `Board in session — collecting ${personas.length} independent perspectives`
                : 'Moderator synthesizing final recommendation'}
            </span>
          </div>
        )}

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
