import { Link, NavLink } from 'react-router-dom'
import { Sparkles, Home as HomeIcon, Info } from 'lucide-react'

export default function Navbar() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`

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

        {/* Links */}
        <nav className="flex items-center space-x-2">
          <NavLink to="/" end className={navLinkClass}>
            <HomeIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/about" className={navLinkClass}>
            <Info className="w-4 h-4" />
            <span>About Project</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

