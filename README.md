# Personal Board of Directors

Six AI advisors debate your life decisions. A Moderator synthesizes one clear recommendation. **Foundry IQ** gives the board persistent memory of every past session.

Built for the [Microsoft IQ Series](https://github.com/microsoft/iq-series) — uses [Foundry IQ](https://learn.microsoft.com/azure/foundry/agents/concepts/what-is-foundry-iq) as the managed knowledge layer.

## Architecture

```
React UI (src/)  →  FastAPI (backend/api.py)  →  board orchestrator (backend/)
                                              ↓
                                    Foundry IQ (Azure AI Search KB)
                                              ↓
                                    Azure OpenAI (6 personas + Moderator)

GitHub Copilot  →  MCP server (backend/mcp_server.py)  →  same orchestrator
                →  Foundry IQ MCP endpoint (optional, .vscode/mcp.json)
```

| Layer | Role |
|-------|------|
| **src/** | Landing page + board session UI |
| **backend/** | Personas, LLM client, Foundry IQ memory, orchestration, API, MCP |
| **scripts/** | Foundry IQ provisioning (`setup_foundry_iq.py`) |
| **Foundry IQ** | RAG — stores and retrieves past decision sessions |

## Prerequisites

- **Python 3.11+**
- **Node.js 20+** (React UI only)
- **Azure subscription** with permissions to create resources
- **Azure CLI** — run `az login` before setup
- Region supporting [agentic retrieval](https://learn.microsoft.com/azure/search/search-region-support) (e.g. `eastus2`)

## 1. Deploy Azure resources (IQ Series)

Use the official [IQ Series deploy button](https://aka.ms/iq-series/deploytoazure) from [microsoft/iq-series](https://github.com/microsoft/iq-series):

1. Create a resource group (e.g. `iq-series-rg`)
2. Get your User Object ID: `az ad signed-in-user show --query id -o tsv`
3. Deploy and copy outputs from the Azure portal **Outputs** tab

Follow [Episode 1 cookbook prerequisites](https://github.com/microsoft/iq-series/tree/main/Foundry-IQ/1-Foundry-IQ-Unlocking-Knowledge-for-Agents/cookbook) if you need detail.

## 2. Configure environment

```bash
cp .env.example .env
```

Fill in values from your deployment outputs:

```env
SEARCH_ENDPOINT=https://YOUR-SEARCH-SERVICE.search.windows.net
SEARCH_API_KEY=your-key
AOAI_ENDPOINT=https://YOUR-OPENAI-RESOURCE.openai.azure.com
AOAI_API_KEY=your-key
KNOWLEDGE_BASE_NAME=board-decisions-kb
```

If using `az login` instead of keys, omit `SEARCH_API_KEY` and `AOAI_API_KEY` — the app uses `DefaultAzureCredential`.

## 3. Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
npm install
```

## 4. Create Foundry IQ knowledge base for the board

```bash
npm run setup:foundry
```

This creates:

- Search index `board-decisions` (past sessions)
- Knowledge source + **Foundry IQ knowledge base** `board-decisions-kb`
- One seed decision for demo retrieval

## 5. Run the app

```bash
npm run dev
```

- Web UI: http://localhost:5173
- API: http://localhost:3001

Ask a decision twice — the second session should reference the first via Foundry IQ memory.

## MCP (GitHub Copilot)

### Board MCP tools

Enable **board-of-directors** in Copilot Chat → Tools. Available tools:

| Tool | Description |
|------|-------------|
| `run_board_tool` | Full session with Foundry IQ memory |
| `ask_persona_tool` | Single advisor |
| `search_memory_tool` | Query Foundry IQ |
| `list_memory_tool` | Recent sessions |

Example: *"Run my board on whether I should relocate for work"*

### Foundry IQ MCP (direct KB access)

Update `.vscode/mcp.json` with your search service name and API key, then enable **foundry-iq** in Copilot Tools. Pattern from [IQ Series Episode 3](https://github.com/microsoft/iq-series/tree/main/Foundry-IQ/3-Foundry-IQ-Querying-the-Multi-Source-AI-Knowledge-Bases/cookbook):

```
https://<search-service>.search.windows.net/knowledgebases/board-decisions-kb/mcp?api-version=2025-11-01-preview
```

## Demo script for judges

1. **First question:** *"Should I quit my stable job for a startup?"* → board deliberates → verdict saved to Foundry IQ
2. **Second question:** *"A startup just offered me equity — should I take it?"* → show **Past decisions referenced** panel
3. **Copilot:** call `run_board_tool` or `search_memory_tool` to show MCP orchestration

**Pitch:** MCP exposes persona tools. Foundry IQ gives them memory. Copilot orchestrates agents that remember your life decisions.

## Learn more

- [Microsoft IQ Series](https://github.com/microsoft/iq-series)
- [What is Foundry IQ?](https://learn.microsoft.com/azure/foundry/agents/concepts/what-is-foundry-iq)
- [Agentic retrieval quickstart](https://learn.microsoft.com/azure/search/search-get-started-agentic-retrieval)

## License

MIT
