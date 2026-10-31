import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Sparkles, Home as HomeIcon, Info, LogIn, LogOut, Sliders, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Cold-Start Volunteer RecSys
            </h1>
            <p className="text-xs text-slate-500">CSIT5210 Group 1 Course Project</p>
          </div>
        </Link>

        {/* Links & Auth State */}
        <div className="flex items-center space-x-3">
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink to="/" end className={navLinkClass}>
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>

            <NavLink to="/recommendations" className={navLinkClass}>
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Recommendations</span>
            </NavLink>

            <NavLink to="/about" className={navLinkClass}>
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </NavLink>
          </nav>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {user ? (
            <div className="flex items-center space-x-2">
              {/* Preferences link */}
              <Link
                to="/onboarding"
                title="Edit cold-start preferences"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Preferences</span>
                {!user.has_preferences && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Preferences not set" />
                )}
              </Link>

              {/* User Identity Pill */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-xs sm:text-sm font-medium">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">{user.name}</span>
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-1.5 px-3.5 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
