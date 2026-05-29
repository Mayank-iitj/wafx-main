import { motion } from 'framer-motion'
import {
  BarChart2, Users, TrendingUp, Zap, Activity, Star, Globe,
  PieChart as PieIcon
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell,
  AreaChart, Area, Legend, ScatterChart, Scatter, CartesianGrid
} from 'recharts'
import { mockAnalytics } from '../data/mockData'

const COLORS = ['#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b']

const diversityData = [
  { category: 'Gender Balance', score: 82, fill: '#6366f1' },
  { category: 'Experience Range', score: 91, fill: '#10b981' },
  { category: 'Education Diversity', score: 76, fill: '#8b5cf6' },
  { category: 'Geographic Spread', score: 88, fill: '#06b6d4' },
]

const trendData = [
  { week: 'W1', applications: 45, ranked: 38, shortlisted: 8 },
  { week: 'W2', applications: 67, ranked: 59, shortlisted: 12 },
  { week: 'W3', applications: 89, ranked: 78, shortlisted: 18 },
  { week: 'W4', applications: 112, ranked: 98, shortlisted: 23 },
  { week: 'W5', applications: 247, ranked: 189, shortlisted: 34 },
]

export function AnalyticsPage() {
  const { pipeline_summary, score_distribution, skill_coverage, weekly_activity, hiring_funnel } = mockAnalytics

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-400" />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-muted">Real-time hiring intelligence and pipeline metrics</p>
        </div>
        <span className="badge-brand text-xs">Live data</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: pipeline_summary.total_candidates, icon: Users, color: '#6366f1' },
          { label: 'Avg Fit Score', value: `${Math.round(mockAnalytics.avg_fit_score * 100)}%`, icon: Star, color: '#10b981' },
          { label: 'Diversity Score', value: `${Math.round(mockAnalytics.diversity_score * 100)}%`, icon: Globe, color: '#8b5cf6' },
          { label: 'Time to Rank', value: `${mockAnalytics.time_to_rank}h`, icon: Zap, color: '#06b6d4' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pipeline trend + funnel */}
      <div className="grid grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Pipeline Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="appGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rankGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Area type="monotone" dataKey="applications" stroke="#6366f1" fill="url(#appGrad2)" strokeWidth={2} name="Applications" />
              <Area type="monotone" dataKey="ranked" stroke="#10b981" fill="url(#rankGrad2)" strokeWidth={2} name="Ranked" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-accent-400" /> Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={score_distribution} layout="vertical">
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="range" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {score_distribution.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-2">
            {score_distribution.map((d, i) => (
              <div key={d.range} className="flex items-center gap-1.5 text-[10px] text-muted">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                {d.range}: {d.count}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diversity + Skill coverage */}
      <div className="grid grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" /> Diversity Analytics
          </h3>
          <div className="space-y-3">
            {diversityData.map((d) => (
              <div key={d.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{d.category}</span>
                  <span className="font-medium" style={{ color: d.fill }}>{d.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: d.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-xs text-emerald-400 font-medium">Overall Fairness Score: 0.94 — No significant bias detected</p>
          </div>
        </div>

        <div className="chart-container">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-400" /> Skill Coverage Heatmap
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={skill_coverage}>
              <XAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} formatter={(v) => [`${v}%`, 'Coverage']} />
              <Bar dataKey="coverage" radius={[6, 6, 0, 0]}>
                {skill_coverage.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.coverage > 70 ? '#10b981' : d.coverage > 50 ? '#6366f1' : d.coverage > 30 ? '#f59e0b' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel visual */}
      <div className="chart-container">
        <h3 className="font-semibold text-primary mb-5">Hiring Funnel</h3>
        <div className="flex items-end justify-center gap-2 h-40">
          {hiring_funnel.map((stage, i) => {
            const maxVal = hiring_funnel[0].value
            const pct = (stage.value / maxVal) * 100
            const width = 100 - i * 12
            return (
              <div key={stage.stage} className="flex flex-col items-center gap-2" style={{ width: `${Math.max(width, 40)}px` }}>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: COLORS[i] }}>{stage.value}</p>
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="w-full rounded-t-lg min-h-[4px]"
                  style={{ background: `linear-gradient(180deg, ${COLORS[i]}, ${COLORS[i]}88)` }}
                />
                <p className="text-[9px] text-muted text-center leading-tight">{stage.stage}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
