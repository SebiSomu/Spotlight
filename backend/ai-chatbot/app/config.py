import logging
import os
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH_CANDIDATES = [
    PROJECT_ROOT / ".env",
    PROJECT_ROOT / ".env.local",
    Path.cwd() / ".env",
    Path.cwd() / ".env.local",
]

DOTENV_LOADED_FROM: str | None = None
for candidate in ENV_PATH_CANDIDATES:
    if candidate.is_file():
        load_dotenv(dotenv_path=candidate, override=False)
        DOTENV_LOADED_FROM = str(candidate)
        logger.info("Loaded environment from %s", candidate)
        break
if DOTENV_LOADED_FROM is None:
    load_dotenv()
    logger.info(
        "No .env file found in candidates: %s. Using process/shell environment only.",
        [str(p) for p in ENV_PATH_CANDIDATES],
    )


def _parse_csv(val: str) -> list:
    return [s.strip() for s in (val or "").split(",") if s.strip()]


def _mask_key(k: str) -> str:
    if not k:
        return "(not set)"
    if len(k) <= 8:
        return "*" * len(k)
    return k[:4] + "*" * max(2, len(k) - 8) + k[-4:]


class Settings:
    def __init__(self):
        self.GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
        self.GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        self.GROQ_FALLBACK_MODELS: list = _parse_csv(
            os.getenv(
                "GROQ_FALLBACK_MODELS",
                "openai/gpt-oss-120b,llama-3.3-70b-versatile,groq/compound-mini,groq/compound,qwen/qwen3.6-27b,qwen/qwen3.8-27b,llama-3.1-8b-instant",
            )
        )
        self.ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/my_rails_server_development")
        self.EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        self.EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
        self.VECTOR_TOP_K: int = int(os.getenv("VECTOR_TOP_K", "5"))
        self.PORT: int = int(os.getenv("PORT", "8000"))

    def summary(self) -> dict:
        return {
            "dotenv_loaded_from": DOTENV_LOADED_FROM,
            "groq_api_key_masked": _mask_key(self.GROQ_API_KEY),
            "groq_model": self.GROQ_MODEL,
            "groq_fallback_model_count": len(self.GROQ_FALLBACK_MODELS),
            "anthropic_api_key_set": bool(self.ANTHROPIC_API_KEY),
            "database_url_masked": self._mask_dsn(self.DATABASE_URL),
            "embedding_model": self.EMBEDDING_MODEL,
            "embedding_dimension": self.EMBEDDING_DIMENSION,
            "vector_top_k": self.VECTOR_TOP_K,
            "port": self.PORT,
        }

    @staticmethod
    def _mask_dsn(dsn: str) -> str:
        if not dsn:
            return "(not set)"
        try:
            from urllib.parse import urlparse
            parsed = urlparse(dsn)
            host = parsed.hostname or "?"
            port = parsed.port or "?"
            db = parsed.path.lstrip("/") or "?"
            user_part = f"{parsed.username}:***@" if parsed.username else ""
            return f"{parsed.scheme}://{user_part}{host}:{port}/{db}"
        except Exception:
            return "(unparseable)"


settings = Settings()
logger.info(
    "Config summary: GROQ=%s | model=%s | fallbacks=%d | ANTHROPIC=%s | DB=%s | dotenv=%s",
    _mask_key(settings.GROQ_API_KEY),
    settings.GROQ_MODEL,
    len(settings.GROQ_FALLBACK_MODELS),
    "set" if settings.ANTHROPIC_API_KEY else "not set",
    Settings._mask_dsn(settings.DATABASE_URL),
    DOTENV_LOADED_FROM or "(none)",
)
