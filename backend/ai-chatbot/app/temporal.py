"""
temporal.py — Parse temporal intent from a user message.

Handles:
  - Explicit months:   "in October", "shows in January 2027"
  - Explicit years:    "shows in 2027"
  - Relative ranges:   "next month", "this month", "next week", "this week",
                       "today", "tonight", "tomorrow", "this weekend",
                       "next year", "this year"
  - Bare month names:  "October shows", "any concerts in March?"

Returns a DateRangeResult with (start, end) as timezone-naive datetimes (UTC-ish),
or both None if no temporal signal found.
"""

import logging
import re
from datetime import date, datetime, timedelta
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Month name tables
# ---------------------------------------------------------------------------

_MONTH_NAMES: Dict[str, int] = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}

# Prebuilt pattern — matches full and abbreviated month names
_MONTH_RE = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(_MONTH_NAMES, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

# 4-digit year in plausible event range
_YEAR_RE = re.compile(r"\b(20\d{2})\b")

# Relative terms
_RELATIVE_RE = re.compile(
    r"\b(next\s+month|this\s+month|next\s+week|this\s+week|"
    r"next\s+year|this\s+year|today|tonight|tomorrow|this\s+weekend|next\s+weekend)\b",
    re.IGNORECASE,
)


def _month_range(year: int, month: int) -> Tuple[datetime, datetime]:
    """First second of month → first second of the following month."""
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def _year_range(year: int) -> Tuple[datetime, datetime]:
    return datetime(year, 1, 1), datetime(year + 1, 1, 1)


def _week_range(ref: date) -> Tuple[datetime, datetime]:
    monday = ref - timedelta(days=ref.weekday())
    next_monday = monday + timedelta(weeks=1)
    return datetime.combine(monday, datetime.min.time()), datetime.combine(next_monday, datetime.min.time())


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class DateRangeResult:
    def __init__(self, start: Optional[datetime] = None, end: Optional[datetime] = None, label: Optional[str] = None):
        self.start = start
        self.end = end
        self.label = label

    @property
    def has_range(self) -> bool:
        return self.start is not None and self.end is not None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start": self.start.isoformat() if self.start else None,
            "end": self.end.isoformat() if self.end else None,
            "label": self.label,
        }


def extract_date_range(message: str, now: Optional[datetime] = None) -> DateRangeResult:
    """Detect and resolve any temporal reference in *message*.

    *now* is injectable for testing; defaults to datetime.utcnow().
    Returns a DateRangeResult with (start, end, label) or (None, None, None).
    """
    if not message:
        return DateRangeResult()

    now = now or datetime.utcnow()
    today = now.date()

    msg = message.strip()

    # --- 1. Relative terms (highest priority) ---
    rel = _RELATIVE_RE.search(msg)
    if rel:
        term = rel.group(1).lower().replace("  ", " ")

        if term in ("today", "tonight"):
            start = datetime.combine(today, datetime.min.time())
            end = start + timedelta(days=1)
            return DateRangeResult(start, end, "today")

        if term == "tomorrow":
            d = today + timedelta(days=1)
            start = datetime.combine(d, datetime.min.time())
            end = start + timedelta(days=1)
            return DateRangeResult(start, end, "tomorrow")

        if term == "this weekend":
            # Saturday of this week
            days_to_sat = (5 - today.weekday()) % 7
            sat = today + timedelta(days=days_to_sat)
            sun = sat + timedelta(days=1)
            start = datetime.combine(sat, datetime.min.time())
            end = datetime.combine(sun + timedelta(days=1), datetime.min.time())
            return DateRangeResult(start, end, "this weekend")

        if term == "next weekend":
            days_to_sat = (5 - today.weekday()) % 7 or 7
            sat = today + timedelta(days=days_to_sat + 7)
            sun = sat + timedelta(days=1)
            start = datetime.combine(sat, datetime.min.time())
            end = datetime.combine(sun + timedelta(days=1), datetime.min.time())
            return DateRangeResult(start, end, "next weekend")

        if term == "this week":
            start, end = _week_range(today)
            return DateRangeResult(start, end, "this week")

        if term == "next week":
            next_monday = today + timedelta(days=(7 - today.weekday()))
            start, end = _week_range(next_monday)
            return DateRangeResult(start, end, "next week")

        if term == "this month":
            start, end = _month_range(today.year, today.month)
            return DateRangeResult(start, end, f"this month ({now.strftime('%B %Y')})")

        if term == "next month":
            if today.month == 12:
                y, m = today.year + 1, 1
            else:
                y, m = today.year, today.month + 1
            start, end = _month_range(y, m)
            import calendar
            label = f"{calendar.month_name[m]} {y}"
            return DateRangeResult(start, end, label)

        if term == "this year":
            start, end = _year_range(today.year)
            return DateRangeResult(start, end, str(today.year))

        if term == "next year":
            start, end = _year_range(today.year + 1)
            return DateRangeResult(start, end, str(today.year + 1))

    # --- 2. Named month (+ optional year) ---
    month_match = _MONTH_RE.search(msg)
    if month_match:
        month_num = _MONTH_NAMES[month_match.group(1).lower()]
        import calendar

        # Look for a year near the month name
        year_match = _YEAR_RE.search(msg)
        if year_match:
            year = int(year_match.group(1))
        else:
            # Infer the nearest upcoming occurrence
            year = today.year
            # If that month has already passed this year, use next year
            if month_num < today.month:
                year += 1
            # If it's the same month but we're near the end and asking "in October"
            # — still return this month's range so they see what's left.

        start, end = _month_range(year, month_num)
        label = f"{calendar.month_name[month_num]} {year}"
        return DateRangeResult(start, end, label)

    # --- 3. Bare year ---
    year_match = _YEAR_RE.search(msg)
    if year_match:
        year = int(year_match.group(1))
        start, end = _year_range(year)
        return DateRangeResult(start, end, str(year))

    return DateRangeResult()
