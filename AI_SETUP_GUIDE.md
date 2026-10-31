# AI Setup & Run Guide — Cold-Start Volunteer RecSys
**Course:** HKUST CSIT5210 (Group 1)  
**Project:** Evaluating Cold-Start Recommendation Strategies for Volunteer Opportunities

This document provides complete, deterministic instructions for an **AI Agent** (or a human developer) to inspect, set up, verify, and run this project from scratch on any machine.

---

## 🤖 Direct AI Instruction Prompt

If you are giving instructions to an AI assistant (Antigravity, Cursor, Claude, ChatGPT, etc.), copy and paste the prompt below:

```markdown
Please inspect and run this project from scratch by following `AI_SETUP_GUIDE.md` and respecting `AGENTS.md`:
1. Check Conda/Python (Python 3.10+). Set up or activate the environment.
2. Install pip dependencies from `backend/requirements.txt`.
3. Check Node.js (v18+) and npm. If missing, provide the appropriate install command.
4. Verify the self-contained SQLite database `backend/volunteer.db` and run `backend/scripts/test_endpoints.py`.
5. Install frontend dependencies in `frontend/` and verify the build with `npm run build`.
6. Launch both the FastAPI backend server (port 8000) and the Vite frontend dev server (port 5173).
Do not use any external LLM/OpenRouter API keys — the system is designed to run 100% locally and offline.
```

---

## Phase 1: Environment & Tooling Verification

### 1.1 Check Conda & Python Environment
An AI agent should first check if Conda is available on the host machine:

```powershell
# Check Conda installation
conda --version
```

- **If Conda is available**: Create and activate a dedicated Python 3.10 environment:
  ```powershell
  conda create -n volunteer-recsys python=3.10 -y
  conda activate volunteer-recsys
  ```
- **If Conda is NOT available**: Check for system Python 3.10+:
  ```powershell
  # Windows
  py -3.10 --version
  # Linux / macOS
  python3.10 --version || python3 --version
  ```

---

### 1.2 Check & Install Node.js
The frontend requires **Node.js (v18+ or LTS)** and **npm**:

```powershell
# Check Node and npm versions
node -v
npm -v
```

- **If Node.js is NOT installed**:
  - **Windows (PowerShell as Administrator or winget)**:
    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```
    *Or download directly from [https://nodejs.org](https://nodejs.org).*
  - **macOS (Homebrew)**:
    ```bash
    brew install node
    ```
  - **Linux (Ubuntu/Debian)**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

---

## Phase 2: Backend Dependencies & Database Verification

### 2.1 Install Python Requirements
With the Python 3.10 environment activated, install the required packages:

```powershell
pip install -r backend/requirements.txt
```

> **Key dependencies installed:**
> - `fastapi`, `uvicorn`, `pydantic`, `httpx` (API backend)
> - `scikit-learn`, `numpy`, `scipy` (TF-IDF vectorizer & cosine similarity)
> - `sentence-transformers`, `torch` (Local `all-MiniLM-L6-v2` and `ms-marco-MiniLM-L-6-v2` neural reranker)

---

### 2.2 Verify SQLite Database & Pre-Computed Vectors
The entire project is self-contained in [`backend/volunteer.db`](backend/volunteer.db) (697 real opportunities from HandsOn Hong Kong, 10 cold-start test users, TF-IDF matrices, and 384-dimensional dense embedding vectors).

Run the automated endpoint test suite to verify database integrity and model inference:

```powershell
python backend/scripts/test_endpoints.py
```

**Expected output:**
```text
--- 1. Testing Health Endpoint ---
Health check OK: {'status': 'ok'}

--- 2. Testing TF-IDF Endpoint ---
TF-IDF OK (latency: ~4.5 ms, items: 3)

--- 3. Testing Semantic Embedding Endpoint ---
Embedding OK (latency: ~18 ms, items: 3)

--- 4. Testing Cross-Encoder Rerank Endpoint ---
Rerank OK (latency: ~1100 ms, items: 3)
Top #1: Help Children with Hearing Impairments with Homework in To Kwa Wan

--- 5. Testing Compare Endpoint ---
Compare OK: contains tfidf, embedding, and cross_encoder side-by-side.

--- 6. Testing 404 on Invalid User ---
404 Validation OK: User 'nonexistent_user' not found.

🎉 ALL BACKEND ENDPOINTS PASSED VERIFICATION!
```

*(Optional) If you ever need to rebuild the vectors from scratch, run:*
```powershell
python backend/scripts/save_vectors_to_db.py
```

---

## Phase 3: Frontend Setup & Build Verification

### 3.1 Install Frontend Packages
Navigate to the `frontend/` directory and install the npm dependencies:

```powershell
cd frontend
npm install
```

---

### 3.2 Verify Production Build
Follow the **Verification Rule** in [`AGENTS.md`](AGENTS.md) to ensure zero TypeScript or bundling errors:

```powershell
npm run build
```
*(Runs `tsc -b && vite build`. Must compile cleanly with 0 errors).*

---

## Phase 4: Launching Development Servers

Run the backend and frontend in two separate terminal sessions:

### Terminal 1: FastAPI Backend
From the project root:
```powershell
uvicorn backend.main:app --reload --port 8000
```
- **API URL:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/health`

---

### Terminal 2: React + Vite Frontend
From the `frontend/` directory (or using `--prefix frontend`):
```powershell
npm --prefix frontend run dev
```
- **Web App URL:** `http://localhost:5173`

---

## Phase 5: Testing the Recommendation Playground

1. Open your browser and navigate to **`http://localhost:5173`**.
2. **Sign In**: Click **"Sign In"** in the top navigation bar.
   - Choose any of the 10 cold-start test accounts:
     - `user_1` / `user1@connect.ust.hk`
     - `user_2` / `user2@connect.ust.hk`
     - ... up to `user_10` / `user10@connect.ust.hk`
3. Click the prominent purple/indigo button: **"Test Recommendation Methods"** (or click **"Recommendations"** in the top Navbar) to jump to `/recommendations`.
4. In the playground:
   - **Active Cold-Start Profile Banner**: Inspect the user's specific causes, demographics, preferred region, and time limit.
   - **Side-by-Side Comparison**: Review Top-K opportunities ranked across all 3 models:
     - **Strategy A (TF-IDF Baseline)**: Fast lexical keyword overlap (~4 ms).
     - **Strategy B (Semantic Embeddings)**: Dense semantic similarity via `all-MiniLM-L6-v2` (~19 ms).
     - **Strategy C (Neural Cross-Encoder Reranker)**: Deep cross-attention reranking via `ms-marco-MiniLM-L-6-v2` with unclipped, explainable match rationales.
   - Click **"View Opportunity"** on any card to inspect full event details, location, and requirements in the modal.

---

## 🛡️ Core Architectural Rules (Summary from `AGENTS.md`)

When modifying this repository, an AI assistant must always obey these principles:
1. **Zero External API Costs**: All 3 recommendation strategies run 100% locally and offline. No `.env` or external API keys are needed.
2. **Zero Hallucination**: Only real opportunities directly queried from `backend/volunteer.db` are recommended. Never invent fake events or event IDs.
3. **Minimal Entry Point**: Keep `backend/main.py` strictly **under 40 lines** (routers in `backend/routers/`, business logic in `backend/services/`).
4. **Standard Tailwind Patterns**: Keep components clean and semantic; avoid heavy custom animation/timer state machines.
5. **Always Verify**: Verify frontend changes with `npm run build` and backend changes with `python backend/scripts/test_endpoints.py`.

