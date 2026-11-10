"""
Database Deduplication & Model Synchronization Script
CSIT5210 Group 1 Project

Deduplicates recurring event instances in `backend/volunteer.db` so the `events` table
contains strictly unique activities (1 canonical record per unique title).
Synchronizes `event_embeddings` and refits `recsys_models` (TF-IDF vectorizer and matrix)
so the entire recommendation engine runs cleanly over the deduplicated catalog.
"""

import os
import shutil
import pickle
import sqlite3
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "volunteer.db"))
BACKUP_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "volunteer.db.bak"))


def score_row(r: dict) -> tuple:
    """
    Heuristic scoring to select the highest-quality, most complete representative
    record among duplicate calendar instances of the same volunteer activity.
    """
    score = 0
    # 1. Territorial Region specificity
    if r.get("region") in ["Hong Kong Island", "Kowloon", "New Territories"]:
        score += 100
    elif r.get("region") == "Online / Flexible":
        score += 80

    # 2. Description completeness
    desc = r.get("description") or ""
    score += min(len(desc), 1000)

    # 3. Positive duration
    if r.get("duration_hours") and r["duration_hours"] > 0:
        score += 50

    # 4. Detailed physical address
    if r.get("location_address") and len(r["location_address"]) > 5:
        score += 30

    # 5. Tie-breaker: latest event_date
    date_val = r.get("event_date") or ""
    return (score, date_val)


def main():
    print(f"Opening database: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    # 1. Create a safe backup
    print(f"Creating backup at: {BACKUP_PATH}")
    shutil.copyfile(DB_PATH, BACKUP_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 2. Fetch all events
    cursor.execute("SELECT * FROM events")
    all_rows = cursor.fetchall()
    print(f"Loaded {len(all_rows)} total event records.")

    # 3. Group by title and select best canonical record
    by_title = {}
    for r in all_rows:
        title = r["title"].strip()
        if title not in by_title:
            by_title[title] = []
        by_title[title].append(dict(r))

    print(f"Identified {len(by_title)} unique event titles.")

    best_rows = []
    for title, rlist in by_title.items():
        sorted_rows = sorted(rlist, key=score_row, reverse=True)
        best_rows.append(sorted_rows[0])

    # Sort canonical rows by id ASC for consistency
    best_rows = sorted(best_rows, key=lambda r: r["id"])
    canonical_ids = [r["id"] for r in best_rows]
    print(f"Selected {len(canonical_ids)} canonical unique event records.")

    # 4. Delete non-canonical records from events table
    print("Purging duplicate session rows from 'events' table...")
    cursor.execute(
        f"DELETE FROM events WHERE id NOT IN ({','.join('?' for _ in canonical_ids)})",
        canonical_ids
    )
    deleted_events = cursor.rowcount
    print(f"Deleted {deleted_events} duplicate rows from 'events'. Remaining: {len(canonical_ids)}")

    # 5. Synchronize event_embeddings table
    print("Synchronizing 'event_embeddings' table...")
    cursor.execute(
        f"DELETE FROM event_embeddings WHERE event_id NOT IN ({','.join('?' for _ in canonical_ids)})",
        canonical_ids
    )
    deleted_embs = cursor.rowcount
    print(f"Deleted {deleted_embs} duplicate embedding vectors from 'event_embeddings'.")

    # 6. Refit and save TF-IDF models on the 194 canonical events
    print("\nRefitting TF-IDF vectorizer and sparse matrix for the canonical catalog...")
    corpus = [r["search_content"] or "" for r in best_rows]
    tfidf_vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
        min_df=2
    )
    tfidf_matrix = tfidf_vectorizer.fit_transform(corpus)
    print(f"New TF-IDF Matrix shape: {tfidf_matrix.shape} (canonical events x vocabulary)")

    cursor.execute(
        """
        INSERT OR REPLACE INTO recsys_models (model_name, model_type, payload)
        VALUES (?, ?, ?)
        """,
        ("tfidf_vectorizer", "sklearn_tfidf", pickle.dumps(tfidf_vectorizer))
    )
    cursor.execute(
        """
        INSERT OR REPLACE INTO recsys_models (model_name, model_type, payload)
        VALUES (?, ?, ?)
        """,
        ("event_tfidf_matrix", "scipy_csr_matrix", pickle.dumps(tfidf_matrix))
    )
    print("Saved refitted TF-IDF models to 'recsys_models'.")

    conn.commit()

    # 7. VACUUM database to reclaim disk space
    print("\nRunning VACUUM to defragment SQLite database...")
    cursor.execute("VACUUM;")
    conn.commit()

    # 8. Verification
    cursor.execute("SELECT COUNT(*) FROM events")
    final_events = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM event_embeddings")
    final_embs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT title) FROM events")
    final_titles = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT organization_name) FROM events")
    final_orgs = cursor.fetchone()[0]

    cursor.execute("SELECT region, COUNT(*) FROM events GROUP BY region ORDER BY COUNT(*) DESC")
    region_dist = cursor.fetchall()

    conn.close()

    print("\n=== Verification Summary ===")
    print(f"Events table rows:          {final_events} (All Unique: {final_events == final_titles})")
    print(f"Distinct Event Titles:      {final_titles}")
    print(f"Distinct Partner NGOs:      {final_orgs}")
    print(f"Event Embeddings rows:      {final_embs}")
    print("Territorial Distribution:")
    for reg, cnt in region_dist:
        print(f"  - {reg}: {cnt}")
    print("\nDeduplication completed successfully!")


if __name__ == "__main__":
    main()
