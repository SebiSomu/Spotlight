import logging
import math
import os
import re
import json
import time
import asyncio
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List

import httpx

logger = logging.getLogger(__name__)

_NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
_NOMINATIM_USER_AGENT = "SpotlightAI-Chatbot/1.0 (event concierge)"
_NOMINATIM_MIN_INTERVAL = 1.05

_CACHE_FILE_DEFAULT = Path(__file__).resolve().parent.parent / "geocode_cache.json"

_HAVERSINE_EARTH_RADIUS_KM = 6371.0088
_MILES_PER_KM = 0.6213711922

_LOC_INTRO_PATTERNS = [
    r"\bi(?:'| a)?m\b",
    r"\bi\s+am\b",
    r"\blocated\s+in\b",
    r"\bliving\s+in\b",
    r"\bbased\s+in\b",
    r"\bright\s+now\s+in\b",
    r"\bsunt\s+(?:din|în|in)\b",
    r"\bma\s+aflu\s+(?:în|in|la)\b",
    r"\bacum\s+sunt\s+(?:în|in|la)\b",
    r"\bcoming\s+from\b",
    r"\btravel(?:l|)ing\s+to\b",
    r"\bcurrently\s+in\b",
    r"\bvisiting\b",
]

_END_OF_CITY_HINT_WORDS = (
    r"(?:show|shows|concert|concerts|event|events|ticket|tickets|"
    r"nearest|closest|nearby|near|looking|please|tell|show|care|what|which|who|where|when|why|how|"
    r"apropiat|apropiate|aproape|concert|eveniment|bilet|bine|mers|va|vreau|să|îți|ți)"
)

_LOC_FROM_PATTERNS = [
    re.compile(
        r"(?i)(?:" + "|".join(_LOC_INTRO_PATTERNS) + r")\s+"
        r"([A-Za-zÀ-ÿ\u0100-\u024F][A-Za-zÀ-ÿ\u0100-\u024F0-9\s'\-.,]{0,80}?)"
        r"(?=(?:\s*[,.;!?])?\s*(?:\b" + _END_OF_CITY_HINT_WORDS + r"\b|$))",
        re.UNICODE,
    ),
    re.compile(
        r"(?i)\bfrom\s+([A-Za-zÀ-ÿ\u0100-\u024F][A-Za-zÀ-ÿ\u0100-\u024F0-9\s'\-.,]{0,80}?)"
        r"(?=(?:\s*[,.;!?])?\s*(?:\b" + _END_OF_CITY_HINT_WORDS + r"\b|$))",
        re.UNICODE,
    ),
]

_WHERE_AM_I_PATTERNS = [
    re.compile(r"(?i)\bwhere\s*(?:am|'?r?e?)\s*i\b", re.UNICODE),
    re.compile(r"(?i)\bunde\s+sunt\b", re.UNICODE),
    re.compile(r"(?i)\bwhats?\s*my\s*(?:current\s*)?location\b", re.UNICODE),
    re.compile(r"(?i)\bloca(?:t|ț)ia\s*(?:mea|actuala)?\b", re.UNICODE),
    re.compile(r"(?i)\buse\s*(?:my|the)\s*current\s*location\b", re.UNICODE),
    re.compile(r"(?i)\bgps\b", re.UNICODE),
]

_NEAREST_QUERY_PATTERNS = [
    re.compile(r"(?i)\b(closest|nearest|nearby|aproape|apropiat|apropiate)\b", re.UNICODE),
    re.compile(r"(?i)\bclose(?:st)?\s+to\s+me\b", re.UNICODE),
    re.compile(r"(?i)\bnear\s+me\b", re.UNICODE),
    re.compile(r"(?i)\bcel\s+mai\s+apropiat\b", re.UNICODE),
    re.compile(r"(?i)\bcele\s+mai\s+apropiate\b", re.UNICODE),
    re.compile(r"(?i)\b(?:which|what).*(?:closest|nearest|near(?:est)?)\b", re.UNICODE),
]

_CITY_NAME_RE = re.compile(
    r"^[A-Za-zÀ-ÿ\u0100-\u024F][A-Za-zÀ-ÿ\u0100-\u024F0-9\s'\-.,()]{1,60}$", re.UNICODE
)

def _normalize_key(q: str) -> str:
    if not q:
        return ""
    return re.sub(r"\s+", " ", (q or "").strip().lower())


def haversine_distance(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> Tuple[float, float]:
    """Return (distance_km, distance_miles) using the haversine great-circle formula."""
    lat1_r = math.radians(float(lat1))
    lat2_r = math.radians(float(lat2))
    dlat_r = math.radians(float(lat2) - float(lat1))
    dlng_r = math.radians(float(lng2) - float(lng1))

    a = (
        math.sin(dlat_r / 2.0) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng_r / 2.0) ** 2
    )
    c = 2.0 * math.asin(math.sqrt(a))
    km = _HAVERSINE_EARTH_RADIUS_KM * c
    miles = km * _MILES_PER_KM
    return round(km, 1), round(miles, 1)


class NominatimGeocoder:
    """Free OpenStreetMap Nominatim geocoder with on-disk + in-memory cache.

    Respects the ~1 req/s public rate limit of the public Nominatim instance.
    """

    def __init__(self, cache_file: Optional[Path] = None):
        self.cache_file = Path(cache_file) if cache_file else _CACHE_FILE_DEFAULT
        self._cache: Dict[str, Tuple[float, float]] = {}
        self._last_call_ts: float = 0.0
        self._httpx_client: Optional[httpx.Client] = None
        self._load_cache()

    # -- cache management -----------------------------------------------------

    def _load_cache(self) -> None:
        try:
            if self.cache_file.exists():
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                loaded = 0
                for k, v in raw.items():
                    if (
                        isinstance(v, list)
                        and len(v) == 2
                        and all(isinstance(x, (int, float)) for x in v)
                    ):
                        self._cache[str(k)] = (float(v[0]), float(v[1]))
                        loaded += 1
                logger.info("Loaded %d cached geocode entries from %s", loaded, self.cache_file)
        except Exception as e:
            logger.warning("Could not load geocode cache from %s: %s", self.cache_file, e)
            self._cache = {}

    def _save_cache(self) -> None:
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            serializable = {k: list(v) for k, v in self._cache.items()}
            tmp = self.cache_file.with_suffix(self.cache_file.suffix + ".tmp")
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(serializable, f, ensure_ascii=False, indent=2)
            os.replace(tmp, self.cache_file)
        except Exception as e:
            logger.warning("Could not persist geocode cache: %s", e)

    # -- network --------------------------------------------------------------

    def _get_client(self) -> httpx.Client:
        if self._httpx_client is None:
            self._httpx_client = httpx.Client(timeout=httpx.Timeout(10.0, connect=8.0))
        return self._httpx_client

    def _throttle(self) -> None:
        now = time.monotonic()
        wait = _NOMINATIM_MIN_INTERVAL - (now - self._last_call_ts)
        if wait > 0:
            time.sleep(wait)
        self._last_call_ts = time.monotonic()

    def _call_nominatim(self, query: str) -> Optional[Tuple[float, float]]:
        self._throttle()
        try:
            client = self._get_client()
            resp = client.get(
                f"{_NOMINATIM_BASE}/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 0,
                },
                headers={
                    "User-Agent": _NOMINATIM_USER_AGENT,
                    "Accept": "application/json",
                },
            )
            if resp.status_code != 200:
                logger.warning("Nominatim returned HTTP %s for %r", resp.status_code, query)
                return None
            data = resp.json()
            if not isinstance(data, list) or not data:
                return None
            first = data[0]
            lat_s = first.get("lat")
            lon_s = first.get("lon")
            if not (lat_s and lon_s):
                return None
            return float(lat_s), float(lon_s)
        except Exception as e:
            logger.warning("Nominatim request failed for %r: %s", query, e)
            return None

    # -- public ---------------------------------------------------------------

    def geocode(self, query: str) -> Optional[Tuple[float, float]]:
        """Resolve a free-form query (city, address, POI) to (lat, lng).

        Cached forever (cities don't move). Returns None on failure.
        """
        q = (query or "").strip()
        if not q:
            return None
        key = _normalize_key(q)
        if key in self._cache:
            return self._cache[key]

        coords = self._call_nominatim(q)
        if coords is None:
            return None
        self._cache[key] = coords
        self._save_cache()
        return coords

    def close(self) -> None:
        if self._httpx_client is not None:
            try:
                self._httpx_client.close()
            except Exception:
                pass
            self._httpx_client = None


# -- intent & city extraction -------------------------------------------------


_CITY_FORBIDDEN_EXACT = frozenset({
    "here", "there", "home", "work", "school", "university", "now", "today",
    "tomorrow", "yesterday", "my", "your", "his", "her", "our", "their",
    "aici", "acolo", "acasa", "maine", "azi",
    "the", "this", "that", "these", "those", "closest", "nearest", "near",
    "concert", "show", "event", "ticket", "concerts", "shows", "events",
    "i'm", "im", "i", "you", "he", "she", "it", "we", "they", "me", "him",
    "us", "them", "mine", "yours", "am", "is", "are", "was", "were",
    "sunt", "esti", "e", "era", "eram", "n-am", "nu", "da", "si",
    "o", "un", "una", "unde", "cine", "ce", "care", "cand", "cum",
    "to", "from", "of", "in", "on", "at", "by", "for", "with", "and",
    "or", "but", "so", "then", "than", "not", "no", "yes", "ok", "okay",
    "please", "tell", "show", "give", "find", "look", "know", "want",
    "need", "thanks", "thank", "hi", "hello", "hey",
    "what", "which", "who", "when", "where", "why", "how",
    "do", "does", "did", "have", "has", "had", "will", "would", "shall", "should",
    "can", "could", "may", "might", "must", "just", "very", "too", "also",
    "all", "any", "some", "each", "every", "both", "few", "more", "most",
    "other", "another", "such", "only", "own", "same", "than", "too", "very",
    "still", "even", "again", "further", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more",
    "time", "week", "day", "year", "month", "hour", "minute", "second",
    "today", "tonight", "tomorrow", "yesterday", "morning", "afternoon", "evening",
    "now", "ago", "before", "after", "during", "while", "through",
    "about", "above", "below", "between", "through", "into", "throughout",
    "ora", "ziua", "saptamana", "luna", "anul", "acum", "maine", "ieri",
    "bine", "mers", "dat", "fapt", "tot", "cea", "cel", "mai", "foarte",
    "totusi", "dar", "daca", "deci", "inca", "pana", "fara", "printr", "sub",
    "peste", "intre", "despre", "pana", "ca", "cum", "cand", "unde", "cine",
    # Music genres, artists, and ticketing terms
    "hip", "hop", "rap", "hip-hop", "pop", "rock", "jazz", "latin", "reggaeton",
    "r&b", "rnb", "electronic", "edm", "house", "techno", "metal", "punk", "indie",
    "country", "classical", "trap", "drill", "dance", "future", "drake",
    "music", "artist", "artists", "tour", "tours", "festival", "festivals",
    "cheap", "cheapest", "expensive", "vip", "stage", "live", "stadium", "arena"
})

_CITY_FORBIDDEN_ANY = frozenset({
    "closest", "nearest", "near", "nearby",
    "concert", "concerts", "show", "shows", "event", "events",
    "ticket", "tickets", "info", "information", "detail", "details",
    "the", "music", "tour", "genre", "artist",
    "hip", "hop", "rap", "reggaeton", "pop", "rock", "jazz",
})

_FALSE_POSITIVE_1WORD_RE = re.compile(
    r"^(?:i'm|i live|i am|i was|sunt|ma|acum|unde|what|which|who|how|when|where|why|"
    r"located|living|based|visiting|coming|travel|travelling|traveling|currently|"
    r"tell|show|find|looking|want|need|give|just|hip|hop|rap|future|drake)$",
    re.IGNORECASE | re.UNICODE,
)


def _looks_like_city(s: str, *, strict: bool = False) -> bool:
    if not s:
        return False
    stripped = s.strip().strip(".,!?;:\"'()[]{}")
    if not stripped:
        return False
    if len(stripped) < 2:
        return False
    if not _CITY_NAME_RE.match(stripped):
        return False
    low = stripped.lower()
    if low in _CITY_FORBIDDEN_EXACT:
        return False
    words = stripped.split()
    if len(words) == 1:
        if _FALSE_POSITIVE_1WORD_RE.match(low):
            return False
        if strict and not stripped[0].isupper() and stripped[0].isascii():
            return False
    if any(w.lower() in _CITY_FORBIDDEN_ANY for w in words):
        return False
    if any(w.lower() in _CITY_FORBIDDEN_EXACT for w in words):
        return False
    return True


def _trim_city_candidate(raw: str) -> str:
    if not raw:
        return ""
    s = raw.strip()
    s = re.split(
        r"\s+(?:and|but|or|so|then|because|that|which|who|what|where|when|why|how|"
        r"nearest|closest|nearby|concert|concerts|show|shows|event|events|ticket|tickets|"
        r"apropiat|apropiate|aproape|concert|eveniment|bilet|unde|cine|ce|care)\b",
        s,
        maxsplit=1,
        flags=re.UNICODE | re.IGNORECASE,
    )[0]
    s = s.rstrip(" ,.;:!?()[]{}\"'\u2014\u2013-")
    s = re.sub(
        r"^(?:the|a|an|un|o|una|from|din|în|in|la|pe|spre|catre|towards|near|around|about)\s+",
        "",
        s,
        flags=re.IGNORECASE | re.UNICODE,
    )
    return s.strip()


def extract_city_from_message(text: str) -> Optional[str]:
    if not text:
        return None
    candidates: List[str] = []

    # 1. Match explicit location introductory patterns (e.g. "in Chicago", "from Miami", "living in London")
    for pattern in _LOC_FROM_PATTERNS:
        for m in pattern.finditer(text):
            candidate = _trim_city_candidate(m.group(1))
            if _looks_like_city(candidate, strict=False):
                candidates.append(candidate)

    # 2. If the entire user message is just a standalone city name (e.g. "Bucharest", "Miami Beach, FL")
    raw_words = text.strip().split()
    if 1 <= len(raw_words) <= 4:
        candidate = _trim_city_candidate(text)
        if _looks_like_city(candidate, strict=True):
            candidates.append(candidate)

    seen = set()
    ordered: List[str] = []
    for c in candidates:
        k = _normalize_key(c)
        if not k or k in seen:
            continue
        seen.add(k)
        ordered.append(c)
    return ordered[0] if ordered else None



def is_nearest_query(text: str) -> bool:
    if not text:
        return False
    return any(p.search(text) for p in _NEAREST_QUERY_PATTERNS)


def is_request_current_location(text: str) -> bool:
    if not text:
        return False
    return any(p.search(text) for p in _WHERE_AM_I_PATTERNS)


def extract_last_referenced_city(history: List[Dict[str, Any]]) -> Optional[str]:
    """Scan conversation history for the most recently mentioned city."""
    if not history:
        return None
    for turn in reversed(history):
        content = ""
        if isinstance(turn, dict):
            content = str(turn.get("content") or turn.get("text") or "")
        elif hasattr(turn, "content"):
            content = str(getattr(turn, "content") or "")
        if not content:
            continue
        city = extract_city_from_message(content)
        if city:
            return city
    return None


class LocationIntentResult:
    def __init__(
        self,
        needs_location: bool = False,
        is_nearest: bool = False,
        use_browser_geolocation: bool = False,
        extracted_city: Optional[str] = None,
        coords_from_browser: Optional[Tuple[float, float]] = None,
        city_from_history: Optional[str] = None,
    ):
        self.needs_location = needs_location
        self.is_nearest = is_nearest
        self.use_browser_geolocation = use_browser_geolocation
        self.extracted_city = extracted_city
        self.coords_from_browser = coords_from_browser
        self.city_from_history = city_from_history

    def to_dict(self) -> Dict[str, Any]:
        return {
            "needs_location": self.needs_location,
            "is_nearest": self.is_nearest,
            "use_browser_geolocation": self.use_browser_geolocation,
            "extracted_city": self.extracted_city,
            "coords_from_browser": (
                list(self.coords_from_browser) if self.coords_from_browser else None
            ),
            "city_from_history": self.city_from_history,
        }


def detect_location_intent(
    message: str,
    history: Optional[List[Dict[str, Any]]] = None,
    browser_lat: Optional[float] = None,
    browser_lng: Optional[float] = None,
) -> LocationIntentResult:
    """Analyse the user's message and decide what location logic to apply."""
    msg = (message or "").strip()
    hist = history or []

    nearest = is_nearest_query(msg)
    where_am_i = is_request_current_location(msg)
    city = extract_city_from_message(msg)
    city_from_hist = extract_last_referenced_city(hist) if not city else None

    browser_coords: Optional[Tuple[float, float]] = None
    if isinstance(browser_lat, (int, float)) and isinstance(browser_lng, (int, float)):
        browser_coords = (float(browser_lat), float(browser_lng))

    use_browser = bool(where_am_i) and browser_coords is None

    needs_location = bool(nearest or city or where_am_i or city_from_hist)

    return LocationIntentResult(
        needs_location=needs_location,
        is_nearest=bool(nearest),
        use_browser_geolocation=use_browser,
        extracted_city=city,
        coords_from_browser=browser_coords,
        city_from_history=city_from_hist,
    )


geocoder = NominatimGeocoder()
