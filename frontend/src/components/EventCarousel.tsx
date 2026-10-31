import type { EventItem } from '../types'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'

interface EventCarouselProps {
  events: EventItem[]
  loading?: boolean
  onSelectEvent: (event: EventItem) => void
}

export default function EventCarousel({ events, loading = false, onSelectEvent }: EventCarouselProps) {
  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden py-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 w-[85%] sm:w-[460px] shrink-0 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (events.length === 0) return null

  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scroll-smooth scrollbar-thin">
      {events.map((event) => (
        <article
          key={event.id}
          onClick={() => onSelectEvent(event)}
          className="snap-center shrink-0 w-[85%] sm:w-[460px] p-6 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md cursor-pointer hover:opacity-95 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Hot Pick
              </span>
              <span className="text-xs text-indigo-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-300" /> {event.region || 'Hong Kong'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold line-clamp-2 leading-snug">{event.title}</h3>
            <p className="text-xs text-indigo-200/80 mt-1 truncate">{event.organization_name}</p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs">
            <span className="flex items-center gap-1 text-indigo-200">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" /> {event.event_date || 'Flexible'}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-white transition-colors">
              Details <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
