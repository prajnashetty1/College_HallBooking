import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound, Loader2, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card w-full p-8">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/15">
              <Mail className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">Email sent</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              If an account exists for <span className="font-semibold">{email}</span>, a password
              reset link is on its way.
            </p>
            <Link to="/login" className="btn-primary mt-6 w-full">Back to sign in</Link>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">Reset password</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter your email and we will send you a reset link.
            </p>
            {error && (
              <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@college.edu"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-violet-600 dark:text-violet-300">Sign in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
