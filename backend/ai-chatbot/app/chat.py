import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.groq_client import llm_service
from app.retriever import retriever
from app.geolocation import (
    detect_location_intent,
    geocoder,
    LocationIntentResult,
)
from app.temporal import extract_date_range

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful, friendly in-app attendant for Spotlight — the live-event and concert ticket platform.

Think of yourself as a warm, reliable box-office and event concierge. Users come to you with questions about shows, artists, venues, tickets, cities, dates, and pricing. Your job is to answer them naturally, like a real person helping someone plan their night out.

FORMATTING RULES (VERY IMPORTANT — FOLLOW THESE EXACTLY):
- Output plain conversational text only.
- DO NOT use any Markdown or formatting characters. No bold, no italic, no code, no inline code.
- NEVER surround words with asterisks, underscores, or backticks. So: no "**word**", no "*word*", no "_word_", no "`word`".
- DO NOT use Markdown headers, numbered lists with "#", or "- " / "* " bullet markers.
- DO NOT start your response with meta-commentary, status notes, or parenthetical phrases like "(Looking up shows near...)", "(Searching...)", or similar thinking notes. Jump straight into your natural answer.
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

GEOLOCATION RULES (VERY IMPORTANT — FOLLOW THESE EXACTLY):
- When a Spotlight record includes a "Distance from you: ~X km (~Y miles)" line, you MUST mention that exact distance naturally in your answer.
- Example: if the record says "Distance from you: ~35 km (~21.7 miles)", you could say "Bad Bunny at Kaseya Center in Miami is the closest, about 35 km (22 miles) away from where you are."
- When the retrieved results are sorted by distance (nearest first), present them in that order. The first item you list should be the closest one.
- If the context shows the user is very far away from every concert (thousands of km), be honest about it but still helpful. For example: "Right now all the Spotlight shows are in the USA, and the closest one to you in Bucharest is Drake in New York at about 7,950 km — but it's still a great show!"
- If the user mentions being "in [City]" or "from [City]", reference that city in your reply — for example "Since you're in London..." or "Based on you being in San Francisco...".

TEMPORAL RULES (VERY IMPORTANT — FOLLOW THESE EXACTLY):
- When the retrieved records are already filtered to a specific time window (e.g., October 2026), just list those events naturally. Do NOT say "I don't have that info."
- If no events exist in the requested window, say something like "There are no Spotlight shows scheduled for [month/period] right now" and offer to help with other searches.
- If a "Current date context" line appears at the top of the context block, use it to correctly interpret relative terms like "next month" or "this week".

Spotlight records you may reference (ONLY use facts from these — nothing external).
If the block says "No direct database records yet" that means nothing was retrieved, so do NOT guess or invent shows — just tell the user you don't have results right now and suggest trying a simpler artist name or city.
-----
{context_text}
-----
"""

RECORDS_FOUND_HEADER = "Found {count} match{plural} in the Spotlight database:"
NO_RECORDS_MSG = "No direct database records yet. Run python ingest.py (or POST /api/v1/chat/ingest) to index events, artists, and venues."

_BROWSER_GEO_PROMPT = (
    "Sure — if you'd like, I can use your browser's current location to show you the nearest concerts. "
    "Just hit the 📍 'Use my location' button in the chat header, or share what city you're in and I'll take it from there!"
)


def _strip_markdown(text: str) -> str:
    if not text:
        return text
    import re
    t = text
    t = re.sub(r"^\s*\([^)]*\)\s*", "", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"\*(.+?)\*", r"\1", t)
    t = re.sub(r"__(.+?)__", r"\1", t)
    t = re.sub(r"_(.+?)_", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"^\s{0,4}[-*+]\s+", "  - ", t, flags=re.MULTILINE)
    t = t.replace("|", "/")
    t = re.sub(r"^#{1,6}\s*", "", t, flags=re.MULTILINE)
    return t.strip()


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


def _resolve_user_coordinates(
    intent: LocationIntentResult,
) -> Tuple[Optional[Tuple[float, float]], Optional[str]]:
    """Figure out what (lat, lng) to use for the user, plus a human-readable label.

    Priority:
      1. Coordinates sent directly from the browser (navigator.geolocation).
      2. City explicitly named in the current message -> Nominatim.
      3. City found in conversation history -> Nominatim.
    Returns ((lat, lng) or None, display_label or None).
    """
    if intent.coords_from_browser is not None:
        lat, lng = intent.coords_from_browser
        return (lat, lng), "your current location"

    city_candidate: Optional[str] = intent.extracted_city or intent.city_from_history
    if not city_candidate:
        return None, None

    coords = geocoder.geocode(city_candidate)
    if coords is None:
        logger.info("Geocoding returned no results for city=%r", city_candidate)
        return None, city_candidate
    lat, lng = coords
    logger.info("Geocoded city=%r -> (%.4f, %.4f)", city_candidate, lat, lng)
    return (lat, lng), city_candidate


def process_chat_request(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    user_latitude: Optional[float] = None,
    user_longitude: Optional[float] = None,
) -> Dict[str, Any]:
    history = history or []

    # --- Temporal intent ---
    temporal = extract_date_range(message)
    date_range = (temporal.start, temporal.end) if temporal.has_range else None
    if temporal.has_range:
        logger.info("Temporal intent: %s -> %s (label=%r)", temporal.start, temporal.end, temporal.label)

    # --- Location intent ---
    intent = detect_location_intent(
        message,
        history=history,
        browser_lat=user_latitude,
        browser_lng=user_longitude,
    )
    logger.info("Location intent: %s", intent.to_dict())

    needs_browser_geo = False
    resolved_location_label: Optional[str] = None

    if intent.needs_location:
        if intent.use_browser_geolocation:
            needs_browser_geo = True
            sources: List[str] = []
            return {
                "reply": _strip_markdown(_BROWSER_GEO_PROMPT),
                "sources": sources,
                "needs_browser_geolocation": True,
                "resolved_location": None,
            }

        user_coords: Optional[Tuple[float, float]] = None
        location_label: Optional[str] = None
        user_coords, location_label = _resolve_user_coordinates(intent)
        resolved_location_label = location_label

        if user_coords is not None and intent.is_nearest:
            retrieved_docs = retriever.find_nearest_events(
                user_lat=user_coords[0],
                user_lng=user_coords[1],
                date_range=date_range,
            )
        else:
            retrieved_docs = retriever.retrieve_relevant_context(
                message,
                date_range=date_range,
                user_coords=user_coords
            )
        temporal_empty = False
    elif temporal.has_range:
        # Pure temporal query — no location signal, just filter by date
        retrieved_docs = retriever.find_events_in_range(
            date_start=temporal.start,
            date_end=temporal.end,
        )
        if not retrieved_docs:
            # Nothing in that window — fall back to showing upcoming events
            retrieved_docs = retriever.find_events_in_range(
                date_start=datetime.utcnow(),
                date_end=datetime(2099, 1, 1),
                top_k=5,
            )
            temporal_empty = True
        else:
            temporal_empty = False
    else:
        retrieved_docs = retriever.retrieve_relevant_context(message)
        temporal_empty = False


    context_text = _format_context(retrieved_docs)
    logger.info("Retrieved %d docs for query: %r", len(retrieved_docs), message)

    # Inject temporal context so the LLM knows what window was searched
    now_label = datetime.utcnow().strftime("%B %d, %Y")
    preamble_parts = [f"Current date context: today is {now_label} (UTC)."]
    if temporal.has_range:
        if temporal_empty:
            preamble_parts.append(
                f"IMPORTANT: No Spotlight events were found in the requested period ({temporal.label}). "
                f"The records below are the next upcoming shows instead. "
                f"Tell the user clearly that there are no shows in {temporal.label} and offer these as alternatives."
            )
        else:
            preamble_parts.append(f"Events shown are filtered to: {temporal.label}.")
    if resolved_location_label:
        preamble_parts.append(f"User location context: treating the user as being in/at {resolved_location_label}.")
    context_text = "\n".join(preamble_parts) + "\n\n" + context_text

    formatted_system_prompt = SYSTEM_PROMPT.format(context_text=context_text)

    reply = llm_service.generate_completion(
        system_prompt=formatted_system_prompt,
        user_message=message,
        history=history,
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
        "needs_browser_geolocation": bool(needs_browser_geo),
        "resolved_location": resolved_location_label,
    }
