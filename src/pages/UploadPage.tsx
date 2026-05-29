import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle, Loader2, X, Zap,
  AlertCircle, File, CloudUpload
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UploadedFile {
  id: string
  name: string
  size: number
  status: 'queued' | 'parsing' | 'embedding' | 'done' | 'error'
  progress: number
  score?: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const PIPELINE_STEPS = ['Parsing PDF', 'Extracting sections', 'Generating embeddings', 'Scoring candidate', 'Ranking update']

export function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [processing, setProcessing] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      status: 'queued',
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    toast.success(`${accepted.length} file(s) added to queue`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: true,
  })

  const processFiles = async () => {
    if (files.length === 0) { toast.error('No files to process'); return }
    setProcessing(true)

    for (const file of files) {
      if (file.status === 'done') continue

      // Simulate pipeline
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: 'parsing', progress: 10 } : f))
      await new Promise((r) => setTimeout(r, 400))

      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, progress: 40 } : f))
      await new Promise((r) => setTimeout(r, 500))

      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: 'embedding', progress: 70 } : f))
      await new Promise((r) => setTimeout(r, 600))

      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, progress: 90 } : f))
      await new Promise((r) => setTimeout(r, 400))

      const score = Math.floor(Math.random() * 35) + 55
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: 'done', progress: 100, score } : f))
    }

    setProcessing(false)
    toast.success('All resumes processed and ranked!')
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const doneCount = files.filter((f) => f.status === 'done').length
  const totalProgress = files.length > 0 ? Math.round((doneCount / files.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-primary">Upload Resumes</h2>
        <p className="text-sm text-muted mt-0.5">Bulk upload PDFs or DOCX — AI will parse, embed, and rank automatically</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
        id="resume-dropzone"
      >
        <input {...getInputProps()} id="resume-file-input" />
        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <CloudUpload className={`w-8 h-8 ${isDragActive ? 'text-brand-400' : 'text-muted'}`} />
          </div>
          {isDragActive ? (
            <p className="text-brand-400 font-medium">Drop your resumes here!</p>
          ) : (
            <>
              <p className="font-medium text-primary">Drag & drop resumes here</p>
              <p className="text-sm text-muted">or click to browse · PDF, DOCX supported</p>
              <p className="text-xs text-muted">Up to 100 files at once</p>
            </>
          )}
        </motion.div>
      </div>

      {/* AI Pipeline steps info */}
      <div className="glass-sm rounded-xl p-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">AI Processing Pipeline</p>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs glass-sm border border-brand-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                {step}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="text-muted">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Files list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary">{files.length} file(s) queued</h3>
              {doneCount === files.length && files.length > 0 && (
                <span className="badge-emerald text-xs">All processed!</span>
              )}
            </div>

            {/* Overall progress */}
            {processing && (
              <div>
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Overall Progress</span>
                  <span>{totalProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <motion.div
                    animate={{ width: `${totalProgress}%` }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }}
                  />
                </div>
              </div>
            )}

            {/* Individual files */}
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
                >
                  <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                      {file.status === 'done' && file.score && (
                        <span className="text-xs font-bold text-emerald-400 flex-shrink-0">{file.score}%</span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{formatBytes(file.size)}</p>
                    {(file.status === 'parsing' || file.status === 'embedding') && (
                      <div className="mt-1.5 h-1 rounded-full bg-white/5">
                        <motion.div
                          animate={{ width: `${file.progress}%` }}
                          className="h-full rounded-full bg-brand-500"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === 'queued' && <div className="w-2 h-2 rounded-full bg-muted" />}
                    {(file.status === 'parsing' || file.status === 'embedding') && (
                      <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                    )}
                    {file.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                    {file.status === 'queued' && (
                      <button onClick={() => removeFile(file.id)} className="btn-ghost p-1" id={`remove-file-${file.id}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={processFiles}
              disabled={processing || doneCount === files.length}
              className="btn-primary w-full py-3 justify-center"
              id="upload-process-btn"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing {doneCount}/{files.length} resumes…
                </>
              ) : doneCount === files.length && files.length > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  All Processed — View Rankings
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start AI Processing ({files.length} files)
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
