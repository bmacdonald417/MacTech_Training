import { cn } from "@/lib/utils"

interface TableShellProps {
  children: React.ReactNode
  className?: string
}

export function TableShell({ children, className }: TableShellProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-card backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TableShellHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-b border-border/40 px-5 py-3.5 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TableShellBody({ children, className }: TableShellProps) {
  return <div className={cn("divide-y divide-border/40", className)}>{children}</div>
}

export function TableShellRow({
  children,
  className,
  as: Comp = "div",
}: {
  children: React.ReactNode
  className?: string
  as?: "div" | "tr"
}) {
  return (
    <Comp
      className={cn(
        "flex flex-wrap items-center gap-2 px-5 py-3.5 sm:px-6 transition-colors duration-150 hover:bg-white/[0.03]",
        Comp === "tr" && "table-row",
        className
      )}
    >
      {children}
    </Comp>
  )
}
