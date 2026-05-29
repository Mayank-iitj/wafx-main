import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, FileJson, Table, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { mockJobs } from '../data/mockData'

export function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null)

  const generate = async (type: string) => {
    setGenerating(type)
    await new Promise((r) => setTimeout(r, 2000))
    setGenerating(null)
    toast.success(`${type} report generated and ready for download!`)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-400" />
          Reports & Exports
        </h2>
        <p className="text-sm text-muted">Generate PDF reports, CSV exports, and data dumps</p>
      </div>

      <div className="space-y-4">
        {[
          {
            id: 'pdf-full',
            title: 'Full Ranking Report',
            desc: 'Complete PDF with all candidate scores, AI explanations, radar charts, and recommendations',
            icon: FileText,
            format: 'PDF',
            color: '#ef4444',
            badge: 'Most Popular',
          },
          {
            id: 'csv-rankings',
            title: 'Rankings CSV Export',
            desc: 'Spreadsheet of all candidates with scoring dimensions for data analysis',
            icon: Table,
            format: 'CSV',
            color: '#10b981',
            badge: null,
          },
          {
            id: 'pdf-bias',
            title: 'Bias Audit Report',
            desc: 'GDPR-ready fairness report with demographic neutrality metrics and certifications',
            icon: FileText,
            format: 'PDF',
            color: '#6366f1',
            badge: 'GDPR Ready',
          },
          {
            id: 'json-data',
            title: 'Full Data Export',
            desc: 'Complete JSON export of all candidate profiles, embeddings metadata, and ranking details',
            icon: FileJson,
            format: 'JSON',
            color: '#f59e0b',
            badge: null,
          },
        ].map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${report.color}15`, border: `1px solid ${report.color}25` }}
            >
              <report.icon className="w-5 h-5" style={{ color: report.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium text-primary">{report.title}</p>
                {report.badge && <span className="badge-brand text-[10px]">{report.badge}</span>}
              </div>
              <p className="text-xs text-secondary">{report.desc}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="badge text-[10px] font-mono" style={{ background: `${report.color}15`, color: report.color, border: `1px solid ${report.color}20` }}>
                .{report.format.toLowerCase()}
              </span>
              <button
                onClick={() => generate(report.title)}
                disabled={generating === report.title}
                className="btn-secondary text-xs"
                id={`report-generate-${report.id}`}
              >
                {generating === report.title ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Generate</>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Job-specific report */}
      <div className="glass-card">
        <h3 className="font-semibold text-primary mb-3">Report by Job</h3>
        <div className="flex items-center gap-3">
          <select className="input flex-1 h-9 text-sm" id="reports-job-select">
            {mockJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <button
            onClick={() => generate('Job-specific Report')}
            disabled={!!generating}
            className="btn-primary text-sm"
            id="reports-job-generate-btn"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>
    </div>
  )
}
