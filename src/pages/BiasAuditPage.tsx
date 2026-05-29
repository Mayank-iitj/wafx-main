import { motion } from 'framer-motion'
import { Shield, CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

const biasMetrics = [
  { dimension: 'Gender Neutrality', score: 0.96, status: 'pass', detail: 'No statistically significant gender-based ranking variance detected' },
  { dimension: 'Education Bias', score: 0.89, status: 'pass', detail: 'Non-prestigious institution candidates ranked fairly based on skills' },
  { dimension: 'Experience Length Bias', score: 0.84, status: 'warning', detail: 'Slight correlation between years of experience and ranking — review threshold' },
  { dimension: 'Geographic Bias', score: 0.93, status: 'pass', detail: 'Candidates ranked consistently across 14 countries' },
  { dimension: 'Name/Ethnicity Bias', score: 0.97, status: 'pass', detail: 'Blind ranking mode active — candidate names excluded from AI scoring' },
  { dimension: 'Age Proxy Signals', score: 0.91, status: 'pass', detail: 'No age-related proxy features detected in scoring model' },
]

const radarData = biasMetrics.map((m) => ({
  subject: m.dimension.split(' ')[0],
  value: Math.round(m.score * 100),
}))

export function BiasAuditPage() {
  const overallScore = biasMetrics.reduce((a, b) => a + b.score, 0) / biasMetrics.length
  const warnings = biasMetrics.filter((m) => m.status === 'warning').length
  const passes = biasMetrics.filter((m) => m.status === 'pass').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Bias Detection & Ethical AI Audit
        </h2>
        <p className="text-sm text-muted">Fairness monitoring and demographic neutrality analysis</p>
      </div>

      {/* Overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(99,102,241,0.05) 100%)' }}
      >
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-emerald-400">{Math.round(overallScore * 100)}</p>
            <p className="text-sm text-muted mt-1">Fairness Score</p>
          </div>
          <div className="h-16 w-px bg-white/10" />
          <div className="grid grid-cols-3 gap-6 flex-1">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{passes}</p>
              <p className="text-xs text-muted">Dimensions Passed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{warnings}</p>
              <p className="text-xs text-muted">Warnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-400">0</p>
              <p className="text-xs text-muted">Critical Failures</p>
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] text-emerald-400 text-center font-medium">GDPR<br />Compliant</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Metrics list */}
        <div className="col-span-2 space-y-3">
          {biasMetrics.map((m, i) => (
            <motion.div
              key={m.dimension}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-sm rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                {m.status === 'pass' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-primary text-sm">{m.dimension}</p>
                    <span className={`badge text-[10px] ${m.status === 'pass' ? 'badge-emerald' : 'badge-amber'}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">{m.detail}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.score * 100}%` }}
                        transition={{ delay: i * 0.07 + 0.3, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: m.status === 'pass' ? '#10b981' : '#f59e0b' }}
                      />
                    </div>
                    <span className="text-xs font-bold" style={{ color: m.status === 'pass' ? '#10b981' : '#f59e0b' }}>
                      {Math.round(m.score * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Radar */}
        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-primary mb-3">Fairness Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(16,185,129,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Fairness" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-accent-400" /> How This Works
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Our bias detection runs continuously, monitoring 6 fairness dimensions using statistical analysis.
              Rankings are computed from skill-based embeddings with demographic features explicitly excluded.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
