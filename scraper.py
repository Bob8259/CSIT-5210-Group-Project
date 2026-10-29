"""
HandsOn Hong Kong Volunteer Opportunity Web Scraper & Database Ingestion
CSIT5210 - Data Mining and Knowledge Discovery Group 1 Project

Features:
- Scrapes opportunity metadata from HandsOn Hong Kong
- Extracts time details: event_date, start_datetime, end_datetime, duration_hours (HKT)
- Removes eligibility constraints
- Builds search_content for TF-IDF / Embedding models
- Persists structured events to a local SQLite database (volunteer_events.db)
"""

import sys
import json
import sqlite3
import argparse
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import requests
from bs4 import BeautifulSoup

HKT = timezone(timedelta(hours=8))
DEFAULT_DB_PATH = "volunteer.db"
DEFAULT_SCHEMA_PATH = "schema.sql"

# Sample 5 active and diverse upcoming volunteer opportunities
SAMPLE_URLS = [
    "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000J4y8TgMQI",  # Animal Shelter (New Territories)
    "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000JiPHdtMQG",  # Food Bank Sorting & Packing (Kowloon)
    "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000KVjZSKMQ3",  # Crossroads Logistics & Care (New Territories)
    "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000KXxe4KMQR",  # Primary Schoolwork Tutoring (Tin Hau / HK Island)
    "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000Jk3nBSMQY",  # Special Needs Lunch Service (Kowloon)
]


def infer_region(location_text: Optional[str], title: str, desc: str) -> str:
    """Infers standard HK territorial region from location and text."""
    combined = f"{location_text or ''} {title} {desc}".lower()
    
    if any(k in combined for k in ['online', 'virtual', 'anywhere', 'work from home', 'at home']):
        return "Online / Flexible"
    if any(k in combined for k in ['new territories', '新界', 'yuen long', 'tuen mun', 'sha tin', 'shatin', 'tai po', 'fanling', 'sheung shui', 'tseung kwan o', 'tsuen wan', 'kwai chung']):
        return "New Territories"
    if any(k in combined for k in [
        'kowloon', '九龍', 'kwun tong', 'mong kok', 'sham shui po', 'yaumatei', 'jordan',
        'tsim sha tsui', 'tst', 'hung hom', 'kowloon city', 'wong tai sin', 'cheung sha wan',
        'san po kong', '新蒲崗', 'diamond hill', '鑽石山', 'to kwa wan', '土瓜灣', 'kai tak', '啟德'
    ]):
        return "Kowloon"
    if any(k in combined for k in ['hong kong island', 'hk island', '港島', 'wan chai', 'central', 'sheung wan', 'admiralty', 'causeway bay', 'tin hau', 'quarry bay', 'north point', 'sai wan', 'aberdeen', 'pok fu lam']):
        return "Hong Kong Island"
    
    return "Hong Kong"


def parse_datetime_and_duration(start_iso: Optional[str], end_iso: Optional[str]):
    """
    Parses UTC ISO strings into local Hong Kong Time (HKT, UTC+8)
    and computes event date and duration in hours.
    """
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
    """
    Scrapes a HandsOn Hong Kong volunteer opportunity page and extracts
    structured attributes without eligibility constraints.
    """
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/124.0.0.0 Safari/537.36'
        ),
        'Accept-Language': 'en-US,en;q=0.9,zh-HK;q=0.8,zh;q=0.7',
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    # 1. Opportunity ID
    opportunity_id = url.rstrip('/').split('?')[0].split('/')[-1]

    # 2. Opportunity Title
    title_elem = soup.find('h1', class_='title-opportunity') or soup.find('h1')
    title = title_elem.get_text(strip=True) if title_elem else "Unknown Opportunity"

    # 3. Organization Information
    org_elem = soup.find('a', class_='organization-name')
    org_name = org_elem.get_text(strip=True) if org_elem else None

    org_web_elem = soup.find('a', class_='organization-link')
    org_website = org_web_elem.get('href') if org_web_elem else None

    # 4. Description & Content
    desc_elem = soup.find('div', id='opportunity-detail-description')
    full_description = desc_elem.get_text(separator='\n', strip=True) if desc_elem else ""

    # 5. Issue Areas (Categories)
    issue_elem = soup.find('span', class_='issue-areas')
    issue_areas: List[str] = []
    if issue_elem:
        raw_issues = issue_elem.get_text()
        issue_areas = [item.strip() for item in raw_issues.split(',') if item.strip()]

    # 6. Populations Served
    pop_elem = soup.find('span', class_='population-served')
    populations_served: List[str] = []
    if pop_elem:
        raw_pops = pop_elem.get_text()
        populations_served = [item.strip() for item in raw_pops.split(',') if item.strip()]

    # 7. Required Skills
    req_box = soup.find('p', class_='requirements')
    skills: List[str] = []
    if req_box:
        skills_span = req_box.find('span', class_='skillsText')
        if skills_span:
            raw_skills = skills_span.get_text(strip=True).replace('Skills:', '').strip()
            skills = [s.strip() for s in raw_skills.split(',') if s.strip()]

    # 8. Location & Region
    loc_elem = soup.find('span', class_='location') or soup.find('input', class_='occurrence-location-name')
    location_address: Optional[str] = None
    if loc_elem:
        if loc_elem.name == 'span':
            location_address = loc_elem.get_text(strip=True)
        else:
            location_address = loc_elem.get('value', '').strip() or None

    region = infer_region(location_address, title, full_description)

    # 9. Time, Dates, and Duration
    first_occ = soup.find('div', class_='item-occ')
    start_iso = first_occ.get('data-occ-start-date-time') if first_occ else None
    end_iso = first_occ.get('data-occ-end-date-time') if first_occ else None

    event_date, start_datetime, end_datetime, duration_hours = parse_datetime_and_duration(start_iso, end_iso)

    # 10. Search Content (for TF-IDF and Semantic Embedding models)
    content_parts = [
        f"Title: {title}",
        f"Organization: {org_name}" if org_name else "",
        f"Categories: {', '.join(issue_areas)}" if issue_areas else "",
        f"Target Groups: {', '.join(populations_served)}" if populations_served else "",
        f"Required Skills: {', '.join(skills)}" if skills else "",
        f"Region: {region}",
        f"Description: {full_description}"
    ]
    search_content = "\n".join([p for p in content_parts if p])

    return {
        'id': opportunity_id,
        'url': url,
        'title': title,
        'organization_name': org_name,
        'organization_website': org_website,
        'issue_areas': issue_areas,
        'populations_served': populations_served,
        'required_skills': skills,
        'location_address': location_address,
        'region': region,
        'event_date': event_date,
        'start_datetime': start_datetime,
        'end_datetime': end_datetime,
        'duration_hours': duration_hours,
        'description': full_description,
        'search_content': search_content
    }


def init_database(db_path: str = DEFAULT_DB_PATH, schema_path: str = DEFAULT_SCHEMA_PATH):
    """Initializes the SQLite database with the table schema."""
    conn = sqlite3.connect(db_path)
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    print(f"Initialized database '{db_path}' using '{schema_path}'.")


def save_event_to_db(event: Dict[str, Any], db_path: str = DEFAULT_DB_PATH):
    """Inserts or replaces an event record in the SQLite database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
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
    """, (
        event['id'],
        event['url'],
        event['title'],
        event['organization_name'],
        event['organization_website'],
        json.dumps(event['issue_areas'], ensure_ascii=False),
        json.dumps(event['populations_served'], ensure_ascii=False),
        json.dumps(event['required_skills'], ensure_ascii=False),
        event['location_address'],
        event['region'],
        event['event_date'],
        event['start_datetime'],
        event['end_datetime'],
        event['duration_hours'],
        event['description'],
        event['search_content']
    ))

    conn.commit()
    conn.close()


def scrape_and_store_events(urls: List[str], db_path: str = DEFAULT_DB_PATH):
    """Scrapes multiple URLs and stores them into the database."""
    print(f"Scraping and storing {len(urls)} events into '{db_path}'...")
    results = []
    for idx, url in enumerate(urls, 1):
        print(f"[{idx}/{len(urls)}] Scraping: {url}")
        try:
            event = scrape_opportunity(url)
            save_event_to_db(event, db_path)
            results.append(event)
            print(f"    Saved: {event['title']}")
            print(f"    Date: {event['event_date']} | Duration: {event['duration_hours']}h | Region: {event['region']}")
        except Exception as e:
            print(f"    Error scraping {url}: {e}")
    return results


def main():
    parser = argparse.ArgumentParser(description="Scrape and store HandsOn Hong Kong events.")
    parser.add_argument('url', nargs='?', default=None, help="Specific opportunity URL to scrape")
    parser.add_argument('--init-db', action='store_true', help="Initialize or reset database tables")
    parser.add_argument('--scrape-sample-5', action='store_true', help="Scrape the 5 diverse sample events")
    parser.add_argument('--db', default=DEFAULT_DB_PATH, help="Path to SQLite database file")

    args = parser.parse_args()

    if args.init_db or args.scrape_sample_5:
        init_database(args.db)

    if args.scrape_sample_5:
        scrape_and_store_events(SAMPLE_URLS, args.db)
        print("\nSuccessfully finished scraping 5 events!")
    elif args.url:
        print(f"Scraping single URL: {args.url}")
        data = scrape_opportunity(args.url)
        save_event_to_db(data, args.db)
        print("Success! Saved event:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        # Default behavior: initialize and scrape 5 events
        init_database(args.db)
        scrape_and_store_events(SAMPLE_URLS, args.db)


if __name__ == '__main__':
    main()
