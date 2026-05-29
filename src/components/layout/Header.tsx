import { useLocation } from 'react-router-dom'
import { Search, Bell, Sun, Moon, Plus } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { UserButton } from '@clerk/clerk-react'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Job Listings',
  '/jobs/new': 'Create New Job',
  '/candidates': 'Candidates',
  '/upload': 'Upload Resumes',
  '/copilot': 'AI Copilot',
  '/hidden-gems': 'Hidden Gems',
  '/graph': 'Knowledge Graph',
  '/bias-audit': 'Bias Audit',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/compare': 'Candidate Comparison',
  '/team-fit': 'Team Fit Analysis',
  '/settings': 'Settings',
}

export function Header() {
  const { theme, toggleTheme } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const pageTitle = routeLabels[location.pathname] || 'HireMind AI'

  return (
    <header
      className="h-16 flex items-center gap-4 px-6 border-b sticky top-0 z-[90]"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(99, 102, 241, 0.1)',
      }}
    >
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-primary">{pageTitle}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search candidates, jobs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 w-64 h-9 text-sm"
          id="global-search"
        />
      </div>

      {/* Quick add job */}
      <button
        onClick={() => navigate('/jobs/new')}
        className="btn-primary h-9 text-xs"
        id="header-new-job-btn"
      >
        <Plus className="w-3.5 h-3.5" />
        New Job
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-muted hover:text-primary transition-colors hover:bg-white/5"
        id="theme-toggle"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg text-muted hover:text-primary transition-colors hover:bg-white/5"
        id="header-notifications-btn"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-surface-800" />
      </button>

      {/* Avatar */}
      <div className="flex items-center justify-center">
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-full border border-indigo-500/20 hover:border-indigo-500/50 transition-colors"
            }
          }}
        />
      </div>
    </header>
  )
}
