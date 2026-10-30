"""
FastAPI Main Application Entry Point
CSIT5210 Group 1 Project
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, users, meta, events

app = FastAPI(
    title="Volunteer RecSys API",
    description="CSIT5210 Group 1 Cold-Start Volunteer Recommendation System",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular sub-routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(meta.router)
app.include_router(events.router)



@app.get("/api/health")
def health_check():
    return {"status": "ok"}
