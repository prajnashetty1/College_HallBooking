import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Send,
  Users,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Booking, Hall, MaintenanceRecord } from '../types'
import MonthCalendar from '../components/MonthCalendar'
import { BookingBadge } from '../components/Badge'
import PageLoader from '../components/PageLoader'
import { cn, formatDate, formatTime, rangesOverlap, toISODate, todayISO } from '../lib/utils'

export default function HallDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, role } = useAuth()

  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('halls').select('*').eq('id', id).single()
      if (!data) {
        navigate('/halls', { replace: true })
        return
      }
      setHall(data as Hall)
      setLoading(false)
    }
    void load()
  }, [id, navigate])

  // Load bookings + maintenance for the visible month, with realtime updates
  useEffect(() => {
    if (!id) return
    const start = toISODate(new Date(month.getFullYear(), month.getMonth(), 1))
    const end = toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0))

    const load = async () => {
      const [{ data: b }, { data: m }] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, user:profiles(full_name)')
          .eq('hall_id', id)
          .gte('event_date', start)
          .lte('event_date', end)
          .order('event_date'),
        supabase
          .from('maintenance')
          .select('*')
          .eq('hall_id', id)
          .gte('scheduled_date', start)
          .lte('scheduled_date', end),
      ])
      setBookings((b as Booking[]) ?? [])
      setMaintenance((m as MaintenanceRecord[]) ?? [])
    }
    void load()

    const channel = supabase
      .channel(`hall-${id}-${start}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `hall_id=eq.${id}` },
        () => void load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance', filter: `hall_id=eq.${id}` },
        () => void load()
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, month])

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.event_date === selectedDate && b.status !== 'cancelled' && b.status !== 'rejected')
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [bookings, selectedDate]
  )

  const dayMaintenance = useMemo(
    () => maintenance.filter((r) => r.scheduled_date === selectedDate),
    [maintenance, selectedDate]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !hall || !selectedDate) return
    setMessage(null)

    if (selectedDate < todayISO()) {
      setMessage({ type: 'error', text: 'You cannot book a date in the past.' })
      return
    }
    if (startTime >= endTime) {
      setMessage({ type: 'error', text: 'End time must be after start time.' })
      return
    }
    // client-side overlap check (database enforces it too)
    const conflict = dayBookings.some(
      (b) => b.status !== 'rejected' && rangesOverlap(startTime, endTime, b.start_time.slice(0, 5), b.end_time.slice(0, 5))
    )
    if (conflict) {
      setMessage({ type: 'error', text: 'This slot overlaps an existing booking. Pick another time.' })
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('bookings').insert({
      hall_id: hall.id,
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      event_date: selectedDate,
      start_time: startTime,
      end_time: endTime,
    })
    setSubmitting(false)

    if (error) {
      setMessage({
        type: 'error',
        text: error.message.includes('conflict') || error.code === 'P0001'
          ? 'That slot was just taken — the database rejected a double booking. Please choose another time.'
          : error.message,
      })
    } else {
      setMessage({ type: 'success', text: 'Booking request submitted! An administrator will review it shortly.' })
      setTitle('')
      setDescription('')
    }
  }

  if (loading) return <PageLoader />
  if (!hall) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/halls" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-600 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to halls
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* LEFT: info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3"
        >
          <div className="relative h-72 overflow-hidden rounded-3xl sm:h-96">
            <img src={hall.image_url ?? ''} alt={hall.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{hall.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/85">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {hall.location}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {hall.capacity} seats</span>
                <span className={cn('chip', hall.is_active ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200')}>
                  {hall.is_active ? 'Operational' : 'Under maintenance'}
                </span>
              </div>
            </div>
          </div>

          <div className="card mt-6 p-6">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">About this hall</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {hall.description}
            </p>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Facilities</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {hall.facilities.map((f) => (
                <span key={f} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: calendar + booking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6 lg:col-span-2"
        >
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            bookings={bookings}
            maintenance={maintenance}
            selectedDate={selectedDate}
            onSelectDate={(iso) => {
              setSelectedDate(iso)
              setMessage(null)
            }}
          />

          {selectedDate && (
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
                <CalendarDays className="h-4 w-4 text-violet-500" /> {formatDate(selectedDate)}
              </h3>

              {dayBookings.length > 0 && (
                <div className="mt-3 space-y-2">
                  {dayBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs dark:bg-white/5">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{b.title}</p>
                        <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="h-3 w-3" /> {formatTime(b.start_time)} – {formatTime(b.end_time)}
                        </p>
                      </div>
                      <BookingBadge status={b.status} />
                    </div>
                  ))}
                </div>
              )}
              {dayMaintenance.length > 0 && (
                <div className="mt-3 space-y-2">
                  {dayMaintenance.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2.5 text-xs text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                      <XCircle className="h-3.5 w-3.5" /> Maintenance: {r.title} ({formatTime(r.start_time)} – {formatTime(r.end_time)})
                    </div>
                  ))}
                </div>
              )}

              {user && (role === 'student' || role === 'faculty') && hall.is_active ? (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <div>
                    <label className="label">Event title</label>
                    <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Tech Symposium 2026" maxLength={120} />
                  </div>
                  <div>
                    <label className="label">Description (optional)</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-20 resize-none" placeholder="Tell us about your event…" maxLength={500} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start time</label>
                      <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">End time</label>
                      <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
                    </div>
                  </div>
                  {message && (
                    <div className={cn(
                      'rounded-xl px-3.5 py-2.5 text-xs font-medium',
                      message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                    )}>
                      {message.text}
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Request booking
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    Requests are reviewed by administrators before confirmation.
                  </p>
                </form>
              ) : !user ? (
                <div className="mt-4 border-t border-slate-100 pt-4 text-center dark:border-white/5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to request a booking.</p>
                  <Link to="/login" className="btn-primary mt-3 w-full">Sign in to book</Link>
                </div>
              ) : (
                <p className="mt-4 border-t border-slate-100 pt-4 text-center text-sm text-slate-400 dark:border-white/5">
                  {hall.is_active ? 'Admins manage bookings from the dashboard.' : 'This hall is currently under maintenance.'}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
