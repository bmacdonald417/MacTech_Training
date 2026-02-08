import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  const sub = description ?? subtitle
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tighter text-foreground sm:text-3xl lg:text-[2rem]">
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2">{sub}</p>
        )}
      </div>
      {action && <div className="mt-4 shrink-0 sm:mt-0">{action}</div>}
    </div>
  )
}
