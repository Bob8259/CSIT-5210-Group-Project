"""
Recommendation API Router: Exposes endpoints for the 3 cold-start recommendation strategies
- Strategy A: TF-IDF Content-Based Baseline
- Strategy B: Semantic Dense Embedding (all-MiniLM-L6-v2)
- Strategy C: Neural Cross-Encoder Reranking (ms-marco-MiniLM-L-6-v2)
- Comparative Aggregator (All 3 models side-by-side)
CSIT5210 Group 1 Project
"""

from fastapi import APIRouter, HTTPException, Query
from backend.schemas import RecommendationResponse, RecommendationComparisonResponse
from backend.services.recommend_service import (
    recommend_tfidf,
    recommend_embedding,
    recommend_cross_encoder,
    recommend_compare,
)

router = APIRouter(prefix="/api/recommend", tags=["recommend"])


@router.get("/tfidf", response_model=RecommendationResponse)
def get_tfidf_recommendations(
    user_id: str = Query(..., description="ID of the user (e.g. user_1)"),
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations to return")
):
    """
    Returns Top-K recommendations using Strategy A (TF-IDF Content-Based Baseline).
    """
    try:
        return recommend_tfidf(user_id=user_id, top_k=top_k)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@router.get("/embedding", response_model=RecommendationResponse)
def get_embedding_recommendations(
    user_id: str = Query(..., description="ID of the user (e.g. user_1)"),
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations to return")
):
    """
    Returns Top-K recommendations using Strategy B (Semantic Dense Embedding).
    """
    try:
        return recommend_embedding(user_id=user_id, top_k=top_k)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@router.get("/rerank", response_model=RecommendationResponse)
def get_cross_encoder_recommendations(
    user_id: str = Query(..., description="ID of the user (e.g. user_1)"),
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations to return")
):
    """
    Returns Top-K recommendations using Strategy C (Two-Stage Neural Cross-Encoder Reranking).
    """
    try:
        return recommend_cross_encoder(user_id=user_id, top_k=top_k)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@router.get("/compare", response_model=RecommendationComparisonResponse)
def get_model_comparison(
    user_id: str = Query(..., description="ID of the user (e.g. user_1)"),
    top_k: int = Query(5, ge=1, le=20, description="Number of recommendations per model")
):
    """
    Returns side-by-side Top-K recommendations from all 3 models for comparative evaluation.
    """
    try:
        return recommend_compare(user_id=user_id, top_k=top_k)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

