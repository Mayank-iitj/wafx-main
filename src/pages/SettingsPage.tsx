import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Sliders, Bell, Shield, Palette, Save, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [weights, setWeights] = useState({
    'Technical Fit': 35,
    'Domain Expertise': 20,
    'Leadership': 15,
    'Learning Velocity': 10,
    'Behavioral Signals': 10,
    'Cultural Alignment': 10,
  })
  const [notifications, setNotifications] = useState({
    'New rankings complete': true,
    'Hidden gem detected': true,
    'Resume batch uploaded': false,
    'Bias audit complete': true,
  })

  const handleSave = () => {
    setSaved(true)
    toast.success('Settings saved successfully!')
    setTimeout(() => setSaved(false), 2000)
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" />
          Settings
        </h2>
        <p className="text-sm text-muted">Customize HireMind AI to your recruiter preferences</p>
      </div>

      {/* Ranking weights */}
      <div className="glass-card">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-400" /> Default Ranking Weights
        </h3>
        <p className="text-xs text-muted mb-4">These weights apply globally. You can override per-job in the Rankings view.</p>
        {Object.entries(weights).map(([key, val]) => (
          <div key={key} className="mb-3">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-secondary">{key}</span>
              <span className={`font-medium ${val > 30 ? 'text-brand-400' : 'text-secondary'}`}>{val}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={val}
              onChange={(e) => setWeights((w) => ({ ...w, [key]: +e.target.value }))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#6366f1' }}
              id={`setting-weight-${key.replace(/ /g, '-').toLowerCase()}`}
            />
          </div>
        ))}
        <div className={`text-xs mt-3 ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
          Total: {totalWeight}% {totalWeight !== 100 ? '(should equal 100%)' : '✓'}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent-400" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {Object.entries(notifications).map(([key, val]) => {
            const k = key as keyof typeof notifications;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-secondary">{key}</span>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, [k]: !n[k] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${val ? 'bg-brand-500' : 'bg-white/10'}`}
                  id={`setting-notif-${key.replace(/ /g, '-').toLowerCase()}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI model */}
      <div className="glass-card">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-400" /> AI Model Configuration
        </h3>
        <div className="space-y-3">
          {[
            { label: 'LLM Provider', id: 'setting-llm-provider', defaultVal: 'OpenAI GPT-4o', options: ['OpenAI GPT-4o', 'Google Gemini 1.5', 'Anthropic Claude 3.5', 'Mock (Demo Mode)'] },
            { label: 'Embedding Model', id: 'setting-embedding', defaultVal: 'text-embedding-3-large', options: ['text-embedding-3-large', 'all-MiniLM-L6-v2', 'bge-large-en-v1.5'] },
          ].map(({ label, id, defaultVal, options }) => (
            <div key={label}>
              <label className="block text-sm text-secondary mb-1.5">{label}</label>
              <select className="input h-9 text-sm" defaultValue={defaultVal} id={id}>
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="btn-primary px-8 py-2.5"
        id="settings-save-btn"
      >
        {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
      </button>
    </div>
  )
}
