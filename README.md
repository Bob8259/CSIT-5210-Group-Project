# Cold-Start Volunteer Opportunity Recommendation System

> **HKUST CSIT5210 (Data Mining and Knowledge Discovery) — Group 1 Course Project**  
> *Evaluating Cold-Start Recommendation Strategies for Volunteer Opportunities*

---

## 1. Project Overview

This project implements and evaluates three cold-start recommendation strategies for volunteer opportunities in Hong Kong:
1. **TF-IDF Content-Based Baseline** (lexical cosine similarity)
2. **Dense Semantic Embeddings** (Sentence-Transformers / text representations)
3. **Retrieval-Augmented LLM Reranker** (grounded candidate reranking)

The system is equipped with:
- A catalog of **697 real volunteer opportunities** scraped from HandsOn Hong Kong, enriched with categories, target groups, required skills, territory regions, dates, and durations.
- **10 cold-start test user accounts** to simulate new user onboarding and evaluate recommendation performance under zero-history conditions.
- A decoupled web architecture: a high-performance **FastAPI (Python)** ML service and a modern **React + Vite (TypeScript + Tailwind CSS)** user interface.

> 💡 **Running with AI?** See [**`AI_SETUP_GUIDE.md`**](AI_SETUP_GUIDE.md) for automated instructions to set up Conda, install pip dependencies, check Node.js, and launch the dev servers from scratch.

---

## 2. Tech Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLite3, Pydantic
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Lucide Icons
- **Database:** SQLite (`backend/volunteer.db`)

---

## 3. Project Directory Structure

```text
Project/
├── backend/
│   ├── main.py                     # Minimal FastAPI entry point & router registry (~30 lines)
│   ├── database.py                 # SQLite connection manager
│   ├── schemas.py                  # Pydantic request / response validation models
│   ├── requirements.txt            # Python dependencies
│   ├── volunteer.db                # SQLite database (697 events & 10 test users)
│   ├── schema.sql                  # Database table definitions & indexes
│   ├── seed_users.py               # Script to seed/reset the 10 test user accounts
│   ├── services/
│   │   └── user_service.py         # Profile text generation & DB record parsing
│   └── routers/
│       ├── auth.py                 # POST /api/auth/login
│       ├── users.py                # GET /api/users, PUT /api/users/{id}/preferences
│       └── meta.py                 # GET /api/meta/options (dynamic category tags)
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.tsx # User session & state management (localStorage cached)
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Main dashboard & recommendation workflow tabs
│   │   │   ├── Login.tsx           # Sign-in page with 1-click test user accounts
│   │   │   ├── Onboarding.tsx      # Cold-start preference questionnaire
│   │   │   └── About.tsx           # Research proposal details & group info
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Navigation bar with user badge & auth controls
│   │   │   └── Layout.tsx          # Shell wrapper with sticky header and footer
│   │   ├── types/                  # TypeScript interface definitions
│   │   └── App.tsx                 # Clean route registry
│   ├── package.json
│   └── vite.config.ts              # Vite config with /api proxy to FastAPI (port 8000)
├── CSIT5210_Group1_Project_Proposal.md
└── README.md
```

---

## 4. Getting Started

### Prerequisites

- **Python 3.10+** (with `pip` and Windows `py` launcher or `python`)
- **Node.js 18+** & **npm**

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal in the project root directory.
2. *(Optional)* Install required Python packages:
   ```powershell
   py -3.10 -m pip install -r backend/requirements.txt
   ```
3. Start the FastAPI development server:
   ```powershell
   py -3.10 -m uvicorn backend.main:app --reload --port 8000
   ```
4. Verify the backend is running:
   - Healthcheck: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
   - Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 2: Start the Frontend (React + Vite)

1. Open a **second terminal** and navigate to `frontend/`:
   ```powershell
   cd frontend
   ```
2. Install npm dependencies (if not already installed):
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open the application in your browser:  
   👉 **[http://localhost:5173](http://localhost:5173)**

---

## 5. Walkthrough & Usage Flow

### A. Sign In with a Test Persona
1. Click **Sign In** in the top navigation bar (or go to `/login`).
2. You can either:
   - Type an email/ID (e.g. `user1@connect.ust.hk` or `user_1`), or
   - Click one of the **10 Quick Test User** cards directly.
3. If the user account has no saved preferences, the system **automatically redirects you to the Onboarding Questionnaire**.

### B. Cold-Start Onboarding Questionnaire
1. Select preferences across the dimensions extracted from the real catalog:
   - **Preferred Causes / Issue Areas** (e.g. *Animal Welfare*, *Education*, *Environmental Conservation*, *Food Assistance*...)
   - **Preferred Regions** (*Kowloon*, *Hong Kong Island*, *New Territories*, *Online / Flexible*)
   - **Target Beneficiaries** (*Animals*, *Children & Youth*, *Elderly*...)
   - **Languages & Skills** (*Cantonese*, *English*, *Mandarin*, *Teaching*...)
   - **Maximum Duration** (e.g. *1.0h*, *2.0h*, *3.0h*, *4.0h*, *6.0h*)
   - **Motivation / Bio** (Free-text statement)
2. Click **Save Preferences & Explore**.
3. The backend stores the attributes and synthesizes the unified `profile_text` used for TF-IDF and dense vector embeddings.

### C. Resetting Test Accounts
If you wish to reset all 10 test users back to an unconfigured, blank state:
```powershell
py -3.10 backend/seed_users.py
```

---

## 6. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend and database health status |
| `GET` | `/api/events/hot` | Random sample of featured/hot volunteer opportunities for the carousel |
| `GET` | `/api/events` | Chronologically ranked volunteer opportunities with search, region/cause filters & pagination |
| `GET` | `/api/events/{event_id}` | Detailed record of a specific volunteer opportunity |
| `GET` | `/api/users` | List all users and their configuration status |
| `POST` | `/api/auth/login` | Sign in by email or user ID (returns `has_preferences` flag) |
| `GET` | `/api/users/{user_id}` | Retrieve profile for a specific user |
| `PUT` | `/api/users/{user_id}/preferences` | Update cold-start questionnaire preferences |
| `GET` | `/api/meta/options` | Dynamic category tags and regions from catalog |


---

## 7. Group Members

- **Group No.:** Group 1
- **Course:** HKUST CSIT5210 — Data Mining and Knowledge Discovery

