import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type {
  EventItem,
  RecommendationItem,
  RecommendationComparisonResponse,
  RecommendationResponse,
} from "../types";
import EventModal from "../components/EventModal";
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Info,
} from "lucide-react";

export default function Recommendations() {
  const { user } = useAuth();

  // Mode: 'compare' | 'tfidf' | 'embedding' | 'cross_encoder'
  const [activeStrategy, setActiveStrategy] = useState<
    "compare" | "tfidf" | "embedding" | "cross_encoder"
  >("compare");
  const [topK, setTopK] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [comparisonData, setComparisonData] =
    useState<RecommendationComparisonResponse | null>(null);
  const [singleData, setSingleData] = useState<RecommendationResponse | null>(
    null
  );

  // Selected event for modal inspection
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Fetch recommendations whenever user, strategy, or topK changes
  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    }
  }, [user?.id, activeStrategy, topK]);

  const fetchRecommendations = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      if (activeStrategy === "compare") {
        const res = await fetch(
          `/api/recommend/compare?user_id=${user.id}&top_k=${topK}`
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to load comparison.");
        }
        const data: RecommendationComparisonResponse = await res.json();
        setComparisonData(data);
      } else {
        const endpoint =
          activeStrategy === "cross_encoder"
            ? "rerank"
            : activeStrategy;
        const res = await fetch(
          `/api/recommend/${endpoint}?user_id=${user.id}&top_k=${topK}`
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to load recommendations.");
        }
        const data: RecommendationResponse = await res.json();
        setSingleData(data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to render a single recommendation card
  const renderItemCard = (item: RecommendationItem) => {
    const isTop1 = item.rank === 1;

    return (
      <article
        key={`${item.strategy}-${item.event.id}-${item.rank}`}
        className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between h-full ${
          isTop1
            ? "border-indigo-300 ring-2 ring-indigo-50/80"
            : "border-slate-200"
        }`}
      >
        <div className="flex-1 flex flex-col">
          {/* Header: Rank badge & Strategy label */}
          <div className="flex items-center justify-between gap-2 h-7 mb-2.5">
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-bold ${
                isTop1
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : item.rank === 2
                  ? "bg-slate-200 text-slate-800"
                  : item.rank === 3
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              #{item.rank}
            </span>

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {item.strategy === "tfidf"
                ? "Strategy A"
                : item.strategy === "embedding"
                ? "Strategy B"
                : "Strategy C"}
            </span>
          </div>

          {/* Title */}
          <h4
            onClick={() => setSelectedEvent(item.event)}
            title={item.event.title}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem] hover:text-indigo-600 cursor-pointer transition-colors"
          >
            {item.event.title}
          </h4>

          {/* Org & Metadata */}
          <p className="text-xs text-slate-500 mt-1 h-4 truncate">
            {item.event.organization_name || "HandsOn Partner"}
          </p>

          {/* Location, Duration, Date */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-2">
            {item.event.region && (
              <span className="flex items-center space-x-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{item.event.region}</span>
              </span>
            )}
            {item.event.duration_hours && (
              <span className="flex items-center space-x-1 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{item.event.duration_hours}h</span>
              </span>
            )}
            {item.event.event_date && (
              <span className="flex items-center space-x-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{item.event.event_date}</span>
              </span>
            )}
          </div>

          {/* Rationale Box: Full unclipped text */}
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed flex-1 flex flex-col justify-start">
            <span className="font-semibold text-slate-900 block mb-1">Match Rationale:</span>
            <p className="text-slate-600">
              {item.rationale ? item.rationale.replace(/\[.*?\]\s*/, "") : "Thematic alignment with cold-start volunteer preferences."}
            </p>
          </div>

          {/* Matched Feature Tags: Naturally wrapping, no cutoffs */}
          {item.matched_features && item.matched_features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {item.matched_features.map((feat, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Trigger: Pinned to bottom */}
        <button
          onClick={() => setSelectedEvent(item.event)}
          className="mt-4 w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>View Details</span>
        </button>
      </article>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Recommendation Methods Playground
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare cold-start recommendation strategies for new volunteers using real opportunities from HandsOn Hong Kong.
          </p>
        </div>

        {/* Refresh Action */}
        <button
          onClick={fetchRecommendations}
          disabled={loading || !user}
          className="self-start sm:self-auto inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-indigo-600 ${
              loading ? "animate-spin" : ""
            }`}
          />
          <span>Refresh Results</span>
        </button>
      </div>

      {/* 2. Active User Profile Cold-Start Banner */}
      {user ? (
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Active Cold-Start Profile
                </span>
                <span className="text-xs text-slate-400">
                  ID: <code className="text-indigo-200 font-mono">{user.id}</code>
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {user.name}{" "}
                <span className="text-sm font-normal text-slate-400">
                  ({user.email})
                </span>
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
              {user.preferred_regions?.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Region: {r}
                </span>
              ))}
              {user.max_duration_hours && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10">
                  Max: {user.max_duration_hours}h
                </span>
              )}
              {user.skills?.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl bg-white/10 text-slate-100 border border-white/10"
                >
                  Skill: {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Option A Pre-Filters Active (Duration &le; {user.max_duration_hours || 4}h + Language Eligibility) • Candidate pool:{" "}
                <strong className="text-emerald-300 font-semibold">
                  {comparisonData?.tfidf.total_eligible ?? singleData?.total_eligible ?? 697}
                </strong>{" "}
                / 697 opportunities eligible
              </span>
            </span>
            <Link
              to="/onboarding"
              className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Modify Onboarding Answers →
            </Link>
          </div>
        </section>
      ) : (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Please Sign In with a Test User</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Sign in with one of the 10 cold-start accounts (e.g., user_1) to test recommendation models.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            Sign In Now
          </Link>
        </section>
      )}

      {/* 3. Controls & Strategy Selector Bar */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Model Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveStrategy("compare")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStrategy === "compare"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setActiveStrategy("tfidf")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStrategy === "tfidf"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Strategy A: TF-IDF
          </button>
          <button
            onClick={() => setActiveStrategy("embedding")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStrategy === "embedding"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Strategy B: Embeddings
          </button>
          <button
            onClick={() => setActiveStrategy("cross_encoder")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStrategy === "cross_encoder"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Strategy C: Cross-Encoder Reranker
          </button>
        </div>

        {/* Top-K Selector */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Top-K:</span>
          {[3, 5, 10].map((k) => (
            <button
              key={k}
              onClick={() => setTopK(k)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                topK === k
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              K={k}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Recommendations Display Area */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">
            Running recommendation models over 697 real opportunities...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
          <strong>Error: </strong>
          {error}
        </div>
      ) : activeStrategy === "compare" && comparisonData ? (
        /* Side-by-Side 3-Column Comparative View with Rank-Aligned Rows */
        <div className="space-y-6">
          {/* Column Headers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Header A */}
            <header className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[96px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                  Strategy A
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ⚡ {comparisonData.tfidf.latency_ms} ms
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  TF-IDF Content-Based
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Lexical unigram/bigram overlap baseline.
                </p>
              </div>
            </header>

            {/* Header B */}
            <header className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 min-h-[96px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                  Strategy B
                </span>
                <span className="text-[11px] font-mono text-indigo-600">
                  ⚡ {comparisonData.embedding.latency_ms} ms
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Semantic Embeddings
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Dense vector dot-product (all-MiniLM-L6-v2).
                </p>
              </div>
            </header>

            {/* Header C */}
            <header className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 min-h-[96px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Strategy C
                </span>
                <span className="text-[11px] font-mono text-emerald-600">
                  ⚡ {comparisonData.cross_encoder.latency_ms} ms
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Neural Cross-Encoder
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Two-stage retrieval + deep interaction reranker.
                </p>
              </div>
            </header>
          </div>

          {/* Cards: Rank-Aligned Rows ensuring matching height per rank */}
          <div className="space-y-6">
            {Array.from({ length: topK }).map((_, rankIdx) => (
              <div
                key={rankIdx}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
              >
                <div className="h-full flex flex-col">
                  {comparisonData.tfidf.items[rankIdx] &&
                    renderItemCard(comparisonData.tfidf.items[rankIdx])}
                </div>
                <div className="h-full flex flex-col">
                  {comparisonData.embedding.items[rankIdx] &&
                    renderItemCard(comparisonData.embedding.items[rankIdx])}
                </div>
                <div className="h-full flex flex-col">
                  {comparisonData.cross_encoder.items[rankIdx] &&
                    renderItemCard(comparisonData.cross_encoder.items[rankIdx])}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : singleData ? (
        /* Single Strategy View */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase">
                {singleData.strategy.replace("_", " ")} Results
              </h3>
              <p className="text-xs text-slate-500">
                Top {singleData.top_k} recommended opportunities for {user?.name}.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              Latency: {singleData.latency_ms} ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {singleData.items.map((item) => (
              <div
                key={`${item.strategy}-${item.event.id}-${item.rank}`}
                className="h-full flex flex-col"
              >
                {renderItemCard(item)}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Event Details Dialog Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
