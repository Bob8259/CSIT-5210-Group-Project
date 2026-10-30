import { useEffect } from 'react'
import type { EventItem } from '../types'
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  ExternalLink, 
  Tag, 
  Users, 
  Wrench,
  Sparkles
} from 'lucide-react'

interface EventModalProps {
  event: EventItem | null
  onClose: () => void
}

export default function EventModal({ event, onClose }: EventModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (event) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [event, onClose])

  if (!event) return null

  // Format start time if available
  const formatTimeRange = () => {
    if (!event.start_datetime) return null
    try {
      const start = new Date(event.start_datetime)
      const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      if (event.end_datetime) {
        const end = new Date(event.end_datetime)
        const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return `${startTimeStr} - ${endTimeStr}`
      }
      return startTimeStr
    } catch {
      return null
    }
  }

  const timeRange = formatTimeRange()

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {event.region || 'Hong Kong'}
              </span>
              {event.duration_hours && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {event.duration_hours} hrs
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {event.title}
            </h2>
            <div className="flex items-center text-xs text-slate-600 space-x-1.5 pt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {event.organization_website ? (
                <a 
                  href={event.organization_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 hover:underline font-medium inline-flex items-center space-x-1"
                >
                  <span>{event.organization_name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ) : (
                <span className="font-medium">{event.organization_name}</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Quick Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Date</span>
                <span className="font-semibold text-xs sm:text-sm">{event.event_date || 'Date Flexible'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 text-slate-700">
              <Clock className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Time & Duration</span>
                <span className="font-semibold text-xs sm:text-sm">
                  {timeRange ? `${timeRange} (${event.duration_hours || 0}h)` : `${event.duration_hours || 0} hours`}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start space-x-2.5 text-slate-700 pt-1">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-slate-400 block">Location</span>
                <span className="font-medium text-xs sm:text-sm text-slate-800">
                  {event.location_address || 'Address provided upon signup / Online'}
                </span>
              </div>
            </div>
          </div>

          {/* Tags (Causes, Demographics, Skills) */}
          <div className="space-y-3">
            {event.issue_areas && event.issue_areas.length > 0 && (
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Cause & Issue Areas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {event.issue_areas.map((cause) => (
                    <span 
                      key={cause}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {cause}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.populations_served && event.populations_served.length > 0 && (
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Target Populations</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {event.populations_served.map((pop) => (
                    <span 
                      key={pop}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {pop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.required_skills && event.required_skills.length > 0 && (
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Required Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {event.required_skills.map((skill) => (
                    <span 
                      key={skill}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Opportunity Description
            </h4>
            <div className="text-slate-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              {event.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* RecSys Notice */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center space-x-2 text-xs text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Sign in to a test account to test how TF-IDF, Semantic Vector Embeddings, and LLM Reranking rank this opportunity for your profile!
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <span>View on HandsOn Hong Kong</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

