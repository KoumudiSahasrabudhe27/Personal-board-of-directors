from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    azure_openai_endpoint: str = Field(..., alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: str = Field(..., alias="AZURE_OPENAI_API_KEY")
    azure_openai_deployment: str = Field(..., alias="AZURE_OPENAI_DEPLOYMENT")
    azure_openai_api_version: str = Field(
        default="2024-10-21",
        alias="AZURE_OPENAI_API_VERSION",
    )

    search_endpoint: str | None = Field(default=None, alias="SEARCH_ENDPOINT")
    search_api_key: str | None = Field(default=None, alias="SEARCH_API_KEY")
    knowledge_base_name: str | None = Field(default=None, alias="KNOWLEDGE_BASE_NAME")
    board_index_name: str = Field(default="board-decisions", alias="BOARD_INDEX_NAME")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def foundry_iq_configured(self) -> bool:
        return bool(self.search_endpoint and self.knowledge_base_name)


@lru_cache
def get_settings() -> Settings:
    return Settings()
