# Project TODO List — Cold-Start Volunteer RecSys
**Course:** HKUST CSIT5210 (Group 1)  
**Goal:** Implement and evaluate 3 Cold-Start Recommendation Strategies (TF-IDF Baseline, Semantic Embeddings, LLM Reranking) on 697 real volunteer opportunities.

---

## 📌 Implementation Roadmap

```
[Phase 1: Pre-calculate Data & Vectors]
       │
       ▼
[Phase 2: Backend Recommendation APIs]
       │
       ▼
[Phase 3: Frontend UI & Dedicated Testing Page]
       │
       ▼
[Phase 4: Evaluation Metrics & Course Report]
```

---

## Phase 1: Pre-calculate Data & Vectors (Completed)

> **Objective:** Pre-compute and serialize all feature representations directly into `backend/volunteer.db` so the entire project is self-contained and query latency is under 5ms.

- [x] **1.1 Dependency Setup**
  - Installed `sentence-transformers`, `torch`, `scikit-learn`, `numpy`, and `scipy`.
  - Updated `backend/requirements.txt`.

- [x] **1.2 SQLite Vector Table Schemas**
  - Created `event_embeddings` table (`event_id`, `model_name`, `dim`, `vector` BLOB).
  - Created `recsys_models` table (`model_name`, `model_type`, `payload` BLOB).

- [x] **1.3 Compute & Store Vectors in SQLite (`backend/scripts/save_vectors_to_db.py`)**
  - **TF-IDF Model:** Fitted `(697, 6121)` sparse document matrix and serialized vectorizer into `recsys_models`.
  - **Semantic Dense Embedding Model:** Encoded all 697 events into 384-dimensional $L_2$-normalized float32 vectors (`all-MiniLM-L6-v2`) and saved as binary BLOBs in `event_embeddings`.

- [x] **1.4 Verification & Benchmark**
  - Loaded full matrix from SQLite in **2.15 ms**.
  - Vector dot-product search across all 697 opportunities completed in **1.59 ms**.
  - Verify output files exist and shapes match `697`.
  - Run a mock vector search for a sample cold-start profile; verify response latency is $< 5\text{ms}$.

---

## Phase 2: Backend Recommendation Services & APIs

> **Objective:** Expose clean FastAPI endpoints for the 3 recommendation strategies and comparison.

- [ ] **2.1 Implement Recommendation Services (`backend/services/recommend_service.py`)**
  - **Strategy A (TF-IDF Baseline):**
    - Load pre-computed TF-IDF model into memory once.
    - Transform input user's `profile_text` into vector.
    - Compute cosine similarity against `event_tfidf_matrix`.
    - Return Top-$K$ events with similarity scores.
  - **Strategy B (Semantic Dense Embeddings):**
    - Load pre-computed `event_embeddings.npy` into memory.
    - Encode user's `profile_text` with `all-MiniLM-L6-v2`.
    - Compute dot product similarity against pre-normalized event matrix.
    - Return Top-$K$ events with similarity scores.
  - **Strategy C (Retrieval-Augmented LLM Reranker):**
    - Retrieve Top 15 candidate events from Strategy B.
    - Prompt LLM (Gemini or OpenAI API) with user's cold-start preferences and the candidate list.
    - Request structured JSON reranking Top 5 with matching rationale.
  - **Comparison Aggregator:**
    - Bundle Top-$K$ from all three methods side-by-side.

- [ ] **2.2 API Router (`backend/routers/recommend.py`)**
  - `GET /api/recommend/tfidf?user_id=...&top_k=5`
  - `GET /api/recommend/embedding?user_id=...&top_k=5`
  - `GET /api/recommend/llm?user_id=...&top_k=5`
  - `GET /api/recommend/compare?user_id=...&top_k=5`

- [ ] **2.3 Register Router in `backend/main.py`**
  - Maintain minimal `main.py` (< 40 lines) per `AGENTS.md`.

---

## Phase 3: Frontend UI Refactoring & Dedicated Playground

> **Objective:** Simplify Dashboard tabs and provide a dedicated, comprehensive page to test and compare models.

- [ ] **3.1 Update Home Dashboard (`frontend/src/pages/Home.tsx`)**
  - Remove *"2. Relevance Labels"* and *"3. Models Comparison"* tabs from the dashboard.
  - Add a prominent, styled action button: **"Test Recommendation Methods"** with an arrow icon.
  - Clicking navigates directly to `/recommendations`.

- [ ] **3.2 Add Route in `frontend/src/App.tsx`**
  - Register route path: `/recommendations` -> `<Recommendations />`.

- [ ] **3.3 Build Playground Page (`frontend/src/pages/Recommendations.tsx`)**
  - **Active Profile Card:** Displays the current user's cold-start attributes (causes, regions, duration, bio).
  - **Model Selector Tabs:**
    - `TF-IDF Baseline`
    - `Semantic Embeddings`
    - `LLM Reranking`
    - `Side-by-Side Comparison`
  - **Control Bar:**
    - Top-$K$ selector slider ($K = 3, 5, 10$).
    - "Generate Recommendations" trigger button with loading skeleton.
  - **Result Cards:**
    - Display rank badges (#1, #2, #3...), similarity score percentage bar.
    - Show matched keywords / LLM rationale.
    - Integrated "View Details" modal for full event info.
  - **Comparison View:**
    - Multi-column side-by-side comparison displaying differences between models for the same cold-start user.

- [ ] **3.4 Verification**
  - Run `npm run build` in `frontend/` to confirm zero TypeScript and bundling errors.

---

## Phase 4: Offline Evaluation & Reporting (Course Project)

> **Objective:** Produce quantitative results and comparative metrics for the CSIT5210 report.

- [ ] **4.1 Ground-Truth Relevance Labeling**
  - Create small test ground-truth set across the 10 test user profiles (Interested / Neutral / Not Interested).
- [ ] **4.2 Metric Computations (`backend/evaluation.py`)**
  - Implement **Recall@K** ($K = 3, 5, 10$).
  - Implement **NDCG@K** (Normalized Discounted Cumulative Gain).
- [ ] **4.3 Results Generation**
  - Generate comparison table and markdown report for group submission.

