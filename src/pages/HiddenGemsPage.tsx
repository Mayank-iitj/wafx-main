import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Zap, Eye, Brain } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockCandidates } from '../data/mockData'
import { getScoreColor, formatScoreNumber } from '../lib/utils'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

export function HiddenGemsPage() {
  const navigate = useNavigate()
  const gems = mockCandidates.filter((c) => c.is_hidden_gem || c.scores.hidden_gem_score > 0.7)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Hidden Gems Discovery
          </h2>
          <p className="text-sm text-muted">Underrated candidates with extraordinary potential detected by AI</p>
        </div>
        <span className="badge-purple">{gems.length} gems found</span>
      </div>

      {/* Info banner */}
      <div
        className="glass-card"
        style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.04) 100%)' }}
      >
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-primary mb-1">How Hidden Gem Detection Works</p>
            <p className="text-sm text-secondary">
              Our AI analyzes learning velocity, behavioral momentum, transferable skill graphs, and potential prediction models.
              Candidates ranked lower on initial fit may score extremely high on future potential — making them high-ROI long-term hires.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {gems.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card"
            style={{ borderColor: 'rgba(139,92,246,0.25)' }}
          >
            <div className="flex items-start gap-5">
              {/* Avatar + gem badge */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-primary text-lg">{c.name}</h3>
                    <p className="text-sm text-secondary">{c.title} · {c.education}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-purple-400">
                        {formatScoreNumber(c.scores.hidden_gem_score)}%
                      </p>
                      <p className="text-[10px] text-muted">Gem Score</p>
                    </div>
                  </div>
                </div>

                {/* Key gem signals */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Learning Velocity', value: c.scores.learning_velocity, icon: Zap },
                    { label: 'Future Potential', value: c.scores.future_potential, icon: TrendingUp },
                    { label: 'Momentum', value: c.behavioral.momentum_score, icon: Sparkles },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
                    >
                      <Icon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-purple-400">{formatScoreNumber(value)}%</p>
                      <p className="text-[10px] text-muted">{label}</p>
                    </div>
                  ))}
                </div>

                {/* AI insight */}
                <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <p className="text-xs text-secondary italic leading-relaxed">
                    "{c.ai_explanation.summary}"
                  </p>
                </div>

                {/* Transferable strengths */}
                <div className="mt-3">
                  <p className="text-xs text-muted mb-2 font-medium">Key Transferable Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.ai_explanation.strengths.slice(0, 3).map((s) => (
                      <span key={s} className="badge-purple text-[10px]">{s.slice(0, 40)}{s.length > 40 ? '…' : ''}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/candidates/${c.id}`)}
                    className="btn-secondary text-xs"
                    id={`gem-view-${c.id}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Profile
                  </button>
                  <button
                    onClick={() => navigate(`/interview/${c.id}`)}
                    className="btn-ghost text-xs border border-white/10"
                    id={`gem-interview-${c.id}`}
                  >
                    <Brain className="w-3.5 h-3.5" /> Interview Kit
                  </button>
                  <span className="text-xs text-muted ml-auto">
                    Current rank: #{c.rank} · With potential: <span className="text-purple-400 font-medium">Top 3 projected</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
