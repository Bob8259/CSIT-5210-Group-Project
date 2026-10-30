"""
Events API Router: provides hot opportunities and chronologically ranked event listings
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.schemas import EventItem, EventListResponse
from backend.services.event_service import (
    get_hot_events,
    get_events_ranked_by_time,
    get_event_by_id,
)

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/hot", response_model=List[EventItem])
def list_hot_events(limit: int = Query(5, ge=1, le=20)):
    """
    Returns a randomized sample of featured/hot volunteer opportunities
    for the landing page carousel.
    """
    return get_hot_events(limit=limit)


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    region: Optional[str] = Query(None),
    cause: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    order: str = Query("asc", pattern="^(asc|desc)$")
):
    """
    Returns events ranked by event start time (chronological by default),
    supporting search, region/cause filtering, and pagination.
    """
    total, items = get_events_ranked_by_time(
        page=page,
        page_size=page_size,
        region=region,
        cause=cause,
        q=q,
        order=order
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.get("/{event_id}", response_model=EventItem)
def get_event(event_id: str):
    """Returns details for a specific event by ID."""
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
