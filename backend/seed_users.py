"""
Seed 10 Blank Test Users for Onboarding Flow Testing
HKUST CSIT5210 Group 1 Project
"""

import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "volunteer.db")


def seed_blank_users(num_users: int = 10):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Re-create users table to ensure clean state
    cursor.execute("DROP TABLE IF EXISTS users;")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            bio TEXT,
            preferred_causes TEXT DEFAULT '[]',
            target_populations TEXT DEFAULT '[]',
            preferred_regions TEXT DEFAULT '[]',
            skills TEXT DEFAULT '[]',
            max_duration_hours REAL,
            profile_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

    # Generate 10 blank users
    users_data = []
    for i in range(1, num_users + 1):
        user_id = f"user_{i}"
        name = f"Test User {i}"
        email = f"user{i}@connect.ust.hk"
        users_data.append((
            user_id,
            name,
            email,
            None,
            json.dumps([]),
            json.dumps([]),
            json.dumps([]),
            json.dumps([]),
            None,
            None
        ))

    cursor.executemany("""
        INSERT INTO users (
            id, name, email, bio,
            preferred_causes, target_populations, preferred_regions,
            skills, max_duration_hours, profile_text
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?
        )
    """, users_data)

    conn.commit()

    cursor.execute("SELECT id, name, email, preferred_causes, max_duration_hours FROM users ORDER BY rowid")
    rows = cursor.fetchall()

    print("=" * 65)
    print(f"SUCCESSFULLY RESET {len(rows)} BLANK TEST USERS IN '{DB_PATH}':")
    print("=" * 65)
    for r in rows:
        print(f"[{r[0]}] {r[1]:<12} | Email: {r[2]:<22} | Causes: {r[3]} | Max Hours: {r[4]}")
    print("=" * 65)

    conn.close()


if __name__ == '__main__':
    seed_blank_users(10)

