import { useEffect, useState } from 'react'
import { CalendarDays, Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { CollegeEvent, EventStatus, Hall } from '../../types'
import EmptyState from '../../components/EmptyState'
import { formatDate, formatTime } from '../../lib/utils'

const statusStyles: Record<EventStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  ongoing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  completed: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

const emptyForm = { title: '', description: '', hall_id: '', event_date: '', start_time: '09:00', end_time: '11:00' }

export default function AdminEvents() {
  const [events, setEvents] = useState<CollegeEvent[]>([])
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | EventStatus>('all')

  const load = async () => {
    const [{ data: e }, { data: h }] = await Promise.all([
      supabase.from('events').select('*, hall:halls(name)').order('event_date', { ascending: false }),
      supabase.from('halls').select('id, name').eq('is_active', true).order('name'),
    ])
    setEvents((e as CollegeEvent[]) ?? [])
    setHalls((h as Hall[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('admin-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      hall_id: form.hall_id || null,
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
    })
    setSaving(false)
    setCreating(false)
    setForm(emptyForm)
    await load()
  }

  const updateStatus = async (id: string, status: EventStatus) => {
    await supabase.from('events').update({ status }).eq('id', id)
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, status } : ev)))
  }

  const remove = async (id: string) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
  }

  const filtered = filter === 'all' ? events : events.filter((e) => e.status === filter)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Event Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Publish campus events — they appear on the public calendar instantly.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New event
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['all', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              filter === s
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                : 'border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-100 dark:bg-navy-800" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6"><EmptyState title="No events" message="Create the first campus event with the button above." /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((ev) => (
            <div key={ev.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                <span className="text-base font-extrabold leading-none">{Number(ev.event_date.slice(8, 10))}</span>
                <span className="text-[9px] font-semibold uppercase">
                  {new Date(`${ev.event_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{ev.title}</h3>
                  <span className={`chip capitalize ${statusStyles[ev.status]}`}>{ev.status}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarDays className="mr-1 inline h-3.5 w-3.5 text-violet-500" />
                  {formatDate(ev.event_date)} · {formatTime(ev.start_time)} – {formatTime(ev.end_time)} · {ev.hall?.name ?? 'Campus wide'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={ev.status}
                  onChange={(e) => void updateStatus(ev.id, e.target.value as EventStatus)}
                  className="input w-auto cursor-pointer py-1.5 text-xs"
                >
                  <option value="upcoming">upcoming</option>
                  <option value="ongoing">ongoing</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <button onClick={() => void remove(ev.id)} className="btn-danger px-3 py-1.5 text-xs">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm" onClick={() => setCreating(false)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">Create event</h3>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="label">Event title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. National Tech Fest 2026" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-16 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hall</label>
                  <select value={form.hall_id} onChange={(e) => setForm({ ...form, hall_id: e.target.value })} className="input cursor-pointer">
                    <option value="">Campus wide</option>
                    {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input required type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Start time</label>
                  <input required type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">End time</label>
                  <input required type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Publish event
                </button>
                <button type="button" onClick={() => setCreating(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
