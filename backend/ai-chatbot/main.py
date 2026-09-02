import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

from pathlib import Path  # noqa: E402
from typing import List, Optional, Dict, Any  # noqa: E402
from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from app.chat import process_chat_request  # noqa: E402
from app.config import settings  # noqa: E402
from app.groq_client import llm_service  # noqa: E402

logger = logging.getLogger("ai-chatbot")

app = FastAPI(
    title="Spotlight AI Chatbot API",
    description="RAG-powered AI assistant service for concert recommendations and event info.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or prompt")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")


class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []


class IngestResponse(BaseModel):
    status: str
    upserted: int = 0
    stats: Dict[str, int] = {}
    error: Optional[str] = None


@app.get("/")
def read_root():
    diag = llm_service.diagnostics()
    cfg = settings.summary()
    return {
        "status": "online",
        "service": "Spotlight AI Chatbot",
        "llm_provider": diag["provider"],
        "llm_model": diag["model"],
        "groq_api_key_present": diag["groq_api_key_present"],
        "groq_api_key_masked": cfg["groq_api_key_masked"],
        "anthropic_api_key_present": diag["anthropic_api_key_present"],
        "working_models": [p["model"] for p in diag["model_probe_results"] if p["ok"]],
        "failed_model_count": sum(1 for p in diag["model_probe_results"] if not p["ok"]),
        "init_errors": diag["init_errors"],
        "dotenv_loaded_from": cfg["dotenv_loaded_from"],
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_dim": settings.EMBEDDING_DIMENSION,
        "port": settings.PORT,
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "llm_provider": llm_service.provider}


@app.get("/diagnostics")
def diagnostics_endpoint():
    diag = llm_service.diagnostics()
    diag["config"] = settings.summary()
    return diag


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        history_dicts = [h.model_dump() for h in request.history] if request.history else []
        result = process_chat_request(message=request.message, history=history_dicts)
        return ChatResponse(reply=result["reply"], sources=result.get("sources", []))
    except Exception as e:
        logger.error("Error handling chat request: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@app.post("/ingest", response_model=IngestResponse)
def trigger_ingestion():
    try:
        from ingest import run, upsert_embeddings, _fetch_source_rows, _fix_entity_ids_and_batch
        from app.embedder import embedder
        from app.db import ensure_embeddings_table, get_cursor
        from app.config import settings

        ensure_embeddings_table(settings.EMBEDDING_DIMENSION)
        raw = _fetch_source_rows()
        items = _fix_entity_ids_and_batch(raw)
        upsert_embeddings(items)

        stats: Dict[str, int] = {}
        with get_cursor() as cur:
            cur.execute(
                "SELECT entity_type, COUNT(*) FROM embeddings GROUP BY entity_type ORDER BY entity_type;"
            )
            for r in cur.fetchall():
                stats[r["entity_type"]] = int(r["count"])

        return IngestResponse(status="ok", upserted=len(items), stats=stats)
    except Exception as e:
        logger.error("Ingestion failed: %s", e, exc_info=True)
        return IngestResponse(status="error", error=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

