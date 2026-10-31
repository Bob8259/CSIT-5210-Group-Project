# AGENTS.md — Project Architectural Rules & Guidelines

This document outlines core principles, coding conventions, and architectural constraints that every agent and contributor must follow when working on this project.

---

## 1. Frontend & UI Guidelines (React + Tailwind CSS)

### Standard Tailwind CSS Templates Over Custom JS Boilerplate
- **Do not reinvent the wheel**: Always prefer standard, idiomatic Tailwind CSS patterns (e.g. Tailwind UI, Flowbite, HyperUI templates).
- **CSS Scroll-Snap Carousels**: Use native CSS scroll snapping (`flex overflow-x-auto snap-x snap-mandatory scroll-smooth`) instead of heavy JavaScript intervals, timers, or custom pause/resume state machines.
- **Minimal, Semantic Component Structure**:
  - Keep components compact and readable (typically under 40–60 lines).
  - Use semantic HTML tags (`<article>`, `<section>`, `<nav>`, `<header>`).
  - Rely on Tailwind's utility classes (`line-clamp-*`, `group-hover:*`, `truncate`, `gap-*`, `border-*`) rather than custom CSS or complex inline styles.

### Verification Rule
- Always verify frontend changes by running `npm run build` inside `frontend/` (`tsc -b && vite build`) to ensure zero TypeScript and packaging errors.

---

## 2. Backend Architecture Guidelines (FastAPI + SQLite)

### Minimal Entry Point (`backend/main.py`)
- Keep `backend/main.py` as minimal as possible (**under 40 lines**).
- `main.py` should only initialize the FastAPI application, attach CORS middleware, and register sub-routers via `app.include_router()`.

### Strict Separation of Concerns
- **Routers (`backend/routers/`)**: Handle HTTP request validation, query parameters, status codes, and routing only.
- **Services (`backend/services/`)**: Contain all database queries, data manipulation, serialization/deserialization, and business logic.
- **Schemas (`backend/schemas.py`)**: All request and response structures must have strict Pydantic schemas.
- **Database (`backend/database.py`)**: Standard connection utility with SQLite `row_factory = sqlite3.Row`.

---

## 3. RecSys & Data Mining Requirements (CSIT5210 Group 1)

### Ground Truth & No Hallucination
- All recommendation algorithms (**TF-IDF Baseline**, **Semantic Embeddings**, and **LLM Reranking**) must recommend real opportunities directly from `backend/volunteer.db`.
- Never hallucinate fake volunteer opportunities or IDs.

### Cold-Start Simulation
- Maintain the 10 test user accounts (`user_1` to `user_10`, `user1@connect.ust.hk` to `user10@connect.ust.hk`).
- Respect the `has_preferences` flag to simulate cold-start onboarding accurately.

