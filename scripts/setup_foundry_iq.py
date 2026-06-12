#!/usr/bin/env python3
"""Provision Foundry IQ index, knowledge source, and knowledge base for the board."""

import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    AzureOpenAIVectorizer,
    AzureOpenAIVectorizerParameters,
    HnswAlgorithmConfiguration,
    KnowledgeBase,
    KnowledgeBaseAzureOpenAIModel,
    KnowledgeRetrievalOutputMode,
    KnowledgeSourceReference,
    SearchField,
    SearchIndex,
    SearchIndexFieldReference,
    SearchIndexKnowledgeSource,
    SearchIndexKnowledgeSourceParameters,
    SemanticConfiguration,
    SemanticField,
    SemanticPrioritizedFields,
    SemanticSearch,
    VectorSearch,
    VectorSearchProfile,
)

INDEX_NAME = os.environ.get("BOARD_INDEX_NAME", "board-decisions")
SOURCE_NAME = os.environ.get("BOARD_KNOWLEDGE_SOURCE", "board-decisions-source")
KB_NAME = os.environ.get("KNOWLEDGE_BASE_NAME", "board-decisions-kb")


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing {name} in .env")
    return value.rstrip("/")


def get_credential():
    api_key = os.environ.get("SEARCH_API_KEY")
    if api_key:
        return AzureKeyCredential(api_key)
    return DefaultAzureCredential()


def main():
    search_endpoint = require_env("SEARCH_ENDPOINT")
    aoai_endpoint = require_env("AOAI_ENDPOINT")
    embedding_deployment = os.environ.get("AOAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-large")
    embedding_model = os.environ.get("AOAI_EMBEDDING_MODEL", "text-embedding-3-large")
    gpt_deployment = os.environ.get("AOAI_GPT_DEPLOYMENT", "gpt-4o-mini")
    gpt_model = os.environ.get("AOAI_GPT_MODEL", "gpt-4o-mini")

    credential = get_credential()
    index_client = SearchIndexClient(endpoint=search_endpoint, credential=credential)

    print("Creating board decisions search index...")
    index = SearchIndex(
        name=INDEX_NAME,
        fields=[
            SearchField(name="id", type="Edm.String", key=True, filterable=True),
            SearchField(name="title", type="Edm.String", searchable=True),
            SearchField(name="verdict", type="Edm.String", searchable=True),
            SearchField(
                name="timestamp", type="Edm.String", filterable=True, sortable=True
            ),
            SearchField(
                name="content",
                type="Edm.String",
                searchable=True,
                analyzer_name="en.microsoft",
            ),
            SearchField(
                name="content_embedding",
                type="Collection(Edm.Single)",
                stored=False,
                vector_search_dimensions=3072,
                vector_search_profile_name="board_vector_profile",
            ),
        ],
        vector_search=VectorSearch(
            profiles=[
                VectorSearchProfile(
                    name="board_vector_profile",
                    algorithm_configuration_name="board_hnsw",
                    vectorizer_name="board_embedder",
                )
            ],
            algorithms=[HnswAlgorithmConfiguration(name="board_hnsw")],
            vectorizers=[
                AzureOpenAIVectorizer(
                    vectorizer_name="board_embedder",
                    parameters=AzureOpenAIVectorizerParameters(
                        resource_url=aoai_endpoint,
                        deployment_name=embedding_deployment,
                        model_name=embedding_model,
                    ),
                )
            ],
        ),
        semantic_search=SemanticSearch(
            default_configuration_name="board_semantic",
            configurations=[
                SemanticConfiguration(
                    name="board_semantic",
                    prioritized_fields=SemanticPrioritizedFields(
                        title_field=SemanticField(field_name="title"),
                        content_fields=[SemanticField(field_name="content")],
                    ),
                )
            ],
        ),
    )
    index_client.create_or_update_index(index)
    print(f'Index "{INDEX_NAME}" ready.')

    print("Creating Foundry IQ knowledge source...")
    knowledge_source = SearchIndexKnowledgeSource(
        name=SOURCE_NAME,
        description="Personal Board of Directors — past life decision sessions",
        search_index_parameters=SearchIndexKnowledgeSourceParameters(
            search_index_name=INDEX_NAME,
            source_data_fields=[
                SearchIndexFieldReference(name="id"),
                SearchIndexFieldReference(name="title"),
                SearchIndexFieldReference(name="verdict"),
                SearchIndexFieldReference(name="timestamp"),
            ],
        ),
    )
    index_client.create_or_update_knowledge_source(knowledge_source=knowledge_source)

    print("Creating Foundry IQ knowledge base...")
    aoai_params = AzureOpenAIVectorizerParameters(
        resource_url=aoai_endpoint,
        deployment_name=gpt_deployment,
        model_name=gpt_model,
    )
    knowledge_base = KnowledgeBase(
        name=KB_NAME,
        models=[KnowledgeBaseAzureOpenAIModel(azure_open_ai_parameters=aoai_params)],
        knowledge_sources=[KnowledgeSourceReference(name=SOURCE_NAME)],
        output_mode=KnowledgeRetrievalOutputMode.EXTRACTIVE_DATA,
        answer_instructions=(
            "Summarize relevant past life decisions. Include the original question, "
            "key advisor themes, and the board verdict."
        ),
    )
    index_client.create_or_update_knowledge_base(knowledge_base)
    print(f'Knowledge base "{KB_NAME}" ready.')

    search_client = SearchClient(
        endpoint=search_endpoint, index_name=INDEX_NAME, credential=credential
    )
    seed_doc = {
        "id": str(uuid.uuid4()),
        "title": "Should I leave my stable job for a startup?",
        "verdict": (
            "Weigh runway and learning goals against stability; negotiate a longer "
            "decision window before committing."
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "content": "\n".join(
            [
                "Decision: Should I leave my stable job for a startup?",
                "",
                "Advisor responses:",
                "ceo: Prioritize long-term career capital — a startup can accelerate ownership if the domain aligns.",
                "investor: Model 12-month runway; equity is uncertain until liquidity.",
                "psychologist: Check burnout signals — a leap under exhaustion rarely ends well.",
                "",
                "Board verdict: Weigh runway and learning goals against stability; negotiate a longer decision window before committing.",
            ]
        ),
    }
    search_client.upload_documents([seed_doc])
    print("Seeded one sample decision for demo retrieval.")
    print("\nSetup complete. Start the app with: npm run dev")


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print(f"Setup failed: {err}", file=sys.stderr)
        sys.exit(1)
