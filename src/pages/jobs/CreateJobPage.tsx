import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Brain, Wand2, CheckCircle, Lightbulb, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const SAMPLE_JD = `We're looking for a Senior Machine Learning Engineer to join our GenAI platform team. You'll design and deploy LLM-powered systems at scale, architect multi-agent pipelines, and optimize inference across distributed clusters.

Requirements:
- 5+ years of ML engineering experience
- Strong Python and PyTorch expertise
- Experience with RAG, vector databases, and LLM orchestration
- MLOps experience with Kubernetes and cloud platforms
- Startup experience preferred — we move fast and ship weekly

Nice to have:
- Experience with vLLM, TGI, or similar inference servers
- RLHF or fine-tuning experience
- Rust knowledge for performance-critical components`

const analysisSteps = [
  'Parsing job description…',
  'Extracting required skills…',
  'Inferring hidden expectations…',
  'Detecting seniority level…',
  'Generating skill ontology…',
  'Building semantic embeddings…',
  'Computing role complexity…',
  'Generating AI insights…',
]

export function CreateJobPage() {
  const navigate = useNavigate()
  const [jd, setJd] = useState(SAMPLE_JD)
  const [title, setTitle] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  const handleAnalyze = async () => {
    if (!jd.trim()) { toast.error('Please enter a job description'); return }
    setAnalyzing(true)
    setStep(0)

    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 500))
      setStep(i + 1)
    }
    setDone(true)
    setAnalyzing(false)
    toast.success('Job intelligence generated!')
    setTimeout(() => navigate('/jobs/job-001'), 1000)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/jobs')} className="btn-ghost p-2" id="create-job-back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-primary">Create New Job</h2>
          <p className="text-sm text-muted">AI will decompose your JD and generate intelligence automatically</p>
        </div>
      </div>

      <div className="glass-card space-y-5">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="e.g. Senior ML Engineer — GenAI Platform"
            id="create-job-title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Job Description
            <span className="ml-2 badge-brand text-[10px]">AI will analyze this</span>
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={14}
            className="input resize-none font-mono text-xs leading-relaxed"
            placeholder="Paste your full job description here…"
            id="create-job-description"
          />
          <p className="text-xs text-muted mt-1">{jd.length} characters</p>
        </div>

        {/* Analysis progress */}
        {(analyzing || done) && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" />
              AI Analysis Pipeline
            </p>
            <div className="space-y-2">
              {analysisSteps.map((s, i) => (
                <div key={s} className="flex items-center gap-2.5 text-sm">
                  {i < step ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : i === step && analyzing ? (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" />
                  )}
                  <span className={i < step ? 'text-secondary' : i === step ? 'text-primary' : 'text-muted'}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI insight preview (after analysis) */}
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-400">Intelligence Generated</p>
            </div>
            <p className="text-sm text-secondary">
              Detected: Senior ML Engineer role with high startup culture signals. 7 core skills extracted,
              5 adjacent skills inferred. Role complexity: 92%. Ideal candidate profile generated.
            </p>
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || done}
            className="btn-primary flex-1 py-3 justify-center"
            id="create-job-analyze-btn"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing with AI…
              </>
            ) : done ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Analysis Complete
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Analyze with AI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
