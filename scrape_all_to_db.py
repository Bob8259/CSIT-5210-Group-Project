"""
Batch Scrape & Ingest all 697 Volunteer Events into SQLite
HKUST CSIT5210 Group 1 Project
"""

import sys
import json
import sqlite3
import time
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional
import requests
from bs4 import BeautifulSoup

from scraper import infer_region, parse_datetime_and_duration, scrape_opportunity, HKT

DB_PATH = "volunteer.db"
SCHEMA_PATH = "schema.sql"
DATA1_PATH = "data1.json"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("Database tables initialized from schema.sql.")


def run_batch_scrape():
    print(f"Reading {DATA1_PATH}...")
    with open(DATA1_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Collect all occurrences and map unique opportunity names to a sample URL
    all_occurrences = []
    unique_opp_urls = {}

    for item in data.get('items', []):
        for occ in item.get('occurrences', []):
            name = occ.get('opportunityName')
            link = occ.get('opportunityLink')
            if name and link:
                all_occurrences.append(occ)
                if name not in unique_opp_urls:
                    unique_opp_urls[name] = link

    total_occurrences = len(all_occurrences)
    print(f"Found {total_occurrences} total event occurrences across {len(unique_opp_urls)} unique opportunity titles.")

    # 1. Scrape the unique opportunity detail pages in parallel
    print(f"Scraping {len(unique_opp_urls)} unique opportunity pages using ThreadPoolExecutor...")
    start_time = time.time()
    scraped_cache = {}

    def fetch_opportunity(item):
        name, url = item
        try:
            res = scrape_opportunity(url)
            return (name, res)
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return (name, None)

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(fetch_opportunity, unique_opp_urls.items())
        for name, res in results:
            if res:
                scraped_cache[name] = res

    elapsed = time.time() - start_time
    print(f"Scraped {len(scraped_cache)}/{len(unique_opp_urls)} opportunity pages in {elapsed:.2f}s.")

    # 2. Build records for all occurrences
    print("Enriching and preparing records for all event occurrences...")
    events_to_insert = []

    for occ in all_occurrences:
        link = occ.get('opportunityLink', '')
        opp_id = occ.get('occurrenceId') or (link.rstrip('/').split('/')[-1] if link else None)
        if not opp_id:
            continue

        name = occ.get('opportunityName', 'Untitled Opportunity')
        meta = scraped_cache.get(name, {})

        org_name = occ.get('organizationServedName') or occ.get('managingOrganization') or meta.get('organization_name')
        org_website = meta.get('organization_website')
        
        issue_areas = meta.get('issue_areas', [])
        populations_served = meta.get('populations_served', [])
        required_skills = meta.get('required_skills', [])

        # Address & Region
        loc_parts = [occ.get('locationCity'), occ.get('locationZipCode'), occ.get('locationState')]
        fallback_addr = ', '.join([p for p in loc_parts if p])
        location_address = meta.get('location_address') or fallback_addr or None
        
        # Region inference
        region = occ.get('locationState')
        if not region or region not in ['Hong Kong Island', 'Kowloon', 'New Territories']:
            region = infer_region(location_address, name, meta.get('description', ''))

        # Dates & Time
        start_iso = occ.get('startDateTimeISO')
        end_iso = occ.get('endDateTimeISO')
        event_date, start_datetime, end_datetime, duration_hours = parse_datetime_and_duration(start_iso, end_iso)

        if not duration_hours and meta.get('duration_hours'):
            duration_hours = meta.get('duration_hours')

        # Description
        description = meta.get('description') or occ.get('description', '')

        # Search Content (for TF-IDF & Vector Embeddings)
        content_parts = [
            f"Title: {name}",
            f"Organization: {org_name}" if org_name else "",
            f"Categories: {', '.join(issue_areas)}" if issue_areas else "",
            f"Target Groups: {', '.join(populations_served)}" if populations_served else "",
            f"Required Skills: {', '.join(required_skills)}" if required_skills else "",
            f"Region: {region}",
            f"Description: {description}"
        ]
        search_content = "\n".join([p for p in content_parts if p])

        events_to_insert.append((
            opp_id,
            link,
            name,
            org_name,
            org_website,
            json.dumps(issue_areas, ensure_ascii=False),
            json.dumps(populations_served, ensure_ascii=False),
            json.dumps(required_skills, ensure_ascii=False),
            location_address,
            region,
            event_date,
            start_datetime,
            end_datetime,
            duration_hours,
            description,
            search_content
        ))

    # 3. Batch insert into SQLite
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.executemany("""
        INSERT OR REPLACE INTO events (
            id, url, title, organization_name, organization_website,
            issue_areas, populations_served, required_skills,
            location_address, region,
            event_date, start_datetime, end_datetime, duration_hours,
            description, search_content
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?
        )
    """, events_to_insert)

    conn.commit()

    # Query statistics
    cursor.execute("SELECT COUNT(*) FROM events")
    total_in_db = cursor.fetchone()[0]

    cursor.execute("SELECT region, COUNT(*) FROM events GROUP BY region ORDER BY COUNT(*) DESC")
    region_stats = cursor.fetchall()

    cursor.execute("SELECT MIN(event_date), MAX(event_date) FROM events WHERE event_date IS NOT NULL")
    date_range = cursor.fetchone()

    conn.close()

    print("\n" + "=" * 60)
    print("SUCCESSFULLY INGESTED ALL EVENTS INTO DATABASE!")
    print("=" * 60)
    print(f"Total events in '{DB_PATH}': {total_in_db}")
    print(f"Date Range: {date_range[0]} to {date_range[1]}")
    print("\nBreakdown by Region:")
    for reg, count in region_stats:
        print(f"  - {reg}: {count} events")
    print("=" * 60)

    return total_in_db


if __name__ == '__main__':
    init_db()
    run_batch_scrape()

