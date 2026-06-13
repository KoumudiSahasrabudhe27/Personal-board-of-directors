import json
import logging
from typing import Any

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    AzureOpenAI,
    NotFoundError,
    RateLimitError as OpenAIRateLimitError,
)

from backend.config import Settings, get_settings
from backend.exceptions import (
    DeploymentNotFoundError,
    InvalidApiKeyError,
    ModelResponseError,
    NetworkError,
    QuotaExceededError,
    RateLimitError,
)

logger = logging.getLogger(__name__)

_client: AzureOpenAI | None = None

JSON_RESPONSE_KEYS = """
- situation_summary
- ceo_perspective
- investor_perspective
- engineer_perspective
- psychologist_perspective
- mentor_perspective
- friend_perspective
- agreements
- disagreements
- consensus_recommendation
- action_plan
- confidence_score (number from 0 to 100)
""".strip()


def build_board_system_prompt(advisor_block: str) -> str:
    return f"""You are a Personal Board of Directors AI.

Your panel includes six advisors, each with a distinct lens:
{advisor_block}

For every user question:
1. Summarize the situation clearly.
2. Provide a dedicated perspective for each advisor (3-4 sentences each, in character).
3. Identify where advisors agree and disagree.
4. Deliver one consensus recommendation and a concrete action plan.
5. Assign a confidence score (0-100) for the recommendation.

Return structured JSON with these exact keys:
{JSON_RESPONSE_KEYS}"""


def get_client(settings: Settings | None = None) -> AzureOpenAI:
    global _client
    if _client is not None:
        return _client

    cfg = settings or get_settings()
    logger.info(
        "Initializing Azure OpenAI client (deployment=%s, api_version=%s)",
        cfg.azure_openai_deployment,
        cfg.azure_openai_api_version,
    )

    _client = AzureOpenAI(
        azure_endpoint=cfg.azure_openai_endpoint.rstrip("/"),
        api_key=cfg.azure_openai_api_key,
        api_version=cfg.azure_openai_api_version,
    )
    return _client


def reset_client() -> None:
    """Reset cached client — useful for tests."""
    global _client
    _client = None


def _map_openai_error(err: Exception, deployment: str) -> Exception:
    if isinstance(err, AuthenticationError):
        logger.error("Azure OpenAI authentication failed: %s", err)
        return InvalidApiKeyError()

    if isinstance(err, NotFoundError):
        logger.error("Azure OpenAI deployment not found: %s", deployment)
        return DeploymentNotFoundError(deployment)

    if isinstance(err, OpenAIRateLimitError):
        message = str(err).lower()
        if "quota" in message or "insufficient" in message:
            logger.error("Azure OpenAI quota exceeded: %s", err)
            return QuotaExceededError(str(err))
        logger.warning("Azure OpenAI rate limit hit: %s", err)
        return RateLimitError(str(err))

    if isinstance(err, APIStatusError):
        status = err.status_code
        message = str(err).lower()
        if status == 401:
            return InvalidApiKeyError()
        if status == 404:
            return DeploymentNotFoundError(deployment)
        if status == 429:
            if "quota" in message or "insufficient" in message:
                return QuotaExceededError(str(err))
            return RateLimitError(str(err))
        if status == 402:
            return QuotaExceededError(str(err))

    if isinstance(err, (APIConnectionError, APITimeoutError)):
        logger.error("Azure OpenAI network error: %s", err)
        return NetworkError(str(err))

    logger.exception("Unexpected Azure OpenAI error")
    return err


def complete_json(
    system_prompt: str,
    user_message: str,
    *,
    max_tokens: int = 2500,
    settings: Settings | None = None,
) -> dict[str, Any]:
    cfg = settings or get_settings()
    client = get_client(cfg)
    deployment = cfg.azure_openai_deployment

    logger.debug(
        "Calling Azure OpenAI deployment=%s max_tokens=%d",
        deployment,
        max_tokens,
    )

    try:
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            max_tokens=max_tokens,
        )
    except Exception as err:
        raise _map_openai_error(err, deployment) from err

    content = response.choices[0].message.content
    if not content:
        raise ModelResponseError("Azure OpenAI returned an empty response.")

    try:
        payload = json.loads(content)
    except json.JSONDecodeError as err:
        raise ModelResponseError(
            "Azure OpenAI returned invalid JSON.",
            details={"raw_content": content[:500]},
        ) from err

    if not isinstance(payload, dict):
        raise ModelResponseError(
            "Azure OpenAI JSON payload must be an object.",
            details={"payload_type": type(payload).__name__},
        )

    logger.info("Azure OpenAI completion succeeded (deployment=%s)", deployment)
    return payload
