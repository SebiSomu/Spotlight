import logging
from typing import List, Dict, Any, Optional
from app.groq_client import llm_service
from app.retriever import retriever

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Spotlight AI, an expert, enthusiastic concert and live event assistant for the Spotlight platform.
Your goal is to help users discover upcoming concerts, artist performances, venue details, and ticket options.

Be helpful, friendly, concise, and informative. When asked about events, artists, or venues, provide clear and engaging suggestions.
Always include concrete details like dates, cities, venues, ticket prices, and availability when available.
Mention how to get tickets (user should visit the event page on Spotlight) when relevant.

If you don't know an answer or the context doesn't cover it, just say so and suggest what you CAN help with.

Relevant Spotlight records retrieved below (use ONLY these for factual answers):
-----
{context_text}
-----
"""

RECORDS_FOUND_HEADER = "🎟️ Found {count} match{plural} in the Spotlight database:"
NO_RECORDS_MSG = "No direct database records yet. Run `python ingest.py` (or POST /api/v1/chat/ingest) to index events, artists, and venues."


def _format_context(docs: List[Dict[str, Any]]) -> str:
    if not docs:
        return NO_RECORDS_MSG
    parts = [RECORDS_FOUND_HEADER.format(count=len(docs), plural="es" if len(docs) != 1 else "")]
    for doc in docs:
        score = doc.get("score")
        header = f"[{doc.get('entity_type', '').upper()}] id={doc.get('entity_id')}"
        if score is not None:
            header += f" (relevance={1 - float(score):.3f})"
        parts.append(header + "\n" + doc.get("text", "").strip())
    return "\n\n---\n\n".join(parts)


def process_chat_request(message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    retrieved_docs = retriever.retrieve_relevant_context(message)
    context_text = _format_context(retrieved_docs)
    logger.info("Retrieved %d docs for query: %r", len(retrieved_docs), message)

    formatted_system_prompt = SYSTEM_PROMPT.format(context_text=context_text)

    reply = llm_service.generate_completion(
        system_prompt=formatted_system_prompt,
        user_message=message,
        history=history or [],
        context_text=context_text,
    )

    has_records_header = RECORDS_FOUND_HEADER.split("{")[0] in reply
    if retrieved_docs and not has_records_header and NO_RECORDS_MSG not in reply:
        reply = context_text + "\n\n---\n\n" + reply

    sources: List[str] = []
    seen = set()
    for doc in retrieved_docs:
        sid = doc.get("source_id")
        if sid and sid not in seen:
            sources.append(sid)
            seen.add(sid)

    return {
        "reply": reply,
        "sources": sources,
    }
