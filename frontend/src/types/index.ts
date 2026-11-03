export interface User {
  id: string
  name: string
  email: string
  bio?: string
  preferred_causes: string[]
  target_populations: string[]
  preferred_regions: string[]
  skills: string[]
  max_duration_hours?: number | null
  has_preferences: boolean
  profile_text?: string
}

export interface PreferenceForm {
  preferred_causes: string[]
  target_populations: string[]
  preferred_regions: string[]
  skills: string[]
  max_duration_hours: number
  bio?: string
}

export interface MetadataOptions {
  issue_areas: string[]
  target_populations: string[]
  regions: string[]
  skills: string[]
}

export interface EventItem {
  id: string
  url: string
  title: string
  organization_name?: string
  organization_website?: string
  issue_areas: string[]
  populations_served: string[]
  required_skills: string[]
  location_address?: string
  region?: string
  event_date?: string
  start_datetime?: string
  end_datetime?: string
  duration_hours?: number | null
  description?: string
}

export interface EventListResponse {
  total: number
  page: number
  page_size: number
  items: EventItem[]
}

export interface RecommendationItem {
  event: EventItem
  rank: number
  score: number
  strategy: 'tfidf' | 'embedding' | 'cross_encoder'
  rationale?: string
  matched_features?: string[]
}

export interface RecommendationResponse {
  user_id: string
  strategy: string
  top_k: number
  latency_ms: number
  total_eligible?: number
  items: RecommendationItem[]
}

export interface RecommendationComparisonResponse {
  user_id: string
  top_k: number
  tfidf: RecommendationResponse
  embedding: RecommendationResponse
  cross_encoder: RecommendationResponse
}

export interface BenchmarkRoundResult {
  round: number
  persona: User
  pickedEvent: EventItem
  tfidfRank: number | null
  embeddingRank: number | null
  crossEncoderRank: number | null
  latencies: {
    tfidf: number
    embedding: number
    crossEncoder: number
  }
  winner: 'tfidf' | 'embedding' | 'cross_encoder' | 'tie' | 'none'
}

export interface StrategyPerformanceMetrics {
  strategy: 'tfidf' | 'embedding' | 'cross_encoder'
  label: string
  wins: number
  winRate: number
  mrr: number
  hitAt3: number
  hitAt3Rate: number
  hitAt5: number
  hitAt5Rate: number
  avgRankWhenHit: number
  avgLatencyMs: number
}



