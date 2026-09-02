import logging
from typing import List, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class Embedder:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
        self._model = None

    def _ensure_model(self):
        if self._model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            inferred = self._model.get_sentence_embedding_dimension()
            if inferred and inferred != self.dimension:
                logger.warning(
                    "Embedding dimension mismatch: config=%s actual=%s. Overwriting to %s.",
                    self.dimension,
                    inferred,
                    inferred,
                )
                self.dimension = inferred
        except Exception as e:
            logger.error("Failed to load embedding model %s: %s", self.model_name, e)
            raise

    def embed_one(self, text: str) -> List[float]:
        self._ensure_model()
        vec = self._model.encode(text, normalize_embeddings=True, show_progress_bar=False)
        return vec.tolist()

    def embed_many(self, texts: List[str], batch_size: int = 16) -> List[List[float]]:
        self._ensure_model()
        if not texts:
            return []
        vectors = self._model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=batch_size,
        )
        return [v.tolist() for v in vectors]


embedder = Embedder()
