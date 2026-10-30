import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, GraduationCap, Loader2, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'
import { cn } from '../lib/utils'

const roleOptions: { value: Exclude<Role, 'admin'>; label: string; icon: typeof BookOpen; desc: string }[] = [
  { value: 'student', label: 'Student', icon: BookOpen, desc: 'Book halls for club events and activities' },
  { value: 'faculty', label: 'Faculty', icon: GraduationCap, desc: 'Book halls for lectures, seminars and meetings' },
]

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('student')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error, sessionCreated } = await signUp(fullName, email, password, role)
    setLoading(false)
    if (error) {
      setError(error)
    } else if (sessionCreated) {
      navigate('/', { replace: true })
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/15">
            <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-slate-900 dark:text-white">Email confirmation is still enabled</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            To allow sign-in without verification, open your Supabase project and turn off
            <span className="font-semibold"> Confirm email</span> under Authentication → Providers → Email.
            Then create your account again.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-6 w-full">
            Go to sign in
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-lg">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Join CampusHalls to book college venues in seconds.
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setRole(o.value)}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition',
                    role === o.value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-slate-200 hover:border-violet-300 dark:border-white/10'
                  )}
                >
                  <o.icon className={cn('h-5 w-5', role === o.value ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400')} />
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{o.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{o.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="label" htmlFor="name">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" placeholder="Aarav Sharma" autoComplete="name" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="email">College email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@college.edu" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="At least 6 characters" autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Admin accounts are provisioned by the college IT office only.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
