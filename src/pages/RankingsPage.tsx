import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Trophy, Sparkles, Eye, GitCompare, SlidersHorizontal,
  ChevronDown, Brain, RefreshCw
} from 'lucide-react'
import { mockCandidates, mockJobs } from '../data/mockData'
import { getScoreColor, formatScoreNumber, getScoreLabel } from '../lib/utils'
import { useState } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

export function RankingsPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [reranking, setReranking] = useState(false)
  const [weights, setWeights] = useState({
    technical: 40,
    leadership: 20,
    behavioral: 20,
    cultural: 20,
  })

  const job = mockJobs.find((j) => j.id === jobId) ?? mockJobs[0]
  const candidates = mockCandidates.sort((a, b) => b.scores.overall_fit - a.scores.overall_fit)

  const handleRerank = async () => {
    setReranking(true)
    await new Promise((r) => setTimeout(r, 2000))
    setReranking(false)
  }

  const radarData = (c: typeof candidates[0]) => [
    { subject: 'Technical', value: Math.round(c.scores.technical_fit * 100) },
    { subject: 'Domain', value: Math.round(c.scores.domain_expertise * 100) },
    { subject: 'Leadership', value: Math.round(c.scores.leadership * 100) },
    { subject: 'Behavioral', value: Math.round(c.scores.behavioral_signals * 100) },
    { subject: 'Cultural', value: Math.round(c.scores.cultural_alignment * 100) },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">AI Rankings</h2>
          <p className="text-sm text-muted">{job.title} · {candidates.length} candidates ranked</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRerank}
            disabled={reranking}
            className="btn-secondary text-sm"
            id="rankings-rerank-btn"
          >
            {reranking ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Reranking…</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Rerank</>
            )}
          </button>
          <button onClick={() => navigate('/compare')} className="btn-primary text-sm" id="rankings-compare-btn">
            <GitCompare className="w-4 h-4" /> Compare
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {/* Weight customization */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-400" />
            Ranking Weights
          </h3>
          <div className="space-y-4">
            {Object.entries(weights).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted capitalize">{key}</span>
                  <span className="text-brand-400 font-medium">{val}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => setWeights((w) => ({ ...w, [key]: +e.target.value }))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#6366f1' }}
                  id={`weight-${key}`}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleRerank}
            disabled={reranking}
            className="btn-secondary w-full text-xs mt-4"
          >
            Apply Weights
          </button>
        </div>

        {/* Rankings list */}
        <div className="col-span-3 space-y-3">
          {candidates.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card"
            >
              <div className="flex items-center gap-4">
                <div className={`rank-badge flex-shrink-0 text-base ${
                  i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'
                }`}>
                  #{i + 1}
                </div>

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${getScoreColor(c.scores.overall_fit)}, #6366f1)` }}
                >
                  {c.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-primary">{c.name}</p>
                    {c.is_hidden_gem && (
                      <span className="badge-purple text-[10px] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Gem
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{c.title} · {c.current_company}</p>
                </div>

                {/* Mini radar */}
                <div className="hidden xl:block">
                  <ResponsiveContainer width={90} height={70}>
                    <RadarChart data={radarData(c)}>
                      <PolarGrid stroke="rgba(99,102,241,0.15)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 7 }} />
                      <Radar dataKey="value" stroke={getScoreColor(c.scores.overall_fit)} fill={getScoreColor(c.scores.overall_fit)} fillOpacity={0.2} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Score breakdown */}
                <div className="flex gap-3 text-center">
                  {[
                    { label: 'Tech', val: c.scores.technical_fit },
                    { label: 'Lead', val: c.scores.leadership },
                    { label: 'Momentum', val: c.behavioral.momentum_score },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-xs font-bold" style={{ color: getScoreColor(val) }}>
                        {formatScoreNumber(val)}
                      </p>
                      <p className="text-[10px] text-muted">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Overall */}
                <div className="text-center ml-2">
                  <p className="text-2xl font-extrabold" style={{ color: getScoreColor(c.scores.overall_fit) }}>
                    {formatScoreNumber(c.scores.overall_fit)}
                  </p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: getScoreColor(c.scores.overall_fit) }}>
                    {getScoreLabel(c.scores.overall_fit)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    className="btn-ghost p-1.5"
                    onClick={() => navigate(`/candidates/${c.id}`)}
                    id={`ranking-view-${c.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-ghost p-1.5"
                    onClick={() => navigate(`/interview/${c.id}`)}
                    id={`ranking-interview-${c.id}`}
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
