import { useState, useEffect, useRef } from 'react'
import type { EventItem } from '../types'
import { 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  ArrowRight,
  ExternalLink 
} from 'lucide-react'

interface EventCarouselProps {
  events: EventItem[]
  loading?: boolean
  onSelectEvent: (event: EventItem) => void
}

export default function EventCarousel({ events, loading = false, onSelectEvent }: EventCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-advance slide every 5 seconds unless paused
  useEffect(() => {
    if (events.length <= 1 || isPaused) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 5000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [events.length, isPaused])

  const handlePrev = () => {
    if (events.length === 0) return
    setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1))
  }

  const handleNext = () => {
    if (events.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % events.length)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm animate-pulse min-h-[300px] flex flex-col justify-between">
        <div className="space-y-3">
          <div className="w-28 h-6 bg-slate-200 rounded-full" />
          <div className="w-3/4 h-8 bg-slate-200 rounded-lg" />
          <div className="w-1/2 h-5 bg-slate-200 rounded-lg" />
        </div>
        <div className="w-full h-16 bg-slate-100 rounded-xl mt-6" />
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  const current = events[currentIndex]

  // Truncate description for carousel snippet
  const snippet = current.description
    ? current.description.replace(/^Description:\s*/i, '').slice(0, 220) + (current.description.length > 220 ? '...' : '')
    : 'Join this impactful volunteering activity organized through HandsOn Hong Kong.'

  return (
    <div 
      className="relative group bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      {/* Slide Content */}
      <div className="relative z-10 flex flex-col justify-between min-h-[280px]">
        {/* Top Badges & Index Tracker */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Hot Event</span>
            </span>

            {current.region && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-100 border border-white/10">
                <MapPin className="w-3 h-3 text-indigo-300" />
                <span>{current.region}</span>
              </span>
            )}
          </div>

          <div className="text-xs text-indigo-200/70 font-mono">
            {currentIndex + 1} / {events.length}
          </div>
        </div>

        {/* Title & Organization */}
        <div className="space-y-2 mb-4">
          <h3 
            onClick={() => onSelectEvent(current)}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight hover:text-indigo-200 cursor-pointer transition-colors"
          >
            {current.title}
          </h3>

          <div className="flex items-center space-x-2 text-indigo-200 text-xs sm:text-sm">
            <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-medium text-indigo-100">{current.organization_name}</span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed mb-6 line-clamp-2 max-w-3xl">
          {snippet}
        </p>

        {/* Bottom Details Row & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-indigo-200">
            {current.event_date && (
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                <span>{current.event_date}</span>
              </div>
            )}
            {current.duration_hours && (
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-300" />
                <span>{current.duration_hours} hours</span>
              </div>
            )}
            {current.issue_areas && current.issue_areas.length > 0 && (
              <div className="flex items-center gap-1.5">
                {current.issue_areas.slice(0, 2).map((cause) => (
                  <span 
                    key={cause}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-800/60 text-indigo-200 border border-indigo-700/50"
                  >
                    {cause}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => onSelectEvent(current)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 shadow-md transition-all cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {current.url && (
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open on HandsOn Hong Kong"
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Carousel Prev / Next Controls */}
      <button
        onClick={handlePrev}
        aria-label="Previous event"
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm cursor-pointer border border-white/10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next event"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm cursor-pointer border border-white/10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel Pagination Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-10">
        {events.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-6 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
