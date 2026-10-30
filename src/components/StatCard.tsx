import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'

export function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView || !ref.current) return
    const controls = animate(0, to, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v).toLocaleString()}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, to, suffix])

  return <span ref={ref}>0{suffix}</span>
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  accent = 'from-blue-500 to-violet-600',
}: {
  icon: LucideIcon
  label: string
  value: number
  suffix?: string
  accent?: string
}) {
  return (
    <div className="card card-hover p-6">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', accent)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            <AnimatedCounter to={value} suffix={suffix} />
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  )
}
