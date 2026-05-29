import { motion } from 'framer-motion'
import { UserCheck, Users, Zap, CheckCircle } from 'lucide-react'
import { mockTeamData } from '../data/mockData'
import { getScoreColor, formatScoreNumber } from '../lib/utils'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

export function TeamFitPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-accent-400" />
          Team Fit Analysis
        </h2>
        <p className="text-sm text-muted">Predict collaboration compatibility and complementary skill coverage</p>
      </div>

      {/* Current team */}
      <div className="glass-card">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" /> Current Team
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {mockTeamData.team_members.map((member, i) => (
            <div key={member.name} className="glass-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, #6366f1, #06b6d4)` }}
                >
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-primary text-sm">{member.name}</p>
                  <p className="text-xs text-muted">{member.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {member.strengths.map((s) => (
                  <span key={s} className="badge-accent text-[10px]">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility scores */}
      <div className="space-y-4">
        <h3 className="font-semibold text-primary">Candidate → Team Compatibility</h3>
        {mockTeamData.compatibility_scores.map((comp, i) => (
          <motion.div
            key={comp.candidate}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card"
          >
            <div className="flex items-center gap-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${getScoreColor(comp.score)}, #6366f1)` }}
              >
                {comp.candidate.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-primary">{comp.candidate}</p>
                  <span className="text-xl font-extrabold" style={{ color: getScoreColor(comp.score) }}>
                    {formatScoreNumber(comp.score)}%
                  </span>
                </div>
                <p className="text-xs text-muted mb-2">Gap filled: <span className="text-secondary">{comp.gap_filled}</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {comp.complementary_skills.map((s) => (
                    <span key={s} className="badge-emerald text-[10px]">{s}</span>
                  ))}
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${comp.score * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${getScoreColor(comp.score)}, #6366f1)` }}
                  />
                </div>
              </div>

              <div className="flex-shrink-0">
                <ResponsiveContainer width={90} height={80}>
                  <RadarChart data={[
                    { subject: 'Collab', value: Math.round(comp.score * 95) },
                    { subject: 'Skills', value: Math.round(comp.score * 92) },
                    { subject: 'Comm', value: Math.round(comp.score * 88) },
                    { subject: 'Culture', value: Math.round(comp.score * 90) },
                  ]}>
                    <PolarGrid stroke="rgba(99,102,241,0.15)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
                    <Radar dataKey="value" stroke={getScoreColor(comp.score)} fill={getScoreColor(comp.score)} fillOpacity={0.2} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendation */}
      <div
        className="glass-card"
        style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(99,102,241,0.04) 100%)' }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary mb-1">AI Team Recommendation</p>
            <p className="text-sm text-secondary">
              <strong className="text-emerald-400">Aria Chen</strong> has the highest team compatibility (91%) and would fill the critical gap in production LLM deployment.
              Her RLHF expertise complements Jordan Lee's research background without overlap. Hiring Aria would maximize team innovation diversity while minimizing redundancy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
