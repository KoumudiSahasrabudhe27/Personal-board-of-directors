#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import personas from '../shared/personas.js';
import { askPersona, moderateBoard, runBoard } from '../shared/board.js';
import { searchMemory, saveDecision, listDecisions, formatMemoryContext } from '../shared/foundryIq.js';

const server = new McpServer({
  name: 'personal-board-of-directors',
  version: '1.0.0'
});

const personaIds = personas.map((p) => p.id);

server.tool(
  'run_board',
  'Run the full Personal Board of Directors: retrieve Foundry IQ memory, 6 advisors respond in parallel, Moderator synthesizes one verdict, session saved to Foundry IQ.',
  { question: z.string().describe('The life decision or question') },
  async ({ question }) => ({
    content: [{ type: 'text', text: JSON.stringify(await runBoard(question), null, 2) }]
  })
);

server.tool(
  'ask_persona',
  'Ask one board advisor (CEO, Investor, Engineer, Psychologist, Mentor, Friend). Uses Foundry IQ for past decision context.',
  {
    persona: z.enum(personaIds),
    question: z.string(),
    includeMemory: z.boolean().optional().default(true)
  },
  async ({ persona, question, includeMemory }) => {
    const memories = includeMemory ? await searchMemory(question, 3) : [];
    const memoryContext = includeMemory ? formatMemoryContext(memories) : '';
    const result = await askPersona(persona, question, memoryContext);
    return {
      content: [{ type: 'text', text: JSON.stringify({ ...result, memoriesUsed: memories }, null, 2) }]
    };
  }
);

server.tool(
  'moderate_board',
  'Moderator synthesizes six advisor responses into one balanced recommendation.',
  {
    question: z.string(),
    responses: z.record(z.string()),
    includeMemory: z.boolean().optional().default(true)
  },
  async ({ question, responses, includeMemory }) => {
    const memories = includeMemory ? await searchMemory(question, 3) : [];
    const memoryContext = includeMemory ? formatMemoryContext(memories) : '';
    const verdict = await moderateBoard(question, responses, memoryContext);
    return {
      content: [{ type: 'text', text: JSON.stringify({ verdict, memoriesUsed: memories }, null, 2) }]
    };
  }
);

server.tool(
  'search_memory',
  'Foundry IQ RAG: retrieve past life decisions similar to the current question.',
  {
    query: z.string(),
    limit: z.number().optional().default(3)
  },
  async ({ query, limit }) => ({
    content: [{ type: 'text', text: JSON.stringify(await searchMemory(query, limit), null, 2) }]
  })
);

server.tool(
  'save_decision',
  'Save a board session to the Foundry IQ index for future retrieval.',
  {
    question: z.string(),
    responses: z.record(z.string()),
    verdict: z.string()
  },
  async ({ question, responses, verdict }) => ({
    content: [{ type: 'text', text: JSON.stringify(await saveDecision({ question, responses, verdict }), null, 2) }]
  })
);

server.tool(
  'list_memory',
  'List recent board sessions stored in Foundry IQ.',
  { limit: z.number().optional().default(10) },
  async ({ limit }) => ({
    content: [{ type: 'text', text: JSON.stringify(await listDecisions(limit), null, 2) }]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server failed:', err);
  process.exit(1);
});
