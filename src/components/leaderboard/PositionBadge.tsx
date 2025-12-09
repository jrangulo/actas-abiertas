import { Award } from 'lucide-react'

export function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-200 dark:bg-yellow-900/40">
        <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      </div>
    )
  }
  if (position === 2) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800">
        <Award className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </div>
    )
  }
  if (position === 3) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-200 dark:bg-amber-900/40">
        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
      <span className="font-bold text-muted-foreground">{position}</span>
    </div>
  )
}
