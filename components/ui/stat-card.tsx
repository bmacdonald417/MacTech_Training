import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: string; positive?: boolean }
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-6 text-card-foreground shadow-card backdrop-blur-sm transition-shadow duration-150 hover:shadow-card-hover sm:p-7",
        className
      )}
    >
      {Icon && (
        <div className="absolute right-5 top-5 opacity-[0.07] transition-opacity duration-150 group-hover:opacity-[0.1]">
          <Icon className="h-11 w-11 text-foreground sm:h-12 sm:w-12" strokeWidth={1.25} />
        </div>
      )}
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive === false ? "text-destructive" : "text-success"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
