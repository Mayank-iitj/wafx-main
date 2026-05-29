import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users, Briefcase, Trophy, Sparkles, TrendingUp, Clock,
  ArrowRight, Upload, Bot, BarChart3, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { mockAnalytics, mockJobs, mockCandidates } from '../data/mockData'
import { useAuthStore } from '../store/authStore'
import { formatDate, getScoreColor, formatScoreNumber } from '../lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
}

function StatCard({
  title, value, subtitle, icon: Icon, color, onClick, index,
}: {
  title: string; value: string | number; subtitle: string
  icon: React.ElementType; color: string; onClick?: () => void; index: number
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="show"
      variants={fadeUp}
      onClick={onClick}
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-xs text-secondary">{subtitle}</p>
    </motion.div>
  )
}

const COLORS = ['#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b']

export function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { pipeline_summary, weekly_activity, score_distribution, skill_coverage, hiring_funnel } = mockAnalytics

  const topCandidates = mockCandidates.slice(0, 5).sort(
    (a, b) => b.scores.overall_fit - a.scores.overall_fit
  )

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.05) 100%)' }}
      >
        <div>
          <h2 className="text-lg font-semibold text-primary mb-1">
            Good afternoon, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-secondary">
            You have <span className="text-brand-400 font-medium">247 ranked candidates</span> across 3 active jobs.
            8 hidden gems discovered today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/upload')} className="btn-secondary text-sm">
            <Upload className="w-4 h-4" /> Upload Resumes
          </button>
          <button onClick={() => navigate('/copilot')} className="btn-primary text-sm">
            <Bot className="w-4 h-4" /> Ask AI Copilot
          </button>
        </div>
      </motion.div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value={pipeline_summary.total_candidates} subtitle="Across all active jobs" icon={Users} color="#6366f1" index={0} onClick={() => navigate('/candidates')} />
        <StatCard title="Avg Fit Score" value={`${Math.round(mockAnalytics.avg_fit_score * 100)}%`} subtitle="+4% vs last week" icon={TrendingUp} color="#10b981" index={1} />
        <StatCard title="Hidden Gems" value={mockAnalytics.hidden_gems_found} subtitle="Underrated candidates found" icon={Sparkles} color="#8b5cf6" index={2} onClick={() => navigate('/hidden-gems')} />
        <StatCard title="Time to Rank" value={`${mockAnalytics.time_to_rank}h`} subtitle="Average processing time" icon={Clock} color="#06b6d4" index={3} />
      </div>

      {/* Pipeline funnel */}
      <div className="grid grid-cols-5 gap-2">
        {hiring_funnel.map((stage, i) => (
          <motion.div
            key={stage.stage}
            custom={i}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="glass-sm rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text-brand">{stage.value}</p>
            <p className="text-[11px] text-muted mt-1">{stage.stage}</p>
            {i < hiring_funnel.length - 1 && (
              <div className="mt-2 h-1 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(stage.value / hiring_funnel[0].value) * 100}%`,
                    background: `linear-gradient(90deg, #6366f1, #06b6d4)`,
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-2 chart-container"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              Weekly Activity
            </h3>
            <span className="badge-brand text-xs">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekly_activity}>
              <defs>
                <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,15,26,0.95)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="applications" stroke="#6366f1" fill="url(#gradApps)" strokeWidth={2} name="Applications" />
              <Area type="monotone" dataKey="rankings" stroke="#06b6d4" fill="url(#gradRank)" strokeWidth={2} name="Rankings" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Score distribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="chart-container"
        >
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-400" />
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={score_distribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
              >
                {score_distribution.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,15,26,0.95)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {score_distribution.slice(0, 3).map((d, i) => (
              <div key={d.range} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted">{d.range}</span>
                </div>
                <span className="font-medium text-secondary">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top candidates */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Top Candidates
            </h3>
            <button onClick={() => navigate('/rankings/job-001')} className="btn-ghost text-xs">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {topCandidates.map((c, i) => (
              <div
                key={c.id}
                onClick={() => navigate(`/candidates/${c.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>
                  #{i + 1}
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${getScoreColor(c.scores.overall_fit)}, #6366f1)` }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-primary truncate">{c.name}</p>
                    {c.is_hidden_gem && <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted truncate">{c.title}</p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: getScoreColor(c.scores.overall_fit) }}
                  >
                    {formatScoreNumber(c.scores.overall_fit)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active jobs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              Active Jobs
            </h3>
            <button onClick={() => navigate('/jobs')} className="btn-ghost text-xs">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {mockJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-primary leading-tight">{job.title}</p>
                    <p className="text-xs text-muted mt-0.5">{job.location}</p>
                  </div>
                  <span className={`badge text-[10px] ${job.urgency === 'high' ? 'badge-red' : job.urgency === 'medium' ? 'badge-amber' : 'badge-emerald'}`}>
                    {job.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {job.candidates_count} candidates
                  </span>
                  <span>Deadline: {formatDate(job.deadline)}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(job.ranked_count / job.candidates_count) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted mt-1">{job.ranked_count} / {job.candidates_count} ranked</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Skill coverage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="chart-container"
      >
        <h3 className="font-semibold text-primary mb-4">Skill Coverage in Candidate Pool</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={skill_coverage} layout="vertical">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
              formatter={(v) => [`${v}%`, 'Coverage']}
            />
            <Bar dataKey="coverage" fill="url(#barGradient)" radius={[0, 6, 6, 0]}>
              {skill_coverage.map((_, i) => (
                <Cell key={i} fill={COLORS[Math.floor(i * COLORS.length / skill_coverage.length)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
