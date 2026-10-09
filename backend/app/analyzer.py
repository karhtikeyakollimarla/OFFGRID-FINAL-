"""
Backward-compatibility adapter for app/analyzer.py.
Delegates to app/ai_service.py (Groq + safety rules + fallback).
"""
from .ai_service import (
    DEPARTMENT_MAP,
    VALID_CATEGORIES,
    URGENCY_RANKS,
    RANK_TO_URGENCY,
    fallback_keyword_classifier,
    apply_safety_rules,
    analyze_complaint
)

__all__ = [
    "DEPARTMENT_MAP",
    "VALID_CATEGORIES",
    "URGENCY_RANKS",
    "RANK_TO_URGENCY",
    "fallback_keyword_classifier",
    "apply_safety_rules",
    "analyze_complaint"
]
