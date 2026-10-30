import { useEffect, useState } from 'react'
import { Loader2, Plus, Wrench } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Hall, MaintenanceRecord, MaintenanceStatus } from '../../types'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { formatDate, formatTime, todayISO } from '../../lib/utils'

const statusStyles: Record<MaintenanceStatus, string> = {
  scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
}

const emptyForm = { hall_id: '', title: '', description: '', scheduled_date: '', start_time: '09:00', end_time: '17:00' }

export default function AdminMaintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [{ data: m }, { data: h }] = await Promise.all([
      supabase.from('maintenance').select('*, hall:halls(name)').order('scheduled_date', { ascending: false }),
      supabase.from('halls').select('id, name').order('name'),
    ])
    setRecords((m as MaintenanceRecord[]) ?? [])
    setHalls((h as Hall[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('maintenance').insert({
      hall_id: form.hall_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      scheduled_date: form.scheduled_date,
      start_time: form.start_time,
      end_time: form.end_time,
    })
    // If the maintenance is today, take the hall offline so new bookings are blocked in the UI.
    if (form.scheduled_date <= todayISO()) {
      await supabase.from('halls').update({ is_active: false }).eq('id', form.hall_id)
    }
    setSaving(false)
    setCreating(false)
    setForm(emptyForm)
    await load()
  }

  const updateStatus = async (id: string, status: MaintenanceStatus) => {
    await supabase.from('maintenance').update({ status }).eq('id', id)
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    // Reopen hall when maintenance completes
    const rec = records.find((r) => r.id === id)
    if (status === 'completed' && rec) {
      await supabase.from('halls').update({ is_active: true }).eq('id', rec.hall_id)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Maintenance Scheduling</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Schedule upkeep work and automatically take halls offline when needed.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Schedule maintenance
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-100 dark:bg-navy-800" />)}</div>
      ) : records.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Wrench} title="No maintenance scheduled" message="All halls are running smoothly." /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {records.map((r) => (
            <div key={r.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/15">
                <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">{r.title}</h3>
                  <span className={`chip capitalize ${statusStyles[r.status]}`}>{r.status.replace('_', ' ')}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {r.hall?.name} · {formatDate(r.scheduled_date)} · {formatTime(r.start_time)} – {formatTime(r.end_time)}
                </p>
                {r.description && <p className="mt-1 text-xs italic text-slate-400">{r.description}</p>}
              </div>
              <select
                value={r.status}
                onChange={(e) => void updateStatus(r.id, e.target.value as MaintenanceStatus)}
                className="input w-auto shrink-0 cursor-pointer py-1.5 text-xs"
              >
                <option value="scheduled">scheduled</option>
                <option value="in_progress">in progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Schedule maintenance">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="label">Hall</label>
            <select required value={form.hall_id} onChange={(e) => setForm({ ...form, hall_id: e.target.value })} className="input cursor-pointer">
              <option value="">Select a hall…</option>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. AC servicing & deep clean" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-16 resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Date</label>
              <input required type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Start</label>
              <input required type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">End</label>
              <input required type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.hall_id} className="btn-primary flex-1">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Schedule
            </button>
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
