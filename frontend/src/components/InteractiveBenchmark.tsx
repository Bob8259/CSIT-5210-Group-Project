import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type {
  EventItem,
  RecommendationComparisonResponse,
} from '../types'
import {
  Trophy,
  Star,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Check,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  Info,
  Zap,
  AlertCircle,
} from 'lucide-react'

interface InteractiveBenchmarkProps {
  onOpenModal: (event: EventItem) => void
  onExit?: () => void
}

interface CandidateItem {
  event: EventItem
  features: string[]
  tfidfRank: number | null
  embeddingRank: number | null
  crossEncoderRank: number | null
}

export default function InteractiveBenchmark({ onOpenModal, onExit }: InteractiveBenchmarkProps) {
  const { user } = useAuth()

  const [phase, setPhase] = useState<'evaluating' | 'completed'>('evaluating')
  const [blindMode, setBlindMode] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [comparisonData, setComparisonData] = useState<RecommendationComparisonResponse | null>(null)

  // Ratings: event.id -> 'interested' | 'not_interested'
  const [ratings, setRatings] = useState<Record<string, 'interested' | 'not_interested'>>({})
  // Optional single top favourite
  const [topFavoriteId, setTopFavoriteId] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const topContainerRef = useRef<HTMLDivElement>(null)

  // Scroll smoothly to top whenever evaluation phase toggles
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (topContainerRef.current) {
      topContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [phase])

  // Fetch recommendations for the logged-in user
  useEffect(() => {
    if (user?.id) {
      loadRecommendations()
    }
  }, [user?.id])

  const loadRecommendations = async () => {
    if (!user?.id) return
    setLoading(true)
    setRatings({})
    setTopFavoriteId(null)
    setPhase('evaluating')

    try {
      const res = await fetch(`/api/recommend/compare?user_id=${user.id}&top_k=5`)
      if (res.ok) {
        const data: RecommendationComparisonResponse = await res.json()
        setComparisonData(data)
      }
    } catch (err) {
      console.error('Failed to load comparison recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Deduplicate candidate opportunities across all 3 strategies
  const getCandidateItems = (): CandidateItem[] => {
    if (!comparisonData) return []

    const map = new Map<string, CandidateItem>()

    const findRank = (items: { event: EventItem; rank: number }[], eid: string) => {
      const it = items.find((i) => i.event.id === eid)
      return it ? it.rank : null
    }

    const allItems = [
      ...comparisonData.cross_encoder.items,
      ...comparisonData.embedding.items,
      ...comparisonData.tfidf.items,
    ]

    allItems.forEach((item) => {
      if (!map.has(item.event.id)) {
        map.set(item.event.id, {
          event: item.event,
          features: item.matched_features || [],
          tfidfRank: findRank(comparisonData.tfidf.items, item.event.id),
          embeddingRank: findRank(comparisonData.embedding.items, item.event.id),
          crossEncoderRank: findRank(comparisonData.cross_encoder.items, item.event.id),
        })
      }
    })

    return Array.from(map.values())
  }

  const candidateItems = getCandidateItems()
  const interestedCount = Object.values(ratings).filter((r) => r === 'interested').length
  const reviewedCount = Object.keys(ratings).length

  // Toggle Interested rating
  const handleToggleInterested = (eventId: string) => {
    setRatings((prev) => {
      const next = { ...prev }
      if (next[eventId] === 'interested') {
        delete next[eventId]
        if (topFavoriteId === eventId) setTopFavoriteId(null)
      } else {
        next[eventId] = 'interested'
      }
      return next
    })
  }

  // Toggle Pass rating
  const handleToggleNotInterested = (eventId: string) => {
    setRatings((prev) => {
      const next = { ...prev }
      if (next[eventId] === 'not_interested') {
        delete next[eventId]
      } else {
        next[eventId] = 'not_interested'
        if (topFavoriteId === eventId) setTopFavoriteId(null)
      }
      return next
    })
  }

  // Toggle Star as #1 Favourite
  const handleToggleTopFavorite = (eventId: string) => {
    if (topFavoriteId === eventId) {
      setTopFavoriteId(null)
    } else {
      setTopFavoriteId(eventId)
      setRatings((prev) => ({ ...prev, [eventId]: 'interested' }))
    }
  }

  // Compute IR Metrics (Precision@5, Recall@5, NDCG@5, MRR)
  const computeMetrics = () => {
    if (!comparisonData) return null

    const relevantIds = new Set(
      Object.entries(ratings)
        .filter(([_, status]) => status === 'interested')
        .map(([id]) => id)
    )

    const totalRelevant = relevantIds.size || 1

    const strats: ('tfidf' | 'embedding' | 'cross_encoder')[] = [
      'tfidf',
      'embedding',
      'cross_encoder',
    ]

    const out: Record<
      'tfidf' | 'embedding' | 'cross_encoder',
      {
        label: string
        precisionAt5: number
        recallAt5: number
        ndcgAt5: number
        mrr: number
        latencyMs: number
        relevantCount: number
        hasTopPick: boolean
        topPickRank: number | null
      }
    > = {} as any

    // Calculate Ideal DCG (IDCG@5)
    // If topFavoriteId is selected, it gets rel=3; other interested get rel=1
    const relValues: number[] = candidateItems.map((c) => {
      if (c.event.id === topFavoriteId) return 3
      if (relevantIds.has(c.event.id)) return 1
      return 0
    })
    relValues.sort((a, b) => b - a)
    let idcg5 = 0
    for (let i = 0; i < Math.min(5, relValues.length); i++) {
      idcg5 += (Math.pow(2, relValues[i]) - 1) / Math.log2(i + 2)
    }
    if (idcg5 === 0) idcg5 = 1.0

    strats.forEach((s) => {
      const items = comparisonData[s].items
      let relevantRetrieved = 0
      let dcg5 = 0
      let mrr = 0
      let topPickRank: number | null = null

      items.forEach((item, idx) => {
        const isFav = item.event.id === topFavoriteId
        const isRel = relevantIds.has(item.event.id)

        if (isRel) {
          relevantRetrieved += 1
          if (mrr === 0) {
            mrr = 1.0 / (idx + 1)
          }
        }

        if (isFav) {
          topPickRank = idx + 1
        }

        const rel = isFav ? 3 : isRel ? 1 : 0
        dcg5 += (Math.pow(2, rel) - 1) / Math.log2(idx + 2)
      })

      const precisionAt5 = Math.round((relevantRetrieved / 5) * 1000) / 10
      const recallAt5 = Math.round((relevantRetrieved / totalRelevant) * 1000) / 10
      const ndcgAt5 = Math.round((dcg5 / idcg5) * 1000) / 1000

      const label =
        s === 'tfidf'
          ? 'Strategy A: TF-IDF'
          : s === 'embedding'
          ? 'Strategy B: Embeddings'
          : 'Strategy C: Cross-Encoder'

      out[s] = {
        label,
        precisionAt5,
        recallAt5,
        ndcgAt5,
        mrr: Math.round(mrr * 1000) / 1000,
        latencyMs: comparisonData[s].latency_ms,
        relevantCount: relevantRetrieved,
        hasTopPick: topPickRank !== null,
        topPickRank,
      }
    })

    return out
  }

  // Copy Markdown Table to Clipboard
  const handleCopyMarkdown = () => {
    const metrics = computeMetrics()
    if (!metrics || !user) return

    const md = `### Personal Recommendation Evaluation Matrix
**Evaluator:** ${user.name} (\`${user.id}\`) | **Causes:** ${user.preferred_causes?.join(', ') || 'N/A'} | **Max Duration:** ${user.max_duration_hours || 'N/A'}h
**Total Candidates Evaluated:** ${candidateItems.length} | **Marked Interested:** ${interestedCount}

| Evaluation Metric | Strategy A: TF-IDF | Strategy B: Embeddings | Strategy C: Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **Precision @ 5** | ${metrics.tfidf.precisionAt5}% | ${metrics.embedding.precisionAt5}% | ${metrics.cross_encoder.precisionAt5}% |
| **Recall @ 5** | ${metrics.tfidf.recallAt5}% | ${metrics.embedding.recallAt5}% | ${metrics.cross_encoder.recallAt5}% |
| **NDCG @ 5** | ${metrics.tfidf.ndcgAt5} | ${metrics.embedding.ndcgAt5} | ${metrics.cross_encoder.ndcgAt5} |
| **Mean Reciprocal Rank (MRR)** | ${metrics.tfidf.mrr} | ${metrics.embedding.mrr} | ${metrics.cross_encoder.mrr} |
| **Retrieved in Top-5** | ${metrics.tfidf.relevantCount} / 5 | ${metrics.embedding.relevantCount} / 5 | ${metrics.cross_encoder.relevantCount} / 5 |
| **Latency (ms)** | ${metrics.tfidf.latencyMs} ms | ${metrics.embedding.latencyMs} ms | ${metrics.cross_encoder.latencyMs} ms |

#### Evaluated Opportunities Breakdown
${candidateItems
  .map((c) => {
    const status = c.event.id === topFavoriteId ? '⭐ #1 Top Favourite' : ratings[c.event.id] === 'interested' ? '👍 Interested' : '👎 Pass'
    return `- **"${c.event.title}"** [Your Verdict: **${status}**] → TF-IDF: ${c.tfidfRank ? `#${c.tfidfRank}` : 'Missed'} | Embedding: ${c.embeddingRank ? `#${c.embeddingRank}` : 'Missed'} | Cross-Encoder: ${c.crossEncoderRank ? `#${c.crossEncoderRank}` : 'Missed'}`
  })
  .join('\n')}
`
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // If user is not logged in
  if (!user) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-bold text-base">Please Sign In to Start Your Personal Evaluation Study</h3>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              Sign in with your student account or one of the test accounts (e.g. <code>user_1</code>) to evaluate recommendations tailored to your profile.
            </p>
          </div>
        </div>
        <Link
          to="/login"
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shrink-0"
        >
          Sign In Now
        </Link>
      </section>
    )
  }

  // =========================================================================
  // VIEW 1: EVALUATING RECOMMENDATIONS (Interactive Grading)
  // =========================================================================
  if (phase === 'evaluating') {
    return (
      <div ref={topContainerRef} className="space-y-6 animate-fadeIn">
        {/* User Profile Context Header */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Your Personal Evaluation Session
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {user.id}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {user.name} <span className="text-xs font-normal text-slate-400">({user.email})</span>
              </h2>
              {user.bio && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2">
                  "{user.bio}"
                </p>
              )}
            </div>

            {/* Constraints Badges */}
            <div className="flex flex-wrap gap-2 lg:max-w-md">
              {user.preferred_causes?.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Cause: {c}
                </span>
              ))}
              {user.target_populations?.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Target: {p}
                </span>
              ))}
              {user.preferred_regions?.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Region: {r}
                </span>
              ))}
              {user.max_duration_hours && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Max: {user.max_duration_hours}h
                </span>
              )}
              {user.skills?.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                >
                  Skill: {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>
              Evaluating {candidateItems.length} candidate opportunities retrieved by Strategy A, B, and C.
            </span>
            <Link
              to="/onboarding"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Modify Onboarding Answers →
            </Link>
          </div>
        </section>

        {/* Study Control Bar */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Mark which opportunities you find genuinely appealing for your profile
            </h3>
            <p className="text-xs text-slate-500">
              Click <strong className="text-emerald-700">"👍 Interested"</strong> if you would attend, or <strong className="text-slate-600">"👎 Pass"</strong> if not. Click <strong className="text-amber-600">"⭐"</strong> to tag your #1 favourite!
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                blindMode
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{blindMode ? 'Blind Mode: ON' : 'Blind Mode: OFF'}</span>
            </button>

            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              Reviewed: {reviewedCount} / {candidateItems.length}
            </div>
          </div>
        </section>

        {/* Candidate Opportunities List */}
        {loading ? (
          <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
            <Zap className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">
              Generating candidate recommendations for {user.name}...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidateItems.map((candidate, idx) => {
              const rating = ratings[candidate.event.id]
              const isTopFav = topFavoriteId === candidate.event.id
              const isInterested = rating === 'interested'
              const isNotInterested = rating === 'not_interested'

              return (
                <article
                  key={candidate.event.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isTopFav
                      ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/40 shadow-sm'
                      : isInterested
                      ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400/30 shadow-sm'
                      : isNotInterested
                      ? 'border-slate-200 bg-slate-50/60 opacity-60'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Candidate Index & Algorithm Tags if Blind Mode OFF */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        Candidate #{idx + 1}
                      </span>

                      {!blindMode && (
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          {candidate.crossEncoderRank && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              C:#{candidate.crossEncoderRank}
                            </span>
                          )}
                          {candidate.embeddingRank && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              B:#{candidate.embeddingRank}
                            </span>
                          )}
                          {candidate.tfidfRank && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                              A:#{candidate.tfidfRank}
                            </span>
                          )}
                        </div>
                      )}

                      {isTopFav ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          <Star className="w-3 h-3 fill-white" />
                          <span>#1 Top Pick</span>
                        </span>
                      ) : isInterested ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          <Check className="w-3 h-3" />
                          <span>Interested</span>
                        </span>
                      ) : isNotInterested ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          Passed
                        </span>
                      ) : null}
                    </div>

                    {/* Event Title */}
                    <h4
                      onClick={() => onOpenModal(candidate.event)}
                      title={candidate.event.title}
                      className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {candidate.event.title}
                    </h4>

                    {/* Org */}
                    <p className="text-xs text-slate-500 truncate">
                      {candidate.event.organization_name || 'Community Partner'}
                    </p>

                    {/* Location, Duration, Date */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 pt-1">
                      {candidate.event.region && (
                        <span className="flex items-center space-x-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{candidate.event.region}</span>
                        </span>
                      )}
                      {candidate.event.duration_hours && (
                        <span className="flex items-center space-x-1 shrink-0 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{candidate.event.duration_hours}h</span>
                        </span>
                      )}
                      {candidate.event.event_date && (
                        <span className="flex items-center space-x-1 truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{candidate.event.event_date}</span>
                        </span>
                      )}
                    </div>

                    {/* Features Tags */}
                    {candidate.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        {candidate.features.slice(0, 3).map((feat, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 truncate max-w-full"
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Rating Buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Interested Button */}
                      <button
                        onClick={() => handleToggleInterested(candidate.event.id)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                          isInterested
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Interested</span>
                      </button>

                      {/* Not Interested Button */}
                      <button
                        onClick={() => handleToggleNotInterested(candidate.event.id)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                          isNotInterested
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* View Details Button */}
                      <button
                        onClick={() => onOpenModal(candidate.event)}
                        className="py-1 px-2 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Info className="w-3 h-3" />
                        <span>Inspect Details</span>
                      </button>

                      {/* Star as Top Pick */}
                      <button
                        onClick={() => handleToggleTopFavorite(candidate.event.id)}
                        className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                          isTopFav
                            ? 'bg-amber-400 text-amber-950 font-bold'
                            : 'text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        <Star className={`w-3 h-3 ${isTopFav ? 'fill-amber-950' : ''}`} />
                        <span>{isTopFav ? '★ #1 Favourite' : 'Mark as #1'}</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Sticky Action Footer */}
        <footer className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            {interestedCount > 0 ? (
              <span className="flex items-center space-x-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {interestedCount} {interestedCount === 1 ? 'event' : 'events'} marked as Interested
                  {topFavoriteId ? ' (including #1 Favourite)' : ''}! Ready to evaluate.
                </span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-amber-600">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Please mark at least 1 opportunity as "👍 Interested" to calculate recommendation metrics.</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back to Playground
              </button>
            )}

            <button
              onClick={() => {
                setPhase('completed')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={interestedCount === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Submit Evaluation & Generate Performance Matrix 🎉</span>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: COMPLETED — PERFORMANCE MATRIX & ANALYSIS
  // =========================================================================
  const metrics = computeMetrics()
  if (!metrics) return null

  // Sort strategies to determine the top winner for this user
  const sorted = [metrics.cross_encoder, metrics.embedding, metrics.tfidf].sort(
    (a, b) => b.ndcgAt5 - a.ndcgAt5 || b.precisionAt5 - a.precisionAt5
  )
  const topWinner = sorted[0]

  return (
    <div ref={topContainerRef} className="space-y-8 animate-fadeIn">
      {/* 1. Winner Podium Banner */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Personal Evaluation Completed &bull; Evaluated by {user.name}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              🏆 Top Match for You: {topWinner.label}
            </h2>

            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Based on your selections, <strong>{topWinner.label}</strong> best satisfied your volunteer preferences,
              achieving the highest <strong>NDCG@5 score of {topWinner.ndcgAt5}</strong> and{' '}
              <strong>{topWinner.precisionAt5}% Precision@5</strong>.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-3">
              <div className="text-[11px] font-semibold text-slate-400">NDCG@5 Score</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{topWinner.ndcgAt5}</div>
            </div>
            <div className="text-center px-3 border-x border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Precision@5</div>
              <div className="text-xl font-black text-white mt-0.5">{topWinner.precisionAt5}%</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[11px] font-semibold text-slate-400">Recall@5</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{topWinner.recallAt5}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Formal Evaluation Performance Matrix Table */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Evaluation Performance Matrix (Personal User Study)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative benchmark across Strategy A (TF-IDF Baseline), Strategy B (Dense Embeddings), and Strategy C (Cross-Encoder Reranker).
            </p>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Markdown Table for Report</span>
              </>
            )}
          </button>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 px-6">Evaluation Metric</th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Strategy A (TF-IDF)</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Strategy B (Embeddings)</span>
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Strategy C (Cross-Encoder)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Row 1: NDCG@5 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>NDCG @ 5 (Ranking Quality)</div>
                  <div className="text-[11px] font-normal text-slate-400">Measures if your preferred items appear at higher ranks (Max: 1.0)</div>
                </td>
                <td className="py-4 px-6 font-mono text-slate-700">
                  {metrics.tfidf.ndcgAt5}
                </td>
                <td className="py-4 px-6 font-mono text-indigo-700 font-bold">
                  {metrics.embedding.ndcgAt5}
                </td>
                <td className="py-4 px-6 font-mono text-emerald-700 font-bold bg-emerald-50/30">
                  {metrics.cross_encoder.ndcgAt5}
                </td>
              </tr>

              {/* Row 2: Precision@5 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Precision @ 5 (%)</div>
                  <div className="text-[11px] font-normal text-slate-400">Percentage of Top-5 recommendations you found relevant</div>
                </td>
                <td className="py-4 px-6 font-mono text-slate-700">
                  {metrics.tfidf.precisionAt5}% ({metrics.tfidf.relevantCount}/5)
                </td>
                <td className="py-4 px-6 font-mono text-indigo-700 font-bold">
                  {metrics.embedding.precisionAt5}% ({metrics.embedding.relevantCount}/5)
                </td>
                <td className="py-4 px-6 font-mono text-emerald-700 font-bold bg-emerald-50/30">
                  {metrics.cross_encoder.precisionAt5}% ({metrics.cross_encoder.relevantCount}/5)
                </td>
              </tr>

              {/* Row 3: Recall@5 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Recall @ 5 (%)</div>
                  <div className="text-[11px] font-normal text-slate-400">Proportion of your total interested opportunities successfully retrieved</div>
                </td>
                <td className="py-4 px-6 font-mono text-slate-700">
                  {metrics.tfidf.recallAt5}%
                </td>
                <td className="py-4 px-6 font-mono text-indigo-700 font-bold">
                  {metrics.embedding.recallAt5}%
                </td>
                <td className="py-4 px-6 font-mono text-emerald-700 font-bold bg-emerald-50/30">
                  {metrics.cross_encoder.recallAt5}%
                </td>
              </tr>

              {/* Row 4: MRR */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Mean Reciprocal Rank (MRR)</div>
                  <div className="text-[11px] font-normal text-slate-400">Rank of your first relevant recommendation (1/rank)</div>
                </td>
                <td className="py-4 px-6 font-mono text-slate-700">
                  {metrics.tfidf.mrr}
                </td>
                <td className="py-4 px-6 font-mono text-indigo-700 font-bold">
                  {metrics.embedding.mrr}
                </td>
                <td className="py-4 px-6 font-mono text-emerald-700 font-bold bg-emerald-50/30">
                  {metrics.cross_encoder.mrr}
                </td>
              </tr>

              {/* Row 5: Latency */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Inference Latency (Efficiency)</div>
                  <div className="text-[11px] font-normal text-slate-400">Server computation time per recommendation query</div>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700">
                  ⚡ {metrics.tfidf.latencyMs} ms
                </td>
                <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                  ⚡ {metrics.embedding.latencyMs} ms
                </td>
                <td className="py-4 px-6 font-mono text-slate-600">
                  🐢 {metrics.cross_encoder.latencyMs} ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Item-by-Item Review Breakdown Table */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Item-by-Item Evaluation Audit
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of every candidate event, your personal rating, and where each model ranked it.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-5">Candidate Opportunity</th>
                <th className="py-3 px-5">Duration & Region</th>
                <th className="py-3 px-4 text-center">Your Rating</th>
                <th className="py-3 px-4 text-center">Strategy A</th>
                <th className="py-3 px-4 text-center">Strategy B</th>
                <th className="py-3 px-4 text-center">Strategy C</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidateItems.map((c) => {
                const isTopFav = c.event.id === topFavoriteId
                const isRel = ratings[c.event.id] === 'interested'
                const isPass = ratings[c.event.id] === 'not_interested'

                return (
                  <tr key={c.event.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5 max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1">{c.event.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{c.event.organization_name}</div>
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {c.event.region} &bull; {c.event.duration_hours}h
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isTopFav ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ★ #1 Top Pick
                        </span>
                      ) : isRel ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          👍 Interested
                        </span>
                      ) : isPass ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          👎 Passed
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {c.tfidfRank ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                          #{c.tfidfRank}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {c.embeddingRank ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                          #{c.embeddingRank}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {c.crossEncoderRank ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold">
                          #{c.crossEncoderRank}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Action Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={() => {
            setPhase('evaluating')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Adjust Ratings / Re-evaluate</span>
        </button>

        {onExit && (
          <button
            onClick={onExit}
            className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            Back to Recommendations Playground
          </button>
        )}
      </footer>
    </div>
  )
}
