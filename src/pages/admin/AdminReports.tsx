import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, Download, FileText, Printer, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Booking, Profile } from '../../types'
import { downloadCSV, formatDate, formatTime, statusLabels, toISODate } from '../../lib/utils'

export default function AdminReports() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [to, setTo] = useState(() => toISODate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)))

  useEffect(() => {
    const load = async () => {
      const [{ data: b }, { data: u }] = await Promise.all([
        supabase.from('bookings').select('*, hall:halls(name), user:profiles(full_name, email)').order('event_date'),
        supabase.from('profiles').select('*').order('created_at'),
      ])
      setBookings((b as Booking[]) ?? [])
      setUsers((u as Profile[]) ?? [])
      setLoading(false)
    }
    void load()
  }, [])

  const filtered = useMemo(
    () => bookings.filter((b) => b.event_date >= from && b.event_date <= to),
    [bookings, from, to]
  )

  const summary = useMemo(() => {
    const approved = filtered.filter((b) => b.status === 'approved')
    return {
      total: filtered.length,
      approved: approved.length,
      pending: filtered.filter((b) => b.status === 'pending').length,
      rejected: filtered.filter((b) => b.status === 'rejected').length,
      cancelled: filtered.filter((b) => b.status === 'cancelled').length,
      utilization: filtered.length ? Math.round((approved.length / filtered.length) * 100) : 0,
    }
  }, [filtered])

  const exportBookingsCSV = () =>
    downloadCSV(
      `bookings-${from}-to-${to}.csv`,
      filtered.map((b) => ({
        title: b.title,
        hall: b.hall?.name ?? '',
        user: b.user?.full_name ?? '',
        email: b.user?.email ?? '',
        date: b.event_date,
        start: formatTime(b.start_time),
        end: formatTime(b.end_time),
        status: b.status,
        admin_notes: b.admin_notes ?? '',
      }))
    )

  const exportUsersCSV = () =>
    downloadCSV(
      'users.csv',
      users.map((u) => ({
        name: u.full_name,
        email: u.email,
        role: u.role,
        department: u.department ?? '',
        joined: u.created_at.slice(0, 10),
      }))
    )

  return (
    <div>
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Export booking and user data, or print a PDF report of a date range.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportBookingsCSV} className="btn-ghost text-xs" disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Bookings CSV
          </button>
          <button onClick={exportUsersCSV} className="btn-ghost text-xs" disabled={users.length === 0}>
            <Users className="h-4 w-4" /> Users CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary text-xs">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      <div className="no-print mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-auto" />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-auto" />
        </div>
      </div>

      {/* Print-friendly report */}
      <div className="card mt-6 p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Booking Report</h2>
            <p className="text-xs text-slate-400">{formatDate(from)} — {formatDate(to)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total', value: summary.total },
            { label: 'Approved', value: summary.approved },
            { label: 'Pending', value: summary.pending },
            { label: 'Rejected', value: summary.rejected },
            { label: 'Cancelled', value: summary.cancelled },
            { label: 'Approval rate', value: `${summary.utilization}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 p-4 text-center dark:bg-white/5">
              <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-navy-700" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:bg-white/5">
            No bookings in this date range.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-white/5">
                  <th className="px-3 py-2.5 font-semibold">Event</th>
                  <th className="px-3 py-2.5 font-semibold">Hall</th>
                  <th className="px-3 py-2.5 font-semibold">Requested by</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Time</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0 dark:border-white/5">
                    <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100">{b.title}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{b.hall?.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{b.user?.full_name}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{b.event_date}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{formatTime(b.start_time)}–{formatTime(b.end_time)}</td>
                    <td className="px-3 py-2.5">{statusLabels[b.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarCheck2 className="h-3.5 w-3.5" /> Generated by CampusHalls on {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}
