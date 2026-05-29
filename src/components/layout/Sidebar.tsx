import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, Users, Upload, Bot, BarChart3,
  GitBranch, Shield, Sparkles, SlidersHorizontal, FileText,
  Bell, ChevronLeft, ChevronRight, LogOut, Settings, Trophy,
  GitCompare, UserCheck
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

const navGroups = [
  {
    label: 'Core',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/jobs', icon: Briefcase, label: 'Jobs' },
      { to: '/candidates', icon: Users, label: 'Candidates' },
      { to: '/upload', icon: Upload, label: 'Upload Resumes' },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { to: '/copilot', icon: Bot, label: 'AI Copilot' },
      { to: '/hidden-gems', icon: Sparkles, label: 'Hidden Gems' },
      { to: '/graph', icon: GitBranch, label: 'Knowledge Graph' },
      { to: '/bias-audit', icon: Shield, label: 'Bias Audit' },
    ],
  },
  {
    label: 'Workflows',
    items: [
      { to: '/rankings/all', icon: Trophy, label: 'Rankings' },
      { to: '/compare', icon: GitCompare, label: 'Compare' },
      { to: '/team-fit', icon: UserCheck, label: 'Team Fit' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/reports', icon: FileText, label: 'Reports' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-[100] flex flex-col glass border-r border-white/5"
      style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-brand-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-bold text-base gradient-text">HireMind</span>
              <span className="text-[10px] text-muted block -mt-0.5 font-mono">AI v2.0</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggleSidebar}
          className={cn(
            'ml-auto p-1.5 rounded-lg transition-all duration-200 text-muted hover:text-primary hover:bg-white/5',
            sidebarCollapsed && 'ml-0'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!sidebarCollapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'sidebar-item mx-2 mb-0.5',
                    isActive && 'active',
                    sidebarCollapsed && 'justify-center px-2'
                  )
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
            {!sidebarCollapsed && group.label !== 'Insights' && (
              <div className="divider mx-4 mt-3" />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom: User + Settings */}
      <div className="border-t p-3 space-y-1" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('sidebar-item', isActive && 'active', sidebarCollapsed && 'justify-center px-2')
          }
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>

        <button
          onClick={handleLogout}
          className={cn('sidebar-item w-full text-left', sidebarCollapsed && 'justify-center px-2')}
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-red-400" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-400"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User avatar */}
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name?.charAt(0) ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{user.name}</p>
              <p className="text-[11px] text-muted capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
