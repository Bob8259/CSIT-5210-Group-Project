import sqlite3
import pickle
import numpy as np

def main():
    conn = sqlite3.connect("backend/volunteer.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Fetch first event
    cursor.execute("""
        SELECT id, title, organization_name, issue_areas, region, location_address, event_date, duration_hours, search_content 
        FROM events 
        ORDER BY id ASC 
        LIMIT 1
    """)
    event = cursor.fetchone()
    if not event:
        print("No events found in database.")
        return

    print("==================================================")
    print("1. FIRST EVENT METADATA")
    print("==================================================")
    print(f"Event ID     : {event['id']}")
    print(f"Title        : {event['title']}")
    print(f"Organization : {event['organization_name']}")
    print(f"Issue Areas  : {event['issue_areas']}")
    print(f"Region       : {event['region']} ({event['location_address']})")
    print(f"Date         : {event['event_date']} ({event['duration_hours']} hours)")
    search_snippet = (event['search_content'][:220] + "...") if event['search_content'] and len(event['search_content']) > 220 else event['search_content']
    print(f"Search Text  : {search_snippet}\n")

    # 2. Fetch Dense Embedding from event_embeddings table
    cursor.execute("""
        SELECT model_name, dim, vector, updated_at 
        FROM event_embeddings 
        WHERE event_id = ?
    """, (event["id"],))
    emb_row = cursor.fetchone()

    print("==================================================")
    print("2. DENSE SEMANTIC EMBEDDING (from SQLite BLOB)")
    print("==================================================")
    if emb_row:
        model_name = emb_row["model_name"]
        dim = emb_row["dim"]
        raw_bytes = emb_row["vector"]
        vec = np.frombuffer(raw_bytes, dtype=np.float32)

        print(f"Model Name  : {model_name}")
        print(f"Storage     : SQLite BLOB ({len(raw_bytes)} bytes = {dim} float32 values * 4 bytes)")
        print(f"Shape       : {vec.shape}")
        print(f"Data Type   : {vec.dtype}")
        print(f"L2 Norm     : {np.linalg.norm(vec):.6f} (Unit sphere normalized for instant cosine similarity)")
        print(f"Summary     : Min = {vec.min():.5f}, Max = {vec.max():.5f}, Mean = {vec.mean():.5f}, Std = {vec.std():.5f}")
        
        print("\nFirst 20 dimensions:")
        for i, val in enumerate(vec[:20]):
            bar = "#" * int(abs(val) * 60)
            sign = "+" if val >= 0 else "-"
            print(f"  dim_{i:03d} : {sign}{abs(val):.5f}  | {bar}")
        print("  ... [364 more dimensions stored in the BLOB] ...\n")
    else:
        print("No embedding found for this event.\n")

    # 3. Fetch TF-IDF Vector from recsys_models table
    print("==================================================")
    print("3. TF-IDF VECTOR (from recsys_models table)")
    print("==================================================")
    cursor.execute("""
        SELECT payload FROM recsys_models WHERE model_name = 'tfidf_vectorizer'
    """)
    vec_row = cursor.fetchone()
    cursor.execute("""
        SELECT payload FROM recsys_models WHERE model_name = 'event_tfidf_matrix'
    """)
    mat_row = cursor.fetchone()

    if vec_row and mat_row:
        vectorizer = pickle.loads(vec_row["payload"])
        matrix = pickle.loads(mat_row["payload"])

        # Find row corresponding to this event
        cursor.execute("SELECT id FROM events ORDER BY id ASC")
        all_ids = [r["id"] for r in cursor.fetchall()]
        event_idx = all_ids.index(event["id"])

        tfidf_row = matrix[event_idx]
        feature_names = np.array(vectorizer.get_feature_names_out())
        
        non_zero_indices = tfidf_row.indices
        non_zero_values = tfidf_row.data
        sorted_order = np.argsort(non_zero_values)[::-1]

        print(f"Total Vocabulary Size : {len(feature_names)} features (unigrams & bigrams)")
        print(f"Non-zero Features     : {len(non_zero_indices)} out of {len(feature_names)} ({len(non_zero_indices)/len(feature_names)*100:.2f}% active tokens)")
        print(f"L2 Norm               : {np.linalg.norm(non_zero_values):.6f}")
        print("\nTop 15 Most Informative Terms & TF-IDF Weights for this Event:")
        for rank, idx in enumerate(sorted_order[:15], 1):
            term = feature_names[non_zero_indices[idx]]
            weight = non_zero_values[idx]
            bar = "=" * int(weight * 35)
            print(f"  {rank:2d}. {term:<26} : {weight:.4f} {bar}")
    else:
        print("No TF-IDF models found.")

    conn.close()

if __name__ == "__main__":
    main()
