import { Routes, Route, NavLink, Link } from 'react-router-dom'
import { Sparkles, Home as HomeIcon, Info } from 'lucide-react'
import Home from './pages/Home'
import About from './pages/About'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Project Title */}
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

          {/* Navigation Links using NavLink (like Vue's router-link) */}
          <nav className="flex items-center space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <HomeIcon className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Info className="w-4 h-4" />
              <span>About Project</span>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Page Routing Views */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}
