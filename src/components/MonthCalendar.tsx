import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking, MaintenanceRecord } from '../types'
import { WEEKDAYS, addMonths, cn, daysInMonth, monthYearLabel, toISODate, todayISO } from '../lib/utils'

interface Props {
  month: Date
  onMonthChange: (d: Date) => void
  bookings: Booking[]
  maintenance?: MaintenanceRecord[]
  selectedDate: string | null
  onSelectDate: (iso: string) => void
}

export default function MonthCalendar({
  month,
  onMonthChange,
  bookings,
  maintenance = [],
  selectedDate,
  onSelectDate,
}: Props) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const total = daysInMonth(month)
  const firstDay = new Date(year, m, 1).getDay() // 0 = Sun
  const offset = (firstDay + 6) % 7 // Monday-first offset
  const today = todayISO()

  const bookingsByDate = new Map<string, Booking[]>()
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.status === 'rejected') continue
    const list = bookingsByDate.get(b.event_date) ?? []
    list.push(b)
    bookingsByDate.set(b.event_date, list)
  }
  const maintenanceDates = new Set(maintenance.map((r) => r.scheduled_date))

  const cells: (string | null)[] = [
    ...Array<string | null>(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => toISODate(new Date(year, m, i + 1))),
  ]

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
          {monthYearLabel(month)}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:text-slate-400"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:text-slate-400"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`empty-${i}`} />
          const dayBookings = bookingsByDate.get(iso) ?? []
          const isPast = iso < today
          const isSelected = iso === selectedDate
          const isToday = iso === today
          const hasMaintenance = maintenanceDates.has(iso)
          return (
            <button
              key={iso}
              disabled={isPast}
              onClick={() => onSelectDate(iso)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition',
                isPast && 'cursor-not-allowed text-slate-300 dark:text-slate-600',
                !isPast && !isSelected && 'text-slate-700 hover:bg-violet-50 dark:text-slate-200 dark:hover:bg-white/5',
                isSelected && 'bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white shadow-glow',
                isToday && !isSelected && 'ring-2 ring-violet-400 dark:ring-violet-500'
              )}
            >
              <span>{Number(iso.slice(8, 10))}</span>
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <span
                    key={b.id}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isSelected
                        ? 'bg-white/90'
                        : b.status === 'approved'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                    )}
                  />
                ))}
                {hasMaintenance && (
                  <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/90' : 'bg-purple-500')} />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Maintenance</span>
      </div>
    </div>
  )
}
