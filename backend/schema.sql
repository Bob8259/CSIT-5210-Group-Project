-- ====================================================================
-- Database Schema for Volunteer Opportunity Recommendation System
-- Project: HKUST CSIT5210 Group 1
-- Description: SQLite schema for volunteer events catalog
-- ====================================================================

DROP TABLE IF EXISTS events;

CREATE TABLE events (
    id TEXT PRIMARY KEY,                       -- Unique Opportunity ID (e.g., 'a0CQ90000J4y8TgMQI')
    url TEXT NOT NULL,                         -- Canonical webpage URL
    title TEXT NOT NULL,                       -- Opportunity title
    organization_name TEXT,                    -- Host / Partner non-profit organization
    organization_website TEXT,                 -- Organization website URL
    
    -- Categorization & Semantic Tags (stored as JSON string arrays)
    issue_areas TEXT DEFAULT '[]',             -- e.g., '["Animal Welfare", "Environment"]'
    populations_served TEXT DEFAULT '[]',      -- e.g., '["Animals", "Youth"]'
    required_skills TEXT DEFAULT '[]',         -- e.g., '["Cantonese", "Teaching"]'
    
    -- Location & Territorial Region
    location_address TEXT,                     -- Full physical address or meeting location
    region TEXT,                               -- Standardized region: 'Hong Kong Island', 'Kowloon', 'New Territories', 'Online / Flexible'
    
    -- Time, Dates, and Duration
    event_date TEXT,                           -- Date of event in YYYY-MM-DD (HKT), e.g., '2026-10-30'
    start_datetime TEXT,                       -- Full start timestamp in ISO 8601 (HKT), e.g., '2026-10-30T10:00:00+08:00'
    end_datetime TEXT,                         -- Full end timestamp in ISO 8601 (HKT), e.g., '2026-10-30T16:00:00+08:00'
    duration_hours REAL,                       -- Event duration in decimal hours (e.g., 2.5, 6.0)
    
    -- Detailed Text & Model Content Representation
    description TEXT,                          -- Clean, full-text event description and instructions
    search_content TEXT,                       -- Precomputed concatenated text for TF-IDF and dense embeddings
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient candidate filtering in Recommendation Pipelines
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_duration ON events(duration_hours);
CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);

