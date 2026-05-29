import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Cpu } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { JobsPage } from './pages/jobs/JobsPage'
import { JobDetailPage } from './pages/jobs/JobDetailPage'
import { CreateJobPage } from './pages/jobs/CreateJobPage'
import { CandidatesPage } from './pages/candidates/CandidatesPage'
import { CandidateProfilePage } from './pages/candidates/CandidateProfilePage'
import { RankingsPage } from './pages/RankingsPage'
import { UploadPage } from './pages/UploadPage'
import { CopilotPage } from './pages/CopilotPage'
import { InterviewKitPage } from './pages/InterviewKitPage'
import { TeamFitPage } from './pages/TeamFitPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage'
import { BiasAuditPage } from './pages/BiasAuditPage'
import { HiddenGemsPage } from './pages/HiddenGemsPage'
import { ComparePage } from './pages/ComparePage'
import { SettingsPage } from './pages/SettingsPage'
import { ReportsPage } from './pages/ReportsPage'
import { NotificationsPage } from './pages/NotificationsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { isLoaded: clerkLoaded, userId, getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('welcome-screen-seen')
  })
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing HireMind Neural Engine...')

  // Clerk Auth state synchronizer
  useEffect(() => {
    if (!clerkLoaded) return

    if (userId && clerkUser) {
      getToken().then((token) => {
        login({
          id: userId,
          name: clerkUser.fullName || clerkUser.username || 'Recruiter User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: 'recruiter',
          avatar: clerkUser.imageUrl,
        }, token || 'clerk-token')
      })
    } else {
      logout()
    }
  }, [clerkLoaded, userId, clerkUser, login, logout, getToken])

  // Welcome screen timeline
  useEffect(() => {
    if (!showWelcome) return

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        const increment = Math.floor(Math.random() * 8) + 5
        return Math.min(prev + increment, 100)
      })
    }, 120)

    const t1 = setTimeout(() => setLoadingText('Connecting to Groq LPU cluster...'), 700)
    const t2 = setTimeout(() => setLoadingText('Loading candidate scoring models...'), 1400)
    const t3 = setTimeout(() => setLoadingText('Calibrating neural matching algorithms...'), 2100)

    const finishTimer = setTimeout(() => {
      setShowWelcome(false)
      sessionStorage.setItem('welcome-screen-seen', 'true')
    }, 2800)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(finishTimer)
    }
  }, [showWelcome])

  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome && (
          <motion.div
            key="welcome-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30, transition: { duration: 0.5, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f] text-white select-none overflow-hidden"
          >
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse pointer-events-none" />

            <div className="relative flex flex-col items-center max-w-sm w-full px-6 text-center z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                className="relative mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 border border-white/20 rounded-2xl animate-spin" style={{ animationDuration: '8s' }} />
                  <Brain className="w-10 h-10 text-white relative z-10" />
                </div>
                <div className="absolute -inset-2 bg-indigo-500/20 rounded-3xl blur-xl animate-pulse pointer-events-none" />
              </motion.div>

              <motion.h1
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="text-3xl font-black tracking-tight mb-2 gradient-text"
              >
                HIREMIND AI
              </motion.h1>

              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-xs text-muted font-mono uppercase tracking-[0.2em] mb-10"
              >
                Autonomous Recruitment Intelligence
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="w-full space-y-3"
              >
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#6366f1] via-[#06b6d4] to-[#6366f1] rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-muted px-1">
                  <span>{loadingText}</span>
                  <span className="text-brand-400 font-bold">{progress}%</span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-muted"
            >
              <Cpu className="w-3.5 h-3.5 text-accent-500" /> POWERED BY GROQ LPU
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} />

        {/* Protected app routes */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route path="candidates/:id" element={<CandidateProfilePage />} />
          <Route path="rankings/:jobId" element={<RankingsPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="copilot" element={<CopilotPage />} />
          <Route path="interview/:candidateId" element={<InterviewKitPage />} />
          <Route path="team-fit" element={<TeamFitPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="graph" element={<KnowledgeGraphPage />} />
          <Route path="bias-audit" element={<BiasAuditPage />} />
          <Route path="hidden-gems" element={<HiddenGemsPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
