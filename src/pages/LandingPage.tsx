import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bot, Sparkles, Brain, BarChart3, Shield, Zap,
  ArrowRight, CheckCircle, Star, Users, Briefcase, TrendingUp
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'

const features = [
  {
    icon: Brain,
    title: 'Semantic Intelligence',
    desc: 'LLM-powered job decomposition understands nuanced requirements and infers hidden expectations beyond keywords.',
    color: '#6366f1',
  },
  {
    icon: Sparkles,
    title: 'Hidden Gem Discovery',
    desc: 'Uncover underrated candidates with transferable skills and extraordinary potential that conventional ATS systems miss.',
    color: '#8b5cf6',
  },
  {
    icon: BarChart3,
    title: 'Multi-Dimensional Ranking',
    desc: '9-axis scoring with XGBoost ensemble models — technical fit, leadership, learning velocity, behavioral signals and more.',
    color: '#06b6d4',
  },
  {
    icon: Bot,
    title: 'AI Recruiter Copilot',
    desc: 'Conversational AI assistant for natural language queries, ranking refinement, and candidate deep-dives.',
    color: '#10b981',
  },
  {
    icon: Shield,
    title: 'Bias Detection & Ethics',
    desc: 'Real-time fairness auditing with demographic neutrality scoring and explainable decision trails.',
    color: '#f59e0b',
  },
  {
    icon: Zap,
    title: 'Real-Time Pipeline',
    desc: 'Rank 1000+ candidates in under 2 minutes with async Celery workers, Redis caching, and vector search.',
    color: '#ef4444',
  },
]

const stats = [
  { value: '1000+', label: 'Candidates ranked in <2min', icon: Users },
  { value: '9-Axis', label: 'Multi-dimensional scoring', icon: Star },
  { value: '94%', label: 'Prediction accuracy', icon: TrendingUp },
  { value: '0 bias', label: 'Fairness-first AI', icon: Shield },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export function LandingPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleDemo = () => {
    // Auto-login with demo credentials
    login(
      { id: 'demo-user', name: 'Alex Recruiter', email: 'demo@hiremind.ai', role: 'recruiter', company: 'Acme Corp' },
      'demo-jwt-token'
    )
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="bg-orb-1" />
        <div className="bg-orb-2" />
        <div className="bg-orb-3" />
      </div>

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">HireMind AI</span>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-ghost text-sm">Sign In</button>
            </SignInButton>
            <button onClick={handleDemo} className="btn-primary text-sm">
              Try Demo <ArrowRight className="w-4 h-4" />
            </button>
          </SignedOut>
          <SignedIn>
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-indigo-500/20 hover:border-indigo-500/50 transition-colors"
                }
              }}
            />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-20 px-6 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="badge-brand text-xs px-3 py-1 mb-4 inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Autonomous AI Talent Intelligence
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-7xl font-extrabold leading-[1.05] mb-6"
          >
            Hire with{' '}
            <span className="gradient-text text-glow-brand">AI Intelligence</span>
            <br />not keyword filters
          </motion.h1>

          <motion.p variants={fadeUp} className="text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            HireMind AI understands candidates at a semantic level — their trajectory, potential, behavioral signals, and cultural fit. Ranked, explained, and ready in minutes.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <SignedOut>
              <button
                onClick={handleDemo}
                className="btn-primary text-base px-8 py-3.5 glow-brand"
                id="landing-demo-btn"
              >
                <Zap className="w-5 h-5" />
                Launch Demo Platform
              </button>
              <SignUpButton mode="modal">
                <button
                  className="btn-secondary text-base px-8 py-3.5"
                  id="landing-signup-btn"
                >
                  Get Started Free
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-base px-8 py-3.5 glow-brand"
                id="landing-dashboard-btn"
              >
                <Zap className="w-5 h-5" />
                Go to Dashboard
              </button>
            </SignedIn>
          </motion.div>

          {/* Trust signals */}
          <motion.div variants={fadeUp} className="mt-10 flex items-center justify-center gap-6 text-sm text-muted">
            {['No credit card required', 'GDPR compliant', 'SOC 2 ready'].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {s}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 max-w-5xl mx-auto relative"
        >
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: 'rgba(99,102,241,0.2)',
              boxShadow: '0 40px 100px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.1)',
            }}
          >
            {/* Fake dashboard preview */}
            <div className="h-10 glass flex items-center gap-2 px-4 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-muted font-mono">hiremind.ai/dashboard</span>
            </div>
            <div className="bg-[#0f0f1a] p-6 grid grid-cols-4 gap-4">
              {/* Mini stat cards */}
              {[
                { label: 'Candidates Ranked', value: '247', color: '#6366f1' },
                { label: 'Avg Fit Score', value: '74%', color: '#10b981' },
                { label: 'Hidden Gems', value: '8', color: '#8b5cf6' },
                { label: 'Time to Rank', value: '1.2h', color: '#06b6d4' },
              ].map((item) => (
                <div key={item.label} className="glass-sm rounded-xl p-4">
                  <p className="text-[11px] text-muted mb-1">{item.label}</p>
                  <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}

              {/* Candidate list preview */}
              <div className="col-span-3 glass-sm rounded-xl p-4">
                <p className="text-xs font-semibold text-muted mb-3">TOP RANKED CANDIDATES</p>
                {[
                  { name: 'Aria Chen', score: 94, rank: 1, badge: 'gold' },
                  { name: 'Sofia Martinez', score: 87, rank: 2, badge: 'silver' },
                  { name: 'Marcus Rivera', score: 89, rank: 3, badge: 'bronze' },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className={`rank-badge ${c.badge}`}>#{c.rank}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">{c.name}</p>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">{c.score}%</div>
                  </div>
                ))}
              </div>

              {/* AI insight preview */}
              <div className="glass-sm rounded-xl p-4">
                <p className="text-[11px] font-semibold text-muted mb-2">AI INSIGHT</p>
                <div className="ai-thinking mb-2">
                  <span /><span /><span />
                  <span className="text-[10px] text-brand-400 ml-1">Analyzing...</span>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed">
                  "Priya Nair is a hidden gem — Physics PhD with 0.99 learning velocity..."
                </p>
              </div>
            </div>
          </div>

          {/* Glow under card */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-brand-600/20 blur-3xl rounded-full" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card text-center"
            >
              <stat.icon className="w-6 h-6 text-brand-400 mx-auto mb-3" />
              <p className="text-2xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-bold mb-4">
              Beyond Applicant Tracking.{' '}
              <span className="gradient-text">True Intelligence.</span>
            </h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto">
              HireMind combines semantic AI, behavioral signals, and explainable ML to give you an unfair advantage in talent acquisition.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={stagger}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="glass-card group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${f.color}20`, border: `1px solid ${f.color}30` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-card"
          style={{ borderColor: 'rgba(99,102,241,0.25)', boxShadow: '0 0 60px rgba(99,102,241,0.1)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-6 shadow-brand">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to transform your hiring?</h2>
          <p className="text-secondary mb-8">
            Join forward-thinking recruiters using AI to find better talent, faster.
          </p>
          <div className="flex items-center justify-center gap-4">
            <SignedOut>
              <button onClick={handleDemo} className="btn-primary text-base px-8 py-3 glow-brand" id="landing-cta-demo-btn">
                <Zap className="w-5 h-5" />
                Start Demo Now
              </button>
              <SignUpButton mode="modal">
                <button className="btn-secondary text-base px-8 py-3" id="landing-cta-signup-btn">
                  <Briefcase className="w-5 h-5" />
                  Create Account
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-base px-8 py-3 glow-brand" id="landing-cta-dashboard-btn">
                <Zap className="w-5 h-5" />
                Go to Dashboard
              </button>
            </SignedIn>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t text-center" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <p className="text-muted text-sm">
          © 2026 HireMind AI — Autonomous Talent Intelligence Platform
        </p>
      </footer>
    </div>
  )
}
