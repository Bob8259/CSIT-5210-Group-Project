import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, PreferenceForm } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (emailOrId: string) => Promise<User>
  logout: () => void
  updatePreferences: (prefs: PreferenceForm) => Promise<User>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'volunteer_recsys_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Load user from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as User
        setUser(parsed)
        // Refresh silently from backend
        fetch(`/api/users/${parsed.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((latest) => {
            if (latest) {
              setUser(latest)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(latest))
            }
          })
          .catch(() => {})
      }
    } catch (e) {
      console.error('Failed to parse cached user:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (emailOrId: string): Promise<User> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_or_id: emailOrId.trim() }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Sign in failed. Please check your Email or User ID.')
    }

    const userData: User = await res.json()
    setUser(userData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    return userData
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const updatePreferences = async (prefs: PreferenceForm): Promise<User> => {
    if (!user) throw new Error('Not logged in')

    const res = await fetch(`/api/users/${user.id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to save preferences.')
    }

    const updatedUser: User = await res.json()
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
    return updatedUser
  }

  const refreshUser = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}`)
      if (res.ok) {
        const latest = await res.json()
        setUser(latest)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latest))
      }
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePreferences, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
