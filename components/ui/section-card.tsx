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
        "rounded-2xl border border-border/60 bg-card shadow-card transition-shadow duration-200 hover:shadow-card-hover",
        className
      )}
    >
      <div className="border-b border-border/60 px-6 py-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
