"""
Script to Compute and Store Vectors (TF-IDF & Dense Embeddings) directly into SQLite
CSIT5210 Group 1 Project
"""

import sys
import os
import time
import pickle
import sqlite3
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer

# Ensure unbuffered output
sys.stdout.reconfigure(line_buffering=True)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "volunteer.db")


def init_vector_tables(conn: sqlite3.Connection):
    """Creates tables for dense embeddings and serialized recsys models."""
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS event_embeddings (
            event_id TEXT PRIMARY KEY,
            model_name TEXT NOT NULL,
            dim INTEGER NOT NULL,
            vector BLOB NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS recsys_models (
            model_name TEXT PRIMARY KEY,
            model_type TEXT NOT NULL,
            payload BLOB NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    conn.commit()
    print("Vector tables (event_embeddings, recsys_models) verified.")


def compute_and_save_tfidf(conn: sqlite3.Connection, events):
    """Computes TF-IDF vectorizer and event document matrix, stores into recsys_models."""
    print("\n--- 1. Computing & Storing TF-IDF in SQLite ---")
    corpus = [row["search_content"] or "" for row in events]

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
        min_df=2
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    print(f"TF-IDF Matrix shape: {tfidf_matrix.shape} (events x vocabulary)")

    cursor = conn.cursor()
    # Store fitted vectorizer object
    cursor.execute(
        """
        INSERT OR REPLACE INTO recsys_models (model_name, model_type, payload)
        VALUES (?, ?, ?)
        """,
        ("tfidf_vectorizer", "sklearn_tfidf", pickle.dumps(vectorizer))
    )

    # Store sparse matrix
    cursor.execute(
        """
        INSERT OR REPLACE INTO recsys_models (model_name, model_type, payload)
        VALUES (?, ?, ?)
        """,
        ("event_tfidf_matrix", "scipy_csr_matrix", pickle.dumps(tfidf_matrix))
    )
    conn.commit()
    print("TF-IDF vectorizer and sparse matrix saved to 'recsys_models' table.")


def compute_and_save_embeddings(conn: sqlite3.Connection, events):
    """Computes dense embeddings with all-MiniLM-L6-v2 and stores BLOBs in event_embeddings."""
    print("\n--- 2. Computing & Storing Dense Embeddings in SQLite ---")
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    print(f"Loading local embedding model: {model_name}...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    # Extract unique texts
    unique_contents = list(set(row["search_content"] or "" for row in events))
    print(f"Encoding {len(unique_contents)} unique opportunity contents across {len(events)} events...")

    t0 = time.time()
    unique_embeddings = model.encode(unique_contents, batch_size=32, show_progress_bar=True, normalize_embeddings=True)
    t1 = time.time()
    print(f"Encoded {len(unique_contents)} items in {t1 - t0:.2f} seconds.")

    content_to_vec = {
        text: unique_embeddings[i] for i, text in enumerate(unique_contents)
    }

    dim = unique_embeddings.shape[1]
    print(f"Embedding dimension: {dim}")

    cursor = conn.cursor()
    records = []
    for row in events:
        event_id = row["id"]
        content = row["search_content"] or ""
        vec = content_to_vec[content]
        # Store as float32 binary BLOB
        blob = np.asarray(vec, dtype=np.float32).tobytes()
        records.append((event_id, "all-MiniLM-L6-v2", dim, blob))

    cursor.executemany(
        """
        INSERT OR REPLACE INTO event_embeddings (event_id, model_name, dim, vector)
        VALUES (?, ?, ?, ?)
        """,
        records
    )
    conn.commit()
    print(f"Successfully saved {len(records)} embedding BLOBs into 'event_embeddings' table.")


def verify_storage(conn: sqlite3.Connection):
    """Verifies vectors in database and runs benchmark similarity search."""
    print("\n--- 3. Verifying Stored Vectors ---")
    cursor = conn.cursor()

    # Check counts
    cursor.execute("SELECT COUNT(*) FROM event_embeddings")
    count = cursor.fetchone()[0]
    print(f"Total rows in event_embeddings: {count}")

    cursor.execute("SELECT model_name, length(payload) FROM recsys_models")
    for r in cursor.fetchall():
        print(f"Model: {r[0]} | Payload size: {r[1]:,} bytes")

    # Benchmark: reconstruct matrix from SQLite BLOBs and perform search
    t0 = time.time()
    cursor.execute("SELECT event_id, vector FROM event_embeddings ORDER BY event_id ASC")
    rows = cursor.fetchall()
    ids = [r[0] for r in rows]
    matrix = np.vstack([np.frombuffer(r[1], dtype=np.float32) for r in rows])
    t1 = time.time()

    print(f"Loaded full embedding matrix {matrix.shape} from SQLite in { (t1 - t0)*1000:.2f} ms")

    # Mock user vector search
    mock_user_vec = matrix[0]  # sample vector
    t_search_0 = time.time()
    scores = np.dot(matrix, mock_user_vec)
    top_indices = np.argsort(scores)[::-1][:5]
    t_search_1 = time.time()

    print(f"Cosine similarity search on all 697 events took: {(t_search_1 - t_search_0)*1000:.3f} ms")
    print(f"Top 5 matched event IDs: {[ids[i] for i in top_indices]}")
    print(f"Top 5 scores: {[round(float(scores[i]), 4) for i in top_indices]}")


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()
    cursor.execute("SELECT id, search_content FROM events ORDER BY id ASC")
    events = cursor.fetchall()
    print(f"Loaded {len(events)} events from {DB_PATH}.")

    init_vector_tables(conn)
    compute_and_save_tfidf(conn, events)
    compute_and_save_embeddings(conn, events)
    verify_storage(conn)

    conn.close()
    print("\nAll vectors are permanently stored inside 'volunteer.db'!")


if __name__ == "__main__":
    main()

