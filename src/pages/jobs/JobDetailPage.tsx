import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Brain, Zap, Users, Calendar, AlertCircle,
  CheckCircle, Lightbulb, Target, GitBranch, ChevronDown, ChevronUp
} from 'lucide-react'
import { mockJobs } from '../../data/mockData'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

export function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [insightExpanded, setInsightExpanded] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const job = mockJobs.find((j) => j.id === id) ?? mockJobs[0]

  const complexityData = [
    { subject: 'Technical Depth', value: job.complexity_score * 100 },
    { subject: 'Leadership', value: job.ai_analysis.leadership_expected ? 78 : 35 },
    { subject: 'Domain Expertise', value: 82 },
    { subject: 'Communication', value: 70 },
    { subject: 'Innovation', value: 75 },
    { subject: 'Ambiguity Tolerance', value: job.ai_analysis.culture.includes('Startup') ? 90 : 55 },
  ]

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/jobs')} className="btn-ghost p-2" id="job-detail-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-primary">{job.title}</h2>
          <p className="text-sm text-muted">{job.location} · {job.type} · {job.department}</p>
        </div>
        <button
          onClick={() => navigate(`/rankings/${job.id}`)}
          className="btn-primary"
          id="job-detail-rankings-btn"
        >
          <Users className="w-4 h-4" />
          View Rankings
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: JD details */}
        <div className="col-span-2 space-y-5">
          {/* Description */}
          <div className="glass-card">
            <h3 className="font-semibold text-primary mb-3">Job Description</h3>
            <p className="text-sm text-secondary leading-relaxed">{job.description}</p>
          </div>

          {/* AI Intelligence Panel */}
          <div
            className="glass-card"
            style={{ borderColor: 'rgba(99,102,241,0.25)', boxShadow: '0 0 30px rgba(99,102,241,0.08)' }}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setInsightExpanded(!insightExpanded)}
            >
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-400" />
                AI Intelligence Analysis
                <span className="badge-brand text-[10px]">AUTO-GENERATED</span>
              </h3>
              {insightExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
            </div>

            {insightExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-4"
              >
                {/* Key signals */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Inferred Signals</p>
                  <div className="grid grid-cols-2 gap-2">
                    {job.ai_analysis.inferred_signals.map((s) => (
                      <div key={s} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* Skill ontology */}
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Skill Ontology</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Core', skills: job.ai_analysis.skill_ontology.core, color: 'badge-brand' },
                      { label: 'Adjacent', skills: job.ai_analysis.skill_ontology.adjacent, color: 'badge-accent' },
                      { label: 'Transferable', skills: job.ai_analysis.skill_ontology.transferable, color: 'badge-purple' },
                    ].map(({ label, skills, color }) => (
                      <div key={label}>
                        <p className="text-[11px] font-medium text-muted mb-2">{label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <span key={s} className={`${color} text-[10px]`}>{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* Ideal profile */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-brand-400" />
                    <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Ideal Candidate Profile</p>
                  </div>
                  <p className="text-sm text-secondary">{job.ai_analysis.ideal_profile}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Required skills */}
          <div className="glass-card">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills_required.map((s) => (
                <span key={s} className="badge-brand text-xs">{s}</span>
              ))}
            </div>
            <h4 className="text-sm font-medium text-muted mb-2">Preferred</h4>
            <div className="flex flex-wrap gap-2">
              {job.skills_preferred.map((s) => (
                <span key={s} className="badge-accent text-xs">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: metadata + radar */}
        <div className="space-y-5">
          {/* Job meta */}
          <div className="glass-card space-y-3">
            {[
              { label: 'Domain', value: job.ai_analysis.domain },
              { label: 'Culture', value: job.ai_analysis.culture },
              { label: 'Urgency', value: job.ai_analysis.urgency_level },
              { label: 'Seniority', value: job.seniority },
              { label: 'Deadline', value: new Date(job.deadline).toLocaleDateString() },
              { label: 'Fit Threshold', value: `≥ ${Math.round(job.fit_threshold * 100)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-primary text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Role complexity radar */}
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent-400" />
              Role Complexity Radar
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={complexityData}>
                <PolarGrid stroke="rgba(99,102,241,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar
                  name="Complexity"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,15,26,0.95)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick actions */}
          <div className="glass-card space-y-2">
            <h3 className="text-sm font-semibold text-primary mb-3">Quick Actions</h3>
            <button className="btn-secondary w-full text-sm" id="job-upload-btn" onClick={() => navigate('/upload')}>
              <Zap className="w-4 h-4" /> Upload Resumes
            </button>
            <button className="btn-ghost w-full text-sm border border-white/10" id="job-copilot-btn" onClick={() => navigate('/copilot')}>
              <Brain className="w-4 h-4" /> Ask AI Copilot
            </button>
            <button className="btn-ghost w-full text-sm border border-white/10" id="job-gems-btn" onClick={() => navigate('/hidden-gems')}>
              <AlertCircle className="w-4 h-4" /> View Hidden Gems
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
