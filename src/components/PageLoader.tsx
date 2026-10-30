import { Loader2 } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading CampusHalls…</p>
      </div>
    </div>
  )
}
