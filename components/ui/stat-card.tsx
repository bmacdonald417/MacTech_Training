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
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 text-card-foreground shadow-card transition-all duration-200 hover:border-border hover:shadow-card-hover",
        className
      )}
    >
      {Icon && (
        <div className="absolute right-4 top-4 opacity-[0.07] transition-opacity duration-200 group-hover:opacity-[0.12]">
          <Icon className="h-12 w-12 text-foreground" strokeWidth={1.25} />
        </div>
      )}
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive === false ? "text-amber-600" : "text-emerald-600"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
