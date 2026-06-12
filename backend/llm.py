import os

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

_client: AzureOpenAI | None = None


def _get_client() -> AzureOpenAI:
    global _client
    if _client is not None:
        return _client

    endpoint = os.environ.get("AOAI_ENDPOINT")
    if not endpoint:
        raise RuntimeError(
            "Missing AOAI_ENDPOINT. Deploy Azure resources via the IQ Series template first."
        )

    api_key = os.environ.get("AOAI_API_KEY")
    deployment = os.environ.get("AOAI_GPT_DEPLOYMENT", "gpt-4o-mini")

    _client = AzureOpenAI(
        azure_endpoint=endpoint.rstrip("/"),
        api_key=api_key or None,
        azure_ad_token_provider=(
            None
            if api_key
            else get_bearer_token_provider(
                DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
            )
        ),
        api_version=os.environ.get("AOAI_API_VERSION", "2024-08-01-preview"),
        azure_deployment=deployment,
    )
    return _client


def call_llm(system_prompt: str, user_message: str, *, max_tokens: int = 300) -> str:
    client = _get_client()
    deployment = os.environ.get("AOAI_GPT_DEPLOYMENT", "gpt-4o-mini")

    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        max_tokens=max_tokens,
    )

    return (response.choices[0].message.content or "").strip() or "No response received."
