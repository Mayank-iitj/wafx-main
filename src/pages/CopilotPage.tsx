import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, User, Mic, Paperclip, RefreshCw } from 'lucide-react'
import { copilotApi } from '../lib/copilot'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  thinking?: boolean
  timestamp: Date
}

const WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'ai',
  content:
    "Hello! I'm your AI Recruiter Copilot. I can help you understand candidate rankings, discover hidden gems, compare applicants, and answer any questions about your talent pipeline. What would you like to know?",
  timestamp: new Date(),
}

export function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    copilotApi.getSuggestions().then(setSuggestions)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim()
    if (!msg || streaming) return
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setStreaming(true)

    // Add thinking placeholder
    const aiId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: aiId, role: 'ai', content: '', thinking: true, timestamp: new Date() },
    ])

    try {
      // Small thinking delay for UX
      await new Promise((r) => setTimeout(r, 900))

      // Remove thinking indicator, start streaming
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, thinking: false, content: '' } : m))
      )

      let streamed = ''
      for await (const char of copilotApi.streamChat(msg)) {
        streamed += char
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, content: streamed } : m))
        )
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, thinking: false, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([{ ...WELCOME_MSG, id: 'welcome-' + Date.now(), content: "Chat reset. I'm ready to help!" }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card mb-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-primary">AI Recruiter Copilot</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-secondary">Online · RAG-powered · 247 candidates indexed</p>
          </div>
        </div>
        <button onClick={resetChat} className="btn-ghost p-2" id="copilot-reset-btn">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'ai' ? 'bg-gradient-to-br from-brand-500 to-accent-500' : 'bg-white/10'
              }`}
            >
              {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>

            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              {msg.thinking ? (
                <div className="ai-thinking py-1">
                  <span /><span /><span />
                </div>
              ) : (
                <p
                  className="leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#818cf8">$1</strong>'),
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {messages.length <= 2 && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-3 flex flex-wrap gap-2"
          >
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-brand-500/10 hover:border-brand-500/30"
                style={{ borderColor: 'rgba(99,102,241,0.2)', color: '#94a3b8' }}
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-brand-400" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="glass-sm rounded-2xl p-3 flex items-end gap-3 mt-3">
        <button className="btn-ghost p-2 mb-0.5" id="copilot-attach-btn">
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about candidates, rankings, or hiring decisions…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none resize-none leading-6"
          style={{ maxHeight: '120px' }}
          id="copilot-input"
        />
        <button className="btn-ghost p-2 mb-0.5" id="copilot-mic-btn">
          <Mic className="w-4 h-4" />
        </button>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          className="btn-primary p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          id="copilot-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-muted text-center mt-2">
        Powered by RAG + vector search over 247 candidate profiles
      </p>
    </div>
  )
}
