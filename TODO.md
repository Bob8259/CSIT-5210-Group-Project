# Project TODO List — Cold-Start Volunteer RecSys
**Course:** HKUST CSIT5210 (Group 1)  
**Goal:** Implement and evaluate 3 Cold-Start Recommendation Strategies (TF-IDF Baseline, Semantic Embeddings using `sentence-transformers/all-MiniLM-L6-v2`, and Neural Cross-Encoder Reranking using `cross-encoder/ms-marco-MiniLM-L-6-v2`) on 697 real volunteer opportunities.

---

## 📌 Implementation Roadmap

```
[Phase 1: Pre-calculate Data & Vectors in SQLite] (Completed)
       │
       ▼
[Phase 2: Backend Recommendation APIs & Services] (In Progress)
       │
       ▼
[Phase 3: Frontend UI & Dedicated Testing Page]
       │
       ▼
[Phase 4: Evaluation Metrics & Course Report]
```

---

## Phase 1: Pre-calculate Data & Vectors in SQLite (Completed)

> **Objective:** Pre-compute and serialize all feature representations directly into `backend/volunteer.db` so the entire project is 100% self-contained and query latency is under 5ms.

- [x] **1.1 Dependency Setup**
  - Installed `sentence-transformers`, `torch`, `scikit-learn`, `numpy`, and `scipy`.
  - Updated `backend/requirements.txt`.

- [x] **1.2 SQLite Vector Table Schemas**
  - Created `event_embeddings` table (`event_id`, `model_name`, `dim`, `vector` BLOB).
  - Created `recsys_models` table (`model_name`, `model_type`, `payload` BLOB).

- [x] **1.3 Compute & Store Vectors in SQLite (`backend/scripts/save_vectors_to_db.py`)**
  - **TF-IDF Model:** Fitted `(697, 6121)` sparse document matrix (unigrams + bigrams, sublinear TF) and serialized vectorizer into `recsys_models`.
  - **Semantic Dense Embedding Model:** Encoded all 697 events using **`sentence-transformers/all-MiniLM-L6-v2`** into 384-dimensional $L_2$-normalized float32 vectors (1,536 bytes per event) and saved as binary BLOBs in `event_embeddings`.

- [x] **1.4 Verification & Inspection (`backend/scripts/inspect_first_event_vector.py`)**
  - SQLite matrix load time: **2.15 ms**; full 697-opportunity dot-product search: **1.59 ms**.
  - Verified first event `a0CQ90000IEo9GYMQZ` (*"Shopping with the Elderly in Tin Shui Wai Centre"*):
    - **Dense Embedding (`sentence-transformers/all-MiniLM-L6-v2`):** Dimension = 384, $L_2$ Norm = 1.000000, Min = -0.14051, Max = +0.16586, Mean = -0.00222.
    - **TF-IDF Representation:** 92 active tokens out of 6,121 features. Top weighted terms: `accompany elderly` (0.1814), `help maintain` (0.1814), `living poverty` (0.1814), `community centre` (0.1814), `elderly` (0.1741).
  - Verified local Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) on sample queries with zero API dependencies.

---

## Phase 2: Backend Recommendation Services & APIs (Completed)

> **Objective:** Expose clean FastAPI endpoints for the 3 recommendation strategies and comparison.

- [x] **2.1 Implement Recommendation Services (`backend/services/recommend_service.py`)**
  - **Strategy A (TF-IDF Baseline):**
    - Load pre-computed TF-IDF vectorizer and sparse matrix from `recsys_models` into memory on startup.
    - Transform input user's `profile_text` into vector.
    - Compute cosine similarity against `event_tfidf_matrix` with opportunity deduplication.
    - Return Top-$K$ events with similarity scores.
  - **Strategy B (Semantic Dense Embeddings — `sentence-transformers/all-MiniLM-L6-v2`):**
    - Load pre-computed $697 \times 384$ embedding matrix from `event_embeddings` into memory on startup.
    - Encode user's `profile_text` using `sentence-transformers/all-MiniLM-L6-v2`.
    - Compute dot product similarity against pre-normalized event matrix ($< 20\text{ms}$).
    - Return Top-$K$ events with similarity scores.
  - **Strategy C (Neural Cross-Encoder Reranker — `cross-encoder/ms-marco-MiniLM-L-6-v2`):**
    - Retrieve distinct candidate events from Strategy B.
    - Run local Cross-Encoder model across `(user_profile, candidate_event)` pairs.
    - Compute fine-grained cross-attention score + structured attribute-matching rationale (causes, region, duration, skills).
    - Return Top-$K$ events with calibrated rerank scores and explainable rationale.
  - **Comparison Aggregator:**
    - Bundled Top-$K$ from all three methods side-by-side (`/api/recommend/compare`).

- [x] **2.2 API Router (`backend/routers/recommend.py`)**
  - `GET /api/recommend/tfidf?user_id=...&top_k=5`
  - `GET /api/recommend/embedding?user_id=...&top_k=5`
  - `GET /api/recommend/rerank?user_id=...&top_k=5` (Strategy C)
  - `GET /api/recommend/compare?user_id=...&top_k=5`

- [x] **2.3 Register Router in `backend/main.py`**
  - Maintained minimal `main.py` (37 lines, under the 40 lines limit per `AGENTS.md`).
  - Tested all endpoints with `fastapi.testclient.TestClient` (`backend/scripts/test_endpoints.py` — 100% pass).

---

## Phase 3: Frontend UI Refactoring & Dedicated Playground (Completed)

> **Objective:** Simplify Dashboard tabs and provide a dedicated, comprehensive page to test and compare models.

- [x] **3.1 Update Home Dashboard (`frontend/src/pages/Home.tsx`)**
  - Removed *"2. Relevance Labels"* and *"3. Models Comparison"* tabs from the dashboard.
  - Added a prominent action button: **"Test Recommendation Methods"** with Sparkles and ArrowRight icons.
  - Clicking navigates directly to `/recommendations`.
  - Added an action callout banner inside the Questionnaire tab prompting users to test recommendation models for their cold-start profile.

- [x] **3.2 Add Route in `frontend/src/App.tsx` & `Navbar.tsx`**
  - Registered route path: `/recommendations` -> `<Recommendations />`.
  - Added navigation link in header Navbar for instant access.

- [x] **3.3 Build Playground Page (`frontend/src/pages/Recommendations.tsx`)**
  - **Active Profile Card:** Displays the current user's cold-start attributes (causes, demographics, regions, duration, bio, skills).
  - **Model Selector Tabs:**
    - `Side-by-Side Comparison` (3-column view)
    - `Strategy A: TF-IDF Baseline`
    - `Strategy B: Semantic Embeddings (all-MiniLM-L6-v2)`
    - `Strategy C: Neural Cross-Encoder Reranker (ms-marco-MiniLM-L-6-v2)`
  - **Control Bar:**
    - Top-$K$ selector ($K = 3, 5, 10$).
    - "Refresh Results" action button.
  - **Result Cards:**
    - Displays rank badges (#1, #2, #3...), match score percentage bar.
    - Explainable match rationale box comparing user profile with opportunity metadata.
    - Matched feature pills (`Cause`, `Target`, `Region`, `Duration`, `Skill`).
    - Integrated "View Opportunity" modal trigger (`EventModal`).
  - **Side-by-Side View:**
    - 3-column layout showing real-time latency badges (e.g. 4ms, 19ms) and differences between models for the same cold-start user.

- [x] **3.4 Verification**
  - Verified with `npm run build` (`tsc -b && vite build`) — passes cleanly in **819ms** with **0 TypeScript and bundling errors**.

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

