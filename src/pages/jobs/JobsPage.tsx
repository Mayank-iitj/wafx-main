import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Briefcase, Users, Calendar, Zap, ChevronRight, Filter
} from 'lucide-react'
import { mockJobs } from '../../data/mockData'
import { formatDate } from '../../lib/utils'
import { useState } from 'react'

export function JobsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')

  const filtered = mockJobs.filter(
    (j) =>
      (filter === 'all' || j.status === filter) &&
      j.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Job Listings</h2>
          <p className="text-sm text-muted mt-0.5">{mockJobs.length} jobs · {mockJobs.filter((j) => j.status === 'active').length} active</p>
        </div>
        <button onClick={() => navigate('/jobs/new')} className="btn-primary" id="jobs-create-btn">
          <Plus className="w-4 h-4" /> Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9"
            id="jobs-search"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'paused'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-muted hover:text-secondary hover:bg-white/5'
              }`}
              id={`jobs-filter-${f}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="glass-card cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-brand-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-primary group-hover:text-brand-300 transition-colors">
                    {job.title}
                  </h3>
                  <span className={`badge text-[10px] ${
                    job.urgency === 'high' ? 'badge-red' :
                    job.urgency === 'medium' ? 'badge-amber' : 'badge-emerald'
                  }`}>
                    {job.urgency} priority
                  </span>
                  <span className={`badge text-[10px] ${job.status === 'active' ? 'badge-emerald' : 'badge-amber'}`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-sm text-secondary mb-3 leading-relaxed line-clamp-2">{job.description}</p>

                <div className="flex items-center flex-wrap gap-2 mb-3">
                  {job.skills_required.slice(0, 5).map((s) => (
                    <span key={s} className="badge-brand text-[10px]">{s}</span>
                  ))}
                  {job.skills_required.length > 5 && (
                    <span className="text-[10px] text-muted">+{job.skills_required.length - 5} more</span>
                  )}
                </div>

                <div className="flex items-center gap-6 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {job.candidates_count} candidates
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-brand-400" />
                    {job.ranked_count} ranked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline: {formatDate(job.deadline)}
                  </span>
                  <span className="font-medium">
                    Complexity: {Math.round(job.complexity_score * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/rankings/${job.id}`) }}
                  className="btn-secondary text-xs py-1.5"
                  id={`job-rankings-${job.id}`}
                >
                  Rankings
                </button>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-brand-400 transition-colors" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(job.ranked_count / job.candidates_count) * 100}%` }}
                  transition={{ delay: i * 0.08 + 0.3, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }}
                />
              </div>
              <span className="text-xs text-muted">{Math.round((job.ranked_count / job.candidates_count) * 100)}% processed</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
