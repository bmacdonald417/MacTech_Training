import { cn } from "@/lib/utils"

type StatusVariant = "default" | "success" | "warning" | "muted"

interface StatusBadgeProps {
  children: React.ReactNode
  variant?: StatusVariant
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-700",
  warning: "bg-amber-500/10 text-amber-700",
  muted: "bg-muted text-muted-foreground",
}

export function StatusBadge({ children, variant = "default", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
