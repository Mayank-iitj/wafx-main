/**
 * HireMind AI — Typed API Service Layer
 * Full CRUD + AI endpoints wired to FastAPI backend.
 * Falls back to mock data if backend is unavailable.
 */
import apiClient from './apiClient'
import {
  mockJobs,
  mockCandidates,
  mockAnalytics,
  mockNotifications,
} from '../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_URL

// ── Type Definitions ────────────────────────────────────────────────────────

export interface Job {
  id: string
  title: string
  description: string
  department: string
  location: string
  type: string
  seniority: string
  status: string
  urgency: string
  candidates_count: number
  ranked_count: number
  created_at: string
  deadline?: string
  complexity_score: number
  fit_threshold: number
  skills_required: string[]
  skills_preferred: string[]
  soft_skills?: string[]
  ai_analysis: Record<string, unknown>
}

export interface Candidate {
  id: string
  name: string
  title: string
  email: string
  location: string
  years_exp: number
  education: string
  current_company: string
  job_id: string
  rank: number
  is_hidden_gem: boolean
  bookmarked: boolean
  applied_at: string
  scores: CandidateScores
  skills: string[]
  missing_skills: string[]
  behavioral: BehavioralSignals
  career_trajectory: CareerEntry[]
  ai_explanation: AiExplanation
}

export interface CandidateScores {
  overall_fit: number
  technical_fit: number
  domain_expertise: number
  leadership: number
  learning_velocity: number
  behavioral_signals: number
  cultural_alignment: number
  communication: number
  stability: number
  adaptability: number
  confidence: number
  interview_probability: number
  success_prediction: number
  hidden_gem_score: number
  future_potential: number
}

export interface BehavioralSignals {
  github_commits_monthly: number
  open_source_contributions: number
  kaggle_rank: string | null
  stackoverflow_rep: number
  momentum_score: number
  curiosity_score: number
  engagement_score: number
  innovation_score: number
}

export interface CareerEntry {
  year: number
  role: string
  company: string
  growth: number
}

export interface AiExplanation {
  summary: string
  strengths: string[]
  weaknesses: string[]
  risk_factors: string[]
  interview_focus: string[]
}

export interface RankingWeights {
  technical_fit: number
  domain_expertise: number
  leadership: number
  learning_velocity: number
  behavioral_signals: number
  cultural_alignment: number
}

export interface AnalyticsDashboard {
  pipeline_summary: {
    total_candidates: number
    ranked: number
    shortlisted: number
    interviewed: number
    offers_extended: number
    hired: number
  }
  avg_fit_score: number
  hidden_gems_found: number
  diversity_score: number
  time_to_rank: number
  score_distribution: { range: string; count: number }[]
  weekly_activity: { day: string; applications: number; rankings: number }[]
}

// ── Jobs API ────────────────────────────────────────────────────────────────

export const jobsApi = {
  list: async (status?: string): Promise<Job[]> => {
    if (USE_MOCK) {
      return status ? mockJobs.filter((j) => j.status === status) : mockJobs
    }
    const res = await apiClient.get('/jobs', { params: { status } })
    return res.data
  },

  get: async (id: string): Promise<Job> => {
    if (USE_MOCK) {
      return mockJobs.find((j) => j.id === id) ?? mockJobs[0]
    }
    const res = await apiClient.get(`/jobs/${id}`)
    return res.data
  },

  create: async (data: Partial<Job>): Promise<Job> => {
    if (USE_MOCK) {
      const newJob: Job = {
        ...mockJobs[0],
        ...data,
        id: `job-${Date.now()}`,
        created_at: new Date().toISOString(),
        candidates_count: 0,
        ranked_count: 0,
      } as Job
      return newJob
    }
    const res = await apiClient.post('/jobs', data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    if (!USE_MOCK) await apiClient.delete(`/jobs/${id}`)
  },

  getIntelligence: async (id: string): Promise<Record<string, unknown>> => {
    if (USE_MOCK) {
      const job = mockJobs.find((j) => j.id === id)
      return job?.ai_analysis ?? {}
    }
    const res = await apiClient.get(`/jobs/${id}/intelligence`)
    return res.data.intelligence
  },
}

// ── Candidates API ──────────────────────────────────────────────────────────

export const candidatesApi = {
  list: async (params?: {
    job_id?: string
    sort_by?: string
    gems_only?: boolean
  }): Promise<Candidate[]> => {
    if (USE_MOCK) {
      let result = [...mockCandidates]
      if (params?.job_id) result = result.filter((c) => c.job_id === params.job_id)
      if (params?.gems_only) result = result.filter((c) => c.is_hidden_gem)
      if (params?.sort_by === 'fit') result.sort((a, b) => b.scores.overall_fit - a.scores.overall_fit)
      if (params?.sort_by === 'potential') result.sort((a, b) => b.scores.future_potential - a.scores.future_potential)
      return result
    }
    const res = await apiClient.get('/candidates', { params })
    return res.data
  },

  get: async (id: string): Promise<Candidate> => {
    if (USE_MOCK) {
      return mockCandidates.find((c) => c.id === id) ?? mockCandidates[0]
    }
    const res = await apiClient.get(`/candidates/${id}`)
    return res.data
  },

  getProfile: async (id: string): Promise<Candidate> => {
    if (USE_MOCK) {
      return mockCandidates.find((c) => c.id === id) ?? mockCandidates[0]
    }
    const res = await apiClient.get(`/candidates/${id}/profile`)
    return res.data
  },

  getInterviewKit: async (id: string) => {
    if (USE_MOCK) {
      return {
        technical: [
          { question: 'Design a RAG pipeline with sub-200ms latency at 10M+ chunks.', difficulty: 'hard', focus: 'System Design' },
          { question: 'Explain DPO vs PPO vs RLHF for LLM alignment tradeoffs.', difficulty: 'hard', focus: 'LLM Fundamentals' },
          { question: 'How would you reduce hallucination rate from 8% to <2%?', difficulty: 'hard', focus: 'ML Debugging' },
        ],
        behavioral: [
          { question: 'Tell me about a time you pushed back on a flawed product decision.', difficulty: 'medium', focus: 'Ownership' },
          { question: 'Describe handling a production ML incident with incorrect predictions.', difficulty: 'medium', focus: 'Crisis Management' },
        ],
        weakness_probing: [
          { question: 'You have primarily worked in research — how will you adapt to shipping weekly?', difficulty: 'medium', focus: 'Adaptability Gap' },
        ],
      }
    }
    const res = await apiClient.get(`/candidates/${id}/interview-kit`)
    return res.data
  },
}

// ── Rankings API ────────────────────────────────────────────────────────────

export const rankingsApi = {
  getRankings: async (jobId: string, weights?: Partial<RankingWeights>) => {
    if (USE_MOCK) {
      return {
        job_id: jobId,
        total_candidates: mockCandidates.length,
        rankings: mockCandidates
          .sort((a, b) => a.rank - b.rank)
          .map((c, i) => ({
            rank: i + 1,
            candidate_id: c.id,
            candidate_name: c.name,
            overall_fit: c.scores.overall_fit,
            scores: c.scores,
            is_hidden_gem: c.is_hidden_gem,
          })),
      }
    }
    const res = await apiClient.get(`/rankings/${jobId}`, { params: weights })
    return res.data
  },

  getHiddenGems: async (jobId: string) => {
    if (USE_MOCK) {
      const gems = mockCandidates.filter((c) => c.is_hidden_gem || c.scores.hidden_gem_score > 0.7)
      return {
        job_id: jobId,
        gems_count: gems.length,
        hidden_gems: gems.map((c) => ({
          candidate_id: c.id,
          name: c.name,
          hidden_gem_score: c.scores.hidden_gem_score,
          future_potential: c.scores.future_potential,
          learning_velocity: c.scores.learning_velocity,
          ai_insight: c.ai_explanation.summary,
        })),
      }
    }
    const res = await apiClient.get(`/rankings/${jobId}/hidden-gems`)
    return res.data
  },
}

// ── Analytics API ───────────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboard: async (): Promise<AnalyticsDashboard> => {
    if (USE_MOCK) {
      return {
        pipeline_summary: mockAnalytics.pipeline_summary,
        avg_fit_score: mockAnalytics.avg_fit_score,
        hidden_gems_found: mockAnalytics.hidden_gems_found,
        diversity_score: mockAnalytics.diversity_score,
        time_to_rank: mockAnalytics.time_to_rank,
        score_distribution: mockAnalytics.score_distribution.map((d) => ({
          range: d.range,
          count: d.count,
        })),
        weekly_activity: mockAnalytics.weekly_activity,
      }
    }
    const res = await apiClient.get('/analytics/dashboard')
    return res.data
  },

  getBiasAudit: async (jobId?: string) => {
    if (USE_MOCK) {
      return {
        overall_fairness_score: 0.94,
        dimensions: [
          { dimension: 'Gender Neutrality', score: 0.96, status: 'pass' },
          { dimension: 'Education Bias', score: 0.89, status: 'pass' },
          { dimension: 'Experience Bias', score: 0.84, status: 'warning' },
          { dimension: 'Geographic Bias', score: 0.93, status: 'pass' },
          { dimension: 'Name/Ethnicity Bias', score: 0.97, status: 'pass' },
          { dimension: 'Age Proxy Signals', score: 0.91, status: 'pass' },
        ],
        gdpr_compliant: true,
        warnings: 1,
        failures: 0,
      }
    }
    const res = await apiClient.get('/analytics/bias-audit', { params: { job_id: jobId } })
    return res.data
  },
}

// ── Upload API ──────────────────────────────────────────────────────────────

export const uploadApi = {
  uploadResumes: async (files: File[], jobId?: string) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    if (jobId) formData.append('job_id', jobId)

    if (USE_MOCK) {
      return {
        uploaded: files.length,
        errors: 0,
        files: files.map((f, i) => ({
          id: `upload-${i}`,
          filename: f.name,
          size: f.size,
          status: 'queued',
          message: 'Queued for AI processing',
        })),
      }
    }

    const res = await apiClient.post('/upload/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}

// ── Reports API ─────────────────────────────────────────────────────────────

export const reportsApi = {
  export: async (params: { job_id?: string; format: string }) => {
    if (USE_MOCK) {
      return {
        status: 'generated',
        format: params.format,
        download_url: `/reports/download/report.${params.format}`,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        file_size_kb: 245,
      }
    }
    const res = await apiClient.post('/reports/export', params)
    return res.data
  },
}

// ── Notifications (local) ───────────────────────────────────────────────────

export const notificationsApi = {
  list: async () => mockNotifications,
  markRead: async (_id: string) => {},
}
