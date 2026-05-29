import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitCompare, Plus, X, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockCandidates } from '../data/mockData'
import { getScoreColor, formatScoreNumber } from '../lib/utils'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

const SCORE_KEYS = [
  ['technical_fit', 'Technical Fit'],
  ['domain_expertise', 'Domain Expertise'],
  ['leadership', 'Leadership'],
  ['learning_velocity', 'Learning Velocity'],
  ['behavioral_signals', 'Behavioral Signals'],
  ['cultural_alignment', 'Cultural Alignment'],
  ['communication', 'Communication'],
  ['stability', 'Stability'],
  ['adaptability', 'Adaptability'],
] as const

const COLORS = ['#6366f1', '#10b981', '#f59e0b']

export function ComparePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([mockCandidates[0].id, mockCandidates[1].id])

  const candidates = selected.map((id) => mockCandidates.find((c) => c.id === id)!).filter(Boolean)

  const radarData = SCORE_KEYS.map(([key, label]) => {
    const row: Record<string, string | number> = { subject: label.split(' ')[0] }
    candidates.forEach((c) => {
      row[c.name.split(' ')[0]] = Math.round((c.scores[key] as number) * 100)
    })
    return row
  })

  const addCandidate = (id: string) => {
    if (selected.length < 3 && !selected.includes(id)) {
      setSelected([...selected, id])
    }
  }

  const removeCandidate = (id: string) => {
    setSelected(selected.filter((s) => s !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-brand-400" />
          Candidate Comparison
        </h2>
        <p className="text-sm text-muted">Side-by-side analysis of up to 3 candidates</p>
      </div>

      {/* Candidate selectors */}
      <div className="flex items-center gap-3">
        {selected.map((id, i) => {
          const c = mockCandidates.find((c) => c.id === id)!
          return (
            <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl glass-sm border border-brand-500/20">
              <div className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center"
                style={{ background: COLORS[i] }}>
                {c.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-primary">{c.name}</span>
              <button onClick={() => removeCandidate(id)} className="text-muted hover:text-red-400 transition-colors ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {selected.length < 3 && (
          <select
            className="input h-9 text-sm w-48"
            onChange={(e) => addCandidate(e.target.value)}
            value=""
            id="compare-add-select"
          >
            <option value="">+ Add candidate</option>
            {mockCandidates.filter((c) => !selected.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Radar comparison */}
      <div className="glass-card">
        <h3 className="font-semibold text-primary mb-4">Competency Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(99,102,241,0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
            {candidates.map((c, i) => (
              <Radar
                key={c.id}
                name={c.name.split(' ')[0]}
                dataKey={c.name.split(' ')[0]}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score grid */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-muted text-xs font-medium uppercase tracking-wider w-40">Dimension</th>
              {candidates.map((c, i) => (
                <th key={c.id} className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: COLORS[i] }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-primary">{c.name.split(' ')[0]}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[['overall_fit', 'Overall Fit'], ...SCORE_KEYS].map(([key, label]) => {
              const vals = candidates.map((c) => (c.scores[key as keyof typeof c.scores] as number) ?? 0)
              const max = Math.max(...vals)
              return (
                <tr key={key} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4 text-muted text-xs">{label}</td>
                  {candidates.map((c, i) => {
                    const val = (c.scores[key as keyof typeof c.scores] as number) ?? 0
                    const isWinner = val === max && vals.filter((v) => v === max).length === 1
                    return (
                      <td key={c.id} className="py-3 px-4 text-center">
                        <span
                          className={`font-bold text-sm ${isWinner ? 'text-white' : ''}`}
                          style={{ color: isWinner ? getScoreColor(val) : '#94a3b8' }}
                        >
                          {formatScoreNumber(val)}%
                          {isWinner && ' ↑'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Quick profile links */}
      <div className="flex gap-3">
        {candidates.map((c, i) => (
          <button
            key={c.id}
            onClick={() => navigate(`/candidates/${c.id}`)}
            className="btn-ghost text-xs border border-white/10 flex-1"
            id={`compare-view-${c.id}`}
          >
            <Eye className="w-3.5 h-3.5" />
            View {c.name.split(' ')[0]}'s Profile
          </button>
        ))}
      </div>
    </div>
  )
}
