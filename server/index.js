import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runBoard } from '../shared/board.js';
import { listDecisions, searchMemory, isFoundryIqConfigured } from '../shared/foundryIq.js';
import personas from '../shared/personas.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    personas: personas.length,
    foundryIq: isFoundryIqConfigured()
  });
});

app.get('/api/personas', (_req, res) => {
  res.json(
    personas.map(({ id, name, initials, title, lens }) => ({
      id,
      name,
      initials,
      title,
      lens
    }))
  );
});

app.post('/api/board', async (req, res) => {
  const { question } = req.body;
  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const result = await runBoard(question.trim());
    res.json(result);
  } catch (err) {
    console.error('Board error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memory', async (_req, res) => {
  try {
    const decisions = await listDecisions(10);
    res.json(decisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memory/search', async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) {
    return res.status(400).json({ error: 'q query param is required' });
  }

  try {
    const results = await searchMemory(q.trim(), 3);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Board API running at http://localhost:${PORT}`);
  console.log(`Foundry IQ: ${isFoundryIqConfigured() ? 'configured' : 'not configured — run npm run setup:foundry'}`);
});
