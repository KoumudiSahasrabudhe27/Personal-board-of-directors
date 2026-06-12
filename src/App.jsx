import React, { useState } from 'react';
import personas from './agents/personas';
import QuestionInput from './components/QuestionInput';
import PersonaCard from './components/PersonaCard';
import ModeratorPanel from './components/ModeratorPanel';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function extractTextFromAnthropic(data) {
  if (data?.content?.[0]?.text) return data.content[0].text;
  return 'No response received.';
}

const App = () => {
  const [responses, setResponses] = useState({});
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [moderatorSummary, setModeratorSummary] = useState('');
  const [isLoadingModerator, setIsLoadingModerator] = useState(false);

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

  const rootStyle = {
    minHeight: '100vh',
    background: '#F8FAFC',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    background: '#0F172A',
    color: '#FFFFFF',
    padding: '28px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(12,18,30,0.12)'
  };

  const containerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 20px',
    maxWidth: 1100,
    margin: '0 auto',
    paddingBottom: 180
  };

  const gridStyle = {
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
  };

  const dividerStyle = {
    height: 1,
    background: 'rgba(15,23,42,0.06)',
    margin: '28px 0'
  };

  return (
    <div style={rootStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Personal Board of Directors</h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.82)', fontSize: 13 }}>6 advisors · 1 verdict</p>
      </header>

      <main style={containerStyle}>
        <section style={{ marginBottom: 24 }}>
          <QuestionInput onSubmit={handleSubmit} isLoading={isLoadingPersonas || isLoadingModerator} />
        </section>

        <section style={gridStyle} aria-live="polite">
          {personas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              isLoading={isLoadingPersonas}
              response={responses[p.id]}
            />
          ))}
        </section>

        <div style={dividerStyle} />

        <section>
          <ModeratorPanel isLoading={isLoadingModerator} summary={moderatorSummary} />
        </section>
      </main>
    </div>
  );
};

export default App;
