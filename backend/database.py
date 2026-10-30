"""
Database Connection Utility
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "volunteer.db")


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with dict-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

