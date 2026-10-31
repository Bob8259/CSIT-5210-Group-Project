"""
Script to clean unescaped HTML entities (e.g. &#39; -> ', &amp; -> &) in SQLite events table
CSIT5210 Group 1 Project
"""

import sys
import os
import re
import html
import sqlite3

def clean_database():
    db_path = os.path.join(os.path.dirname(__file__), "..", "volunteer.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    text_cols = ["title", "description", "organization_name", "location_address", "region", "search_content"]
    
    cursor.execute("SELECT id, " + ", ".join(text_cols) + " FROM events")
    rows = cursor.fetchall()

    modified_count = 0

    for row in rows:
        event_id = row[0]
        updates = {}
        
        for col_name, val in zip(text_cols, row[1:]):
            if val and isinstance(val, str):
                cleaned_val = html.unescape(val)
                # Normalize HTML entities
                cleaned_val = cleaned_val.replace("&#39;", "'").replace("&quot;", '"').replace("&amp;", "&").replace("&nbsp;", " ")
                # Fix awkward spaced apostrophes (e.g., "Hong Kong 's" -> "Hong Kong's")
                cleaned_val = re.sub(r"\s+'(s|t|re|ll|ve|d|m)\b", r"'\1", cleaned_val)
                # Clean extra spaces
                cleaned_val = re.sub(r"[ \t]+", " ", cleaned_val).strip()

                if cleaned_val != val:
                    updates[col_name] = cleaned_val

        if updates:
            set_clause = ", ".join([f"{col} = ?" for col in updates.keys()])
            params = list(updates.values()) + [event_id]
            cursor.execute(f"UPDATE events SET {set_clause} WHERE id = ?", params)
            modified_count += 1

    conn.commit()
    print(f"Cleaned {modified_count} events in SQLite database.")
    
    # Verify sample cleaned title
    cursor.execute("SELECT title FROM events WHERE title LIKE '%Hong Kong%Refugees%' LIMIT 1")
    sample = cursor.fetchone()
    if sample:
        print(f"Sample Cleaned Title: {sample[0]}")

    conn.close()

if __name__ == "__main__":
    clean_database()
