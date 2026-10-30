import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { AppNotification } from '../types'
import { cn } from '../lib/utils'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)
      setNotifications((data as AppNotification[]) ?? [])
    }
    void fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new as AppNotification, ...prev].slice(0, 15))
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user])

  const unread = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    if (!user || unread === 0) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markRead = async (n: AppNotification) => {
    if (n.is_read) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border border-slate-200 bg-white/60 p-2 text-slate-600 transition hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400 dark:hover:text-violet-300"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="glass absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl shadow-card"
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-300"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link ?? '/bookings'}
                      onClick={() => {
                        void markRead(n)
                        setOpen(false)
                      }}
                      className={cn(
                        'block border-b border-slate-100 px-4 py-3 transition last:border-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5',
                        !n.is_read && 'bg-violet-50/60 dark:bg-violet-500/5'
                      )}
                    >
                      <p className="flex items-start gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />}
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
