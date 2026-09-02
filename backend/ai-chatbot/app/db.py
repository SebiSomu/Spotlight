import logging
from contextlib import contextmanager
from typing import Iterator, Optional
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from app.config import settings

logger = logging.getLogger(__name__)

_connection_pool: Optional[pool.SimpleConnectionPool] = None


def init_pool(minconn: int = 1, maxconn: int = 10) -> None:
    global _connection_pool
    if _connection_pool is not None:
        return
    try:
        _connection_pool = pool.SimpleConnectionPool(
            minconn=minconn,
            maxconn=maxconn,
            dsn=settings.DATABASE_URL,
        )
        logger.info("PostgreSQL connection pool initialized.")
    except Exception as e:
        logger.error("Failed to initialize DB pool: %s", e)
        _connection_pool = None


@contextmanager
def get_conn():
    global _connection_pool
    if _connection_pool is None:
        init_pool()
    if _connection_pool is None:
        raise RuntimeError("DB pool is not available. Check DATABASE_URL.")
    conn = _connection_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _connection_pool.putconn(conn)


@contextmanager
def get_cursor():
    with get_conn() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
        finally:
            cursor.close()


def ensure_vector_extension() -> None:
    try:
        with get_cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        logger.info("pgvector extension ensured.")
    except Exception as e:
        logger.warning("Could not ensure pgvector extension: %s", e)


def ensure_embeddings_table(dimension: int) -> None:
    ensure_vector_extension()
    try:
        with get_cursor() as cur:
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS embeddings (
                    id BIGSERIAL PRIMARY KEY,
                    entity_type TEXT NOT NULL,
                    entity_id BIGINT NOT NULL,
                    chunk_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB DEFAULT '{{}}'::jsonb,
                    embedding vector({dimension}),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE (entity_type, entity_id, chunk_id)
                );
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_embeddings_embedding ON embeddings "
                "USING hnsw (embedding vector_cosine_ops);"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_embeddings_entity ON embeddings (entity_type, entity_id);"
            )
        logger.info("Embeddings table ensured (dimension=%s).", dimension)
    except Exception as e:
        msg = str(e)
        is_vector_unavailable = (
            "type \"vector\" does not exist" in msg
            or "extension \"vector\" is not available" in msg
            or "data type vector does not exist" in msg
        )
        if is_vector_unavailable:
            logger.warning(
                "Embeddings table unavailable (pgvector extension missing). "
                "Install pgvector for semantic search, or use keyword-only fallback: %s",
                msg.splitlines()[0],
            )
        else:
            logger.error("Failed to ensure embeddings table: %s", e)
        raise
