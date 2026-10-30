"""
Metadata Options Router
"""

import json
from fastapi import APIRouter
from backend.database import get_db_connection
from backend.schemas import MetadataOptionsResponse

router = APIRouter(prefix="/api/meta", tags=["Metadata"])


@router.get("/options", response_model=MetadataOptionsResponse)
def get_metadata_options():
    """Returns unique causes, target demographics, regions, and skills from the events catalog."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT issue_areas, populations_served, required_skills, region FROM events")

    issue_set = set()
    pop_set = set()
    skill_set = set()
    region_set = set()

    for row in c.fetchall():
        if row["region"]:
            region_set.add(row["region"])
        try:
            for item in json.loads(row["issue_areas"] or "[]"):
                issue_set.add(item)
        except Exception:
            pass
        try:
            for item in json.loads(row["populations_served"] or "[]"):
                pop_set.add(item)
        except Exception:
            pass
        try:
            for item in json.loads(row["required_skills"] or "[]"):
                skill_set.add(item)
        except Exception:
            pass

    conn.close()

    skill_set.update(["Cantonese", "English", "Mandarin", "Teaching / Tutoring", "First Aid", "Driving"])

    return {
        "issue_areas": sorted(list(issue_set)),
        "target_populations": sorted(list(pop_set)),
        "regions": sorted(list(region_set)),
        "skills": sorted(list(skill_set)),
    }

