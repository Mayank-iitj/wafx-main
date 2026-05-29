/**
 * HireMind AI — Copilot Streaming Service
 * Handles SSE streaming from the FastAPI copilot endpoint.
 */
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_URL

import { mockCopilotResponses } from '../data/mockData'
import { sleep } from './utils'

export interface CopilotMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  streaming?: boolean
}

export const copilotApi = {
  /**
   * Send a message and receive a streaming response.
   * Yields characters one at a time via async generator.
   */
  async *streamChat(
    message: string,
    sessionId: string = 'default',
    jobId?: string,
  ): AsyncGenerator<string> {
    if (USE_MOCK) {
      // Pick the most contextually relevant mock response
      const msg = message.toLowerCase()
      let response = mockCopilotResponses[0]
      if (msg.includes('gem') || msg.includes('hidden')) response = mockCopilotResponses[1]
      else if (msg.includes('startup') || msg.includes('fast')) response = mockCopilotResponses[2]
      else if (msg.includes('gen') || msg.includes('llm') || msg.includes('transition')) response = mockCopilotResponses[3]

      for (const char of response) {
        yield char
        await sleep(12)
      }
      return
    }

    const token = useAuthStore.getState().token
    const response = await fetch(`${API_URL}/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        job_id: jobId,
        stream: true,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Copilot error: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          yield data
        }
      }
    }
  },

  async getSuggestions(): Promise<string[]> {
    if (USE_MOCK) {
      return [
        'Why is Aria Chen ranked #1?',
        'Find startup-minded engineers',
        'Show hidden gem candidates',
        'Who can transition into GenAI?',
        'Which candidates have RLHF experience?',
        'Compare top 3 candidates by leadership',
      ]
    }
    const token = useAuthStore.getState().token
    const res = await fetch(`${API_URL}/copilot/suggestions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data = await res.json()
    return data.suggestions ?? []
  },
}
