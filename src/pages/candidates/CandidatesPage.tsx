import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, SlidersHorizontal, Sparkles, Eye, BookmarkPlus,
  GitCompare, ChevronRight, Star
} from 'lucide-react'
import { mockCandidates } from '../../data/mockData'
import { getScoreColor, formatScoreNumber, getScoreLabel } from '../../lib/utils'

export function CandidatesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'fit' | 'potential' | 'momentum'>('fit')
  const [gemsOnly, setGemsOnly] = useState(false)

  const sorted = [...mockCandidates]
    .filter(
      (c) =>
        (!gemsOnly || c.is_hidden_gem) &&
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'fit') return b.scores.overall_fit - a.scores.overall_fit
      if (sortBy === 'potential') return b.scores.future_potential - a.scores.future_potential
      return b.behavioral.momentum_score - a.behavioral.momentum_score
    })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Candidates</h2>
          <p className="text-sm text-muted mt-0.5">{mockCandidates.length} total · {mockCandidates.filter((c) => c.is_hidden_gem).length} hidden gems</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGemsOnly(!gemsOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              gemsOnly ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-muted border border-white/10 hover:bg-white/5'
            }`}
            id="candidates-gems-filter"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Hidden Gems
          </button>
          <button onClick={() => navigate('/compare')} className="btn-secondary text-xs" id="candidates-compare-btn">
            <GitCompare className="w-3.5 h-3.5" />
            Compare
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9"
            id="candidates-search"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted" />
          <span className="text-muted">Sort:</span>
          {[
            { key: 'fit', label: 'Fit Score' },
            { key: 'potential', label: 'Potential' },
            { key: 'momentum', label: 'Momentum' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as typeof sortBy)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                sortBy === key
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-muted hover:text-secondary hover:bg-white/5'
              }`}
              id={`candidates-sort-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card cursor-pointer group"
            onClick={() => navigate(`/candidates/${c.id}`)}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`rank-badge flex-shrink-0 ${
                c.rank === 1 ? 'gold' : c.rank === 2 ? 'silver' : c.rank === 3 ? 'bronze' : 'default'
              }`}>
                #{c.rank}
              </div>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${getScoreColor(c.scores.overall_fit)}, #6366f1)`,
                }}
              >
                {c.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-primary group-hover:text-brand-300 transition-colors">
                    {c.name}
                  </h3>
                  {c.is_hidden_gem && (
                    <span className="badge-purple text-[10px] flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Hidden Gem
                    </span>
                  )}
                  {c.bookmarked && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                </div>
                <p className="text-sm text-secondary">{c.title} · {c.current_company}</p>
                <p className="text-xs text-muted mt-0.5">{c.education}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.skills.slice(0, 5).map((s) => (
                    <span key={s} className="badge-brand text-[10px]">{s}</span>
                  ))}
                  {c.skills.length > 5 && (
                    <span className="text-[10px] text-muted">+{c.skills.length - 5}</span>
                  )}
                </div>
              </div>

              {/* Scores */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Mini score bars */}
                <div className="hidden lg:flex flex-col gap-1 w-28">
                  {[
                    { label: 'Technical', val: c.scores.technical_fit },
                    { label: 'Leadership', val: c.scores.leadership },
                    { label: 'Momentum', val: c.behavioral.momentum_score },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted w-16">{label}</span>
                      <div className="flex-1 h-1 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${val * 100}%`, background: getScoreColor(val) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall score */}
                <div className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(c.scores.overall_fit) }}
                  >
                    {formatScoreNumber(c.scores.overall_fit)}
                  </p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: getScoreColor(c.scores.overall_fit) }}>
                    {getScoreLabel(c.scores.overall_fit)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5">
                  <button
                    className="btn-ghost p-1.5"
                    onClick={(e) => { e.stopPropagation(); navigate(`/candidates/${c.id}`) }}
                    title="View Profile"
                    id={`candidate-view-${c.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-ghost p-1.5"
                    onClick={(e) => e.stopPropagation()}
                    title="Bookmark"
                    id={`candidate-bookmark-${c.id}`}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                </div>

                <ChevronRight className="w-4 h-4 text-muted group-hover:text-brand-400 transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
