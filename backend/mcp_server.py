import json

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

from backend.board import ask_persona, moderate_board, run_board
from backend.foundry_iq import format_memory_context, list_decisions, save_decision, search_memory
from backend.personas import PERSONAS

mcp = FastMCP("personal-board-of-directors")
PERSONA_IDS = [p["id"] for p in PERSONAS]


@mcp.tool()
def run_board_tool(question: str) -> str:
    """Run the full Personal Board of Directors: retrieve Foundry IQ memory, 6 advisors respond in parallel, Moderator synthesizes one verdict, session saved to Foundry IQ."""
    return json.dumps(run_board(question), indent=2)


@mcp.tool()
def ask_persona_tool(persona: str, question: str, include_memory: bool = True) -> str:
    """Ask one board advisor (CEO, Investor, Engineer, Psychologist, Mentor, Friend). Uses Foundry IQ for past decision context."""
    if persona not in PERSONA_IDS:
        raise ValueError(f"Unknown persona: {persona}. Choose from {', '.join(PERSONA_IDS)}")

    memories = search_memory(question, 3) if include_memory else []
    memory_context = format_memory_context(memories) if include_memory else ""
    result = ask_persona(persona, question, memory_context)
    return json.dumps({**result, "memoriesUsed": memories}, indent=2)


@mcp.tool()
def moderate_board_tool(
    question: str, responses: dict[str, str], include_memory: bool = True
) -> str:
    """Moderator synthesizes six advisor responses into one balanced recommendation."""
    memories = search_memory(question, 3) if include_memory else []
    memory_context = format_memory_context(memories) if include_memory else ""
    verdict = moderate_board(question, responses, memory_context)
    return json.dumps({"verdict": verdict, "memoriesUsed": memories}, indent=2)


@mcp.tool()
def search_memory_tool(query: str, limit: int = 3) -> str:
    """Foundry IQ RAG: retrieve past life decisions similar to the current question."""
    return json.dumps(search_memory(query, limit), indent=2)


@mcp.tool()
def save_decision_tool(question: str, responses: dict[str, str], verdict: str) -> str:
    """Save a board session to the Foundry IQ index for future retrieval."""
    return json.dumps(save_decision(question, responses, verdict), indent=2)


@mcp.tool()
def list_memory_tool(limit: int = 10) -> str:
    """List recent board sessions stored in Foundry IQ."""
    return json.dumps(list_decisions(limit), indent=2)


if __name__ == "__main__":
    mcp.run()
