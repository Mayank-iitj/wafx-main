import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, ChevronDown, ChevronUp, Copy, Download } from 'lucide-react'
import { mockCandidates, mockInterviewQuestions } from '../data/mockData'
import toast from 'react-hot-toast'

const diffColor: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
}

function QuestionCard({
  question, difficulty, focus, i,
}: {
  question: string; difficulty: string; focus: string; i: number
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="glass-sm rounded-xl p-4"
    >
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ background: `${diffColor[difficulty]}20`, color: diffColor[difficulty], border: `1px solid ${diffColor[difficulty]}30` }}
        >
          {i + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="badge text-[9px]"
              style={{ background: `${diffColor[difficulty]}15`, color: diffColor[difficulty], border: `1px solid ${diffColor[difficulty]}20` }}
            >
              {difficulty.toUpperCase()}
            </span>
            <span className="badge-brand text-[9px]">{focus}</span>
          </div>
          <p className="text-sm text-primary">{question}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            className="btn-ghost p-1"
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(question); toast.success('Copied!') }}
            id={`copy-q-${i}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </div>
      </div>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pl-9 text-xs text-muted"
        >
          <p className="mb-2 font-medium text-secondary">What to look for:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Depth of technical knowledge and real-world application</li>
            <li>Problem-solving methodology and thought process clarity</li>
            <li>Ability to communicate complex concepts simply</li>
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}

export function InterviewKitPage() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<'technical' | 'behavioral' | 'weakness'>('technical')

  const candidate = mockCandidates.find((c) => c.id === candidateId) ?? mockCandidates[0]
  const { technical, behavioral, weakness_probing } = mockInterviewQuestions

  const sections = {
    technical: { label: 'Technical', questions: technical },
    behavioral: { label: 'Behavioral', questions: behavioral },
    weakness: { label: 'Gap Probing', questions: weakness_probing },
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2" id="interview-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-primary">Interview Kit</h2>
          <p className="text-sm text-muted">AI-generated for {candidate.name}</p>
        </div>
        <button className="btn-secondary text-sm" id="interview-export-btn">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Candidate context */}
      <div
        className="glass-card"
        style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.04) 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            {candidate.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-primary">{candidate.name}</p>
            <p className="text-sm text-muted">{candidate.title} · {candidate.education}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted mb-1">Overall Fit</p>
            <p className="text-xl font-bold text-brand-400">{Math.round(candidate.scores.overall_fit * 100)}%</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <p className="text-xs font-semibold text-brand-400 flex items-center gap-2 mb-1">
            <Brain className="w-3.5 h-3.5" /> AI Recommendation
          </p>
          <p className="text-xs text-secondary">{candidate.ai_explanation.summary}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-2">
        {Object.entries(sections).map(([key, { label, questions }]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as typeof activeSection)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeSection === key
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-muted hover:text-secondary hover:bg-white/5'
            }`}
            id={`interview-section-${key}`}
          >
            {label}
            <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              {questions.length}
            </span>
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {sections[activeSection].questions.map((q, i) => (
          <QuestionCard key={i} {...q} i={i} />
        ))}
      </div>
    </div>
  )
}
