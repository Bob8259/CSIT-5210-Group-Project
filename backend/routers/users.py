"""
User Management & Onboarding Preferences Router
"""

import json
from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.database import get_db_connection
from backend.schemas import UserProfileResponse, PreferenceUpdateRequest
from backend.services.user_service import parse_user_row, generate_profile_text

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserProfileResponse])
def list_users():
    """Lists all users for test personas selection."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users ORDER BY rowid ASC")
    rows = c.fetchall()
    conn.close()
    return [parse_user_row(row) for row in rows]


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: str):
    """Fetches a specific user profile by user_id."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return parse_user_row(row)


@router.put("/{user_id}/preferences", response_model=UserProfileResponse)
def update_preferences(user_id: str, payload: PreferenceUpdateRequest):
    """Saves user onboarding preferences and regenerates cold-start profile text."""
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user_name = row["name"]
    bio = (payload.bio or "").strip()

    profile_text = generate_profile_text(
        name=user_name,
        bio=bio,
        causes=payload.preferred_causes,
        pops=payload.target_populations,
        regions=payload.preferred_regions,
        skills=payload.skills,
        max_hours=payload.max_duration_hours
    )

    c.execute("""
        UPDATE users
        SET bio = ?,
            preferred_causes = ?,
            target_populations = ?,
            preferred_regions = ?,
            skills = ?,
            max_duration_hours = ?,
            profile_text = ?
        WHERE id = ?
    """, (
        bio,
        json.dumps(payload.preferred_causes, ensure_ascii=False),
        json.dumps(payload.target_populations, ensure_ascii=False),
        json.dumps(payload.preferred_regions, ensure_ascii=False),
        json.dumps(payload.skills, ensure_ascii=False),
        payload.max_duration_hours,
        profile_text,
        user_id
    ))

    conn.commit()

    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_row = c.fetchone()
    conn.close()

    return parse_user_row(updated_row)

