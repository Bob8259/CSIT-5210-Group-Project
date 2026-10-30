"""
Event Service: Database operations for fetching hot and time-ranked volunteer events
"""

import json
import sqlite3
from typing import Dict, Any, List, Optional, Tuple
from backend.database import get_db_connection


def parse_event_row(row: sqlite3.Row) -> Dict[str, Any]:
    """Parses a SQLite event row into a structured dictionary with deserialized JSON arrays."""
    try:
        issue_areas = json.loads(row["issue_areas"] or "[]")
    except Exception:
        issue_areas = []

    try:
        populations_served = json.loads(row["populations_served"] or "[]")
    except Exception:
        populations_served = []

    try:
        required_skills = json.loads(row["required_skills"] or "[]")
    except Exception:
        required_skills = []

    return {
        "id": row["id"],
        "url": row["url"] or "",
        "title": row["title"] or "Untitled Opportunity",
        "organization_name": row["organization_name"] or "HandsOn Hong Kong Partner",
        "organization_website": row["organization_website"] or "",
        "issue_areas": issue_areas,
        "populations_served": populations_served,
        "required_skills": required_skills,
        "location_address": row["location_address"] or "",
        "region": row["region"] or "Hong Kong",
        "event_date": row["event_date"] or "",
        "start_datetime": row["start_datetime"] or "",
        "end_datetime": row["end_datetime"] or "",
        "duration_hours": row["duration_hours"],
        "description": row["description"] or "",
    }


def get_hot_events(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Selects random active volunteer events to serve as featured/hot opportunities.
    Filters for events with non-empty descriptions for optimal presentation.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM events 
            WHERE length(title) > 5 AND length(COALESCE(description, '')) > 40
            ORDER BY RANDOM() 
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [parse_event_row(row) for row in rows]
    finally:
        conn.close()


def get_events_ranked_by_time(
    page: int = 1,
    page_size: int = 12,
    region: Optional[str] = None,
    cause: Optional[str] = None,
    q: Optional[str] = None,
    order: str = "asc"
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Retrieves events ranked chronologically by start_datetime / event_date
    with optional filtering and pagination.
    """
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    offset = (page - 1) * page_size

    where_clauses = ["1=1"]
    params: List[Any] = []

    if region and region.strip():
        where_clauses.append("region = ?")
        params.append(region.strip())

    if cause and cause.strip():
        where_clauses.append("issue_areas LIKE ?")
        params.append(f"%{cause.strip()}%")

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        where_clauses.append("(title LIKE ? OR organization_name LIKE ? OR description LIKE ?)")
        params.extend([search_term, search_term, search_term])

    where_sql = " AND ".join(where_clauses)
    direction = "ASC" if order.lower() == "asc" else "DESC"
    order_sql = f"ORDER BY start_datetime {direction}, event_date {direction}, id ASC"

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Count total matching rows
        count_query = f"SELECT COUNT(*) FROM events WHERE {where_sql}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        # Fetch paginated items
        select_query = f"""
            SELECT * FROM events 
            WHERE {where_sql} 
            {order_sql} 
            LIMIT ? OFFSET ?
        """
        cursor.execute(select_query, params + [page_size, offset])
        rows = cursor.fetchall()

        items = [parse_event_row(row) for row in rows]
        return total, items
    finally:
        conn.close()


def get_event_by_id(event_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single event record by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return parse_event_row(row)
    finally:
        conn.close()

