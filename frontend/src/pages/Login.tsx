import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'
import { LogIn, Sparkles, UserCheck, AlertCircle, ArrowRight } from 'lucide-react'

export default function Login() {
  const [emailOrId, setEmailOrId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testUsers, setTestUsers] = useState<User[]>([])
  const [fetchingUsers, setFetchingUsers] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Fetch test users for quick login buttons
  useEffect(() => {
    setFetchingUsers(true)
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: User[]) => setTestUsers(data))
      .catch((err) => console.error('Failed to load test users:', err))
      .finally(() => setFetchingUsers(false))
  }, [])

  const handleSignIn = async (identifier: string) => {
    setError(null)
    setIsSubmitting(true)
    try {
      const loggedUser = await login(identifier)
      // Check if preferences are already set
      if (!loggedUser.has_preferences) {
        navigate('/onboarding')
      } else {
        navigate('/')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!emailOrId.trim()) {
      setError('Please enter your email or User ID.')
      return
    }
    handleSignIn(emailOrId)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-4 shadow-sm">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Your Account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your university email or select a pre-configured test account to simulate cold-start recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Direct Input Form */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Direct Sign In</h2>
          <p className="text-xs text-slate-500 mb-6">Type user ID or email</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email or User ID
              </label>
              <input
                id="identifier"
                type="text"
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="e.g. user1@connect.ust.hk or user_1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 text-center">
            New test accounts without preferences will automatically be routed to the{' '}
            <span className="font-semibold text-indigo-600">Onboarding Questionnaire</span>.
          </div>
        </div>

        {/* Right: Quick Test Users Selection Grid */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quick Test Accounts</h2>
              <p className="text-xs text-slate-500">Click any persona to log in instantly</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              10 Accounts Ready
            </span>
          </div>

          {fetchingUsers ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading test users...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {testUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSignIn(u.email)}
                  disabled={isSubmitting}
                  className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-sm text-slate-800 group-hover:text-indigo-600">
                      {u.name}
                    </span>
                    {u.has_preferences ? (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 flex items-center">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Configured
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                        No Prefs
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 truncate">{u.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
