import { motion } from 'framer-motion'
import { Bell, Sparkles, Trophy, Upload, Shield, CheckCheck, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockNotifications } from '../data/mockData'
import { timeAgo } from '../lib/utils'
import { useState } from 'react'

const icons: Record<string, React.ElementType> = {
  gem: Sparkles,
  ranking: Trophy,
  upload: Upload,
  bias: Shield,
}
const iconColors: Record<string, string> = {
  gem: '#8b5cf6',
  ranking: '#6366f1',
  upload: '#10b981',
  bias: '#06b6d4',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [allRead, setAllRead] = useState(false)

  const markAllRead = () => {
    setNotifications((n) => n.map((notif) => ({ ...notif, read: true })))
    setAllRead(true)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-400" />
            Notifications
          </h2>
          <p className="text-sm text-muted">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="btn-ghost text-xs border border-white/10" id="notifications-mark-all-btn">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button onClick={() => setNotifications([])} className="btn-ghost text-xs border border-white/10 text-red-400" id="notifications-clear-btn">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card text-center py-16">
          <Bell className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const Icon = icons[notif.type]
            const color = iconColors[notif.type]
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate(notif.link)}
                className={`glass-sm rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-all hover:bg-white/5 ${!notif.read ? 'border-l-2' : ''}`}
                style={!notif.read ? { borderLeftColor: color } : {}}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${notif.read ? 'text-secondary' : 'text-primary'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted flex-shrink-0">{timeAgo(notif.time)}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{notif.message}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
