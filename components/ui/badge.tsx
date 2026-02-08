import { cn } from "@/lib/utils"

export type BadgeStatus = "Assigned" | "In Progress" | "Completed" | "Overdue"

const statusStyles: Record<BadgeStatus, string> = {
  Assigned: "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/15 text-primary",
  Completed: "bg-success/15 text-emerald-400",
  Overdue: "bg-destructive/15 text-destructive",
}

interface BadgeProps {
  children: React.ReactNode
  status?: BadgeStatus
  variant?: "default" | "outline"
  className?: string
}

export function Badge({
  children,
  status,
  variant = "default",
  className,
}: BadgeProps) {
  const base = "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium"
  const style = status ? statusStyles[status] : "bg-muted text-muted-foreground"
  const outline = variant === "outline" ? "border border-border" : ""

  return (
    <span className={cn(base, style, outline, className)}>
      {children}
    </span>
  )
}
