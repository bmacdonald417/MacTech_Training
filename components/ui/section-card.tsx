import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-card backdrop-blur-sm transition-shadow duration-150 hover:shadow-card-hover",
        className
      )}
    >
      <div className="border-b border-border/40 px-6 py-4 sm:px-7 sm:py-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-6 sm:p-7">{children}</div>
    </div>
  )
}
