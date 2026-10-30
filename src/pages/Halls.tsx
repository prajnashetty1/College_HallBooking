import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Hall } from '../types'
import HallCard from '../components/HallCard'
import EmptyState from '../components/EmptyState'

const capacityOptions = [
  { value: 0, label: 'Any capacity' },
  { value: 100, label: '100+ seats' },
  { value: 300, label: '300+ seats' },
  { value: 600, label: '600+ seats' },
  { value: 1000, label: '1000+ seats' },
]

export default function Halls() {
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minCapacity, setMinCapacity] = useState(0)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('halls').select('*').order('capacity', { ascending: false })
      setHalls((data as Hall[]) ?? [])
      setLoading(false)
    }
    void load()
  }, [])

  // halls that have at least one approved booking today are "busy today"
  useEffect(() => {
    if (!onlyAvailable) return
    const today = new Date().toISOString().slice(0, 10)
    supabase
      .from('bookings')
      .select('hall_id')
      .eq('event_date', today)
      .eq('status', 'approved')
      .then(({ data }) => setBusyDates(new Set((data ?? []).map((r: { hall_id: string }) => r.hall_id))))
  }, [onlyAvailable])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return halls.filter((h) => {
      if (q) {
        const haystack = `${h.name} ${h.location} ${h.description ?? ''} ${h.facilities.join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (h.capacity < minCapacity) return false
      if (onlyAvailable && busyDates.has(h.id)) return false
      return true
    })
  }, [halls, search, minCapacity, onlyAvailable, busyDates])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Venues</p>
        <h1 className="section-title mt-2">Explore Our Halls</h1>
        <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
          Eight distinctive venues across campus — filter by capacity, search by facility, and find
          the perfect space for seminars, fests, and conferences.
        </p>
      </motion.div>

      <div className="card mt-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search halls, locations, facilities…"
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={minCapacity}
            onChange={(e) => setMinCapacity(Number(e.target.value))}
            className="input w-auto"
          >
            {capacityOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          Free today
        </label>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-slate-100 dark:bg-navy-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No halls match your filters"
            message="Try a different search term or lower the capacity requirement."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h, i) => (
            <HallCard key={h.id} hall={h} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
