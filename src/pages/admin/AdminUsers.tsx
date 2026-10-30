import { useEffect, useState } from 'react'
import { CalendarCheck2, Loader2, Search, ShieldAlert, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { Profile, Role } from '../../types'
import { RoleBadge } from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { cn } from '../../lib/utils'

const roleColors: Record<Role, string> = {
  student: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300',
  faculty: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300',
  admin: 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-300',
}

export default function AdminUsers() {
  const { profile: me } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const changeRole = async (user: Profile, role: Role) => {
    if (user.id === me?.id) {
      setMessage('You cannot change your own role.')
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setUpdating(user.id)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id)
    setUpdating(null)
    if (error) {
      setMessage(error.message)
      setTimeout(() => setMessage(null), 3000)
    } else {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)))
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${u.full_name} ${u.email} ${u.department ?? ''}`.toLowerCase().includes(q)
  })

  const counts = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    faculty: users.filter((u) => u.role === 'faculty').length,
    admins: users.filter((u) => u.role === 'admin').length,
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Manage roles for students, faculty and administrators.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Users', value: counts.total, icon: Users, accent: 'from-blue-500 to-indigo-600' },
          { label: 'Students', value: counts.students, icon: Users, accent: 'from-sky-500 to-blue-600' },
          { label: 'Faculty', value: counts.faculty, icon: CalendarCheck2, accent: 'from-indigo-500 to-violet-600' },
          { label: 'Admins', value: counts.admins, icon: ShieldAlert, accent: 'from-violet-500 to-purple-600' },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', s.accent)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, department…" className="input pl-10" />
      </div>

      {message && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          {message}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-slate-100 dark:bg-navy-800" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6"><EmptyState title="No users found" message="Try a different search term." /></div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-white/5">
                <th className="px-5 py-3.5 font-semibold">User</th>
                <th className="px-5 py-3.5 font-semibold">Department</th>
                <th className="px-5 py-3.5 font-semibold">Joined</th>
                <th className="px-5 py-3.5 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-white/5 dark:hover:bg-white/5">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
                        {u.full_name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{u.full_name}</p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{u.department ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={u.role} />
                      {updating === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => void changeRole(u, e.target.value as Role)}
                          disabled={u.id === me?.id}
                          className={cn(
                            'cursor-pointer rounded-lg border bg-transparent px-2 py-1 text-xs font-semibold outline-none transition',
                            roleColors[u.role],
                            u.id === me?.id && 'cursor-not-allowed opacity-50'
                          )}
                        >
                          <option value="student">student</option>
                          <option value="faculty">faculty</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
