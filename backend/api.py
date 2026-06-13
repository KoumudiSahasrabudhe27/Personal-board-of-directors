import logging
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from backend.board import run_board_of_directors, run_board_session
from backend.config import get_settings
from backend.exceptions import AppError, ValidationError
from backend.foundry_iq import list_decisions, search_memory
from backend.logging_config import configure_logging
from backend.personas import public_personas
from backend.schemas import (
    ApiResponse,
    BoardAnalysis,
    ErrorDetail,
    HealthData,
    MemoryItem,
    QuestionRequest,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    configure_logging()
    settings = get_settings()
    logger.info(
        "API started (deployment=%s, foundry_iq=%s)",
        settings.azure_openai_deployment,
        settings.foundry_iq_configured,
    )
    yield
    logger.info("API shutdown")


app = FastAPI(
    title="Personal Board of Directors API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def success_response(data: Any, status_code: int = 200) -> JSONResponse:
    payload = ApiResponse(success=True, data=data).model_dump()
    return JSONResponse(status_code=status_code, content=payload)


def error_response(err: AppError) -> JSONResponse:
    payload = ApiResponse(
        success=False,
        error=ErrorDetail(
            code=err.code,
            message=err.message,
            details=err.details,
        ),
    ).model_dump()
    return JSONResponse(status_code=err.status_code, content=payload)


@app.exception_handler(AppError)
async def handle_app_error(_request: Request, err: AppError) -> JSONResponse:
    return error_response(err)


@app.exception_handler(Exception)
async def handle_unexpected_error(_request: Request, err: Exception) -> JSONResponse:
    logger.exception("Unhandled error")
    app_err = AppError(
        "An unexpected error occurred.",
        code="internal_error",
        status_code=500,
    )
    return error_response(app_err)


def _require_question(question: str) -> str:
    cleaned = question.strip()
    if not cleaned:
        raise ValidationError("question is required")
    return cleaned


@app.post("/analyze")
async def analyze(body: QuestionRequest) -> JSONResponse:
    question = _require_question(body.question)
    analysis = run_board_of_directors(question)
    return success_response(analysis.model_dump())


@app.get("/api/health")
async def health() -> JSONResponse:
    cfg = get_settings()
    data = HealthData(
        personas=len(public_personas()),
        foundry_iq=cfg.foundry_iq_configured,
        deployment=cfg.azure_openai_deployment,
    )
    return success_response(data)


@app.get("/api/personas")
async def personas() -> JSONResponse:
    return success_response(public_personas())


@app.post("/api/board")
async def board(body: QuestionRequest) -> JSONResponse:
    question = _require_question(body.question)
    session = run_board_session(question)

    # Legacy shape for the React UI plus full structured analysis.
    legacy = {
        "question": session.question,
        "responses": session.responses,
        "verdict": session.verdict,
        "memoriesUsed": [m.model_dump() for m in session.memories_used],
        "savedDecisionId": session.saved_decision_id,
        "memorySaved": session.memory_saved,
        "analysis": session.analysis.model_dump(),
    }
    return success_response(legacy)


@app.get("/api/memory")
async def memory() -> JSONResponse:
    items = [MemoryItem.model_validate(item) for item in list_decisions(10)]
    return success_response([item.model_dump() for item in items])


@app.get("/api/memory/search")
async def memory_search(q: str = Query(...)) -> JSONResponse:
    query = _require_question(q)
    items = [MemoryItem.model_validate(item) for item in search_memory(query, 3)]
    return success_response([item.model_dump() for item in items])
