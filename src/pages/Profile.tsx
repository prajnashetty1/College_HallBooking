import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck2, CheckCircle2, Clock, Loader2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { RoleBadge } from '../components/Badge'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ total: 0, upcoming: 0 })

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setDepartment(profile.department ?? '')
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, event_date, status')
        .eq('user_id', user.id)
      const list = data ?? []
      const today = new Date().toISOString().slice(0, 10)
      setStats({
        total: list.length,
        upcoming: list.filter((b: { event_date: string; status: string }) => b.event_date >= today && b.status === 'approved').length,
      })
    }
    void load()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaved(false)
    await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), department: department.trim() || null })
      .eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="card overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-violet-600 text-3xl font-extrabold text-white shadow-glow dark:border-navy-800">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="pb-1">
                  <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{profile?.full_name}</h1>
                  <div className="mt-1 flex items-center gap-2">
                    <RoleBadge role={profile?.role ?? 'student'} />
                    <span className="text-sm text-slate-500 dark:text-slate-400">{profile?.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pb-1">
                <div className="card px-4 py-3 text-center">
                  <p className="flex items-center gap-1.5 font-display text-xl font-bold text-slate-900 dark:text-white">
                    <CalendarCheck2 className="h-4 w-4 text-violet-500" /> {stats.total}
                  </p>
                  <p className="text-[11px] text-slate-400">Total bookings</p>
                </div>
                <div className="card px-4 py-3 text-center">
                  <p className="flex items-center gap-1.5 font-display text-xl font-bold text-slate-900 dark:text-white">
                    <Clock className="h-4 w-4 text-emerald-500" /> {stats.upcoming}
                  </p>
                  <p className="text-[11px] text-slate-400">Upcoming</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-8 space-y-4 border-t border-slate-100 pt-6 dark:border-white/5">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Profile details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="fullName">Full name</label>
                  <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="department">Department / Club</label>
                  <input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="input" placeholder="e.g. CSE / IEEE Student Branch" />
                </div>
              </div>
              <div>
                <label className="label">Email (cannot be changed)</label>
                <input value={profile?.email ?? ''} disabled className="input opacity-60" />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Profile updated
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
