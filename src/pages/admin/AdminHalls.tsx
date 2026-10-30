import { useEffect, useState } from 'react'
import { Building2, Loader2, MapPin, Pencil, Save, Users, Wrench } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Hall } from '../../types'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import { cn } from '../../lib/utils'

export default function AdminHalls() {
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Hall | null>(null)
  const [form, setForm] = useState({ capacity: 0, location: '', description: '', facilities: '', image_url: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('halls').select('*').order('name')
    setHalls((data as Hall[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const openEdit = (h: Hall) => {
    setEditing(h)
    setForm({
      capacity: h.capacity,
      location: h.location,
      description: h.description ?? '',
      facilities: h.facilities.join(', '),
      image_url: h.image_url ?? '',
    })
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    await supabase
      .from('halls')
      .update({
        capacity: form.capacity,
        location: form.location.trim(),
        description: form.description.trim() || null,
        facilities: form.facilities.split(',').map((f) => f.trim()).filter(Boolean),
        image_url: form.image_url.trim() || null,
      })
      .eq('id', editing.id)
    setSaving(false)
    setEditing(null)
    await load()
  }

  const toggleActive = async (h: Hall) => {
    await supabase.from('halls').update({ is_active: !h.is_active }).eq('id', h.id)
    setHalls((prev) => prev.map((x) => (x.id === h.id ? { ...x, is_active: !h.is_active } : x)))
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Hall Management</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Update capacities, facilities, images, and mark halls under maintenance.
      </p>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-44 animate-pulse bg-slate-100 dark:bg-navy-800" />)}
        </div>
      ) : halls.length === 0 ? (
        <div className="mt-6"><EmptyState title="No halls found" message="Run the seed data in supabase/schema.sql to create the 8 halls." /></div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {halls.map((h) => (
            <div key={h.id} className={cn('card overflow-hidden', !h.is_active && 'opacity-75')}>
              <div className="relative h-32">
                <img src={h.image_url ?? ''} alt={h.name} className="h-full w-full object-cover" />
                <span className={cn(
                  'absolute right-3 top-3 chip',
                  h.is_active ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
                )}>
                  {h.is_active ? 'Operational' : 'Maintenance'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
                  <Building2 className="h-4 w-4 text-violet-500" /> {h.name}
                </h3>
                <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {h.capacity} seats</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {h.location}</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(h)} className="btn-ghost flex-1 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => void toggleActive(h)}
                    className={cn('btn flex-1 text-xs', h.is_active ? 'btn-danger' : 'btn-success')}
                  >
                    <Wrench className="h-3.5 w-3.5" /> {h.is_active ? 'Set maintenance' : 'Reopen'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? ''}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-20 resize-none" />
          </div>
          <div>
            <label className="label">Facilities (comma separated)</label>
            <input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} className="input" placeholder="Projector, AC, Wi-Fi" />
          </div>
          <div>
            <label className="label">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input" placeholder="https://…" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => void save()} disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save hall
            </button>
            <button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
