import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Users, Wrench } from 'lucide-react'
import type { Hall } from '../types'
import { cn } from '../lib/utils'

export default function HallCard({ hall, index = 0 }: { hall: Hall; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
    >
      <Link
        to={`/halls/${hall.id}`}
        className={cn('card card-hover group block overflow-hidden', !hall.is_active && 'opacity-60')}
      >
        <div className="relative h-52 overflow-hidden">
          <img
            src={hall.image_url ?? ''}
            alt={hall.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
          {!hall.is_active && (
            <div className="glass absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-800 dark:text-white">
              <Wrench className="h-3.5 w-3.5" /> Under maintenance
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white/90">
            <Users className="h-3.5 w-3.5" /> Seats {hall.capacity}
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-bold text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
            {hall.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-violet-500" /> {hall.location}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hall.facilities.slice(0, 3).map((f) => (
              <span
                key={f}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300"
              >
                {f}
              </span>
            ))}
            {hall.facilities.length > 3 && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                +{hall.facilities.length - 3} more
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-violet-600 dark:border-white/5 dark:text-violet-300">
            Check availability
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
