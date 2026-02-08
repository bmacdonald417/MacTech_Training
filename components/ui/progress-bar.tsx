import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: ProgressBarProps) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all duration-200",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
