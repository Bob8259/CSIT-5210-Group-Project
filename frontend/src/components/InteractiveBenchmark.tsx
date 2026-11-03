import { useState, useEffect } from 'react'
import type { 
  User, 
  EventItem, 
  RecommendationComparisonResponse, 
  BenchmarkRoundResult, 
  StrategyPerformanceMetrics 
} from '../types'
import { 
  Trophy, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Copy, 
  Check, 
  Clock, 
  MapPin, 
  Calendar, 
  SlidersHorizontal, 
  ShieldCheck, 
  Info,
  Zap,
  Target
} from 'lucide-react'

interface InteractiveBenchmarkProps {
  onOpenModal: (event: EventItem) => void
  onExit?: () => void
}

export default function InteractiveBenchmark({ onOpenModal, onExit }: InteractiveBenchmarkProps) {
  // Setup & Phase State
  const [phase, setPhase] = useState<'setup' | 'evaluating' | 'completed'>('setup')
  const [totalRounds, setTotalRounds] = useState<number>(5)
  const [blindMode, setBlindMode] = useState<boolean>(true)
  
  // Personas & Active Round
  const [personas, setPersonas] = useState<User[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0)
  const [loadingRound, setLoadingRound] = useState<boolean>(false)
  const [currentComparison, setCurrentComparison] = useState<RecommendationComparisonResponse | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  // Accumulated Results
  const [results, setResults] = useState<BenchmarkRoundResult[]>([])
  const [copied, setCopied] = useState<boolean>(false)

  // Load all test personas on mount
  useEffect(() => {
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: User[]) => {
        if (data && data.length > 0) {
          setPersonas(data)
        }
      })
      .catch((err) => console.error('Failed to load personas:', err))
  }, [])

  // Start the study
  const handleStartStudy = (rounds: number) => {
    setTotalRounds(rounds)
    setCurrentRoundIndex(0)
    setResults([])
    setSelectedEventId(null)
    setPhase('evaluating')
    loadRoundData(0, rounds)
  }

  // Fetch recommendations for active round persona
  const loadRoundData = async (roundIdx: number, roundsLimit?: number) => {
    const activeLimit = roundsLimit || totalRounds
    if (roundIdx >= activeLimit) return

    setLoadingRound(true)
    setSelectedEventId(null)

    // Select persona for this round (fallback to user_1 if array length < roundIdx)
    const activePersona = personas[roundIdx] || { id: `user_${roundIdx + 1}` }
    const personaId = activePersona.id || `user_${roundIdx + 1}`

    try {
      const res = await fetch(`/api/recommend/compare?user_id=${personaId}&top_k=5`)
      if (res.ok) {
        const data: RecommendationComparisonResponse = await res.json()
        setCurrentComparison(data)
      }
    } catch (err) {
      console.error('Error fetching round recommendations:', err)
    } finally {
      setLoadingRound(false)
    }
  }

  // Get unique deduplicated events across the 3 strategies for the round
  const getCandidateItems = () => {
    if (!currentComparison) return []

    const map = new Map<string, { event: EventItem; rationales: string[]; features: string[] }>()

    const strategies = [
      currentComparison.tfidf.items,
      currentComparison.embedding.items,
      currentComparison.cross_encoder.items,
    ]

    strategies.forEach((items) => {
      items.forEach((item) => {
        if (!map.has(item.event.id)) {
          map.set(item.event.id, {
            event: item.event,
            rationales: item.rationale ? [item.rationale] : [],
            features: item.matched_features || [],
          })
        }
      })
    })

    return Array.from(map.values())
  }

  // Confirm current pick and advance
  const handleConfirmPick = () => {
    if (!selectedEventId || !currentComparison) return

    const candidateItems = getCandidateItems()
    const pickedCandidate = candidateItems.find((c) => c.event.id === selectedEventId)
    if (!pickedCandidate) return

    const currentPersona = personas[currentRoundIndex] || {
      id: currentComparison.user_id,
      name: `User ${currentRoundIndex + 1}`,
      email: `${currentComparison.user_id}@connect.ust.hk`,
      preferred_causes: [],
      target_populations: [],
      preferred_regions: [],
      skills: [],
      has_preferences: true,
    }

    // Determine rank in each model (1-5, or null if missed)
    const findRank = (items: { event: EventItem; rank: number }[]) => {
      const item = items.find((i) => i.event.id === selectedEventId)
      return item ? item.rank : null
    }

    const tfidfRank = findRank(currentComparison.tfidf.items)
    const embeddingRank = findRank(currentComparison.embedding.items)
    const crossEncoderRank = findRank(currentComparison.cross_encoder.items)

    // Determine round winner strategy
    const ranks = [
      { strat: 'cross_encoder' as const, rank: crossEncoderRank },
      { strat: 'embedding' as const, rank: embeddingRank },
      { strat: 'tfidf' as const, rank: tfidfRank },
    ].filter((r) => r.rank !== null) as { strat: 'tfidf' | 'embedding' | 'cross_encoder'; rank: number }[]

    let winner: 'tfidf' | 'embedding' | 'cross_encoder' | 'tie' | 'none' = 'none'

    if (ranks.length > 0) {
      ranks.sort((a, b) => a.rank - b.rank)
      const bestRank = ranks[0].rank
      const bestStrats = ranks.filter((r) => r.rank === bestRank)
      if (bestStrats.length === 1) {
        winner = bestStrats[0].strat
      } else {
        winner = 'tie'
      }
    }

    const roundRecord: BenchmarkRoundResult = {
      round: currentRoundIndex + 1,
      persona: currentPersona,
      pickedEvent: pickedCandidate.event,
      tfidfRank,
      embeddingRank,
      crossEncoderRank,
      latencies: {
        tfidf: currentComparison.tfidf.latency_ms,
        embedding: currentComparison.embedding.latency_ms,
        crossEncoder: currentComparison.cross_encoder.latency_ms,
      },
      winner,
    }

    const nextResults = [...results, roundRecord]
    setResults(nextResults)

    if (currentRoundIndex + 1 >= totalRounds) {
      setPhase('completed')
    } else {
      const nextIdx = currentRoundIndex + 1
      setCurrentRoundIndex(nextIdx)
      loadRoundData(nextIdx)
    }
  }

  // Compute aggregate performance metrics for completed study
  const computeMetrics = (): Record<'tfidf' | 'embedding' | 'cross_encoder', StrategyPerformanceMetrics> => {
    const N = results.length || 1

    const strats: ('tfidf' | 'embedding' | 'cross_encoder')[] = ['tfidf', 'embedding', 'cross_encoder']
    const out: Record<string, StrategyPerformanceMetrics> = {}

    strats.forEach((s) => {
      let wins = 0
      let reciprocalRankSum = 0
      let hitAt3Count = 0
      let hitAt5Count = 0
      let rankSumWhenHit = 0
      let hitCount = 0
      let latencySum = 0

      results.forEach((r) => {
        // Winner count
        if (r.winner === s) {
          wins += 1
        } else if (r.winner === 'tie') {
          // Check if this model tied for best
          const rank = s === 'tfidf' ? r.tfidfRank : s === 'embedding' ? r.embeddingRank : r.crossEncoderRank
          const minRank = Math.min(
            r.tfidfRank ?? 999,
            r.embeddingRank ?? 999,
            r.crossEncoderRank ?? 999
          )
          if (rank === minRank && rank !== 999) {
            wins += 0.5
          }
        }

        const rank = s === 'tfidf' ? r.tfidfRank : s === 'embedding' ? r.embeddingRank : r.crossEncoderRank
        const lat = s === 'tfidf' ? r.latencies.tfidf : s === 'embedding' ? r.latencies.embedding : r.latencies.crossEncoder
        latencySum += lat

        if (rank !== null && rank <= 5) {
          reciprocalRankSum += 1.0 / rank
          hitAt5Count += 1
          rankSumWhenHit += rank
          hitCount += 1
          if (rank <= 3) {
            hitAt3Count += 1
          }
        }
      })

      const label =
        s === 'tfidf'
          ? 'Strategy A: TF-IDF'
          : s === 'embedding'
          ? 'Strategy B: Embeddings'
          : 'Strategy C: Neural Cross-Encoder'

      out[s] = {
        strategy: s,
        label,
        wins: Math.round(wins * 10) / 10,
        winRate: Math.round((wins / N) * 1000) / 10,
        mrr: Math.round((reciprocalRankSum / N) * 1000) / 1000,
        hitAt3: hitAt3Count,
        hitAt3Rate: Math.round((hitAt3Count / N) * 1000) / 10,
        hitAt5: hitAt5Count,
        hitAt5Rate: Math.round((hitAt5Count / N) * 1000) / 10,
        avgRankWhenHit: hitCount > 0 ? Math.round((rankSumWhenHit / hitCount) * 10) / 10 : 5.0,
        avgLatencyMs: Math.round((latencySum / N) * 10) / 10,
      }
    })

    return out as Record<'tfidf' | 'embedding' | 'cross_encoder', StrategyPerformanceMetrics>
  }

  // Copy Markdown table for report
  const handleCopyMarkdown = () => {
    const metrics = computeMetrics()
    const md = `### Cold-Start Recommendation Interactive Study Performance Matrix
**Rounds Evaluated:** ${results.length} | **Evaluation Protocol:** Blind Top-1 Selection

| Metric | Strategy A: TF-IDF | Strategy B: Embeddings | Strategy C: Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **Top-Choice Win Rate** | ${metrics.tfidf.winRate}% | ${metrics.embedding.winRate}% | ${metrics.cross_encoder.winRate}% |
| **Mean Reciprocal Rank (MRR)** | ${metrics.tfidf.mrr} | ${metrics.embedding.mrr} | ${metrics.cross_encoder.mrr} |
| **Hit Rate @ 3 (Hit@3)** | ${metrics.tfidf.hitAt3Rate}% | ${metrics.embedding.hitAt3Rate}% | ${metrics.cross_encoder.hitAt3Rate}% |
| **Hit Rate @ 5 (Hit@5)** | ${metrics.tfidf.hitAt5Rate}% | ${metrics.embedding.hitAt5Rate}% | ${metrics.cross_encoder.hitAt5Rate}% |
| **Avg Rank when Retrieved** | #${metrics.tfidf.avgRankWhenHit} | #${metrics.embedding.avgRankWhenHit} | #${metrics.cross_encoder.avgRankWhenHit} |
| **Mean Latency (ms)** | ${metrics.tfidf.avgLatencyMs} ms | ${metrics.embedding.avgLatencyMs} ms | ${metrics.cross_encoder.avgLatencyMs} ms |

#### Round-by-Round Breakdown
${results
  .map(
    (r) =>
      `- **Round ${r.round} (${r.persona.name}):** Picked *"${r.pickedEvent.title}"* ` +
      `[TF-IDF: ${r.tfidfRank ? `#${r.tfidfRank}` : 'Missed'} | ` +
      `Embedding: ${r.embeddingRank ? `#${r.embeddingRank}` : 'Missed'} | ` +
      `Cross-Encoder: ${r.crossEncoderRank ? `#${r.crossEncoderRank}` : 'Missed'}] ` +
      `Winner: ${r.winner}`
  )
  .join('\n')}
`
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const activePersona = personas[currentRoundIndex] || {
    id: `user_${currentRoundIndex + 1}`,
    name: `User ${currentRoundIndex + 1}`,
    email: `user${currentRoundIndex + 1}@connect.ust.hk`,
    bio: 'Cold-start volunteer profile',
    preferred_causes: ['Community Support'],
    target_populations: ['General'],
    preferred_regions: ['Hong Kong'],
    skills: ['Cantonese'],
    max_duration_hours: 3.0,
    has_preferences: true,
  }

  // =========================================================================
  // VIEW 1: SETUP
  // =========================================================================
  if (phase === 'setup') {
    return (
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 animate-fadeIn">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Empirical Human Evaluation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Interactive Recommendation Benchmark Study
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Test and evaluate how effectively each recommendation strategy satisfies cold-start volunteer profiles.
            In each round, review a realistic student persona, evaluate the recommended opportunities, and select your favourite event.
            The system will immediately compute and display the <strong>Performance Matrix (Win Rate, MRR, Hit@K, and Latency)</strong>.
          </p>
        </div>

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card 1: Study Length */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Choose Study Duration</span>
            </div>
            <p className="text-xs text-slate-500">
              Select how many cold-start personas you want to evaluate:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTotalRounds(5)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  totalRounds === 5
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">5 Rounds</div>
                <div className="text-xs text-slate-500 mt-1">Quick Study (~2 mins)</div>
                <div className="text-[11px] font-medium text-indigo-600 mt-2">user_1 to user_5</div>
              </button>

              <button
                onClick={() => setTotalRounds(10)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  totalRounds === 10
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">10 Rounds</div>
                <div className="text-xs text-slate-500 mt-1">Full Evaluation (~4 mins)</div>
                <div className="text-[11px] font-medium text-indigo-600 mt-2">All 10 Personas</div>
              </button>
            </div>
          </div>

          {/* Card 2: Blind Evaluation Option */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Evaluation Protocol</span>
            </div>
            <p className="text-xs text-slate-500">
              Control whether model labels are concealed during candidate selection:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBlindMode(true)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  blindMode
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">Blind Mode</div>
                <div className="text-xs text-slate-500 mt-1">Unbiased Choice</div>
                <div className="text-[11px] font-medium text-emerald-600 mt-2">Conceal Strategy Tags</div>
              </button>

              <button
                onClick={() => setBlindMode(false)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  !blindMode
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">Visible Mode</div>
                <div className="text-xs text-slate-500 mt-1">Side-by-Side</div>
                <div className="text-[11px] font-medium text-indigo-600 mt-2">Show Strategy Columns</div>
              </button>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Ready with 10 cold-start personas and Option A Pre-Filters enabled.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {onExit && (
              <button
                onClick={onExit}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => handleStartStudy(totalRounds)}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Begin Benchmark Study ({totalRounds} Rounds)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    )
  }

  // =========================================================================
  // VIEW 2: EVALUATION ROUND IN PROGRESS
  // =========================================================================
  if (phase === 'evaluating') {
    const candidateItems = getCandidateItems()
    const progressPercent = Math.round(((currentRoundIndex + 1) / totalRounds) * 100)

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Progress Header */}
        <header className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                Round {currentRoundIndex + 1} of {totalRounds}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {blindMode ? 'Blind Evaluation' : 'Visible Comparison'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Select the best-matching opportunity for this volunteer profile
            </h3>
          </div>

          <div className="w-full sm:w-48 space-y-1.5 self-start sm:self-auto">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        {/* Persona Profile Card */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/20">
                  Target Persona
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activePersona.id}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {activePersona.name}
              </h2>
              {activePersona.bio && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2">
                  "{activePersona.bio}"
                </p>
              )}
            </div>

            {/* Persona Constraints */}
            <div className="flex flex-wrap gap-2 lg:max-w-md">
              {activePersona.preferred_causes?.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Cause: {c}
                </span>
              ))}
              {activePersona.target_populations?.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Target: {p}
                </span>
              ))}
              {activePersona.preferred_regions?.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Region: {r}
                </span>
              ))}
              {activePersona.max_duration_hours && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Max: {activePersona.max_duration_hours}h
                </span>
              )}
              {activePersona.skills?.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                >
                  Skill: {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Candidate Opportunities List */}
        {loadingRound ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
            <Zap className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">
              Generating candidate recommendations for {activePersona.name}...
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Candidate Opportunities ({candidateItems.length} Unique Recommendations)
              </h4>
              <span className="text-xs text-slate-400">
                Click <strong className="text-indigo-600 font-semibold">"Pick as Favourite"</strong> on the event you believe best fits {activePersona.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {candidateItems.map((candidate, idx) => {
                const isSelected = selectedEventId === candidate.event.id

                return (
                  <article
                    key={candidate.event.id}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Card index & Selection Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          Candidate #{idx + 1}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                            <Star className="w-3 h-3 fill-white" />
                            <span>Selected Pick</span>
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h5
                        onClick={() => onOpenModal(candidate.event)}
                        title={candidate.event.title}
                        className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {candidate.event.title}
                      </h5>

                      {/* Org */}
                      <p className="text-xs text-slate-500 truncate">
                        {candidate.event.organization_name || 'Community Partner'}
                      </p>

                      {/* Metadata */}
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

                      {/* Match Features */}
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

                    {/* Card Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => onOpenModal(candidate.event)}
                        className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => setSelectedEventId(candidate.event.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-white' : ''}`} />
                        <span>{isSelected ? 'Chosen' : 'Pick as Favourite'}</span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Action Footer Bar */}
        <footer className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            {selectedEventId ? (
              <span className="flex items-center space-x-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Opportunity selected! Click continue to proceed.</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-amber-600">
                <Target className="w-4 h-4 text-amber-500" />
                <span>Please select 1 favourite opportunity to proceed to the next round.</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setPhase('setup')}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Exit Study
            </button>

            <button
              onClick={handleConfirmPick}
              disabled={!selectedEventId}
              className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>
                {currentRoundIndex + 1 >= totalRounds
                  ? 'Complete Study & View Matrix 🎉'
                  : 'Confirm & Next Round →'}
              </span>
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: COMPLETED — PERFORMANCE MATRIX & SCORECARD
  // =========================================================================
  const metrics = computeMetrics()
  const sortedWinners = [metrics.cross_encoder, metrics.embedding, metrics.tfidf].sort(
    (a, b) => b.winRate - a.winRate || b.mrr - a.mrr
  )
  const topWinner = sortedWinners[0]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Winner Announcement Banner */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Study Complete &bull; {results.length} Rounds Evaluated</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              🏆 Top Performer: {topWinner.label}
            </h2>

            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Based on your {results.length} blind selections, <strong>{topWinner.label}</strong> achieved the
              highest relevance with a <strong>{topWinner.winRate}% First-Choice Win Rate</strong> and a{' '}
              <strong>Mean Reciprocal Rank (MRR) of {topWinner.mrr}</strong>.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-3">
              <div className="text-[11px] font-semibold text-slate-400">Top Win Rate</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{topWinner.winRate}%</div>
            </div>
            <div className="text-center px-3 border-x border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">MRR Score</div>
              <div className="text-xl font-black text-white mt-0.5">{topWinner.mrr}</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[11px] font-semibold text-slate-400">Hit Rate@5</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{topWinner.hitAt5Rate}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Formal Performance Matrix Table */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Evaluation Performance Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative benchmark across Lexical baseline, Dense Embeddings, and Neural Reranking.
            </p>
          </div>

          <div className="flex items-center space-x-2">
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
        </div>

        {/* Table */}
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
              {/* Row 1: Win Rate */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Top-Choice Win Rate (%)</div>
                  <div className="text-[11px] font-normal text-slate-400">Share of rounds ranked #1</div>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-slate-700">
                  {metrics.tfidf.winRate}% ({metrics.tfidf.wins} wins)
                </td>
                <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                  {metrics.embedding.winRate}% ({metrics.embedding.wins} wins)
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                  {metrics.cross_encoder.winRate}% ({metrics.cross_encoder.wins} wins)
                </td>
              </tr>

              {/* Row 2: MRR */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Mean Reciprocal Rank (MRR)</div>
                  <div className="text-[11px] font-normal text-slate-400">Higher is better (max: 1.0)</div>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-slate-700">
                  {metrics.tfidf.mrr}
                </td>
                <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                  {metrics.embedding.mrr}
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                  {metrics.cross_encoder.mrr}
                </td>
              </tr>

              {/* Row 3: Hit@3 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Hit Rate @ 3 (Hit@3)</div>
                  <div className="text-[11px] font-normal text-slate-400">Target item within Top 3</div>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-slate-700">
                  {metrics.tfidf.hitAt3Rate}%
                </td>
                <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                  {metrics.embedding.hitAt3Rate}%
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                  {metrics.cross_encoder.hitAt3Rate}%
                </td>
              </tr>

              {/* Row 4: Hit@5 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Hit Rate @ 5 (Hit@5)</div>
                  <div className="text-[11px] font-normal text-slate-400">Target item within Top 5</div>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-slate-700">
                  {metrics.tfidf.hitAt5Rate}%
                </td>
                <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                  {metrics.embedding.hitAt5Rate}%
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                  {metrics.cross_encoder.hitAt5Rate}%
                </td>
              </tr>

              {/* Row 5: Avg Rank */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Avg Rank When Recommended</div>
                  <div className="text-[11px] font-normal text-slate-400">Lower is better (#1 is best)</div>
                </td>
                <td className="py-4 px-6 font-mono text-slate-600">
                  #{metrics.tfidf.avgRankWhenHit}
                </td>
                <td className="py-4 px-6 font-mono text-indigo-700">
                  #{metrics.embedding.avgRankWhenHit}
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                  #{metrics.cross_encoder.avgRankWhenHit}
                </td>
              </tr>

              {/* Row 6: Latency */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-slate-900">
                  <div>Average Latency (Efficiency)</div>
                  <div className="text-[11px] font-normal text-slate-400">Response time per request</div>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700">
                  ⚡ {metrics.tfidf.avgLatencyMs} ms
                </td>
                <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                  ⚡ {metrics.embedding.avgLatencyMs} ms
                </td>
                <td className="py-4 px-6 font-mono text-slate-600">
                  🐢 {metrics.cross_encoder.avgLatencyMs} ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Round-by-Round Breakdown Table */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Round-by-Round Decisions Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of each persona query and where each model placed your selected opportunity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-5">Round</th>
                <th className="py-3 px-5">Persona</th>
                <th className="py-3 px-5">Your Picked Opportunity</th>
                <th className="py-3 px-4 text-center">Strategy A</th>
                <th className="py-3 px-4 text-center">Strategy B</th>
                <th className="py-3 px-4 text-center">Strategy C</th>
                <th className="py-3 px-4 text-right">Round Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.round} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    #{r.round}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-900">{r.persona.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{r.persona.id}</div>
                  </td>
                  <td className="py-3.5 px-5 max-w-xs">
                    <div className="font-medium text-slate-800 line-clamp-1">
                      {r.pickedEvent.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {r.pickedEvent.organization_name} &bull; {r.pickedEvent.duration_hours}h
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {r.tfidfRank ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                        #{r.tfidfRank}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {r.embeddingRank ? (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                        #{r.embeddingRank}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {r.crossEncoderRank ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold">
                        #{r.crossEncoderRank}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold">
                    {r.winner === 'cross_encoder' ? (
                      <span className="text-emerald-700">Strategy C</span>
                    ) : r.winner === 'embedding' ? (
                      <span className="text-indigo-700">Strategy B</span>
                    ) : r.winner === 'tfidf' ? (
                      <span className="text-slate-700">Strategy A</span>
                    ) : r.winner === 'tie' ? (
                      <span className="text-amber-600">Tie</span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Action Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={() => setPhase('setup')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Restart Benchmark Study</span>
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
