import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.knowledgebases import KnowledgeBaseRetrievalClient
from azure.search.documents.knowledgebases.models import (
    KnowledgeBaseRetrievalRequest,
    KnowledgeRetrievalMinimalReasoningEffort,
)

from backend.config import get_settings

logger = logging.getLogger(__name__)


def _get_credential() -> AzureKeyCredential | DefaultAzureCredential:
    api_key = os.environ.get("SEARCH_API_KEY")
    if api_key:
        return AzureKeyCredential(api_key)
    return DefaultAzureCredential()


def _search_endpoint() -> str:
    endpoint = os.environ.get("SEARCH_ENDPOINT")
    if not endpoint:
        raise RuntimeError("Missing SEARCH_ENDPOINT. See README for Foundry IQ setup.")
    return endpoint.rstrip("/")


def is_foundry_iq_configured() -> bool:
    return get_settings().foundry_iq_configured


def _format_session_document(
    question: str,
    responses: dict[str, str],
    verdict: str,
    doc_id: str | None = None,
    timestamp: str | None = None,
) -> dict[str, str]:
    advisor_block = "\n".join(f"{pid}: {text}" for pid, text in (responses or {}).items())
    ts = timestamp or datetime.now(timezone.utc).isoformat()

    return {
        "id": doc_id or str(uuid.uuid4()),
        "title": question,
        "content": "\n".join(
            [
                f"Decision: {question}",
                f"Date: {ts}",
                "",
                "Advisor responses:",
                advisor_block,
                "",
                f"Board verdict: {verdict}",
            ]
        ),
        "verdict": verdict,
        "timestamp": ts,
    }


def _extract_verdict(content: str) -> str:
    match = re.search(r"Board verdict:\s*(.+)", content, re.DOTALL)
    if match:
        return match.group(1).strip()[:200]
    return content[:200]


def _reference_to_memory(ref: Any, index: int) -> dict[str, Any]:
    doc = getattr(ref, "source_data", None) or getattr(ref, "content", None) or ref
    if hasattr(doc, "as_dict"):
        doc = doc.as_dict()
    elif not isinstance(doc, dict):
        doc = {}

    content = doc.get("content") or doc.get("text") or ""
    return {
        "id": doc.get("id") or f"ref-{index}",
        "question": doc.get("title") or doc.get("name") or "Past decision",
        "verdict": doc.get("verdict") or _extract_verdict(content),
        "timestamp": doc.get("timestamp"),
        "snippet": content[:280],
    }


def format_memory_context(memories: list[dict[str, Any]]) -> str:
    if not memories:
        return ""

    blocks: list[str] = []
    for i, memory in enumerate(memories):
        date_suffix = ""
        if memory.get("timestamp"):
            date_suffix = f" — {str(memory['timestamp'])[:10]}"
        blocks.append(
            f"[Past decision {i + 1}{date_suffix}]\n"
            f"Question: {memory['question']}\n"
            f"Verdict: {memory['verdict']}"
        )

    return "\n\nRelevant past decisions from Foundry IQ memory:\n" + "\n\n".join(blocks)


def search_memory(question: str, limit: int = 3) -> list[dict[str, Any]]:
    if not is_foundry_iq_configured():
        logger.debug("Foundry IQ not configured — skipping memory search")
        return []

    settings = get_settings()
    kb_name = settings.knowledge_base_name or "board-decisions-kb"

    logger.info("Searching Foundry IQ memory (limit=%d)", limit)
    client = KnowledgeBaseRetrievalClient(
        endpoint=_search_endpoint(),
        knowledge_base_name=kb_name,
        credential=_get_credential(),
    )

    request = KnowledgeBaseRetrievalRequest(
        intents=[
            {
                "search": (
                    f"Past life decisions similar to: {question}. "
                    "Include question, advisor perspectives, and final verdict."
                )
            }
        ],
        include_activity=False,
        retrieval_reasoning_effort=KnowledgeRetrievalMinimalReasoningEffort(),
        max_output_size=limit * 2000,
    )

    result = client.retrieve(retrieval_request=request)
    references = getattr(result, "references", None) or []
    memories = [_reference_to_memory(ref, i) for i, ref in enumerate(references[:limit])]
    logger.info("Found %d memory references", len(memories))
    return memories


def save_decision(
    question: str,
    responses: dict[str, str],
    verdict: str,
) -> dict[str, Any]:
    doc = _format_session_document(question, responses, verdict)

    if not os.environ.get("SEARCH_ENDPOINT"):
        logger.warning("Foundry IQ not configured — decision not saved")
        return {"id": doc["id"], "saved": False, "reason": "Foundry IQ not configured"}

    settings = get_settings()
    client = SearchClient(
        endpoint=_search_endpoint(),
        index_name=settings.board_index_name,
        credential=_get_credential(),
    )
    client.upload_documents([doc])
    logger.info("Saved decision to Foundry IQ (id=%s)", doc["id"])
    return {"id": doc["id"], "saved": True, "timestamp": doc["timestamp"]}


def list_decisions(limit: int = 10) -> list[dict[str, Any]]:
    if not os.environ.get("SEARCH_ENDPOINT"):
        return []

    settings = get_settings()
    client = SearchClient(
        endpoint=_search_endpoint(),
        index_name=settings.board_index_name,
        credential=_get_credential(),
    )

    results = client.search(
        search_text="*",
        top=limit,
        order_by=["timestamp desc"],
        select=["id", "title", "verdict", "timestamp", "content"],
    )

    return [
        {
            "id": doc["id"],
            "question": doc["title"],
            "verdict": doc["verdict"],
            "timestamp": doc["timestamp"],
        }
        for doc in results
    ]
