import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Loader2, Search, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Booking, BookingStatus } from '../../types'
import { BookingBadge } from '../../components/Badge'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import { formatDate, formatTime } from '../../lib/utils'

const tabs: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<BookingStatus | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [approve, setApprove] = useState(true)
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, hall:halls(name), user:profiles(full_name, email, role)')
      .order('created_at', { ascending: false })
    setBookings((data as Booking[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const filtered = bookings.filter((b) => {
    if (tab !== 'all' && b.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return `${b.title} ${b.hall?.name ?? ''} ${b.user?.full_name ?? ''} ${b.user?.email ?? ''}`.toLowerCase().includes(q)
    }
    return true
  })

  const openReview = (b: Booking, willApprove: boolean) => {
    setReviewTarget(b)
    setApprove(willApprove)
    setNotes('')
    setError(null)
  }

  const submitReview = async () => {
    if (!reviewTarget) return
    setActing(true)
    setError(null)
    const { error } = await supabase.rpc('review_booking', {
      p_booking_id: reviewTarget.id,
      p_approve: approve,
      p_notes: notes.trim() || null,
    })
    setActing(false)
    if (error) {
      setError(
        error.message.includes('conflict')
          ? 'Cannot approve: this slot now conflicts with another booking (double-booking protection).'
          : error.message
      )
    } else {
      setReviewTarget(null)
      await load()
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Booking Requests</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Approve or reject requests. The database blocks conflicting approvals automatically.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, hall, user…" className="input pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
                tab === t.value
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                  : 'border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-100 dark:bg-navy-800" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6"><EmptyState title="No bookings found" message="No requests match this filter right now." /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{b.title}</h3>
                  <BookingBadge status={b.status} />
                  <span className="chip bg-slate-100 capitalize text-slate-500 dark:bg-white/5 dark:text-slate-400">{b.user?.role}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{b.user?.full_name}</span> ({b.user?.email})
                </p>
                <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-violet-500" /> {b.hall?.name}</span>
                  <span>{formatDate(b.event_date)}</span>
                  <span>{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                </p>
                {b.description && <p className="mt-1.5 text-xs italic text-slate-400">{b.description}</p>}
                {b.admin_notes && (
                  <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    Note: {b.admin_notes}
                  </p>
                )}
              </div>
              {b.status === 'pending' && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openReview(b, true)} className="btn-success">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => openReview(b, false)} className="btn-danger">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title={approve ? 'Approve booking' : 'Reject booking'}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {approve
            ? `Approve "${reviewTarget?.title}" in ${reviewTarget?.hall?.name} on ${reviewTarget ? formatDate(reviewTarget.event_date) : ''}? The user will be notified instantly.`
            : `Reject "${reviewTarget?.title}"? Optionally provide a reason for the user.`}
        </p>
        <div className="mt-4">
          <label className="label">{approve ? 'Note (optional)' : 'Reason (optional)'}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-20 resize-none" placeholder={approve ? 'e.g. Approved — see you there!' : 'e.g. Hall reserved for convocation rehearsals.'} />
        </div>
        {error && (
          <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <button onClick={() => void submitReview()} disabled={acting} className={approve ? 'btn-success flex-1' : 'btn-danger flex-1'}>
            {acting && <Loader2 className="h-4 w-4 animate-spin" />}
            {approve ? 'Confirm approval' : 'Confirm rejection'}
          </button>
          <button onClick={() => setReviewTarget(null)} className="btn-ghost">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
