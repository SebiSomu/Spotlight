import logging
import re
from typing import List, Dict, Any, Optional
from app.config import settings
from app.db import ensure_embeddings_table, get_cursor
from app.embedder import embedder

logger = logging.getLogger(__name__)

_STOPWORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "of", "in",
    "on", "at", "to", "for", "with", "from", "by", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "may", "might", "can", "i", "you", "he", "she",
    "it", "we", "they", "them", "his", "her", "their", "our", "your", "my",
    "me", "him", "us", "what", "which", "who", "whom", "this", "that", "these",
    "those", "am", "about", "into", "more", "most", "some", "any", "no", "not",
    "so", "up", "out", "just", "tell", "show", "give", "get", "find", "look",
    "know", "want", "need", "please", "thanks", "thank", "ok", "okay", "yes",
    "hi", "hello", "hey", "how", "why", "when", "where", "there", "here",
    "concert", "concerts", "show", "shows", "ticket", "tickets", "info",
    "information", "details", "detail", "about", "coming", "upcoming",
})

_WORD_RE = re.compile(r"[a-zA-Z0-9_]+")


def _extract_search_terms(query: str) -> List[str]:
    """Return deduplicated ordered list of terms for keyword search.

    Includes:
      - exact lowercase phrase (whole trimmed query)
      - bigrams (2 consecutive words)
      - individual non-stopwords of length >= 2
    """
    q = (query or "").strip().lower()
    if not q:
        return []

    terms: List[str] = []
    seen = set()

    def _add(t: str) -> None:
        if not t:
            return
        if t in seen:
            return
        seen.add(t)
        terms.append(t)

    _add(q)

    words: List[str] = [w for w in _WORD_RE.findall(q) if len(w) >= 2]
    filtered = [w for w in words if w not in _STOPWORDS]

    for i in range(len(filtered) - 1):
        _add(f"{filtered[i]} {filtered[i + 1]}")

    for w in filtered:
        _add(w)

    return terms


class EventRetriever:
    def __init__(self):
        self._ready: Optional[bool] = None

    def _ensure_ready(self):
        if self._ready is True:
            return
        if self._ready is False:
            return
        try:
            ensure_embeddings_table(settings.EMBEDDING_DIMENSION)
            self._ready = True
        except Exception as e:
            logger.warning("Vector search permanently disabled: %s", e)
            self._ready = False

    def retrieve_relevant_context(self, query: str, top_k: int = None) -> List[Dict[str, Any]]:
        top_k = top_k or settings.VECTOR_TOP_K
        self._ensure_ready()

        if not self._ready:
            logger.warning("Vector DB not ready; falling back to keyword-only search.")
            return self._keyword_fallback(query, top_k)

        try:
            qvec = embedder.embed_one(query)
        except Exception as e:
            logger.error("Failed to embed query: %s", e)
            return self._keyword_fallback(query, top_k)

        try:
            with get_cursor() as cur:
                cur.execute(
                    """
                    SELECT entity_type, entity_id, chunk_id, content, metadata,
                           (embedding <=> %s::vector) AS score
                    FROM embeddings
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (str(qvec), str(qvec), top_k),
                )
                rows = cur.fetchall()

            results: List[Dict[str, Any]] = []
            for row in rows:
                score = float(row["score"]) if row["score"] is not None else None
                if score is not None and score > 1.5:
                    continue
                metadata = row["metadata"] or {}
                entity_type = row["entity_type"] or "unknown"
                entity_id = row["entity_id"]
                source_id = f"{entity_type}-{entity_id}"
                results.append({
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "source_id": source_id,
                    "score": score,
                    "text": row["content"],
                    "metadata": metadata,
                })
            if results:
                return results
            return self._keyword_fallback(query, top_k)
        except Exception as e:
            logger.error("Vector search failed: %s", e, exc_info=True)
            return self._keyword_fallback(query, top_k)

    def _build_content_block(self, row: Dict[str, Any]) -> str:
        venue_parts = [row["venue_name"] or ""]
        city = row["venue_city"]
        if city:
            venue_parts.append(city)
        venue_str = ", ".join(p for p in venue_parts if p)
        min_price = round((row.get("min_price_cents") or 0) / 100.0, 2)
        lines = [
            f"Event: {row.get('title') or ''}",
            f"Artist: {row.get('artist') or ''}",
            f"Genre: {row.get('genre') or ''}",
            f"Date: {row.get('starts_at') or ''}",
            f"Venue: {venue_str}",
            f"Description: {row.get('description') or 'N/A'}",
            f"Min price: ${min_price}",
            f"Status: {row.get('status') or ''}",
        ]
        return "\n".join(lines)

    def _keyword_fallback(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        try:
            terms = _extract_search_terms(query)
            logger.info("Keyword fallback: %d search term(s): %r", len(terms), terms)

            if not terms:
                with get_cursor() as cur:
                    cur.execute(
                        """
                        SELECT e.id, e.title, e.artist, e.genre, e.description, e.starts_at,
                               e.status, e.min_price_cents,
                               v.name AS venue_name, v.city AS venue_city
                        FROM events e
                        INNER JOIN venues v ON v.id = e.venue_id
                        ORDER BY e.starts_at ASC
                        LIMIT %s;
                        """,
                        (top_k,),
                    )
                    rows = cur.fetchall()
                results = []
                for row in rows:
                    r = dict(row)
                    results.append({
                        "entity_type": "event",
                        "entity_id": r["id"],
                        "source_id": f"event-{r['id']}",
                        "score": None,
                        "text": self._build_content_block(r),
                        "metadata": {},
                    })
                return results

            where_clauses: List[str] = []
            params: List[Any] = []
            score_expr_parts: List[str] = []

            for t in terms:
                like = f"%{t}%"
                col_exprs = [
                    "LOWER(COALESCE(e.title, ''))",
                    "LOWER(COALESCE(e.artist, ''))",
                    "LOWER(COALESCE(e.genre, ''))",
                    "LOWER(COALESCE(v.name, ''))",
                    "LOWER(COALESCE(v.city, ''))",
                    "LOWER(COALESCE(v.state, ''))",
                    "LOWER(COALESCE(e.description, ''))",
                ]
                term_wheres = [f"{c} LIKE %s" for c in col_exprs]
                where_clauses.append("(" + " OR ".join(term_wheres) + ")")
                for _ in col_exprs:
                    params.append(like)

                score_expr_parts.append(
                    " + ".join(
                        f"(CASE WHEN {c} LIKE %s THEN 1 ELSE 0 END)" for c in col_exprs
                    )
                )
                for _ in col_exprs:
                    params.append(like)

            score_expr = "(" + " + ".join(score_expr_parts) + ")"

            sql = f"""
                SELECT e.id, e.title, e.artist, e.genre, e.description, e.starts_at,
                       e.status, e.min_price_cents,
                       v.name AS venue_name, v.city AS venue_city,
                       {score_expr} AS match_score
                FROM events e
                INNER JOIN venues v ON v.id = e.venue_id
                WHERE {" OR ".join(where_clauses)}
                ORDER BY match_score DESC, e.starts_at ASC
                LIMIT %s;
            """
            params.append(top_k)

            with get_cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()

            logger.info("Keyword fallback matched %d row(s) for query %r", len(rows), query)

            results = []
            for row in rows:
                r = dict(row)
                results.append({
                    "entity_type": "event",
                    "entity_id": r["id"],
                    "source_id": f"event-{r['id']}",
                    "score": None,
                    "text": self._build_content_block(r),
                    "metadata": {"match_score": int(r.get("match_score") or 0)},
                })
            return results
        except Exception as e:
            logger.error("Keyword fallback also failed: %s", e, exc_info=True)
            return []


retriever = EventRetriever()
