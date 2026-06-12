from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from backend.board import run_board
from backend.foundry_iq import is_foundry_iq_configured, list_decisions, search_memory
from backend.personas import PERSONAS, public_personas

app = FastAPI(title="Personal Board of Directors API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class BoardRequest(BaseModel):
    question: str


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "personas": len(PERSONAS),
        "foundryIq": is_foundry_iq_configured(),
    }


@app.get("/api/personas")
def get_personas():
    return public_personas()


@app.post("/api/board")
def board_session(body: BoardRequest):
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    try:
        return run_board(question)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.get("/api/memory")
def memory():
    try:
        return list_decisions(10)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.get("/api/memory/search")
def memory_search(q: str = Query(...)):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="q query param is required")

    try:
        return search_memory(query, 3)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err
