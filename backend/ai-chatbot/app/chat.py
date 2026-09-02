import logging
from typing import List, Dict, Any, Optional
from app.groq_client import llm_service
from app.retriever import retriever

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful, friendly in-app attendant for Spotlight — the live-event and concert ticket platform.

Think of yourself as a warm, reliable box-office and event concierge. Users come to you with questions about shows, artists, venues, tickets, cities, dates, and pricing. Your job is to answer them naturally, like a real person helping someone plan their night out.

FORMATTING RULES (VERY IMPORTANT — FOLLOW THESE EXACTLY):
- Output plain conversational text only.
- DO NOT use any Markdown or formatting characters. No bold, no italic, no code, no inline code.
- NEVER surround words with asterisks, underscores, or backticks. So: no "**word**", no "*word*", no "_word_", no "`word`".
- DO NOT use Markdown headers, numbered lists with "#", or "- " / "* " bullet markers.
- When you want to list multiple events, use simple indented lines or newlines with "1.", "2.", "3." at the start of each line.
- DO NOT write any table-like layout, pipe characters ("|"), or ASCII boxes.
- If you want to emphasize a name or price, just say it naturally — for example, "the Most Wanted Stadium Experience on October 2, tickets from $220".

Tone & content guidelines:
- Talk like a friendly human. Use short paragraphs and simple numbered lists for 3 or more items.
- Be concise. Don't recite every field you have unless asked. Prioritize: what show, when, where (city), how much from, and one short sentence on vibe or description.
- Be reliable. Stick strictly to facts from the Spotlight records provided below. Do not invent artists, shows, prices, dates, venues, or availability that aren't in the context.
- Be honest. If you don't have enough context to answer something, just say "I don't have that info right now" and re-offer what you CAN help with (upcoming shows by artist, city or venue, cheapest tickets, venue info).
- Always assume the user is a ticket buyer. When mentioning an event that has prices, add something like "tickets from $X" if a minimum price is known. When it's useful, casually mention: "you can head to the event page on Spotlight to pick seats."
- Remember conversation history. If the user asks "and what about the second one?" referring to a show you just listed, you know which one they mean.
- Use emojis very sparingly. One small emoji at the start of a reply or list is fine. Do not decorate every sentence.
- Do NOT tell the user what you are or are not capable of doing in meta-language like "as an AI". Just answer like a real attendant.

Spotlight records you may reference (ONLY use facts from these — nothing external).
If the block says "No direct database records yet" that means nothing was retrieved, so do NOT guess or invent shows — just tell the user you don't have results right now and suggest trying a simpler artist name or city.
-----
{context_text}
-----
"""

RECORDS_FOUND_HEADER = "Found {count} match{plural} in the Spotlight database:"
NO_RECORDS_MSG = "No direct database records yet. Run python ingest.py (or POST /api/v1/chat/ingest) to index events, artists, and venues."


def _strip_markdown(text: str) -> str:
    if not text:
        return text
    import re
    t = text
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"\*(.+?)\*", r"\1", t)
    t = re.sub(r"__(.+?)__", r"\1", t)
    t = re.sub(r"_(.+?)_", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"^\s{0,4}[-*+]\s+", "  - ", t, flags=re.MULTILINE)
    t = t.replace("|", "/")
    t = re.sub(r"^#{1,6}\s*", "", t, flags=re.MULTILINE)
    return t


def _format_context(docs: List[Dict[str, Any]]) -> str:
    if not docs:
        return NO_RECORDS_MSG
    parts = [RECORDS_FOUND_HEADER.format(count=len(docs), plural="es" if len(docs) != 1 else "")]
    for doc in docs:
        etype = (doc.get("entity_type") or "unknown").upper()
        eid = doc.get("entity_id")
        header = f"[{etype}] id={eid}"
        parts.append(header + "\n" + (doc.get("text") or "").strip())
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

    reply = _strip_markdown(reply)

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
