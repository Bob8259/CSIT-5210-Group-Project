import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { MetadataOptions } from '../types'
import { 
  Sparkles, 
  MapPin, 
  HeartHandshake, 
  Users, 
  GraduationCap, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

export default function Onboarding() {
  const { user, updatePreferences, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [selectedCauses, setSelectedCauses] = useState<string[]>([])
  const [selectedPopulations, setSelectedPopulations] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [maxDuration, setMaxDuration] = useState<number>(4.0)
  const [bio, setBio] = useState<string>('')

  // Metadata options from backend
  const [options, setOptions] = useState<MetadataOptions | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Populate form with existing user data if available
  useEffect(() => {
    if (user) {
      if (user.preferred_causes?.length) setSelectedCauses(user.preferred_causes)
      if (user.target_populations?.length) setSelectedPopulations(user.target_populations)
      if (user.preferred_regions?.length) setSelectedRegions(user.preferred_regions)
      if (user.skills?.length) setSelectedSkills(user.skills)
      if (user.max_duration_hours) setMaxDuration(user.max_duration_hours)
      if (user.bio) setBio(user.bio)
    }
  }, [user])

  // Fetch available categories and filters from DB
  useEffect(() => {
    fetch('/api/meta/options')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MetadataOptions | null) => {
        if (data) setOptions(data)
      })
      .catch((err) => console.error('Failed to load metadata options:', err))
      .finally(() => setLoadingOptions(false))
  }, [])

  // Toggle helper for multi-select arrays
  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selectedCauses.length === 0 && selectedRegions.length === 0) {
      setError('Please select at least one cause or preferred region to help us match events.')
      return
    }

    setSaving(true)
    try {
      await updatePreferences({
        preferred_causes: selectedCauses,
        target_populations: selectedPopulations,
        preferred_regions: selectedRegions,
        skills: selectedSkills,
        max_duration_hours: maxDuration,
        bio: bio.trim(),
      })
      // Successfully saved preferences, route to home
      navigate('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to save preferences. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loadingOptions) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm">Preparing your onboarding questionnaire...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-8 rounded-3xl shadow-sm mb-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-300" />
            Cold-Start Profile Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
            Since your account is brand new, please share your volunteering interests and constraints. 
            Our recommendation algorithms (TF-IDF Baseline, Semantic Embeddings, and LLM Reranking) will use this profile to find the most relevant opportunities.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Causes & Issue Areas */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Preferred Causes & Issue Areas</h2>
              <p className="text-xs text-slate-500">Select the topics and community missions that resonate with you</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {options?.issue_areas.map((cause) => {
              const selected = selectedCauses.includes(cause)
              return (
                <button
                  type="button"
                  key={cause}
                  onClick={() => toggleItem(selectedCauses, setSelectedCauses, cause)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cause}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 2: Preferred Regions */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Preferred Locations in Hong Kong</h2>
              <p className="text-xs text-slate-500">Where are you willing to participate?</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {options?.regions.map((region) => {
              const selected = selectedRegions.includes(region)
              return (
                <button
                  type="button"
                  key={region}
                  onClick={() => toggleItem(selectedRegions, setSelectedRegions, region)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {region}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 3: Target Demographics */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">3. Target Demographics & Beneficiaries</h2>
              <p className="text-xs text-slate-500">Who would you like to serve or support?</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {options?.target_populations.map((pop) => {
              const selected = selectedPopulations.includes(pop)
              return (
                <button
                  type="button"
                  key={pop}
                  onClick={() => toggleItem(selectedPopulations, setSelectedPopulations, pop)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pop}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 4: Skills & Languages */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">4. Your Languages & Skills</h2>
              <p className="text-xs text-slate-500">Help us filter events with language or skill prerequisites</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {options?.skills.map((skill) => {
              const selected = selectedSkills.includes(skill)
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleItem(selectedSkills, setSelectedSkills, skill)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {skill}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 5: Maximum Time Commitment */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">5. Maximum Time Commitment per Event</h2>
              <p className="text-xs text-slate-500">Used as a constraint filter (events longer than this can be flagged or deprioritized)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1.0, 2.0, 3.0, 4.0, 6.0].map((hours) => (
              <button
                type="button"
                key={hours}
                onClick={() => setMaxDuration(hours)}
                className={`py-3 px-4 rounded-xl border text-center transition-all cursor-pointer ${
                  maxDuration === hours
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="text-base sm:text-lg">{hours}h</div>
                <div className="text-[11px] text-slate-500 font-normal">
                  {hours <= 2 ? 'Short' : hours <= 4 ? 'Standard' : 'Half-day+'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 6: Bio & Motivation */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">6. Bio & Motivation (Free Text)</h2>
              <p className="text-xs text-slate-500">
                A brief description of your background or goals. This text is embedded directly by Sentence-Transformers and LLM rerankers!
              </p>
            </div>
          </div>

          <div className="mt-4">
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. University student passionate about youth mentoring and animal shelters. Available on weekends."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
          >
            Skip for now
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>Save Preferences & Explore</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
