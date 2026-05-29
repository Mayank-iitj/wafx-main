"""
HireMind AI — Embedding Service
Generates semantic embeddings for JDs and resumes.
Supports: sentence-transformers (local) and OpenAI text-embedding-3-large.
Falls back to TF-IDF mock vectors in demo mode.
"""
import hashlib
import math
import random
from typing import List, Optional
from app.core.config import settings


class EmbeddingService:
    """
    Unified embedding interface. Automatically selects provider based on config.

    Priority: OpenAI > sentence-transformers > mock
    """

    def __init__(self):
        self._model = None
        self._openai_client = None
        self._provider = self._detect_provider()

    def _detect_provider(self) -> str:
        if settings.OPENAI_API_KEY and settings.AI_PROVIDER == "openai":
            return "openai"
        try:
            from sentence_transformers import SentenceTransformer  # noqa
            return "sentence_transformers"
        except ImportError:
            return "mock"

    def _load_model(self):
        """Lazy-load the embedding model."""
        if self._model is not None:
            return
        if self._provider == "sentence_transformers":
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            print(f"[EmbeddingService] Loaded model: {settings.EMBEDDING_MODEL}")
        elif self._provider == "openai":
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            print("[EmbeddingService] Using OpenAI embeddings")

    def embed(self, text: str) -> List[float]:
        """Generate a single embedding vector."""
        if not text or not text.strip():
            return self._zero_vector()
        self._load_model()

        if self._provider == "sentence_transformers":
            return self._model.encode(text, normalize_embeddings=True).tolist()
        elif self._provider == "openai":
            response = self._openai_client.embeddings.create(
                model="text-embedding-3-large",
                input=text[:8000],
            )
            return response.data[0].embedding
        else:
            return self._mock_embed(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts efficiently."""
        if not texts:
            return []
        self._load_model()

        if self._provider == "sentence_transformers":
            embeddings = self._model.encode(texts, normalize_embeddings=True, batch_size=32)
            return [e.tolist() for e in embeddings]
        elif self._provider == "openai":
            # OpenAI batch limit: 2048 texts
            results = []
            for i in range(0, len(texts), 100):
                batch = texts[i:i + 100]
                response = self._openai_client.embeddings.create(
                    model="text-embedding-3-large",
                    input=[t[:8000] for t in batch],
                )
                results.extend([d.embedding for d in response.data])
            return results
        else:
            return [self._mock_embed(t) for t in texts]

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if not vec1 or not vec2:
            return 0.0
        dot = sum(a * b for a, b in zip(vec1, vec2))
        mag1 = math.sqrt(sum(a ** 2 for a in vec1))
        mag2 = math.sqrt(sum(b ** 2 for b in vec2))
        if mag1 == 0 or mag2 == 0:
            return 0.0
        return max(-1.0, min(1.0, dot / (mag1 * mag2)))

    def _mock_embed(self, text: str, dim: int = 384) -> List[float]:
        """
        Deterministic mock embedding using text hash.
        Ensures consistent similarity scores for demo mode.
        """
        seed = int(hashlib.md5(text.encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)
        vec = [rng.gauss(0, 1) for _ in range(dim)]
        # Normalize
        mag = math.sqrt(sum(x**2 for x in vec))
        return [x / mag for x in vec] if mag > 0 else vec

    def _zero_vector(self, dim: int = 384) -> List[float]:
        return [0.0] * dim

    @property
    def provider(self) -> str:
        return self._provider

    @property
    def dimension(self) -> int:
        if self._provider == "openai":
            return 3072  # text-embedding-3-large
        return 384  # all-MiniLM-L6-v2


embedding_service = EmbeddingService()
