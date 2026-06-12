import { randomUUID } from 'node:crypto';
import { AzureKeyCredential } from '@azure/core-auth';
import { DefaultAzureCredential } from '@azure/identity';
import { SearchClient } from '@azure/search-documents';
import { KnowledgeRetrievalClient } from '@azure/search-documents';

const INDEX_NAME = process.env.BOARD_INDEX_NAME || 'board-decisions';
const KB_NAME = process.env.KNOWLEDGE_BASE_NAME || 'board-decisions-kb';

function getCredential() {
  const apiKey = process.env.SEARCH_API_KEY;
  if (apiKey) return new AzureKeyCredential(apiKey);
  return new DefaultAzureCredential();
}

function getSearchEndpoint() {
  const endpoint = process.env.SEARCH_ENDPOINT;
  if (!endpoint) {
    throw new Error('Missing SEARCH_ENDPOINT. See README for Foundry IQ setup.');
  }
  return endpoint.replace(/\/$/, '');
}

export function isFoundryIqConfigured() {
  return Boolean(process.env.SEARCH_ENDPOINT && process.env.KNOWLEDGE_BASE_NAME);
}

function formatSessionDocument({ question, responses, verdict, id, timestamp }) {
  const advisorBlock = Object.entries(responses || {})
    .map(([personaId, text]) => `${personaId}: ${text}`)
    .join('\n');

  return {
    id: id || randomUUID(),
    title: question,
    content: [
      `Decision: ${question}`,
      `Date: ${timestamp || new Date().toISOString()}`,
      '',
      'Advisor responses:',
      advisorBlock,
      '',
      `Board verdict: ${verdict}`
    ].join('\n'),
    verdict,
    timestamp: timestamp || new Date().toISOString()
  };
}

function referenceToMemory(ref, index) {
  const doc = ref.sourceData || ref.content || ref;
  return {
    id: doc.id || `ref-${index}`,
    question: doc.title || doc.name || 'Past decision',
    verdict: doc.verdict || extractVerdict(doc.content || doc.text || ''),
    timestamp: doc.timestamp || null,
    snippet: (doc.content || doc.text || '').slice(0, 280)
  };
}

function extractVerdict(content) {
  const match = content.match(/Board verdict:\s*(.+)/s);
  return match ? match[1].trim().slice(0, 200) : content.slice(0, 200);
}

export function formatMemoryContext(memories) {
  if (!memories?.length) return '';

  const blocks = memories.map(
    (m, i) =>
      `[Past decision ${i + 1}${m.timestamp ? ` — ${new Date(m.timestamp).toLocaleDateString()}` : ''}]\n` +
      `Question: ${m.question}\n` +
      `Verdict: ${m.verdict}`
  );

  return `\n\nRelevant past decisions from Foundry IQ memory:\n${blocks.join('\n\n')}`;
}

export async function searchMemory(question, limit = 3) {
  if (!isFoundryIqConfigured()) return [];

  const endpoint = getSearchEndpoint();
  const credential = getCredential();

  const retrievalClient = new KnowledgeRetrievalClient(
    endpoint,
    KB_NAME,
    credential
  );

  const result = await retrievalClient.retrieveKnowledge({
    intents: [
      {
        search: `Past life decisions similar to: ${question}. Include question, advisor perspectives, and final verdict.`
      }
    ],
    includeActivity: false,
    retrievalReasoningEffort: { kind: 'minimal' },
    maxOutputSize: limit * 2000
  });

  const references = result.references || [];
  return references.slice(0, limit).map(referenceToMemory);
}

export async function saveDecision({ question, responses, verdict }) {
  const doc = formatSessionDocument({ question, responses, verdict });

  if (!process.env.SEARCH_ENDPOINT) {
    return { id: doc.id, saved: false, reason: 'Foundry IQ not configured' };
  }

  const endpoint = getSearchEndpoint();
  const credential = getCredential();
  const searchClient = new SearchClient(endpoint, INDEX_NAME, credential);

  await searchClient.uploadDocuments([doc]);
  return { id: doc.id, saved: true, timestamp: doc.timestamp };
}

export async function listDecisions(limit = 10) {
  if (!process.env.SEARCH_ENDPOINT) return [];

  const endpoint = getSearchEndpoint();
  const credential = getCredential();
  const searchClient = new SearchClient(endpoint, INDEX_NAME, credential);

  const results = await searchClient.search('*', {
    top: limit,
    orderBy: ['timestamp desc'],
    select: ['id', 'title', 'verdict', 'timestamp', 'content']
  });

  const decisions = [];
  for await (const r of results.results) {
    decisions.push({
      id: r.document.id,
      question: r.document.title,
      verdict: r.document.verdict,
      timestamp: r.document.timestamp
    });
  }
  return decisions;
}
