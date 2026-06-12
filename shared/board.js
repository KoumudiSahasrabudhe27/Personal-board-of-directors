import personas, { MODERATOR_PROMPT } from './personas.js';
import { callLLM } from './llm.js';
import { searchMemory, formatMemoryContext, saveDecision } from './foundryIq.js';

export async function askPersona(personaId, question, memoryContext = '') {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) throw new Error(`Unknown persona: ${personaId}`);

  const userMessage = memoryContext
    ? `${memoryContext}\n\nCurrent decision the user is facing:\n${question}`
    : question;

  const text = await callLLM(persona.systemPrompt, userMessage);
  return { personaId, name: persona.name, text };
}

export async function moderateBoard(question, responses, memoryContext = '') {
  const combined = personas
    .map((p) => `--- ${p.name} (${p.title}):\n${responses[p.id] || ''}`)
    .join('\n\n');

  const userMessage = memoryContext
    ? `${memoryContext}\n\nUser question: ${question}\n\nAdvisor responses:\n${combined}`
    : `User question: ${question}\n\nAdvisor responses:\n${combined}`;

  return callLLM(MODERATOR_PROMPT, userMessage);
}

export async function runBoard(question) {
  const memories = await searchMemory(question, 3);
  const memoryContext = formatMemoryContext(memories);

  const results = await Promise.all(
    personas.map(async (p) => {
      try {
        return await askPersona(p.id, question, memoryContext);
      } catch (err) {
        return { personaId: p.id, name: p.name, text: `Error: ${err.message}` };
      }
    })
  );

  const responses = results.reduce((acc, r) => {
    acc[r.personaId] = r.text;
    return acc;
  }, {});

  const verdict = await moderateBoard(question, responses, memoryContext);
  const saved = await saveDecision({ question, responses, verdict });

  return {
    question,
    responses,
    verdict,
    memoriesUsed: memories,
    savedDecisionId: saved.id,
    memorySaved: saved.saved
  };
}
