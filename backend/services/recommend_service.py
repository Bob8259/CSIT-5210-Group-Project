"""
Recommendation Service: Implementation of 3 Cold-Start Recommendation Strategies
- Strategy A: TF-IDF Content-Based Matching
- Strategy B: Semantic Dense Embeddings (all-MiniLM-L6-v2)
- Strategy C: Neural Cross-Encoder Reranking (ms-marco-MiniLM-L-6-v2)
- Option A Pre-Filters: Duration Constraint + Language/Skill Eligibility
CSIT5210 Group 1 Project
"""

import time
import pickle
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Set
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, CrossEncoder

from backend.database import get_db_connection
from backend.services.user_service import parse_user_row
from backend.services.event_service import parse_event_row

# Global In-Memory Model Cache
_TFIDF_VECTORIZER = None
_EVENT_TFIDF_MATRIX = None
_EMBEDDING_MATRIX = None
_EVENT_IDS = []
_EVENT_MAP: Dict[str, Dict[str, Any]] = {}
_EVENT_SEARCH_TEXTS: Dict[str, str] = {}
_BI_ENCODER = None
_CROSS_ENCODER = None
_IS_INITIALIZED = False


def _ensure_models_loaded():
    """Lazily loads all models and SQLite matrices into RAM once."""
    global _TFIDF_VECTORIZER, _EVENT_TFIDF_MATRIX, _EMBEDDING_MATRIX
    global _EVENT_IDS, _EVENT_MAP, _EVENT_SEARCH_TEXTS, _BI_ENCODER, _CROSS_ENCODER, _IS_INITIALIZED

    if _IS_INITIALIZED:
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # 1. Load all events into fast dictionary lookup
        cursor.execute("SELECT * FROM events ORDER BY id ASC")
        event_rows = cursor.fetchall()
        _EVENT_IDS = [r["id"] for r in event_rows]
        _EVENT_MAP = {r["id"]: parse_event_row(r) for r in event_rows}
        _EVENT_SEARCH_TEXTS = {r["id"]: r["search_content"] or "" for r in event_rows}

        # 2. Load TF-IDF Models from recsys_models
        cursor.execute("SELECT payload FROM recsys_models WHERE model_name = 'tfidf_vectorizer'")
        vec_row = cursor.fetchone()
        cursor.execute("SELECT payload FROM recsys_models WHERE model_name = 'event_tfidf_matrix'")
        mat_row = cursor.fetchone()

        if vec_row and mat_row:
            _TFIDF_VECTORIZER = pickle.loads(vec_row["payload"])
            _EVENT_TFIDF_MATRIX = pickle.loads(mat_row["payload"])
        else:
            raise RuntimeError("TF-IDF models missing from recsys_models table. Run save_vectors_to_db.py first.")

        # 3. Load Dense Embeddings from event_embeddings
        cursor.execute("SELECT event_id, vector FROM event_embeddings ORDER BY event_id ASC")
        emb_rows = cursor.fetchall()
        id_to_vec = {r["event_id"]: np.frombuffer(r["vector"], dtype=np.float32) for r in emb_rows}
        _EMBEDDING_MATRIX = np.array([id_to_vec[eid] for eid in _EVENT_IDS], dtype=np.float32)

        # 4. Load Neural Models
        _BI_ENCODER = SentenceTransformer("all-MiniLM-L6-v2")
        _CROSS_ENCODER = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

        _IS_INITIALIZED = True
    finally:
        conn.close()


def _get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves and parses user by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return parse_user_row(row)
    finally:
        conn.close()


def _apply_pre_filter(user: Dict[str, Any]) -> Tuple[np.ndarray, int]:
    """
    Applies Option A Hard Pre-Filters across all 697 events:
    1. Physical Duration Constraint: event.duration_hours <= user.max_duration_hours
    2. Language Eligibility Guard:
       - If event requires Cantonese, user must have Cantonese in skills.
       - If event requires English, user must have English in skills.
    Returns:
        eligible_mask: boolean numpy array of shape (N,) indicating eligible items.
        eligible_count: number of surviving events in candidate pool.
    """
    user_max_duration = user.get("max_duration_hours")
    user_skills = set(user.get("skills", []))

    mask = np.ones(len(_EVENT_IDS), dtype=bool)

    for idx, eid in enumerate(_EVENT_IDS):
        event = _EVENT_MAP[eid]

        # 1. Hard Physical Constraint: Duration
        if user_max_duration is not None:
            ev_dur = event.get("duration_hours")
            if ev_dur is not None and ev_dur > user_max_duration:
                mask[idx] = False
                continue

        # 2. Hard Eligibility Constraint: Language / Skills
        req_skills = set(event.get("required_skills", []))
        if "Cantonese" in req_skills and "Cantonese" not in user_skills:
            mask[idx] = False
            continue
        if "English" in req_skills and "English" not in user_skills:
            mask[idx] = False
            continue

    eligible_count = int(np.sum(mask))

    # Safety Guard (Sparsity Fallback): If pre-filtering leaves fewer than 5 candidates, gracefully relax
    if eligible_count < 5:
        return np.ones(len(_EVENT_IDS), dtype=bool), len(_EVENT_IDS)

    return mask, eligible_count


def _generate_attribute_rationale(user: Dict[str, Any], event: Dict[str, Any]) -> Tuple[str, List[str]]:
    """Generates human-interpretable rationale comparing user constraints with event metadata."""
    reasons = []
    matched_features = []

    # 1. Match Causes
    user_causes = set(user.get("preferred_causes", []))
    event_causes = set(event.get("issue_areas", []))
    common_causes = user_causes.intersection(event_causes)
    if common_causes:
        reasons.append(f"Matches cause: {', '.join(common_causes)}")
        matched_features.extend([f"Cause: {c}" for c in common_causes])

    # 2. Match Target Populations
    user_pops = set(user.get("target_populations", []))
    event_pops = set(event.get("populations_served", []))
    common_pops = user_pops.intersection(event_pops)
    if common_pops:
        reasons.append(f"Serves {', '.join(common_pops)}")
        matched_features.extend([f"Target: {p}" for p in common_pops])

    # 3. Match Region
    user_regions = set(user.get("preferred_regions", []))
    event_region = event.get("region")
    if event_region and event_region in user_regions:
        reasons.append(f"Located in preferred region ({event_region})")
        matched_features.append(f"Region: {event_region}")

    # 4. Duration compatibility
    user_max_duration = user.get("max_duration_hours")
    event_duration = event.get("duration_hours")
    if user_max_duration and event_duration:
        if event_duration <= user_max_duration:
            reasons.append(f"Fits time budget ({event_duration}h ≤ {user_max_duration}h limit)")
            matched_features.append(f"Duration: {event_duration}h")

    # 5. Skills alignment
    user_skills = set(user.get("skills", []))
    event_skills = set(event.get("required_skills", []))
    common_skills = user_skills.intersection(event_skills)
    if common_skills:
        reasons.append(f"Matches skills: {', '.join(common_skills)}")
        matched_features.extend([f"Skill: {s}" for s in common_skills])

    if reasons:
        rationale = " • ".join(reasons)
    else:
        rationale = "General thematic interest overlap with volunteer profile."

    return rationale, matched_features


def recommend_tfidf(user_id: str, top_k: int = 5, deduplicate: bool = True) -> Dict[str, Any]:
    """
    Strategy A: TF-IDF Content-Based Recommendation Baseline.
    Applies Option A hard pre-filter (Duration + Language), transforms user profile into sparse vector,
    and ranks eligible events by cosine similarity.
    """
    _ensure_models_loaded()
    user = _get_user_profile(user_id)
    if not user:
        raise ValueError(f"User '{user_id}' not found.")

    t0 = time.perf_counter()
    profile_text = user.get("profile_text") or user.get("bio") or user.get("name")
    
    # 1. Hard Pre-Filter
    eligible_mask, eligible_count = _apply_pre_filter(user)

    # 2. Transform profile text to TF-IDF vector & compute similarity
    user_vec = _TFIDF_VECTORIZER.transform([profile_text])
    scores = cosine_similarity(user_vec, _EVENT_TFIDF_MATRIX)[0]

    # Disqualify ineligible events
    scores[~eligible_mask] = -999.0

    # 3. Rank indices by score descending
    sorted_indices = np.argsort(scores)[::-1]
    latency_ms = (time.perf_counter() - t0) * 1000

    items = []
    seen_titles: Set[str] = set()

    for idx in sorted_indices:
        if scores[idx] < -900:
            break

        event_id = _EVENT_IDS[idx]
        event = _EVENT_MAP[event_id]
        title = event.get("title", "")

        if deduplicate and title in seen_titles:
            continue
        seen_titles.add(title)

        score = float(scores[idx])
        rationale, matched_features = _generate_attribute_rationale(user, event)
        items.append({
            "event": event,
            "rank": len(items) + 1,
            "score": round(score, 4),
            "strategy": "tfidf",
            "rationale": f"[TF-IDF] {rationale}",
            "matched_features": matched_features
        })

        if len(items) >= top_k:
            break

    return {
        "user_id": user_id,
        "strategy": "tfidf",
        "top_k": top_k,
        "latency_ms": round(latency_ms, 2),
        "total_eligible": eligible_count,
        "items": items
    }


def recommend_embedding(user_id: str, top_k: int = 5, deduplicate: bool = True) -> Dict[str, Any]:
    """
    Strategy B: Semantic Dense Embedding Recommendation.
    Applies Option A hard pre-filter (Duration + Language), encodes user profile using all-MiniLM-L6-v2,
    and computes dot-product cosine similarity against eligible events.
    """
    _ensure_models_loaded()
    user = _get_user_profile(user_id)
    if not user:
        raise ValueError(f"User '{user_id}' not found.")

    t0 = time.perf_counter()
    profile_text = user.get("profile_text") or user.get("bio") or user.get("name")

    # 1. Hard Pre-Filter
    eligible_mask, eligible_count = _apply_pre_filter(user)

    # 2. Encode query with local all-MiniLM-L6-v2 & compute dot-product similarity
    user_vec = _BI_ENCODER.encode(profile_text, normalize_embeddings=True)
    scores = np.dot(_EMBEDDING_MATRIX, user_vec)

    # Disqualify ineligible events
    scores[~eligible_mask] = -999.0

    # 3. Rank indices
    sorted_indices = np.argsort(scores)[::-1]
    latency_ms = (time.perf_counter() - t0) * 1000

    items = []
    seen_titles: Set[str] = set()

    for idx in sorted_indices:
        if scores[idx] < -900:
            break

        event_id = _EVENT_IDS[idx]
        event = _EVENT_MAP[event_id]
        title = event.get("title", "")

        if deduplicate and title in seen_titles:
            continue
        seen_titles.add(title)

        score = float(scores[idx])
        rationale, matched_features = _generate_attribute_rationale(user, event)
        items.append({
            "event": event,
            "rank": len(items) + 1,
            "score": round(score, 4),
            "strategy": "embedding",
            "rationale": f"[Semantic] {rationale}",
            "matched_features": matched_features
        })

        if len(items) >= top_k:
            break

    return {
        "user_id": user_id,
        "strategy": "embedding",
        "top_k": top_k,
        "latency_ms": round(latency_ms, 2),
        "total_eligible": eligible_count,
        "items": items
    }


def recommend_cross_encoder(user_id: str, top_k: int = 5, deduplicate: bool = True) -> Dict[str, Any]:
    """
    Strategy C: Two-Stage Neural Cross-Encoder Reranking.
    1. Pre-filters by Option A (Duration + Language).
    2. Retrieves Top candidate events via Strategy B (Bi-Encoder).
    3. Deep cross-attention reranking using cross-encoder/ms-marco-MiniLM-L-6-v2.
    """
    _ensure_models_loaded()
    user = _get_user_profile(user_id)
    if not user:
        raise ValueError(f"User '{user_id}' not found.")

    t0 = time.perf_counter()
    profile_text = user.get("profile_text") or user.get("bio") or user.get("name")

    # 1. Hard Pre-Filter
    eligible_mask, eligible_count = _apply_pre_filter(user)

    # 2. Stage 1: Candidate retrieval over eligible opportunities
    user_vec = _BI_ENCODER.encode(profile_text, normalize_embeddings=True)
    first_stage_scores = np.dot(_EMBEDDING_MATRIX, user_vec)
    first_stage_scores[~eligible_mask] = -999.0
    sorted_candidate_indices = np.argsort(first_stage_scores)[::-1]

    candidate_indices = []
    seen_candidate_titles = set()
    candidate_target = max(15, top_k * 3)

    for idx in sorted_candidate_indices:
        if first_stage_scores[idx] < -900:
            break

        title = _EVENT_MAP[_EVENT_IDS[idx]].get("title", "")
        if deduplicate and title in seen_candidate_titles:
            continue
        seen_candidate_titles.add(title)
        candidate_indices.append(idx)
        if len(candidate_indices) >= candidate_target:
            break

    # 3. Stage 2: Cross-Encoder scoring across candidate pairs
    candidate_pairs = [
        [profile_text, _EVENT_SEARCH_TEXTS[_EVENT_IDS[idx]]]
        for idx in candidate_indices
    ]
    raw_logits = np.array(_CROSS_ENCODER.predict(candidate_pairs))

    # Calibrate scores to intuitive percentage range (0.50 to 0.98)
    min_logit, max_logit = float(np.min(raw_logits)), float(np.max(raw_logits))
    if max_logit > min_logit:
        calibrated_scores = 0.50 + 0.48 * ((raw_logits - min_logit) / (max_logit - min_logit))
    else:
        calibrated_scores = np.full_like(raw_logits, 0.85)

    # Rank candidates by cross-encoder score
    reranked_order = np.argsort(raw_logits)[::-1][:top_k]
    latency_ms = (time.perf_counter() - t0) * 1000

    items = []
    for rank, order_idx in enumerate(reranked_order, 1):
        actual_event_idx = candidate_indices[order_idx]
        event_id = _EVENT_IDS[actual_event_idx]
        event = _EVENT_MAP[event_id]
        score = float(calibrated_scores[order_idx])

        rationale, matched_features = _generate_attribute_rationale(user, event)
        items.append({
            "event": event,
            "rank": rank,
            "score": round(score, 4),
            "strategy": "cross_encoder",
            "rationale": f"[Neural Reranker] {rationale}",
            "matched_features": matched_features
        })

    return {
        "user_id": user_id,
        "strategy": "cross_encoder",
        "top_k": top_k,
        "latency_ms": round(latency_ms, 2),
        "total_eligible": eligible_count,
        "items": items
    }


def recommend_compare(user_id: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Aggregator: Returns recommendations from all three models side-by-side for comparative evaluation.
    """
    tfidf_res = recommend_tfidf(user_id=user_id, top_k=top_k)
    emb_res = recommend_embedding(user_id=user_id, top_k=top_k)
    cross_res = recommend_cross_encoder(user_id=user_id, top_k=top_k)

    return {
        "user_id": user_id,
        "top_k": top_k,
        "tfidf": tfidf_res,
        "embedding": emb_res,
        "cross_encoder": cross_res
    }
