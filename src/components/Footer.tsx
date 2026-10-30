import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-slate-200/70 bg-white dark:border-white/10 dark:bg-navy-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Campus<span className="text-gradient">Halls</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The smart way to discover, book, and manage college halls. Built for students,
            faculty, and administrators.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="/halls" className="hover:text-violet-600 dark:hover:text-violet-300">All Halls</a></li>
            <li><a href="/events" className="hover:text-violet-600 dark:hover:text-violet-300">Upcoming Events</a></li>
            <li><a href="/register" className="hover:text-violet-600 dark:hover:text-violet-300">Create Account</a></li>
            <li><a href="/bookings" className="hover:text-violet-600 dark:hover:text-violet-300">My Bookings</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">Popular Halls</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li>Sambram Hall</li>
            <li>Amphitheatre</li>
            <li>JKShim MBA Hall</li>
            <li>Netravati Hall</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" /> College Campus, Academic Block, Mangalore, Karnataka 575001</li>
            <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-violet-500" /> halls@college.edu</li>
            <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-violet-500" /> +91 824 000 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
        © {new Date().getFullYear()} CampusHalls · College Hall Management System
      </div>
    </footer>
  )
}
