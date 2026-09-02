import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.provider = "none"
        self.client = None
        self.model = settings.GROQ_MODEL
        self._available_models: Optional[List[str]] = None
        self.init_errors: List[Dict[str, Any]] = []
        self.groq_api_key_present: bool = bool(settings.GROQ_API_KEY)
        self.anthropic_api_key_present: bool = bool(settings.ANTHROPIC_API_KEY)
        self.model_probe_results: List[Dict[str, Any]] = []

        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.client = Groq(api_key=settings.GROQ_API_KEY)
                self.provider = "groq"
                self._pick_working_groq_model()
                if self.provider != "none":
                    logger.info("LLM provider: Groq initialized with model %s", self.model)
            except Exception as e:
                err = {"provider": "groq", "stage": "client_init", "error": str(e)}
                self.init_errors.append(err)
                logger.warning("Failed to initialize Groq client: %s", e)
                self.client = None
                self.provider = "none"

        if self.provider == "none" and settings.ANTHROPIC_API_KEY:
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                self.provider = "anthropic"
                self.model = "claude-3-haiku-20240307"
                logger.info("LLM provider: Anthropic initialized with model %s", self.model)
            except Exception as e:
                err = {"provider": "anthropic", "stage": "client_init", "error": str(e)}
                self.init_errors.append(err)
                logger.warning("Failed to initialize Anthropic client: %s", e)
                self.client = None
                self.provider = "none"

        if self.provider == "none":
            logger.warning("No LLM provider configured. Will return offline fallback responses.")

    def diagnostics(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model": self.model if self.provider != "none" else "offline-fallback",
            "groq_api_key_present": self.groq_api_key_present,
            "groq_model_configured": settings.GROQ_MODEL if self.groq_api_key_present else None,
            "groq_fallback_models": settings.GROQ_FALLBACK_MODELS if self.groq_api_key_present else [],
            "anthropic_api_key_present": self.anthropic_api_key_present,
            "init_errors": self.init_errors,
            "model_probe_results": self.model_probe_results,
        }

    def _groq_models_to_try(self) -> List[str]:
        models = [self.model]
        for m in settings.GROQ_FALLBACK_MODELS:
            if m not in models:
                models.append(m)
        return models

    def _pick_working_groq_model(self) -> None:
        """Probe configured + fallback Groq models; keep first that returns 2xx on a tiny call."""
        if not self.client or self.provider != "groq":
            return
        for candidate in self._groq_models_to_try():
            try:
                r = self.client.chat.completions.create(
                    model=candidate,
                    messages=[{"role": "user", "content": "hi"}],
                    max_tokens=2,
                    temperature=0,
                )
                if getattr(r, "choices", None):
                    self.model = candidate
                    self.model_probe_results.append({"model": candidate, "ok": True})
                    logger.info("Selected working Groq model: %s", candidate)
                    return
                self.model_probe_results.append({"model": candidate, "ok": False, "error": "no_choices_in_response"})
            except Exception as e:
                self.model_probe_results.append({"model": candidate, "ok": False, "error": str(e)[:200]})
                logger.info("Groq model %s not available: %s", candidate, e)
        logger.warning("None of the configured Groq models worked; will use offline fallback.")
        self.provider = "none"
        self.client = None

    def _build_messages(
        self,
        system_prompt: str,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []

        if self.provider != "anthropic":
            messages.append({"role": "system", "content": system_prompt})

        if history:
            for item in history:
                role = item.get("role", "user")
                content = item.get("content", "")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": user_message})
        return messages

    def _fallback_response(self, user_message: str, context_text: str) -> str:
        no_records = (
            (not context_text)
            or ("No direct database records" in context_text)
            or ("No matching records" in context_text)
        )
        header = "[Offline Mode] Spotlight AI — LLM API unavailable.\n\n"

        if not no_records:
            tail = (
                "\n\n(Your LLM API is currently not reachable so I'm showing raw DB results above. "
                "Set a valid GROQ_API_KEY (and working model) or ANTHROPIC_API_KEY for natural-language answers. "
                "Models auto-tested at startup. Tip: run `python ingest.py` for semantic search.)"
            )
            return header + context_text + tail

        intro = (
            "I'm Spotlight AI, your concert and live event assistant. I can help with:\n\n"
            "  • Finding upcoming concerts by artist, venue, city, or genre\n"
            "  • Ticket pricing and availability details\n"
            "  • Venue information and location\n"
            "  • Artist lineups and upcoming shows\n\n"
            "Example questions:\n"
            "  - What Bad Bunny concerts are coming up?\n"
            "  - Tell me about Taylor Swift at SoFi Stadium\n"
            "  - What's the cheapest ticket for Drake in Brooklyn?\n"
            "  - Show me venues in California\n\n"
            "Note: Run `python ingest.py` (or POST /api/v1/chat/ingest) to index the database, "
            "then add a valid GROQ_API_KEY with an available model for natural-language answers."
        )
        return header + intro

    def generate_completion(
        self,
        system_prompt: str,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
        context_text: str = "",
    ) -> str:
        if self.provider == "none" or self.client is None:
            return self._fallback_response(user_message, context_text)

        try:
            messages = self._build_messages(system_prompt, user_message, history)

            if self.provider == "groq":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                content = response.choices[0].message.content
                if content:
                    return content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model=self.model,
                    system=system_prompt,
                    messages=[m for m in messages if m["role"] != "system"],
                    max_tokens=1024,
                    temperature=0.7,
                )
                if response.content and len(response.content) > 0:
                    return response.content[0].text

        except Exception as e:
            logger.error("LLM call failed (%s/%s): %s", self.provider, self.model, e, exc_info=True)
            return self._fallback_response(user_message, context_text)

        return self._fallback_response(user_message, context_text)


llm_service = LLMService()

