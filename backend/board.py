import logging

from pydantic import ValidationError

from backend.azure_openai import build_board_system_prompt, complete_json
from backend.exceptions import ModelResponseError
from backend.foundry_iq import format_memory_context, save_decision, search_memory
from backend.personas import advisor_prompt_block, get_persona
from backend.schemas import BoardAnalysis, BoardSessionData, MemoryItem

logger = logging.getLogger(__name__)

_BOARD_SYSTEM_PROMPT = build_board_system_prompt(advisor_prompt_block())


def run_board_of_directors(
    question: str,
    *,
    memory_context: str = "",
) -> BoardAnalysis:
    """
    Single reusable entry point for board-of-directors analysis.

    Calls Azure OpenAI once and returns a validated structured analysis.
    """
    cleaned = question.strip()
    if not cleaned:
        raise ValueError("question is required")

    user_message = (
        f"{memory_context}\n\nCurrent decision:\n{cleaned}"
        if memory_context
        else cleaned
    )

    logger.info("Running board-of-directors analysis")
    raw = complete_json(_BOARD_SYSTEM_PROMPT, user_message)

    try:
        analysis = BoardAnalysis.model_validate(raw)
    except ValidationError as err:
        raise ModelResponseError(
            "Model response is missing required board fields.",
            details={"validation_errors": err.errors()},
        ) from err

    logger.info(
        "Board analysis complete (confidence_score=%.1f)",
        analysis.confidence_score,
    )
    return analysis


def run_board_session(question: str) -> BoardSessionData:
    """
    Full session flow: Foundry IQ memory retrieval, board analysis, and persistence.
    """
    cleaned = question.strip()
    if not cleaned:
        raise ValueError("question is required")

    logger.info("Starting board session")
    memories_raw = search_memory(cleaned, limit=3)
    memory_context = format_memory_context(memories_raw)
    analysis = run_board_of_directors(cleaned, memory_context=memory_context)

    responses = analysis.to_persona_responses()
    saved = save_decision(cleaned, responses, analysis.consensus_recommendation)

    memories = [MemoryItem.model_validate(item) for item in memories_raw]

    return BoardSessionData(
        question=cleaned,
        analysis=analysis,
        responses=responses,
        verdict=analysis.consensus_recommendation,
        memories_used=memories,
        saved_decision_id=saved.get("id"),
        memory_saved=bool(saved.get("saved")),
    )


def get_advisor_perspective(
    persona_id: str,
    question: str,
    *,
    memory_context: str = "",
) -> dict[str, str]:
    """Return one advisor perspective from a full board analysis."""
    persona = get_persona(persona_id)
    if persona is None:
        raise ValueError(f"Unknown persona: {persona_id}")

    analysis = run_board_of_directors(question, memory_context=memory_context)
    responses = analysis.to_persona_responses()

    return {
        "personaId": persona_id,
        "name": persona["name"],
        "text": responses[persona_id],
    }


# Backward-compatible alias for existing imports.
def run_board(question: str) -> dict:
    session = run_board_session(question)
    return {
        "question": session.question,
        "responses": session.responses,
        "verdict": session.verdict,
        "memoriesUsed": [m.model_dump() for m in session.memories_used],
        "savedDecisionId": session.saved_decision_id,
        "memorySaved": session.memory_saved,
        "analysis": session.analysis.model_dump(),
    }
