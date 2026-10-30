import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  CalendarCheck2,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { CollegeEvent, Hall } from '../types'
import HallCard from '../components/HallCard'
import StatCard from '../components/StatCard'
import { formatDate, formatTime } from '../lib/utils'

const heroStats = [
  { icon: GraduationCap, label: 'Premium Halls', value: 8, suffix: '' },
  { icon: Users, label: 'Total Capacity', value: 5200, suffix: '+' },
  { icon: CalendarCheck2, label: 'Events Hosted / Year', value: 350, suffix: '+' },
  { icon: ShieldCheck, label: 'Booking Success', value: 98, suffix: '%' },
]

const features = [
  {
    icon: CalendarCheck2,
    title: 'Live Availability',
    text: 'Interactive calendars update in real time as bookings are approved, so you always see the truth.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    text: 'Students, faculty and admins each get a tailored, secure experience powered by Supabase RLS.',
  },
  {
    icon: Zap,
    title: 'Instant Notifications',
    text: 'Get notified the moment an admin approves or rejects your hall booking request.',
  },
]

export default function Home() {
  const [halls, setHalls] = useState<Hall[]>([])
  const [events, setEvents] = useState<CollegeEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: hallsData }, { data: eventsData }] = await Promise.all([
        supabase
          .from('halls')
          .select('*')
          .eq('is_active', true)
          .order('capacity', { ascending: false })
          .limit(4),
        supabase
          .from('events')
          .select('*, hall:halls(name)')
          .in('status', ['upcoming', 'ongoing'])
          .order('event_date', { ascending: true })
          .limit(3),
      ])
      setHalls((hallsData as Hall[]) ?? [])
      setEvents((eventsData as CollegeEvent[]) ?? [])
      setLoading(false)
    }
    void load()
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-float rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 animate-float-slow rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="chip mb-5 border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> College Hall Management System
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Book the perfect hall for <span className="text-gradient">every occasion</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              Explore 8 premium campus venues — from the grand Amphitheatre to the intimate
              JKShim MBA Hall. Check live availability, submit booking requests, and track
              approvals in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/halls" className="btn-primary">
                <Search className="h-4 w-4" /> Explore Halls
              </Link>
              <Link to="/events" className="btn-ghost">
                <CalendarDays className="h-4 w-4" /> Upcoming Events
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {heroStats.map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="glass animate-float overflow-hidden rounded-3xl p-3 shadow-glow">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80"
                alt="College auditorium event"
                className="h-[420px] w-full rounded-2xl object-cover"
              />
            </div>
            <div className="glass card-hover absolute -bottom-6 -left-8 flex items-center gap-3 rounded-2xl p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                <CalendarCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Sambram Hall</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Available today</p>
              </div>
            </div>
            <div className="glass card-hover absolute -right-6 top-8 flex items-center gap-3 rounded-2xl p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">1,200 seats</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Amphitheatre</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED HALLS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Venues
            </p>
            <h2 className="section-title mt-2">Featured Halls</h2>
          </div>
          <Link to="/halls" className="btn-ghost">
            View all halls <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-80 animate-pulse bg-slate-100 dark:bg-navy-800" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {halls.map((h, i) => (
              <HallCard key={h.id} hall={h} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="border-y border-slate-200/70 bg-white py-20 dark:border-white/5 dark:bg-navy-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="section-title">Why CampusHalls?</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              A premium booking experience built on Supabase — realtime, secure, and effortless.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card card-hover p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Campus Life
            </p>
            <h2 className="section-title mt-2">Upcoming Events</h2>
          </div>
          <Link to="/events" className="btn-ghost">
            Full calendar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="card p-10 text-center text-sm text-slate-400">No upcoming events right now — check back soon.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {events.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card card-hover flex items-start gap-4 p-5"
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                  <span className="text-lg font-extrabold leading-none">{Number(e.event_date.slice(8, 10))}</span>
                  <span className="text-[10px] font-semibold uppercase">
                    {new Date(`${e.event_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">{e.title}</h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {e.hall?.name ?? 'Campus'} · {formatTime(e.start_time)} – {formatTime(e.end_time)}
                  </p>
                  <p className="mt-1 text-xs text-violet-600 dark:text-violet-300">{formatDate(e.event_date)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-10 text-center shadow-glow sm:p-16">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to host your next event?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-blue-100">
            Create a free account, pick a hall, choose your slot, and submit a booking request in
            under a minute.
          </p>
          <Link to="/register" className="btn relative mt-8 bg-white text-violet-700 shadow-xl hover:bg-blue-50">
            Get started now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
