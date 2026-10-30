"""
Authentication Router
"""

from fastapi import APIRouter, HTTPException, status
from backend.database import get_db_connection
from backend.schemas import LoginRequest, UserProfileResponse
from backend.services.user_service import parse_user_row

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=UserProfileResponse)
def login(payload: LoginRequest):
    """Login by email or user ID. Returns user profile with has_preferences flag."""
    query_str = payload.email_or_id.strip()
    if not query_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or User ID cannot be empty.")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(id) = LOWER(?)",
        (query_str, query_str)
    )
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{query_str}' not found. Try 'user1@connect.ust.hk' or 'user_1'."
        )

    return parse_user_row(row)

