"""
User Service: parsing database records and profile text generation
"""

import json
import sqlite3
from typing import Dict, Any, List, Optional


def parse_user_row(row: sqlite3.Row) -> Dict[str, Any]:
    """Parses a SQLite user row into structured dict with boolean has_preferences flag."""
    try:
        preferred_causes = json.loads(row["preferred_causes"] or "[]")
    except Exception:
        preferred_causes = []

    try:
        target_populations = json.loads(row["target_populations"] or "[]")
    except Exception:
        target_populations = []

    try:
        preferred_regions = json.loads(row["preferred_regions"] or "[]")
    except Exception:
        preferred_regions = []

    try:
        skills = json.loads(row["skills"] or "[]")
    except Exception:
        skills = []

    # True if user has configured causes, regions, or max duration
    has_preferences = bool(preferred_causes or preferred_regions or row["max_duration_hours"])

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "bio": row["bio"] or "",
        "preferred_causes": preferred_causes,
        "target_populations": target_populations,
        "preferred_regions": preferred_regions,
        "skills": skills,
        "max_duration_hours": row["max_duration_hours"],
        "has_preferences": has_preferences,
        "profile_text": row["profile_text"] or "",
    }


def generate_profile_text(
    name: str,
    bio: str,
    causes: List[str],
    pops: List[str],
    regions: List[str],
    skills: List[str],
    max_hours: Optional[float]
) -> str:
    """Constructs concatenated profile document for TF-IDF and dense embeddings."""
    parts = [
        f"User: {name}",
        f"Bio & Motivation: {bio}" if bio else "",
        f"Preferred Causes: {', '.join(causes)}" if causes else "",
        f"Target Demographics: {', '.join(pops)}" if pops else "",
        f"Preferred Regions: {', '.join(regions)}" if regions else "",
        f"Skills & Languages: {', '.join(skills)}" if skills else "",
        f"Maximum Duration: {max_hours} hours" if max_hours else ""
    ]
    return "\n".join([p for p in parts if p])

