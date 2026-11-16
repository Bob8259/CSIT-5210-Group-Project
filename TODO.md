# Project TODO List — Cold-Start Volunteer RecSys
**Course:** HKUST CSIT5210 (Group 1)  
**Goal:** Implement and evaluate 3 Cold-Start Recommendation Strategies (TF-IDF Baseline, Semantic Embeddings using `sentence-transformers/all-MiniLM-L6-v2`, and Neural Cross-Encoder Reranking using `cross-encoder/ms-marco-MiniLM-L-6-v2`) on real civic volunteer opportunities with strict Stage 0 pre-filtering.

---

## 📌 Implementation Roadmap

```
[Phase 1: Pre-calculate Data & Vectors in SQLite] (Completed)
       │
       ▼
[Phase 2: Backend Recommendation APIs & Services] (Completed)
       │
       ▼
[Phase 3: Frontend UI & Dedicated Testing Page] (Completed)
       │
       ▼
[Phase 4: Evaluation Metrics & Course Report] (Completed)
```

**Overall Project Status:** ✅ **100% Completed**

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
  - **Semantic Dense Embedding Model:** Encoded all events using **`sentence-transformers/all-MiniLM-L6-v2`** into 384-dimensional $L_2$-normalized float32 vectors (1,536 bytes per event) and saved as binary BLOBs in `event_embeddings`.

- [x] **1.4 Verification & Inspection (`backend/scripts/inspect_first_event_vector.py`)**
  - SQLite matrix load time: **2.15 ms**; full catalog dot-product search: **1.59 ms**.
  - Verified first event `a0CQ90000IEo9GYMQZ` (*"Shopping with the Elderly in Tin Shui Wai Centre"*):
    - **Dense Embedding (`sentence-transformers/all-MiniLM-L6-v2`):** Dimension = 384, $L_2$ Norm = 1.000000, Min = -0.14051, Max = +0.16586, Mean = -0.00222.
    - **TF-IDF Representation:** 92 active tokens out of 6,121 features. Top weighted terms: `accompany elderly` (0.1814), `help maintain` (0.1814), `living poverty` (0.1814), `community centre` (0.1814), `elderly` (0.1741).
  - Verified local Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) on sample queries with zero external API dependencies.

---

## Phase 2: Backend Recommendation Services & APIs (Completed)

> **Objective:** Expose clean FastAPI endpoints for the 3 recommendation strategies and comparison.

- [x] **2.1 Implement Recommendation Services (`backend/services/recommend_service.py`)**
  - **Stage 0: Deterministic Option A Pre-Filters:**
    - Physical duration feasibility constraint (disqualifying events exceeding user's available hours).
    - Language and prerequisite eligibility guard (mandatory Cantonese and English proficiency matching).
    - Automatic duration relaxation fallback ensuring at least 5 candidates survive.
  - **Strategy A (TF-IDF Baseline):**
    - Load pre-computed TF-IDF vectorizer and sparse matrix from `recsys_models` into memory on startup.
    - Transform input user's `profile_text` into query vector $\mathbf{q}$.
    - Compute cosine similarity against `event_tfidf_matrix` with opportunity deduplication.
    - Return Top-$K$ events with similarity scores.
  - **Strategy B (Semantic Dense Embeddings — `sentence-transformers/all-MiniLM-L6-v2`):**
    - Load pre-computed embedding matrix from `event_embeddings` into memory on startup.
    - Encode user's `profile_text` dynamically into 384-dim dense representation using `all-MiniLM-L6-v2`.
    - Compute dot product similarity against pre-normalized event matrix ($< 20\text{ms}$).
    - Return Top-$K$ events with similarity scores.
  - **Strategy C (Neural Cross-Encoder Reranker — `cross-encoder/ms-marco-MiniLM-L-6-v2`):**
    - Retrieve top candidate events from Strategy B.
    - Run local Cross-Encoder model across concatenated `(user_profile, candidate_event)` pairs with token-level cross-attention.
    - Return Top-$K$ events with calibrated rerank scores and explainable rationale.
  - **Comparison Aggregator:**
    - Bundled Top-$K$ from all three methods side-by-side (`/api/recommend/compare`).

- [x] **2.2 API Router (`backend/routers/recommend.py`)**
  - `GET /api/recommend/tfidf?user_id=...&top_k=5`
  - `GET /api/recommend/embedding?user_id=...&top_k=5`
  - `GET /api/recommend/rerank?user_id=...&top_k=5` (Strategy C)
  - `GET /api/recommend/compare?user_id=...&top_k=5`

- [x] **2.3 Register Router in `backend/main.py`**
  - Maintained minimal `main.py` (under 40 lines limit per `AGENTS.md`).
  - Tested all endpoints with `fastapi.testclient.TestClient` (`backend/scripts/test_endpoints.py` — 100% pass).

---

## Phase 3: Frontend UI Refactoring & Dedicated Playground (Completed)

> **Objective:** Simplify Dashboard tabs and provide a dedicated, comprehensive page to test and compare models.

- [x] **3.1 Update Home Dashboard (`frontend/src/pages/Home.tsx`)**
  - Removed outdated tabs from the dashboard.
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
  - Verified with `npm run build` (`tsc -b && vite build`) — passes cleanly with **0 TypeScript and bundling errors**.

---

## Phase 4: Offline Evaluation & Reporting (Course Project) (Completed)

> **Objective:** Produce quantitative benchmark results, conduct multi-annotator validation, and generate the final group project deliverable.

- [x] **4.1 Large-Scale Ground-Truth Relevance Labeling & Human Spot-Check**
  - Synthesized **500 realistic cold-start volunteer profiles** via DeepSeek-v4-pro covering diverse activity types, demographics, regions, skills, and maximum durations.
  - Curated and deduplicated **194 distinct canonical activities across 53 partner non-profit organizations** from HandsOn Hong Kong.
  - Produced **97,000 frozen relevance labels** on a 3-point ordinal scale (0: Infeasible/Not Interested, 1: Neutral, 2: Highly Interested) using GPT-5 Luna.
  - Executed independent **multi-annotator human spot-check validation across 600 common pairs** (1,200 human labels total) achieving 53.8% human–human vs. 56.5% human–LLM agreement, 94.2% within-one agreement, and solid weighted consistency (0.54 score).

- [x] **4.2 Multi-Metric Evaluation & Method Benchmark**
  - Implemented **Recall@K**, **Normalized Recall@K**, and **NDCG@K** for $K \in \{5, 10, 20\}$.
  - Benchmarked 4 distinct recommendation strategies: Strategy A (Sparse TF-IDF Baseline), Strategy B (Dense Semantic Bi-Encoder `all-MiniLM-L6-v2`), Strategy C (Neural Cross-Encoder Reranker `ms-marco-MiniLM-L-6-v2`), and Random Baseline.
  - Evaluated under both Strict Relevance (label = 2) and Neutral-Inclusive Relevance (label $\ge 1$).
  - Conducted paired human-versus-LLM ablation across all 600 human-annotated pairs confirming identical ranking order ($\text{TF-IDF} > \text{Cross-Encoder} > \text{Bi-Encoder} \gg \text{Random}$).

- [x] **4.3 Course Project Final Report Deliverables**
  - Authored complete research-oriented report ([`CSIT5210_Group1_Final_Report.md`](file:///d:/Homework/港科技/CSIT5210%20(L1)%20-%20Data%20Mining%20and%20Knowledge%20Discovery/Project/CSIT5210_Group1_Final_Report.md)) and compiled production Word document ([`CSIT5210_Group1_Final_Report.docx`](file:///d:/Homework/港科技/CSIT5210%20(L1)%20-%20Data%20Mining%20and%20Knowledge%20Discovery/Project/CSIT5210_Group1_Final_Report.docx)).
  - Main body word count strictly maintained at **9,099 words** (complying with the 5,000–10,000 word course requirement).
  - Rendered all mathematical formulations in native Microsoft Word Office Math Markup Language (OMML), with Stage 0 pre-filter guards articulated in clear, accessible technical prose.
  - Formatted and verified all 19 academic references with verified clickable DOI, arXiv, and NeurIPS proceedings hyperlinks.
  - Embedded 5 publication-quality figures (catalog distribution, two-stage pipeline, system sequence, compact horizontal 5-stage benchmark design, and comparative ranking performance chart).
  - Maintained zero running headers/footers in the DOCX deliverable and verified frontend production builds (`npm run build`) with zero errors.
