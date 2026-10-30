import type { BookingStatus } from '../types'
import { cn, statusLabels, statusStyles } from '../lib/utils'

export function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn('chip capitalize', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
    faculty: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    student: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  }
  return <span className={cn('chip capitalize', styles[role] ?? styles.student)}>{role}</span>
}
