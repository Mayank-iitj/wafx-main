import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function formatScoreNumber(score: number): number {
  return Math.round(score * 100)
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return '#10b981' // emerald
  if (score >= 0.6) return '#6366f1' // brand
  if (score >= 0.4) return '#f59e0b' // amber
  return '#ef4444' // red
}

export function getScoreLabel(score: number): string {
  if (score >= 0.85) return 'Excellent'
  if (score >= 0.70) return 'Strong'
  if (score >= 0.55) return 'Good'
  if (score >= 0.40) return 'Fair'
  return 'Weak'
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 0.80) return 'badge-emerald'
  if (score >= 0.60) return 'badge-brand'
  if (score >= 0.40) return 'badge-amber'
  return 'badge-red'
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'default'
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Simulate typing delay for AI streamed responses */
export async function* streamText(text: string, delay = 20) {
  for (const char of text) {
    yield char
    await sleep(delay)
  }
}
