import { useState, useEffect, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { EventItem, EventListResponse, MetadataOptions } from '../types'
import EventCarousel from '../components/EventCarousel'
import EventCard from '../components/EventCard'
import EventModal from '../components/EventModal'
import { 
  ClipboardList, 
  CheckSquare, 
  Layers, 
  BarChart3, 
  Sliders, 
  Sparkles, 
  LogIn, 
  ArrowRight,
  Heart,
  MapPin,
  Clock,
  UserCheck,
  Search,
  Filter,
  Calendar,
  Compass,
  ArrowUpDown,
  RefreshCw,
  X
} from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'labeling' | 'recommend' | 'evaluation' | 'catalog'>('questionnaire')

  // Events data states
  const [hotEvents, setHotEvents] = useState<EventItem[]>([])
  const [loadingHot, setLoadingHot] = useState<boolean>(true)

  const [events, setEvents] = useState<EventItem[]>([])
  const [totalEvents, setTotalEvents] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(12)
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedCause, setSelectedCause] = useState<string>('')
  const [timeOrder, setTimeOrder] = useState<'asc' | 'desc'>('asc')

  // Metadata options
  const [options, setOptions] = useState<MetadataOptions | null>(null)

  // Modal inspection state
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)

  const [, startTransition] = useTransition()

  // Fetch hot events & metadata options on mount
  useEffect(() => {
    fetchHotEvents()
    fetchOptions()
  }, [])

  // Fetch time-ranked events on filter or page changes
  useEffect(() => {
    fetchEvents()
  }, [page, selectedRegion, selectedCause, searchQuery, timeOrder])

  const fetchHotEvents = async () => {
    try {
      setLoadingHot(true)
      const res = await fetch('/api/events/hot?limit=5')
      if (res.ok) {
        const data = await res.json()
        setHotEvents(data)
      }
    } catch (err) {
      console.error('Failed to load hot events:', err)
    } finally {
      setLoadingHot(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/meta/options')
      if (res.ok) {
        const data = await res.json()
        setOptions(data)
      }
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true)
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        order: timeOrder
      })
      if (selectedRegion) params.append('region', selectedRegion)
      if (selectedCause) params.append('cause', selectedCause)
      if (searchQuery.trim()) params.append('q', searchQuery.trim())

      const res = await fetch(`/api/events?${params.toString()}`)
      if (res.ok) {
        const data: EventListResponse = await res.json()
        setEvents(data.items)
        setTotalEvents(data.total)
      }
    } catch (err) {
      console.error('Failed to load events list:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      setPage(1)
      setSearchQuery(searchInput)
    })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedRegion('')
    setSelectedCause('')
    setTimeOrder('asc')
    setPage(1)
  }

  const totalPages = Math.ceil(totalEvents / pageSize) || 1

  // Component for rendering the public events catalog (Carousel + Time-Ranked list)
  const renderEventsCatalog = () => (
    <div className="space-y-10">
      {/* 1. Hot Events Carousel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <span>Featured Hot Opportunities</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Highlighting popular volunteer programs actively recruiting across Hong Kong.
            </p>
          </div>
          <button
            onClick={fetchHotEvents}
            title="Refresh featured opportunities"
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>

        <EventCarousel 
          events={hotEvents} 
          loading={loadingHot} 
          onSelectEvent={setSelectedEvent} 
        />
      </section>

      {/* 2. Lower Field: Events Ranked by Time */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Volunteer Opportunities Ranked by Time
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Showing {totalEvents} opportunities arranged in chronological order.
            </p>
          </div>

          {/* Quick Sort Order Toggle */}
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <span className="text-xs text-slate-500 font-medium">Order:</span>
            <button
              onClick={() => {
                setTimeOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
                setPage(1)
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>{timeOrder === 'asc' ? 'Earliest First (Upcoming)' : 'Latest First'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by keyword, cause, or organization..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Region Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Regions</option>
                {options?.regions.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            {/* Cause Dropdown */}
            <div className="w-full md:w-56">
              <select
                value={selectedCause}
                onChange={(e) => {
                  setSelectedCause(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Causes & Issues</option>
                {options?.issue_areas.map((cause) => (
                  <option key={cause} value={cause}>{cause}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          {/* Active Filter Pills */}
          {(searchQuery || selectedRegion || selectedCause) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-400">Filters applied:</span>

              {searchQuery && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium">
                  <span>Keyword: "{searchQuery}"</span>
                  <button onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}>
                    <X className="w-3 h-3 text-indigo-500 hover:text-indigo-800" />
                  </button>
                </span>
              )}

              {selectedRegion && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-medium">
                  <span>Region: {selectedRegion}</span>
                  <button onClick={() => { setSelectedRegion(''); setPage(1); }}>
                    <X className="w-3 h-3 text-amber-600 hover:text-amber-900" />
                  </button>
                </span>
              )}

              {selectedCause && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                  <span>Cause: {selectedCause}</span>
                  <button onClick={() => { setSelectedCause(''); setPage(1); }}>
                    <X className="w-3 h-3 text-emerald-600 hover:text-emerald-900" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearFilters}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline text-xs ml-auto cursor-pointer"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Events Cards Grid */}
        {loadingEvents ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-4 bg-slate-200 rounded-full" />
                </div>
                <div className="w-full h-5 bg-slate-200 rounded" />
                <div className="w-2/3 h-4 bg-slate-200 rounded" />
                <div className="w-full h-12 bg-slate-100 rounded-lg mt-2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-800">No Volunteer Opportunities Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No events matched your current filter criteria. Try clearing the region or cause filters to view more opportunities.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onSelect={setSelectedEvent} 
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalEvents > pageSize && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(page * pageSize, totalEvents)}</span> of{' '}
              <span className="font-semibold">{totalEvents}</span> events
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>

              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* User Onboarding Status Banner */}
      {!user ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sign in to Test Cold-Start Recommendations</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse all 697 events below, or choose one of our 10 test accounts to test onboarding and compare cold-start recommendation models.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Test Account</span>
          </Link>
        </div>
      ) : !user.has_preferences ? (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Preferences Required: {user.name}</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                You haven't set your volunteering interests yet. Complete the short questionnaire to build your cold-start profile!
              </p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm shrink-0"
          >
            <span>Complete Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5 sm:mt-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">{user.name}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Profile Active
                </span>
              </div>
              <div className="text-slate-600 text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {user.preferred_causes?.length > 0 && (
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 text-rose-500 mr-1" />
                    {user.preferred_causes.join(', ')}
                  </span>
                )}
                {user.preferred_regions?.length > 0 && (
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 text-blue-500 mr-1" />
                    {user.preferred_regions.join(', ')}
                  </span>
                )}
                {user.max_duration_hours && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 text-purple-500 mr-1" />
                    &le; {user.max_duration_hours}h
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors shrink-0"
          >
            Edit Preferences
          </Link>
        </div>
      )}

      {/* When user is NOT logged in: Direct public view with Hot Events Carousel & Time-Ranked catalog */}
      {!user ? (
        renderEventsCatalog()
      ) : (
        /* When user IS logged in: Show the 4 research workflow tabs + an Explore Catalog tab */
        <div className="space-y-6">
          {/* Subnav for the 5 workflow / browsing steps */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveTab('questionnaire')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'questionnaire'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>1. Questionnaire Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('labeling')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'labeling'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>2. Relevance Labels</span>
            </button>

            <button
              onClick={() => setActiveTab('recommend')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'recommend'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Models Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'evaluation'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>4. Evaluation Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Events</span>
            </button>
          </div>

          {/* Tab Panels */}
          {activeTab === 'questionnaire' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">1. Onboarding Questionnaire Profile</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Collects explicit preference dimensions (causes, regions, skills, time constraints) to represent the user under cold start.
                  </p>
                </div>
                <Link
                  to="/onboarding"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{user?.has_preferences ? 'Update Questionnaire' : 'Start Questionnaire'}</span>
                </Link>
              </div>

              {user?.has_preferences ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Constructed Text Representation (For TF-IDF & Vector Embeddings)
                    </h4>
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono bg-white p-3.5 rounded-lg border border-slate-200">
                      {user.profile_text || 'No text generated.'}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <span className="text-xs text-slate-500 block">Causes Selected</span>
                      <span className="font-semibold text-sm text-slate-800">
                        {user.preferred_causes?.length || 0} topics
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <span className="text-xs text-slate-500 block">Regions</span>
                      <span className="font-semibold text-sm text-slate-800">
                        {user.preferred_regions?.join(', ') || 'Anywhere'}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <span className="text-xs text-slate-500 block">Max Duration</span>
                      <span className="font-semibold text-sm text-slate-800">
                        {user.max_duration_hours ? `${user.max_duration_hours} hours` : 'Flexible'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center">
                  <Sliders className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Preferences Set for Current User</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Click below to complete the onboarding questionnaire and generate cold-start recommendations.
                  </p>
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    Open Questionnaire
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'labeling' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">2. Ground-Truth Relevance Labeling</h2>
              <p className="text-slate-600 text-sm mb-6">
                Review real volunteer events from the catalog and rate them (Interested / Neutral / Not Interested) to create test labels.
              </p>
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                Event rating interface will be integrated here.
              </div>
            </div>
          )}

          {activeTab === 'recommend' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">3. Recommendation Comparison</h2>
              <p className="text-slate-600 text-sm mb-6">
                Compare 3 models: <strong>TF-IDF Baseline</strong> vs. <strong>Semantic Embeddings</strong> vs. <strong>Retrieval + LLM Reranking</strong>.
              </p>
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                Side-by-side recommendation view will be integrated here.
              </div>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">4. Experimental Evaluation</h2>
              <p className="text-slate-600 text-sm mb-6">
                Evaluate and plot ranking performance across all test users using <strong>Recall@K</strong> and <strong>NDCG@K</strong>.
              </p>
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                Evaluation metrics and chart dashboard will be integrated here.
              </div>
            </div>
          )}

          {activeTab === 'catalog' && renderEventsCatalog()}
        </div>
      )}

      {/* Event Details Dialog Modal */}
      <EventModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </div>
  )
}
