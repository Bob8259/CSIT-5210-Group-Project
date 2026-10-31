import sys
import os
sys.path.insert(0, os.path.abspath("."))

import time
from backend.services.recommend_service import recommend_compare

def main():
    print("Testing recommendation service for user_1...")
    t0 = time.time()
    res = recommend_compare("user_1", top_k=3)
    t1 = time.time()
    print(f"Comparison completed in {t1 - t0:.3f} seconds total.\n")

    print(f"=== TF-IDF (Latency: {res['tfidf']['latency_ms']} ms) ===")
    for item in res["tfidf"]["items"]:
        print(f"  #{item['rank']} [Score: {item['score']:.4f}] {item['event']['title']} ({item['event']['region']})")

    print(f"\n=== Semantic Dense Embedding (Latency: {res['embedding']['latency_ms']} ms) ===")
    for item in res["embedding"]["items"]:
        print(f"  #{item['rank']} [Score: {item['score']:.4f}] {item['event']['title']} ({item['event']['region']})")

    print(f"\n=== Neural Cross-Encoder Reranker (Latency: {res['cross_encoder']['latency_ms']} ms) ===")
    for item in res["cross_encoder"]["items"]:
        print(f"  #{item['rank']} [Score: {item['score']:.4f}] {item['event']['title']} ({item['event']['region']})")
        print(f"     Rationale: {item['rationale']}")
        print(f"     Matched: {item['matched_features']}")

if __name__ == "__main__":
    main()
