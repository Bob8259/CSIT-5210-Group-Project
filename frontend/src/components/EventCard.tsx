import type { EventItem } from '../types'
import { Calendar, Clock, Building2, ArrowUpRight } from 'lucide-react'

interface EventCardProps {
  event: EventItem
  onSelect: (event: EventItem) => void
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  // Region color coding
  const getRegionBadge = (region?: string) => {
    switch (region) {
      case 'Kowloon':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'Hong Kong Island':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'New Territories':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'Online / Flexible':
        return 'bg-purple-50 text-purple-800 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // Format start time if available
  const getStartTimeFormatted = () => {
    if (!event.start_datetime) return null
    try {
      const dt = new Date(event.start_datetime)
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  }

  const startTimeStr = getStartTimeFormatted()

  return (
    <div 
      onClick={() => onSelect(event)}
      className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{event.event_date || 'Flexible Date'}</span>
          </div>

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRegionBadge(event.region)}`}>
            {event.region || 'Hong Kong'}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
          {event.title}
        </h4>

        {/* Organization */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{event.organization_name}</span>
        </div>

        {/* Cause Tags */}
        {event.issue_areas && event.issue_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.issue_areas.slice(0, 2).map((cause) => (
              <span
                key={cause}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
              >
                {cause}
              </span>
            ))}
            {event.issue_areas.length > 2 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded text-slate-400">
                +{event.issue_areas.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Description snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {event.description
            ? event.description.replace(/^Description:\s*/i, '').replace(/活動簡介：/i, '')
            : 'Explore this HandsOn Hong Kong volunteer session.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          {startTimeStr && (
            <span className="flex items-center space-x-1 text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>{startTimeStr}</span>
            </span>
          )}
          {event.duration_hours && (
            <span className="text-slate-400">
              ({event.duration_hours}h)
            </span>
          )}
        </div>

        <span className="inline-flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
          Details
          <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </div>
  )
}
