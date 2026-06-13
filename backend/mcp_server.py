import json
import logging

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

from backend.board import get_advisor_perspective, run_board_of_directors, run_board_session
from backend.foundry_iq import format_memory_context, list_decisions, save_decision, search_memory
from backend.logging_config import configure_logging
from backend.personas import ADVISORS

configure_logging()
logger = logging.getLogger(__name__)

mcp = FastMCP("personal-board-of-directors")
PERSONA_IDS = [persona["id"] for persona in ADVISORS]


@mcp.tool()
def run_board_tool(question: str) -> str:
    """Run the full Personal Board of Directors with Foundry IQ memory and structured analysis."""
    logger.info("MCP run_board_tool invoked")
    session = run_board_session(question)
    return json.dumps(session.model_dump(), indent=2)


@mcp.tool()
def analyze_tool(question: str) -> str:
    """Run board-of-directors analysis without saving to Foundry IQ."""
    analysis = run_board_of_directors(question)
    return json.dumps(analysis.model_dump(), indent=2)


@mcp.tool()
def ask_persona_tool(persona: str, question: str, include_memory: bool = True) -> str:
    """Ask one board advisor using the unified board analysis."""
    if persona not in PERSONA_IDS:
        raise ValueError(f"Unknown persona: {persona}. Choose from {', '.join(PERSONA_IDS)}")

    memories = search_memory(question, 3) if include_memory else []
    memory_context = format_memory_context(memories) if include_memory else ""
    result = get_advisor_perspective(persona, question, memory_context=memory_context)
    return json.dumps({**result, "memoriesUsed": memories}, indent=2)


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
