"""
Comprehensive Scraper & Ingestion Pipeline for data1.json, data2.json, data3.json
CSIT5210 Group 1 Project
"""

import sys
import os
import json
import sqlite3
import time
import re
import html
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional, Tuple
import requests
from bs4 import BeautifulSoup

# Unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.path.insert(0, os.path.dirname(__file__))

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_PATH = os.path.join(ROOT_DIR, "backend", "volunteer.db")
JSON_FILES = [
    os.path.join(ROOT_DIR, "data1.json"),
    os.path.join(ROOT_DIR, "data2.json"),
    os.path.join(ROOT_DIR, "data3.json"),
]

HKT = timezone(timedelta(hours=8))

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept-Language': 'en-US,en;q=0.9,zh-HK;q=0.8,zh;q=0.7',
}


def clean_text(text: Optional[str]) -> str:
    """Unescapes HTML entities, fixes awkward punctuation and removes extra spaces."""
    if not text:
        return ""
    cleaned = html.unescape(text)
    cleaned = cleaned.replace("&#39;", "'").replace("&quot;", '"').replace("&amp;", "&").replace("&nbsp;", " ")
    cleaned = re.sub(r"\s+'(s|t|re|ll|ve|d|m)\b", r"'\1", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned).strip()
    return cleaned


def infer_region(location_text: Optional[str], title: str, desc: str) -> str:
    """Infers standard HK territorial region from location and text."""
    combined = f"{location_text or ''} {title} {desc}".lower()
    
    if any(k in combined for k in ['online', 'virtual', 'anywhere', 'work from home', 'at home']):
        return "Online / Flexible"
    if any(k in combined for k in [
        'new territories', '新界', 'yuen long', 'tuen mun', 'sha tin', 'shatin',
        'tai po', 'fanling', 'sheung shui', 'tseung kwan o', 'tsuen wan', 'kwai chung',
        'sai kung', 'ma on shan', 'tin shui wai'
    ]):
        return "New Territories"
    if any(k in combined for k in [
        'kowloon', '九龍', 'kwun tong', 'mong kok', 'sham shui po', 'yaumatei', 'jordan',
        'tsim sha tsui', 'tst', 'hung hom', 'kowloon city', 'wong tai sin', 'cheung sha wan',
        'san po kong', '新蒲崗', 'diamond hill', '鑽石山', 'to kwa wan', '土瓜灣', 'kai tak', '啟德',
        'kowloon bay'
    ]):
        return "Kowloon"
    if any(k in combined for k in [
        'hong kong island', 'hk island', '港島', 'wan chai', 'central', 'sheung wan',
        'admiralty', 'causeway bay', 'tin hau', 'quarry bay', 'north point', 'sai wan',
        'aberdeen', 'pok fu lam', 'fortress hill', 'sai ying pun', 'kennedy town'
    ]):
        return "Hong Kong Island"
    
    return "Hong Kong"


def parse_datetime_and_duration(start_iso: Optional[str], end_iso: Optional[str]):
    """Parses UTC ISO strings into local Hong Kong Time (HKT, UTC+8) and duration in hours."""
    if not start_iso:
        return None, None, None, None

    try:
        s_dt = datetime.fromisoformat(start_iso.replace('Z', '+00:00')).astimezone(HKT)
        event_date = s_dt.strftime('%Y-%m-%d')
        start_hkt = s_dt.isoformat()

        end_hkt = None
        duration_hours = None
        if end_iso:
            e_dt = datetime.fromisoformat(end_iso.replace('Z', '+00:00')).astimezone(HKT)
            end_hkt = e_dt.isoformat()
            duration_hours = round((e_dt - s_dt).total_seconds() / 3600.0, 2)

        return event_date, start_hkt, end_hkt, duration_hours
    except Exception:
        return None, None, None, None


def scrape_opportunity(url: str) -> Dict[str, Any]:
    """Scrapes detail page for a unique volunteer opportunity from HandsOn Hong Kong."""
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    # Title
    title_elem = soup.find('h1', class_='title-opportunity') or soup.find('h1')
    title = clean_text(title_elem.get_text(strip=True) if title_elem else "Unknown Opportunity")

    # Organization
    org_elem = soup.find('a', class_='organization-name')
    org_name = clean_text(org_elem.get_text(strip=True) if org_elem else None)

    org_web_elem = soup.find('a', class_='organization-link')
    org_website = org_web_elem.get('href') if org_web_elem else None

    # Description
    desc_elem = soup.find('div', id='opportunity-detail-description')
    full_description = clean_text(desc_elem.get_text(separator='\n', strip=True) if desc_elem else "")

    # Issue Areas (Categories)
    issue_elem = soup.find('span', class_='issue-areas')
    issue_areas: List[str] = []
    if issue_elem:
        raw_issues = issue_elem.get_text()
        issue_areas = [clean_text(item) for item in raw_issues.split(',') if item.strip()]

    # Populations Served
    pop_elem = soup.find('span', class_='population-served')
    populations_served: List[str] = []
    if pop_elem:
        raw_pops = pop_elem.get_text()
        populations_served = [clean_text(item) for item in raw_pops.split(',') if item.strip()]

    # Required Skills
    req_box = soup.find('p', class_='requirements')
    skills: List[str] = []
    if req_box:
        skills_span = req_box.find('span', class_='skillsText')
        if skills_span:
            raw_skills = skills_span.get_text(strip=True).replace('Skills:', '').strip()
            skills = [clean_text(s) for s in raw_skills.split(',') if s.strip()]

    # Location
    loc_elem = soup.find('span', class_='location') or soup.find('input', class_='occurrence-location-name')
    location_address: Optional[str] = None
    if loc_elem:
        if loc_elem.name == 'span':
            location_address = clean_text(loc_elem.get_text(strip=True))
        else:
            location_address = clean_text(loc_elem.get('value', '').strip()) or None

    return {
        'title': title,
        'organization_name': org_name,
        'organization_website': org_website,
        'issue_areas': issue_areas,
        'populations_served': populations_served,
        'required_skills': skills,
        'location_address': location_address,
        'description': full_description,
    }


def load_cached_metadata_from_db(conn: sqlite3.Connection) -> Dict[str, Dict[str, Any]]:
    """Loads existing opportunity metadata from DB so we don't scrape already available opportunities."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT title, organization_name, organization_website,
               issue_areas, populations_served, required_skills,
               location_address, description
        FROM events
    """)
    cache = {}
    for row in cursor.fetchall():
        t = row[0]
        if not t:
            continue
        try:
            issues = json.loads(row[3]) if row[3] else []
        except Exception:
            issues = []
        try:
            pops = json.loads(row[4]) if row[4] else []
        except Exception:
            pops = []
        try:
            sk = json.loads(row[5]) if row[5] else []
        except Exception:
            sk = []

        cache[t] = {
            'title': t,
            'organization_name': row[1],
            'organization_website': row[2],
            'issue_areas': issues,
            'populations_served': pops,
            'required_skills': sk,
            'location_address': row[6],
            'description': row[7],
        }
    return cache


def main():
    print("=" * 60)
    print("STARTING BATCH INGESTION FOR DATA1, DATA2, DATA3")
    print(f"Target SQLite Database: {DB_PATH}")
    print("=" * 60)

    # 1. Gather all occurrences and unique opportunities across all 3 files
    all_occurrences = []
    unique_opps: Dict[str, str] = {}  # cleaned_name -> url

    for jpath in JSON_FILES:
        if not os.path.exists(jpath):
            print(f"WARNING: File {jpath} not found!")
            continue
        print(f"Reading {os.path.basename(jpath)}...")
        with open(jpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            count = 0
            for item in data.get('items', []):
                for occ in item.get('occurrences', []):
                    name = clean_text(occ.get('opportunityName'))
                    link = occ.get('opportunityLink')
                    oid = occ.get('occurrenceId')
                    if name and link and oid:
                        all_occurrences.append(occ)
                        count += 1
                        if name not in unique_opps:
                            unique_opps[name] = link
            print(f"  -> Extracted {count} occurrences from {os.path.basename(jpath)}")

    print(f"\nTotal occurrences across all files: {len(all_occurrences)}")
    print(f"Total unique opportunities: {len(unique_opps)}")

    # 2. Check cached metadata in DB
    conn = sqlite3.connect(DB_PATH)
    cached_meta = load_cached_metadata_from_db(conn)
    print(f"Loaded {len(cached_meta)} existing opportunities from database cache.")

    to_scrape = {}
    for name, url in unique_opps.items():
        # Also check with unescaped / normalized variations
        if name not in cached_meta and clean_text(name) not in cached_meta:
            to_scrape[name] = url

    print(f"Found {len(to_scrape)} new opportunities requiring live web scraping from HandsOn HK.")

    # 3. Scrape new opportunities concurrently
    scraped_cache = {}
    if to_scrape:
        print(f"Scraping {len(to_scrape)} opportunities with ThreadPoolExecutor (max_workers=8)...")
        t0 = time.time()

        def fetch(item):
            name, url = item
            try:
                res = scrape_opportunity(url)
                return (name, res)
            except Exception as e:
                print(f"  [Error] {url}: {e}")
                return (name, None)

        with ThreadPoolExecutor(max_workers=8) as executor:
            for name, res in executor.map(fetch, to_scrape.items()):
                if res:
                    scraped_cache[name] = res

        elapsed = time.time() - t0
        print(f"Scraped {len(scraped_cache)}/{len(to_scrape)} pages in {elapsed:.2f}s.")

    # 4. Prepare all occurrences for database insertion
    print("\nPreparing occurrences for database ingestion...")
    events_to_insert = []
    seen_occurrence_ids = set()

    for occ in all_occurrences:
        oid = occ.get('occurrenceId')
        if not oid or oid in seen_occurrence_ids:
            continue
        seen_occurrence_ids.add(oid)

        raw_name = occ.get('opportunityName', 'Untitled Opportunity')
        name = clean_text(raw_name)
        link = occ.get('opportunityLink', '')

        # Metadata resolution: scraped_cache > cached_meta > occurrence fields
        meta = scraped_cache.get(name) or cached_meta.get(name) or cached_meta.get(clean_text(name)) or {}

        org_name = clean_text(
            occ.get('organizationServedName') or occ.get('managingOrganization') or meta.get('organization_name')
        )
        org_website = meta.get('organization_website')
        
        issue_areas = meta.get('issue_areas', [])
        populations_served = meta.get('populations_served', [])
        required_skills = meta.get('required_skills', [])

        # Location & Region
        loc_parts = [clean_text(occ.get('locationCity')), clean_text(occ.get('locationZipCode')), clean_text(occ.get('locationState'))]
        fallback_addr = ', '.join([p for p in loc_parts if p])
        location_address = meta.get('location_address') or fallback_addr or None

        # Description
        description = clean_text(meta.get('description') or occ.get('description', ''))

        # Region
        region = occ.get('locationState')
        if not region or region not in ['Hong Kong Island', 'Kowloon', 'New Territories']:
            region = infer_region(location_address, name, description)

        # Dates & Time
        start_iso = occ.get('startDateTimeISO')
        end_iso = occ.get('endDateTimeISO')
        event_date, start_datetime, end_datetime, duration_hours = parse_datetime_and_duration(start_iso, end_iso)

        # Search Content
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
            oid,
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

    print(f"Inserting/Updating {len(events_to_insert)} unique event occurrences into SQLite...")
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

    # Query stats
    cursor.execute("SELECT COUNT(*) FROM events")
    total_in_db = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT title) FROM events")
    distinct_titles = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT organization_name) FROM events")
    distinct_orgs = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM (
            SELECT DISTINCT title, organization_name, region, duration_hours FROM events
        )
    """)
    distinct_activities = cursor.fetchone()[0]

    print("\n" + "=" * 60)
    print("DATABASE INGESTION COMPLETE")
    print(f"Total event occurrences in DB: {total_in_db}")
    print(f"Total distinct program titles: {distinct_titles}")
    print(f"Total distinct organizations: {distinct_orgs}")
    print(f"Total distinct activities (title+org+region+duration): {distinct_activities}")
    print("=" * 60)

    # 5. Clean HTML entities
    print("\nRunning clean_html_entities...")
    from clean_html_entities import clean_database
    clean_database()

    # 6. Recompute TF-IDF and Dense Embeddings
    print("\nRecomputing TF-IDF Vectorizer & Dense Embeddings...")
    from save_vectors_to_db import init_vector_tables, compute_and_save_tfidf, compute_and_save_embeddings

    init_vector_tables(conn)
    cursor.execute("SELECT id, search_content FROM events")
    all_rows = cursor.fetchall()
    events_list = [{"id": r[0], "search_content": r[1]} for r in all_rows]

    compute_and_save_tfidf(conn, events_list)
    compute_and_save_embeddings(conn, events_list)

    conn.close()
    print("\n" + "=" * 60)
    print("SUCCESS: ALL 3 DATA FILES INGESTED & VECTORS RECOMPUTED!")
    print("=" * 60)


if __name__ == '__main__':
    main()
