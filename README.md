# Cold-Start Volunteer Opportunity Recommendation System

> **HKUST CSIT5210 (Data Mining and Knowledge Discovery) — Fall 2026**  
> **Group 1 Research Project & System Deliverable**  
> *Evaluating Cold-Start Recommendation Strategies for Volunteer Opportunities*  
> **Online Repository:** [https://github.com/Bob8259/CSIT-5210-Group-Project](https://github.com/Bob8259/CSIT-5210-Group-Project)

---

## 📌 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Operating Systems Tested](#2-operating-systems-tested)
3. [How to Compile / Build](#3-how-to-compile--build)
4. [How to Execute / Run](#4-how-to-execute--run)
5. [An Example to Show How to Run the Program](#5-an-example-to-show-how-to-run-the-program)
6. [Description of Each Source File](#6-description-of-each-source-file)
7. [API Reference & Sample Payloads](#7-api-reference--sample-payloads)
8. [Course Deliverables & References](#8-course-deliverables--references)
9. [Group 1 Members & Responsibilities](#9-group-1-members--responsibilities)

---

## 1. Project Overview

Civic volunteering platforms (such as *HandsOn Hong Kong*) suffer from high drop-off during onboarding because new volunteers have zero historical interaction records ($R_{u, :} = \mathbf{0}$) and must evaluate opportunities constrained by rigid physical time limits and language requirements.

This project implements, evaluates, and demonstrates an end-to-end, decoupled recommendation system comparing three distinct cold-start strategies against a random baseline:
1. **Strategy A (Sparse TF-IDF Baseline):** Lexical Vector Space Model with sublinear term frequency ($1 + \log\mathrm{TF}$) and smoothed IDF across 4,797 n-gram features.
2. **Strategy B (Dense Semantic Bi-Encoder):** 384-dimensional dense semantic retrieval utilizing Sentence-Transformers (`all-MiniLM-L6-v2`) with pre-normalized unit vectors stored in SQLite.
3. **Strategy C (Two-Stage Neural Cross-Encoder Reranker):** Two-stage neural pipeline combining fast candidate shortlist retrieval with token-level cross-attention reranking (`cross-encoder/ms-marco-MiniLM-L-6-v2`).
4. **Stage 0 (Deterministic Pre-Filters):** Option A hard physical invariant filters for physical session duration availability and mandatory language prerequisites (Cantonese / English) with an automated duration relaxation fallback.

---

## 2. Operating Systems Tested

This program has been tested, verified, and benchmarked across the following environments:

- ✅ **Microsoft Windows 11 / 10 (64-bit)**
  - Shell: PowerShell 7+ / Windows PowerShell 5.1 / Command Prompt (`cmd`)
  - Python Environment: Python 3.10.11 / Python 3.11 with Windows `py` launcher
  - Node Environment: Node.js v18.20.0 / v20.x, npm 9.x / 10.x
- ✅ **Linux (Ubuntu 22.04 LTS / Debian 12 / WSL2)**
  - Shell: Bash / Zsh
  - Python Environment: Python 3.10+ (`python3`, `python3-pip`, `python3-venv`)
  - Node Environment: Node.js v18+ & npm

---

## 3. How to Compile / Build

The project is divided into a high-performance **Python/FastAPI** backend service and a modern **React 19 / TypeScript / Vite** frontend client.

### 3.1 Backend Dependencies Setup
Ensure Python 3.10+ is installed. In the project root directory, install backend dependencies:

**On Windows:**
```powershell
py -3.10 -m pip install -r backend/requirements.txt
```

**On Linux / macOS:**
```bash
python3 -m pip install -r backend/requirements.txt
```

*Key packages:* `fastapi`, `uvicorn`, `sentence-transformers`, `torch`, `scikit-learn`, `numpy`, `scipy`, `pydantic`.

### 3.2 Offline Vector & Matrix Pre-computation
All vector representations and TF-IDF models are stored directly in the SQLite database (`backend/volunteer.db`) for self-contained, sub-millisecond querying without external vector database services:

**On Windows:**
```powershell
py -3.10 backend/scripts/save_vectors_to_db.py
```

**On Linux / macOS:**
```bash
python3 backend/scripts/save_vectors_to_db.py
```
*Output:* Serializes the fitted TF-IDF matrix into table `recsys_models` and all 384-dim dense float32 BLOB embeddings into table `event_embeddings`.

### 3.3 Frontend Compilation & Bundling
Compile the TypeScript code and bundle the production assets using Vite:

```bash
cd frontend
npm install
npm run build
```
*Verification:* The build runs `tsc -b && vite build`. A clean compile completes in under 1 second with **0 TypeScript and bundling errors**.

---

## 4. How to Execute / Run

### Option A: Development Mode (Recommended for Testing & Exploration)

To run the live interactive application, launch both the backend API and frontend Vite server:

#### Terminal 1 — Start the FastAPI Backend:
**On Windows:**
```powershell
py -3.10 -m uvicorn backend.main:app --reload --port 8000
```
**On Linux / macOS:**
```bash
python3 -m uvicorn backend.main:app --reload --port 8000
```
- API Base: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Healthcheck: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Terminal 2 — Start the React Frontend:
```bash
cd frontend
npm run dev
```
- Frontend UI: 👉 **[http://localhost:5173](http://localhost:5173)**

---

### Option B: Production Mode (Serving Static Assets)
After compiling the frontend via `npm run build` inside `frontend/`:
```bash
cd frontend
npm run preview -- --port 5173
```

---

## 5. An Example to Show How to Run the Program

### Step-by-Step Interactive Walkthrough

#### Step 1: Sign in with a Test Persona
1. Open [http://localhost:5173](http://localhost:5173) in your web browser.
2. Click **Sign In** in the top navigation bar (or navigate to [http://localhost:5173/login](http://localhost:5173/login)).
3. Select any of the **10 pre-configured test users** (e.g. `user_1` / `user1@connect.ust.hk` — *Sarah Chan: Passionate animal lover eager to assist shelter rescues*).
4. You are automatically logged in with an active cold-start session.

#### Step 2: Configure Onboarding Preferences (Simulating Cold Start)
1. Navigate to the **Onboarding Questionnaire** (`/onboarding`).
2. Toggle the multi-attribute preferences extracted from real HandsOn Hong Kong catalog tags:
   - **Preferred Causes:** `Animal Welfare`, `Environmental Conservation`
   - **Target Beneficiaries:** `Animals`, `Children & Youth`
   - **Preferred Regions:** `New Territories`, `Hong Kong Island`
   - **Languages & Skills:** `Cantonese`, `First Aid`
   - **Maximum Duration:** `3.0 hours`
   - **Motivation / Bio:** *"Eager to help local dog shelters and community rescue programs."*
3. Click **Save Preferences & Explore**.

#### Step 3: Run and Compare the Recommendation Models
1. Navigate to the dedicated **Recommendations Playground** (`/recommendations`) via the Navbar or the Home Dashboard button **"Test Recommendation Methods"**.
2. Select the **Side-by-Side Comparison** tab to observe the three models evaluated on the exact same cold-start profile simultaneously:
   - **Strategy A (TF-IDF Baseline):** Prioritizes opportunities sharing exact keywords (*"animal shelter"*, *"dog walk"*), with ultra-low latency (~0.6ms).
   - **Strategy B (Semantic Dense Embeddings):** Surfaces conceptually related opportunities via 384-dim geometric vector space (~8.8ms).
   - **Strategy C (Neural Cross-Encoder Reranker):** Retrieves candidates via Bi-Encoder and reranks them with full token-level cross-attention (~22.4ms), providing structured match rationale tags.
3. Toggle Top-$K$ selector ($K=3, 5, 10$) to test cutoff depths.
4. Click **View Opportunity** on any card to inspect full NGO metadata, required prerequisites, and event coordinates.

---

### CLI & API Execution Example (cURL / Python)

You can also query the recommendation engine directly via HTTP requests:

#### cURL Request:
```bash
curl -X GET "http://127.0.0.1:8000/api/recommend/compare?user_id=user_1&top_k=3" -H "accept: application/json"
```

#### Python Example:
```python
import requests

url = "http://127.0.0.1:8000/api/recommend/compare"
params = {"user_id": "user_1", "top_k": 3}
response = requests.get(url, params=params)
data = response.json()

print(f"User: {data['user_id']} ({data['user_name']})")
for strategy in ["tfidf", "embedding", "rerank"]:
    res = data[strategy]
    print(f"\n--- {res['model_name']} (Latency: {res['latency_ms']} ms) ---")
    for rank, item in enumerate(res["recommendations"], 1):
        print(f"  #{rank}: {item['title']} (Score: {item['score']:.4f}) | Duration: {item['duration_hours']}h | NGO: {item['ngo_name']}")
```

---

## 6. Description of Each Source File

```text
Project/
├── backend/
│   ├── main.py                     # Minimal FastAPI entry point & CORS configuration (<40 lines)
│   ├── database.py                 # SQLite connection manager with sqlite3.Row factory
│   ├── schemas.py                  # Pydantic schemas validating all API request & response payloads
│   ├── requirements.txt            # Python dependencies (fastapi, torch, sentence-transformers, scikit-learn)
│   ├── volunteer.db                # SQLite database (194 canonical opportunities, 53 NGOs, embeddings, users)
│   ├── schema.sql                  # Database table definitions, indexes, and vector BLOB storage schemas
│   ├── seed_users.py               # Seeds 10 cold-start user accounts (user_1 to user_10)
│   ├── services/
│   │   ├── recommend_service.py    # Core RecSys logic: Stage 0 pre-filters, TF-IDF, Bi-Encoder, Cross-Encoder
│   │   └── user_service.py         # Profile compiler: aggregates structured user attributes into profile_text
│   ├── routers/
│   │   ├── recommend.py            # API routes: /api/recommend/{tfidf, embedding, rerank, compare}
│   │   ├── auth.py                 # API routes: POST /api/auth/login
│   │   ├── users.py                # API routes: GET /api/users, PUT /api/users/{id}/preferences
│   │   ├── events.py               # API routes: GET /api/events, GET /api/events/{id}, GET /api/events/hot
│   │   └── meta.py                 # API routes: GET /api/meta/options (causes, regions, skills)
│   └── scripts/
│       ├── save_vectors_to_db.py   # Offline pre-computation of TF-IDF matrix & 384-dim SBERT embeddings
│       ├── inspect_first_event_vector.py # Inspects vector norms, dimensions, and latency
│       ├── deduplicate_db.py       # Deduplicates 2,023 session postings into 194 canonical opportunities
│       ├── test_endpoints.py       # Integration test suite validating all FastAPI endpoints
│       └── test_prefilter.py       # Automated tests verifying Stage 0 physical duration & language filters
├── frontend/
│   ├── package.json                # Frontend package dependencies (React 19, Vite, Tailwind CSS v4)
│   ├── vite.config.ts              # Vite configuration with automatic /api proxy to FastAPI (port 8000)
│   └── src/
│       ├── main.tsx                # React root application bootstrap
│       ├── App.tsx                 # Route registry (/login, /onboarding, /recommendations, /about)
│       ├── context/
│       │   └── AuthContext.tsx     # Session state management cached in localStorage
│       ├── components/
│       │   ├── Navbar.tsx          # Navigation bar with user status badge and direct playground links
│       │   ├── Layout.tsx          # Shell layout wrapper with header and responsive footer
│       │   ├── EventCard.tsx       # Volunteer opportunity card with feature pills and modal trigger
│       │   └── EventModal.tsx      # Modal displaying detailed opportunity attributes and schedule
│       ├── pages/
│       │   ├── Home.tsx            # Main dashboard with featured opportunity carousels
│       │   ├── Recommendations.tsx # Dedicated 3-column RecSys testing & side-by-side comparison page
│       │   ├── Onboarding.tsx      # Interactive questionnaire eliciting cold-start preferences
│       │   ├── Login.tsx           # Authentication page with 1-click test user selection
│       │   └── About.tsx           # Research project summary and group member details
│       └── types/
│           ├── event.ts            # TypeScript interface definitions for events and opportunities
│           └── user.ts             # TypeScript interface definitions for user profiles and preferences
├── figures/
│   ├── activity_catalog_distribution.png  # Figure 1: 4-dimension opportunity distribution
│   ├── retrieval_pipeline.png             # Figure 2: Two-stage retrieval and reranking pipeline
│   ├── system_sequence.png                # Figure 3: System sequence flow across tiers
│   ├── experiment_stages.png              # Figure 4: Horizontal 5-stage benchmark evaluation protocol
│   └── ranking_quality_comparison.png     # Figure 5: Comparative ranking performance chart (NDCG@5 & Recall@5)
├── scratch/
│   ├── build_full_docx.py          # DOCX report compiler (native OMML equations, high-res figures)
│   └── build_presentation_pptx.py  # Presentation PowerPoint generator (16:9 widescreen, 19 slides)
├── CSIT5210_Group1_Final_Report.md         # Full research final report in GitHub-flavored Markdown
├── CSIT5210_Group1_Final_Report.docx       # Production-ready final report in Microsoft Word format
├── CSIT5210_Group1_Presentation.pptx       # Course presentation slide deck (19 slides with presenter attribution)
├── PRESENTATION_REQUIREMENTS.md            # Course presentation guidelines, schedule, and rubric
├── TODO.md                                 # Complete project roadmap and implementation checklist
└── README.md                               # Project documentation & operational manual
```

---

## 7. API Reference & Sample Payloads

| Method | Endpoint | Description | Sample Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service & SQLite DB health status | `curl http://127.0.0.1:8000/api/health` |
| `GET` | `/api/recommend/tfidf` | Strategy A: Sparse TF-IDF baseline | `/api/recommend/tfidf?user_id=user_1&top_k=5` |
| `GET` | `/api/recommend/embedding` | Strategy B: Dense SBERT embeddings | `/api/recommend/embedding?user_id=user_1&top_k=5` |
| `GET` | `/api/recommend/rerank` | Strategy C: Two-stage Cross-Encoder | `/api/recommend/rerank?user_id=user_1&top_k=5` |
| `GET` | `/api/recommend/compare` | Side-by-side comparison of all 3 models | `/api/recommend/compare?user_id=user_1&top_k=5` |
| `GET` | `/api/events` | Chronologically listed catalog opportunities | `/api/events?page=1&page_size=10` |
| `GET` | `/api/events/{id}` | Full metadata for a specific event | `/api/events/a0CQ90000IEo9GYMQZ` |
| `POST`| `/api/auth/login` | Authenticate user persona | `{"user_id": "user_1"}` |
| `PUT` | `/api/users/{id}/preferences`| Update cold-start questionnaire profile | `{"preferred_causes": ["Animal Welfare"]}` |

---

## 8. Course Deliverables & References

- **Final Research Report (Markdown):** [`CSIT5210_Group1_Final_Report.md`](CSIT5210_Group1_Final_Report.md) (9,099 words)
- **Final Research Report (Word DOCX):** [`CSIT5210_Group1_Final_Report.docx`](CSIT5210_Group1_Final_Report.docx)
- **Presentation Slide Deck (PowerPoint):** [`CSIT5210_Group1_Presentation.pptx`](CSIT5210_Group1_Presentation.pptx) (19 widescreen slides)
- **Presentation Guidelines & Schedule:** [`PRESENTATION_REQUIREMENTS.md`](PRESENTATION_REQUIREMENTS.md)

---

## 9. Group 1 Members & Responsibilities

| Student Name | Student ID | Email | Primary Responsibilities |
| :--- | :---: | :--- | :--- |
| **ZHANG, Kaitai** | **21314648** | `kzhangbn@connect.ust.hk` | Data scraping & cleaning, catalog deduplication, Stage 0 physical pre-filtering guards |
| **WANG, Rui** | **21322126** | `rwangbm@connect.ust.hk` | Sparse TF-IDF baseline implementation, Vector Space Model & term weighting |
| **LIANG, Shuang** | **21383778** | `sliangba@connect.ust.hk` | Dense semantic embeddings (`all-MiniLM-L6-v2`), SQLite BLOB vector storage & indexing |
| **JIA, Hansen** | **21322009** | `hjiaao@connect.ust.hk` | Two-stage neural retrieval architecture, Cross-Encoder reranking (`ms-marco`), explainability |
| **GUO, Youjia** | **21315159** | `yguobv@connect.ust.hk` | Experimental benchmark design, multi-annotator human spot-check validation, metrics evaluation |

---
*HKUST Department of Computer Science & Engineering — CSIT5210 (Fall 2026)*
