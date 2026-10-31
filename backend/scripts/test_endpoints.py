import sys
import os
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.main import app

def main():
    client = TestClient(app)

    print("--- 1. Testing Health Endpoint ---")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("Health check OK:", res.json())

    print("\n--- 2. Testing TF-IDF Endpoint ---")
    res = client.get("/api/recommend/tfidf?user_id=user_1&top_k=3")
    assert res.status_code == 200, res.text
    data = res.json()
    print(f"TF-IDF OK (latency: {data['latency_ms']} ms, items: {len(data['items'])})")
    assert len(data["items"]) == 3
    assert data["strategy"] == "tfidf"

    print("\n--- 3. Testing Semantic Embedding Endpoint ---")
    res = client.get("/api/recommend/embedding?user_id=user_1&top_k=3")
    assert res.status_code == 200, res.text
    data = res.json()
    print(f"Embedding OK (latency: {data['latency_ms']} ms, items: {len(data['items'])})")
    assert len(data["items"]) == 3
    assert data["strategy"] == "embedding"

    print("\n--- 4. Testing Cross-Encoder Rerank Endpoint ---")
    res = client.get("/api/recommend/rerank?user_id=user_1&top_k=3")
    assert res.status_code == 200, res.text
    data = res.json()
    print(f"Rerank OK (latency: {data['latency_ms']} ms, items: {len(data['items'])})")
    assert len(data["items"]) == 3
    assert data["strategy"] == "cross_encoder"
    print(f"Top #1: {data['items'][0]['event']['title']} (Score: {data['items'][0]['score']})")

    print("\n--- 5. Testing Compare Endpoint ---")
    res = client.get("/api/recommend/compare?user_id=user_1&top_k=3")
    assert res.status_code == 200, res.text
    data = res.json()
    print("Compare OK: contains tfidf, embedding, and cross_encoder side-by-side.")
    assert "tfidf" in data and "embedding" in data and "cross_encoder" in data

    print("\n--- 6. Testing 404 on Invalid User ---")
    res = client.get("/api/recommend/tfidf?user_id=nonexistent_user")
    assert res.status_code == 404, res.text
    print("404 Validation OK:", res.json()["detail"])

    print("\n🎉 ALL BACKEND ENDPOINTS PASSED VERIFICATION!")

if __name__ == "__main__":
    main()

