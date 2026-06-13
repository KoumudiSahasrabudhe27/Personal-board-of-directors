from typing import Any


class AppError(Exception):
    """Base application error with HTTP mapping."""

    def __init__(
        self,
        message: str,
        *,
        code: str,
        status_code: int,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ConfigurationError(AppError):
    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message,
            code="configuration_error",
            status_code=500,
            details=details,
        )


class InvalidApiKeyError(AppError):
    def __init__(self, message: str = "Invalid Azure OpenAI API key.") -> None:
        super().__init__(message, code="invalid_api_key", status_code=401)


class DeploymentNotFoundError(AppError):
    def __init__(
        self,
        deployment: str,
        message: str | None = None,
    ) -> None:
        super().__init__(
            message or f"Deployment '{deployment}' was not found.",
            code="deployment_not_found",
            status_code=404,
            details={"deployment": deployment},
        )


class RateLimitError(AppError):
    def __init__(self, message: str = "Azure OpenAI rate limit exceeded.") -> None:
        super().__init__(message, code="rate_limit_exceeded", status_code=429)


class QuotaExceededError(AppError):
    def __init__(self, message: str = "Azure OpenAI quota exceeded.") -> None:
        super().__init__(message, code="quota_exceeded", status_code=402)


class NetworkError(AppError):
    def __init__(self, message: str = "Unable to reach Azure OpenAI.") -> None:
        super().__init__(message, code="network_error", status_code=503)


class ModelResponseError(AppError):
    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message,
            code="invalid_model_response",
            status_code=502,
            details=details,
        )


class ValidationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, code="validation_error", status_code=400)
