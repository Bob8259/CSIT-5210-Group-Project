"""
Pre-computation Script: TF-IDF and OpenRouter Nemotron-3.5 Embeddings for 697 Events
CSIT5210 Group 1 Project
"""

import os
import sys
import json
import time
import pickle
import sqlite3
import hashlib
import numpy as np
import requests
from dotenv import load_dotenv

# Ensure unbuffered console output
sys.stdout.reconfigure(line_buffering=True)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "nvidia/nemotron-3.5-embed-8b:free")

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "volunteer.db")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CACHE_FILE = os.path.join(DATA_DIR, "cached_embeddings.json")
os.makedirs(DATA_DIR, exist_ok=True)


def load_events():
    """Loads all 697 events from SQLite in deterministic ID order."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, organization_name, issue_areas, region, search_content 
        FROM events 
        ORDER BY id ASC
        """
    )
    rows = cursor.fetchall()
    conn.close()
    return rows


def build_tfidf(events):
    """Fits and serializes TF-IDF vectorizer and event document matrix."""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from scipy.sparse import save_npz

    print("\n--- 1. Computing TF-IDF Baseline Vectors ---")
    corpus = [row["search_content"] or "" for row in events]

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
        min_df=2
    )

    tfidf_matrix = vectorizer.fit_transform(corpus)
    print(f"TF-IDF Matrix shape: {tfidf_matrix.shape} (events x vocabulary)")

    vec_path = os.path.join(DATA_DIR, "tfidf_vectorizer.pkl")
    matrix_path = os.path.join(DATA_DIR, "event_tfidf_matrix.npz")

    with open(vec_path, "wb") as f:
        pickle.dump(vectorizer, f)
    save_npz(matrix_path, tfidf_matrix)

    print(f"Saved TF-IDF vectorizer to {vec_path}")
    print(f"Saved TF-IDF matrix to {matrix_path}")
    return tfidf_matrix


def get_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f)


def fetch_single_embedding(text, retries=6):
    """Fetches embedding for a single text using OpenRouter API with robust backoff."""
    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Volunteer RecSys"
    }

    payload = {
        "model": MODEL_NAME,
        "input": text[:3500]
    }

    for attempt in range(1, retries + 1):
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=30)
            if res.status_code == 200:
                data = res.json()
                return data["data"][0]["embedding"]
            else:
                print(f"  Attempt {attempt}/{retries} - HTTP {res.status_code}: {res.text[:150]}")
                # Exponential backoff
                time.sleep(3 * attempt)
        except Exception as e:
            print(f"  Attempt {attempt}/{retries} error: {e}")
            time.sleep(3 * attempt)

    raise RuntimeError(f"Failed to fetch embedding after {retries} retries.")


def build_embeddings(events):
    """Computes dense embeddings for unique contents and maps to all 697 events."""
    print(f"\n--- 2. Computing Neural Embeddings via OpenRouter ({MODEL_NAME}) ---")

    if not API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not set. Check your .env file.")

    # Deduplicate by search_content
    unique_contents = list(set(row["search_content"] or "" for row in events))
    print(f"Total events: {len(events)} | Unique opportunity contents: {len(unique_contents)}")

    cache = load_cache()
    print(f"Loaded {len(cache)} pre-cached embeddings from disk.")

    needed_texts = [t for t in unique_contents if get_text_hash(t) not in cache]
    print(f"Texts requiring API generation: {len(needed_texts)}")

    # Fetch remaining texts with controlled pace to respect free-tier limits
    for idx, text in enumerate(needed_texts, 1):
        h = get_text_hash(text)
        print(f"[{idx}/{len(needed_texts)}] Fetching embedding for text hash {h[:8]}...")
        emb = fetch_single_embedding(text)
        cache[h] = emb
        save_cache(cache)
        time.sleep(0.8)  # respectful delay between requests

    print(f"\nAll {len(unique_contents)} unique embeddings acquired!")
    dim = len(next(iter(cache.values())))
    print(f"Embedding dimension: {dim}")

    # Build full matrix for all 697 events in ID order
    full_matrix = np.zeros((len(events), dim), dtype=np.float32)
    for idx, row in enumerate(events):
        content = row["search_content"] or ""
        h = get_text_hash(content)
        full_matrix[idx] = cache[h]

    # L2 normalize vectors for instant dot-product cosine similarity
    norms = np.linalg.norm(full_matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1e-10
    normalized_matrix = full_matrix / norms

    emb_path = os.path.join(DATA_DIR, "event_embeddings.npy")
    np.save(emb_path, normalized_matrix)
    print(f"Saved normalized event embeddings to {emb_path} (Shape: {normalized_matrix.shape})")

    # Save ordered event IDs list
    ids_path = os.path.join(DATA_DIR, "event_ids.json")
    event_ids = [row["id"] for row in events]
    with open(ids_path, "w", encoding="utf-8") as f:
        json.dump(event_ids, f, indent=2)
    print(f"Saved event ID mapping to {ids_path}")

    return normalized_matrix


def main():
    events = load_events()
    print(f"Loaded {len(events)} events from database.")

    # 1. TF-IDF
    build_tfidf(events)

    # 2. Dense Embeddings
    build_embeddings(events)

    print("\nAll data pre-computations completed successfully!")


if __name__ == "__main__":
    main()
