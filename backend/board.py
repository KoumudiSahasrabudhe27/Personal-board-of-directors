from concurrent.futures import ThreadPoolExecutor, as_completed

from backend.foundry_iq import format_memory_context, save_decision, search_memory
from backend.llm import call_llm
from backend.personas import MODERATOR_PROMPT, PERSONAS, get_persona


def ask_persona(persona_id: str, question: str, memory_context: str = "") -> dict:
    persona = get_persona(persona_id)
    if not persona:
        raise ValueError(f"Unknown persona: {persona_id}")

    user_message = (
        f"{memory_context}\n\nCurrent decision the user is facing:\n{question}"
        if memory_context
        else question
    )

    text = call_llm(persona["system_prompt"], user_message)
    return {"personaId": persona_id, "name": persona["name"], "text": text}


def moderate_board(question: str, responses: dict, memory_context: str = "") -> str:
    combined = "\n\n".join(
        f"--- {p['name']} ({p['title']}):\n{responses.get(p['id'], '')}" for p in PERSONAS
    )

    user_message = (
        f"{memory_context}\n\nUser question: {question}\n\nAdvisor responses:\n{combined}"
        if memory_context
        else f"User question: {question}\n\nAdvisor responses:\n{combined}"
    )

    return call_llm(MODERATOR_PROMPT, user_message)


def run_board(question: str) -> dict:
    memories = search_memory(question, 3)
    memory_context = format_memory_context(memories)

    results = []
    with ThreadPoolExecutor(max_workers=len(PERSONAS)) as executor:
        futures = {
            executor.submit(ask_persona, p["id"], question, memory_context): p
            for p in PERSONAS
        }
        for future in as_completed(futures):
            persona = futures[future]
            try:
                results.append(future.result())
            except Exception as err:
                results.append(
                    {
                        "personaId": persona["id"],
                        "name": persona["name"],
                        "text": f"Error: {err}",
                    }
                )

    results.sort(key=lambda r: next(i for i, p in enumerate(PERSONAS) if p["id"] == r["personaId"]))
    responses = {r["personaId"]: r["text"] for r in results}

    verdict = moderate_board(question, responses, memory_context)
    saved = save_decision(question, responses, verdict)

    return {
        "question": question,
        "responses": responses,
        "verdict": verdict,
        "memoriesUsed": memories,
        "savedDecisionId": saved["id"],
        "memorySaved": saved.get("saved", False),
    }
