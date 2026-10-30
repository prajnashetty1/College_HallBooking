import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  CalendarCheck2,
  LayoutDashboard,
  Menu,
  Users,
  Wrench,
  Building2,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck2 },
  { to: '/admin/halls', label: 'Halls', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)

  const sidebar = (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="mx-auto flex max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="no-print sticky top-24 hidden h-fit w-60 shrink-0 lg:block">
        <div className="card p-4">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Administration
          </p>
          {sidebar}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="no-print mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 dark:border-white/10 dark:text-slate-300 lg:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Admin menu
        </button>
        {open && <div className="card no-print mb-4 p-4 lg:hidden">{sidebar}</div>}
        <Outlet />
      </div>
    </div>
  )
}
