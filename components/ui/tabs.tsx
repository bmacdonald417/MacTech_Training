import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface TabItem {
  value: string
  label: string
}

interface TabNavProps {
  tabs: TabItem[]
  currentValue: string
  basePath: string
  className?: string
}

/**
 * URL-based tab navigation. Each tab links to basePath?tab={value}.
 * Use with searchParams.tab on the page.
 */
export function TabNav({
  tabs,
  currentValue,
  basePath,
  className,
}: TabNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Content categories"
      className={cn(
        "inline-flex rounded-lg bg-muted/50 p-0.5",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = currentValue === tab.value
        const href = tab.value === "all" ? basePath : `${basePath}?tab=${tab.value}`

        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
