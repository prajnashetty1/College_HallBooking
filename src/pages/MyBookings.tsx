import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, Loader2, MapPin, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Booking } from '../types'
import { BookingBadge } from '../components/Badge'
import EmptyState from '../components/EmptyState'
import { formatDate, formatTime } from '../lib/utils'

const tabs = ['all', 'pending', 'approved', 'rejected', 'cancelled'] as const
type Tab = (typeof tabs)[number]

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, hall:halls(name, location, image_url)')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
      setBookings((data as Booking[]) ?? [])
      setLoading(false)
    }
    void load()

    const channel = supabase
      .channel(`my-bookings:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` },
        () => void load()
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user])

  const cancel = async (id: string) => {
    setCancelling(id)
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)))
    setCancelling(null)
  }

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Account</p>
          <h1 className="section-title mt-2">My Bookings</h1>
        </div>
        <Link to="/halls" className="btn-primary">Book a hall</Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                : 'border border-slate-200 text-slate-600 hover:border-violet-400 dark:border-white/10 dark:text-slate-300'
            }`}
          >
            {t}
            <span className="ml-1.5 text-xs opacity-70">
              ({t === 'all' ? bookings.length : bookings.filter((b) => b.status === t).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-100 dark:bg-navy-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={tab === 'all' ? 'No bookings yet' : `No ${tab} bookings`}
            message="Browse the halls and submit your first booking request."
            action={<Link to="/halls" className="btn-primary">Explore halls</Link>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="card card-hover flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {b.hall?.image_url && (
                <img src={b.hall.image_url} alt={b.hall.name} className="h-24 w-full rounded-xl object-cover sm:w-36" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{b.title}</h3>
                  <BookingBadge status={b.status} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-violet-500" /> {b.hall?.name} · {b.hall?.location}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(b.event_date)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                </p>
                {b.admin_notes && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    Admin note: {b.admin_notes}
                  </p>
                )}
              </div>
              {b.status === 'pending' && (
                <button
                  onClick={() => void cancel(b.id)}
                  disabled={cancelling === b.id}
                  className="btn-danger shrink-0 self-start sm:self-center"
                >
                  {cancelling === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
