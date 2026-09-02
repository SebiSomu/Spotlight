import logging
import json
from typing import List, Dict, Any
from app.config import settings
from app.db import ensure_embeddings_table, get_cursor
from app.embedder import embedder

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ingest")


def _fetch_source_rows() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT v.id, v.name, v.address, v.city, v.state, v.capacity,
                   v.image_url, COUNT(e.id) AS event_count
            FROM venues v
            LEFT JOIN events e ON e.venue_id = v.id
            GROUP BY v.id, v.name, v.address, v.city, v.state, v.capacity, v.image_url
            ORDER BY v.id;
            """
        )
        for row in cur.fetchall():
            location_parts = [p for p in [row["city"], row["state"]] if p]
            content = (
                f"Venue: {row['name']}\n"
                f"Location: {', '.join(location_parts) if location_parts else 'N/A'}\n"
                f"Address: {row['address'] or 'N/A'}\n"
                f"Capacity: {row['capacity'] or 'unknown'}\n"
                f"Upcoming event count: {row['event_count'] or 0}"
            )
            items.append({
                "entity_type": "venue",
                "entity_id": row["id"],
                "chunk_id": "main",
                "content": content,
                "metadata": {
                    "name": row["name"],
                    "city": row["city"],
                    "state": row["state"],
                    "capacity": row["capacity"],
                    "image_url": row["image_url"],
                },
            })

        cur.execute(
            """
            SELECT e.id, e.title, e.artist, e.genre, e.description, e.starts_at,
                   e.status, e.min_price_cents, e.image_url,
                   v.name AS venue_name, v.city AS venue_city, v.state AS venue_state,
                   COALESCE(json_agg(
                       json_build_object(
                           'name', tt.name,
                           'price_cents', tt.price_cents,
                           'price_dollars', ROUND(COALESCE(tt.price_cents,0)/100.0,2),
                           'remaining', tt.quantity_remaining,
                           'available', tt.quantity_available
                       )
                   ) FILTER (WHERE tt.id IS NOT NULL), '[]'::json) AS ticket_types
            FROM events e
            JOIN venues v ON v.id = e.venue_id
            LEFT JOIN ticket_types tt ON tt.event_id = e.id
            GROUP BY e.id, v.name, v.city, v.state
            ORDER BY e.id;
            """
        )
        for row in cur.fetchall():
            location_parts = [p for p in [row["venue_city"], row["venue_state"]] if p]
            min_price_usd = round((row["min_price_cents"] or 0) / 100.0, 2)
            try:
                tt_list = row["ticket_types"] if isinstance(row["ticket_types"], list) else []
            except Exception:
                tt_list = []
            ticket_lines = []
            for tt in tt_list:
                if tt:
                    ticket_lines.append(
                        f"  - {tt.get('name','?')}: ${tt.get('price_dollars', 0)} "
                        f"({tt.get('remaining', 0)} of {tt.get('available', 0)} left)"
                    )
            tickets_block = "\n".join(ticket_lines) if ticket_lines else "  (no ticket tiers loaded)"

            content = (
                f"Event: {row['title']}\n"
                f"Artist: {row['artist']}\n"
                f"Genre: {row['genre']}\n"
                f"Date: {row['starts_at']}\n"
                f"Venue: {row['venue_name']} ({', '.join(location_parts) if location_parts else 'N/A'})\n"
                f"Description: {row['description'] or 'N/A'}\n"
                f"Min ticket price: ${min_price_usd}\n"
                f"Status: {row['status']}\n"
                f"Ticket tiers:\n{tickets_block}"
            )
            items.append({
                "entity_type": "event",
                "entity_id": row["id"],
                "chunk_id": "main",
                "content": content,
                "metadata": {
                    "title": row["title"],
                    "artist": row["artist"],
                    "genre": row["genre"],
                    "starts_at": str(row["starts_at"]) if row["starts_at"] else None,
                    "venue_name": row["venue_name"],
                    "venue_city": row["venue_city"],
                    "min_price_usd": min_price_usd,
                    "status": row["status"],
                    "image_url": row["image_url"],
                },
            })

            artist_item = next(
                (x for x in items if x["entity_type"] == "artist" and x["metadata"]["name"] == row["artist"]),
                None,
            )
            if not artist_item:
                artist_upcoming: List[str] = []
                artist_upcoming.append(f"{row['title']} on {row['starts_at']} at {row['venue_name']} ({', '.join(location_parts)})")
                items.append({
                    "entity_type": "artist",
                    "entity_id": f"artist-{row['artist']}",
                    "chunk_id": "main",
                    "content": (
                        f"Artist: {row['artist']}\n"
                        f"Known for genre: {row['genre']}\n"
                        f"Upcoming show: {artist_upcoming[0]}"
                    ),
                    "metadata": {
                        "name": row["artist"],
                        "genre": row["genre"],
                        "upcoming_shows": artist_upcoming,
                    },
                })
            else:
                artist_item["metadata"]["upcoming_shows"].append(
                    f"{row['title']} on {row['starts_at']} at {row['venue_name']} ({', '.join(location_parts)})"
                )
                artist_upcoming = artist_item["metadata"]["upcoming_shows"]
                shows_text = "\n".join(f"  - {s}" for s in artist_upcoming)
                artist_item["content"] = (
                    f"Artist: {row['artist']}\n"
                    f"Known for genre: {row['genre']}\n"
                    f"Upcoming shows on Spotlight:\n{shows_text}"
                )
    return items


def _fix_entity_ids_and_batch(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    artist_counter = 100_000
    for it in items:
        if it["entity_type"] == "artist" and isinstance(it["entity_id"], str):
            it["entity_id"] = artist_counter
            artist_counter += 1
        it["entity_id"] = int(it["entity_id"])
    return items


def upsert_embeddings(items: List[Dict[str, Any]]) -> None:
    if not items:
        logger.info("No items to embed.")
        return
    texts = [it["content"] for it in items]
    logger.info("Embedding %d chunks with model=%s ...", len(texts), settings.EMBEDDING_MODEL)
    vectors = embedder.embed_many(texts, batch_size=16)
    logger.info("Embedding done. Upserting into Postgres...")

    upserted = 0
    with get_cursor() as cur:
        for it, vec in zip(items, vectors):
            cur.execute(
                """
                INSERT INTO embeddings (entity_type, entity_id, chunk_id, content, metadata, embedding)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s::vector)
                ON CONFLICT (entity_type, entity_id, chunk_id)
                DO UPDATE SET
                    content = EXCLUDED.content,
                    metadata = EXCLUDED.metadata,
                    embedding = EXCLUDED.embedding;
                """,
                (
                    it["entity_type"],
                    it["entity_id"],
                    it["chunk_id"],
                    it["content"],
                    json.dumps(it["metadata"] or {}),
                    str(vec),
                ),
            )
            upserted += 1
    logger.info("Upserted %d embeddings successfully.", upserted)


def print_stats() -> None:
    with get_cursor() as cur:
        cur.execute(
            "SELECT entity_type, COUNT(*) FROM embeddings GROUP BY entity_type ORDER BY entity_type;"
        )
        rows = cur.fetchall()
    print("\n=== Embeddings table stats ===")
    for r in rows:
        print(f"  {r['entity_type']:8s}: {r['count']:>4d} rows")
    if not rows:
        print("  (empty)")


def run() -> None:
    logger.info("Starting ingestion job...")
    ensure_embeddings_table(settings.EMBEDDING_DIMENSION)
    raw_items = _fetch_source_rows()
    items = _fix_entity_ids_and_batch(raw_items)
    logger.info("Fetched %d chunks from source tables.", len(items))
    upsert_embeddings(items)
    print_stats()
    logger.info("Ingestion complete.")


if __name__ == "__main__":
    run()
