import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  hint?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  action,
  className,
}: EmptyStateProps) {
  const hintOrDesc = hint ?? description
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/10 py-14 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hintOrDesc && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hintOrDesc}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
