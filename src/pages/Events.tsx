import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { CollegeEvent } from '../types'
import MonthCalendar from '../components/MonthCalendar'
import EmptyState from '../components/EmptyState'
import { formatDate, formatTime, toISODate } from '../lib/utils'

const eventStatusStyles: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  ongoing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  completed: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

export default function Events() {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [events, setEvents] = useState<CollegeEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = toISODate(new Date(month.getFullYear(), month.getMonth(), 1))
    const end = toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0))
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('events')
        .select('*, hall:halls(name)')
        .gte('event_date', start)
        .lte('event_date', end)
        .order('event_date')
        .order('start_time')
      setEvents((data as CollegeEvent[]) ?? [])
      setLoading(false)
    }
    void load()

    const channel = supabase
      .channel('events-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [month])

  // convert events to fake "bookings" for calendar dots (status mapping)
  const calendarBookings = useMemo(
    () =>
      events
        .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
        .map((e) => ({
          id: e.id,
          hall_id: e.hall_id ?? '',
          user_id: '',
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          start_time: e.start_time ?? '00:00',
          end_time: e.end_time ?? '23:59',
          status: e.status === 'ongoing' ? ('approved' as const) : ('pending' as const),
          admin_notes: null,
          created_at: e.created_at,
        })),
    [events]
  )

  const dayEvents = useMemo(
    () => events.filter((e) => e.event_date === selectedDate),
    [events, selectedDate]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Campus Life</p>
        <h1 className="section-title mt-2">Events Calendar</h1>
        <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
          Everything happening on campus — updated live. Select a day to see what is scheduled.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          bookings={calendarBookings}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <div>
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
            <CalendarDays className="h-4 w-4 text-violet-500" />
            {selectedDate ? formatDate(selectedDate) : 'Select a date'}
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-navy-800" />
              ))}
            </div>
          ) : !selectedDate ? (
            <EmptyState title="Pick a date" message="Click any day in the calendar to view its events." />
          ) : dayEvents.length === 0 ? (
            <EmptyState title="No events on this day" message="There is nothing scheduled here yet — maybe your event could be next." />
          ) : (
            <div className="space-y-3">
              {dayEvents.map((e) => (
                <div key={e.id} className="card card-hover p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">{e.title}</h4>
                    <span className={`chip capitalize ${eventStatusStyles[e.status] ?? eventStatusStyles.upcoming}`}>{e.status}</span>
                  </div>
                  {e.description && (
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{e.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-violet-500" /> {formatTime(e.start_time)} – {formatTime(e.end_time)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-violet-500" /> {e.hall?.name ?? 'Campus wide'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
