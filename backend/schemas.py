"""
Pydantic Schemas for Request & Response Data Validation
"""

from typing import List, Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email_or_id: str


class PreferenceUpdateRequest(BaseModel):
    preferred_causes: List[str]
    target_populations: List[str]
    preferred_regions: List[str]
    skills: List[str]
    max_duration_hours: Optional[float] = 4.0
    bio: Optional[str] = ""


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    bio: Optional[str] = ""
    preferred_causes: List[str]
    target_populations: List[str]
    preferred_regions: List[str]
    skills: List[str]
    max_duration_hours: Optional[float] = None
    has_preferences: bool
    profile_text: Optional[str] = None


class MetadataOptionsResponse(BaseModel):
    issue_areas: List[str]
    target_populations: List[str]
    regions: List[str]
    skills: List[str]


class EventItem(BaseModel):
    id: str
    url: str
    title: str
    organization_name: Optional[str] = None
    organization_website: Optional[str] = None
    issue_areas: List[str] = []
    populations_served: List[str] = []
    required_skills: List[str] = []
    location_address: Optional[str] = None
    region: Optional[str] = None
    event_date: Optional[str] = None
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    duration_hours: Optional[float] = None
    description: Optional[str] = None


class EventListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[EventItem]


