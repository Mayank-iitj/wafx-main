import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Star, Brain, GitBranch, MessageSquare,
  BookmarkPlus, FileText, Activity, TrendingUp, AlertTriangle,
  CheckCircle, Target, ChevronDown, ChevronUp, Award
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area
} from 'recharts'
import { mockCandidates } from '../../data/mockData'
import { getScoreColor, formatScoreNumber, getScoreLabel } from '../../lib/utils'


function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>
        {formatScoreNumber(value)}
      </span>
    </div>
  )
}

const scoreLabels: Record<string, string> = {
  technical_fit: 'Technical Fit',
  domain_expertise: 'Domain Expertise',
  leadership: 'Leadership',
  learning_velocity: 'Learning Velocity',
  behavioral_signals: 'Behavioral Signals',
  cultural_alignment: 'Cultural Alignment',
  communication: 'Communication',
  stability: 'Stability',
  adaptability: 'Adaptability',
}

export function CandidateProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [explanationOpen, setExplanationOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'career'>('overview')

  const candidate = mockCandidates.find((c) => c.id === id) ?? mockCandidates[0]
  const { scores, behavioral, career_trajectory, ai_explanation, skills, missing_skills } = candidate

  const radarData = Object.entries(scoreLabels).map(([key, label]) => ({
    subject: label.split(' ')[0],
    value: Math.round((scores[key as keyof typeof scores] as number) * 100),
    fullMark: 100,
  }))

  const careerChartData = career_trajectory.map((t) => ({
    year: t.year,
    growth: Math.round(t.growth * 100),
    company: t.company,
  }))

  const behaviorData = [
    { metric: 'Momentum', value: behavioral.momentum_score * 100 },
    { metric: 'Curiosity', value: behavioral.curiosity_score * 100 },
    { metric: 'Engagement', value: behavioral.engagement_score * 100 },
    { metric: 'Innovation', value: behavioral.innovation_score * 100 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/candidates')} className="btn-ghost p-2" id="candidate-profile-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${getScoreColor(scores.overall_fit)}, #6366f1)` }}
          >
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-primary">{candidate.name}</h2>
              {candidate.is_hidden_gem && (
                <span className="badge-purple text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Hidden Gem
                </span>
              )}
              {candidate.bookmarked && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
            </div>
            <p className="text-sm text-secondary">{candidate.title} · {candidate.current_company}</p>
            <p className="text-xs text-muted">{candidate.education} · {candidate.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2 border border-white/10" id="candidate-bookmark-btn">
            <BookmarkPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/interview/${candidate.id}`)}
            className="btn-secondary text-sm"
            id="candidate-interview-btn"
          >
            <FileText className="w-4 h-4" /> Interview Kit
          </button>
        </div>
      </div>

      {/* Overall score hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ background: `linear-gradient(135deg, ${getScoreColor(scores.overall_fit)}0d 0%, rgba(99,102,241,0.05) 100%)`, borderColor: `${getScoreColor(scores.overall_fit)}30` }}
      >
        <div className="flex items-center gap-8">
          {/* Big score */}
          <div className="text-center">
            <p
              className="text-6xl font-extrabold"
              style={{ color: getScoreColor(scores.overall_fit) }}
            >
              {formatScoreNumber(scores.overall_fit)}
            </p>
            <p className="text-xs text-muted mt-1">Overall Fit Score</p>
            <p className="text-sm font-semibold mt-1" style={{ color: getScoreColor(scores.overall_fit) }}>
              {getScoreLabel(scores.overall_fit)}
            </p>
          </div>

          {/* Quick scores */}
          <div className="flex-1 grid grid-cols-3 gap-4">
            {[
              { label: 'Confidence', val: scores.confidence, icon: Award },
              { label: 'Interview Prob.', val: scores.interview_probability, icon: MessageSquare },
              { label: 'Future Potential', val: scores.future_potential, icon: TrendingUp },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: getScoreColor(val) }} />
                <p className="text-xl font-bold" style={{ color: getScoreColor(val) }}>{formatScoreNumber(val)}%</p>
                <p className="text-[10px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {['overview', 'behavioral', 'career'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-muted hover:text-secondary hover:bg-white/5'
            }`}
            id={`candidate-tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Score bars */}
          <div className="col-span-2 space-y-5">
            <div className="glass-card">
              <h3 className="font-semibold text-primary mb-4">Scoring Dimensions</h3>
              <div className="space-y-3">
                {Object.entries(scoreLabels).map(([key, label]) => {
                  const val = scores[key as keyof typeof scores] as number
                  return <ScoreBar key={key} label={label} value={val} color={getScoreColor(val)} />
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="glass-card">
              <h3 className="font-semibold text-primary mb-3">Skills Profile</h3>
              <div className="mb-3">
                <p className="text-xs text-muted mb-2">Present Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => <span key={s} className="badge-emerald text-xs">{s}</span>)}
                </div>
              </div>
              {missing_skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missing_skills.map((s) => <span key={s} className="badge-red text-xs">{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* AI Explanation */}
            <div
              className="glass-card"
              style={{ borderColor: 'rgba(99,102,241,0.25)' }}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExplanationOpen(!explanationOpen)}
              >
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-400" />
                  AI Explainability Report
                </h3>
                {explanationOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
              </div>

              {explanationOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 space-y-4"
                >
                  <p className="text-sm text-secondary leading-relaxed italic">"{ai_explanation.summary}"</p>

                  <div className="divider" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Strengths
                      </p>
                      <ul className="space-y-1.5">
                        {ai_explanation.strengths.map((s) => (
                          <li key={s} className="text-xs text-secondary flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
                      </p>
                      <ul className="space-y-1.5">
                        {ai_explanation.weaknesses.map((s) => (
                          <li key={s} className="text-xs text-secondary flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
                    <p className="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Interview Focus Areas
                    </p>
                    <ul className="space-y-1.5">
                      {ai_explanation.interview_focus.map((s) => (
                        <li key={s} className="text-xs text-secondary flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0 mt-1.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: radar + quick info */}
          <div className="space-y-5">
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-primary mb-3">Competency Radar</h3>
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(99,102,241,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name="Score" dataKey="value" stroke={getScoreColor(scores.overall_fit)} fill={getScoreColor(scores.overall_fit)} fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card space-y-3">
              <h3 className="text-sm font-semibold text-primary">Quick Profile</h3>
              {[
                { label: 'Experience', value: `${candidate.years_exp} years` },
                { label: 'Location', value: candidate.location },
                { label: 'Education', value: candidate.education.split(' — ')[0] },
                { label: 'Current Role', value: candidate.title },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium text-primary text-right text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'behavioral' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-400" /> Behavioral Signal Scores
            </h3>
            <div className="space-y-3">
              {behaviorData.map(({ metric, value }) => (
                <ScoreBar
                  key={metric}
                  label={metric}
                  value={value / 100}
                  color={getScoreColor(value / 100)}
                />
              ))}
            </div>
            <div className="divider my-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted text-xs mb-1">GitHub Commits/mo</p>
                <p className="font-bold text-primary">{behavioral.github_commits_monthly}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">OSS Contributions</p>
                <p className="font-bold text-primary">{behavioral.open_source_contributions}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">StackOverflow Rep</p>
                <p className="font-bold text-primary">{behavioral.stackoverflow_rep.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Kaggle Rank</p>
                <p className="font-bold text-primary">{behavioral.kaggle_rank ?? 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Activity Timeline
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={[
                { month: 'Jan', commits: 89, oss: 2 },
                { month: 'Feb', commits: 112, oss: 4 },
                { month: 'Mar', commits: 98, oss: 3 },
                { month: 'Apr', commits: 145, oss: 5 },
                { month: 'May', commits: 178, oss: 7 },
                { month: 'Jun', commits: behavioral.github_commits_monthly, oss: behavioral.open_source_contributions },
              ]}>
                <defs>
                  <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
                <Area type="monotone" dataKey="commits" stroke="#6366f1" fill="url(#commitGrad)" strokeWidth={2} name="Commits" />
                <Line type="monotone" dataKey="oss" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="OSS PRs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'career' && (
        <div className="glass-card">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Career Trajectory
          </h3>
          <div className="space-y-4 mb-6">
            {career_trajectory.map((t, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${getScoreColor(t.growth)}20`, border: `2px solid ${getScoreColor(t.growth)}40`, color: getScoreColor(t.growth) }}
                  >
                    {t.year.toString().slice(2)}
                  </div>
                  {i < career_trajectory.length - 1 && <div className="w-px h-6 mt-1" style={{ background: 'rgba(99,102,241,0.2)' }} />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-primary">{t.role}</p>
                  <p className="text-sm text-muted">{t.company} · {t.year}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 max-w-xs h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${t.growth * 100}%`, background: `linear-gradient(90deg, ${getScoreColor(t.growth)}, ${getScoreColor(t.growth)}88)` }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: getScoreColor(t.growth) }}>
                      {Math.round(t.growth * 100)}% growth
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={careerChartData}>
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
              <Line type="monotone" dataKey="growth" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} name="Growth %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
