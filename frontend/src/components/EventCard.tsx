import type { EventItem } from '../types'
import { Calendar, Clock, ArrowUpRight } from 'lucide-react'

interface EventCardProps {
  event: EventItem
  onSelect: (event: EventItem) => void
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  return (
    <article
      onClick={() => onSelect(event)}
      className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex justify-between items-center text-xs mb-2 text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            {event.event_date || 'Flexible Date'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
            {event.region || 'Hong Kong'}
          </span>
        </div>

        <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {event.title}
        </h4>
        <p className="text-xs text-slate-500 mt-1 truncate">{event.organization_name}</p>

        {event.issue_areas && event.issue_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {event.issue_areas.slice(0, 2).map((cause) => (
              <span key={cause} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                {cause}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-purple-500" />
          {event.duration_hours ? `${event.duration_hours}h` : 'Flexible'}
        </span>
        <span className="font-semibold text-indigo-600 flex items-center group-hover:translate-x-0.5 transition-transform">
          Details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </article>
  )
}
