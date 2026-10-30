import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { AuditLog, Booking } from '../../types'
import StatCard from '../../components/StatCard'
import { BookingBadge } from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { formatDate, formatTime } from '../../lib/utils'

interface DashboardStats {
  halls: number
  users: number
  bookings: number
  pending: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ halls: 0, users: 0, bookings: 0, pending: 0 })
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [bookingsPerHall, setBookingsPerHall] = useState<{ name: string; count: number }[]>([])
  const [activity, setActivity] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [halls, users, bookings, pending, hallNames, logs] = await Promise.all([
      supabase.from('halls').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('halls').select('id, name'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6),
    ])
    const { data: allBookings } = await supabase.from('bookings').select('hall_id, status')
    const hallsList = (hallNames.data ?? []) as { id: string; name: string }[]
    const perHall = hallsList.map((h) => ({
      name: h.name,
      count: (allBookings ?? []).filter((b: { hall_id: string }) => b.hall_id === h.id).length,
    })).sort((a, b) => b.count - a.count)

    const { data: pendingList } = await supabase
      .from('bookings')
      .select('*, hall:halls(name), user:profiles(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    setStats({
      halls: halls.count ?? 0,
      users: users.count ?? 0,
      bookings: bookings.count ?? 0,
      pending: pending.count ?? 0,
    })
    setBookingsPerHall(perHall)
    setPendingBookings((pendingList as Booking[]) ?? [])
    setActivity((logs.data as AuditLog[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const maxCount = useMemo(() => Math.max(1, ...bookingsPerHall.map((h) => h.count)), [bookingsPerHall])

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Live overview of halls, bookings and campus activity.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Total Halls" value={stats.halls} />
        <StatCard icon={Users} label="Registered Users" value={stats.users} accent="from-sky-500 to-blue-600" />
        <StatCard icon={CalendarCheck2} label="Total Bookings" value={stats.bookings} accent="from-violet-500 to-purple-600" />
        <StatCard icon={Clock} label="Pending Requests" value={stats.pending} accent="from-amber-500 to-orange-600" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Pending bookings */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Pending Requests</h2>
            <Link to="/admin/bookings" className="text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-300">
              Review all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-navy-700" />)}</div>
          ) : pendingBookings.length === 0 ? (
            <EmptyState title="All caught up" message="There are no booking requests waiting for review." />
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{b.title}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {b.user?.full_name} · {b.hall?.name} · {formatDate(b.event_date)}, {formatTime(b.start_time)}–{formatTime(b.end_time)}
                    </p>
                  </div>
                  <BookingBadge status="pending" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings per hall chart */}
        <div className="card p-6">
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
            <TrendingUp className="h-4 w-4 text-violet-500" /> Bookings per Hall
          </h2>
          <p className="mb-5 text-xs text-slate-400">All-time booking volume by venue</p>
          <div className="space-y-3">
            {bookingsPerHall.map((h) => (
              <div key={h.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{h.name}</span>
                  <span className="text-slate-400">{h.count}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-700"
                    style={{ width: `${Math.max(4, (h.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">Recent Activity</h2>
        {activity.length === 0 ? (
          <EmptyState title="No activity yet" message="Admin actions will appear here as they happen." />
        ) : (
          <div className="space-y-1">
            {activity.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5">
                {log.action.includes('approved') ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : log.action.includes('rejected') ? (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <span className="flex-1 text-slate-600 dark:text-slate-300">
                  <span className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-300">{log.action}</span>
                  {log.table_name ? ` on ${log.table_name}` : ''}
                </span>
                <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
