"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface MarkdownDocViewProps {
  /** Rendered HTML from markdownToHtml(content) */
  html: string
  /** Optional title override (otherwise first h1 in content is the doc title) */
  title?: string
  /** Optional short description shown under the title */
  description?: string
  className?: string
}

export function MarkdownDocView({
  html,
  title,
  description,
  className,
}: MarkdownDocViewProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card/50 shadow-card overflow-hidden",
        "ring-1 ring-white/[0.02]",
        className
      )}
    >
      {/* Top bar: optional label */}
      <div className="border-b border-border/40 bg-muted/20 px-6 py-3 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reference
        </p>
      </div>

      <article
        className={cn(
          "markdown-doc-prose",
          "px-6 py-8 sm:px-8 sm:py-10 lg:px-12"
        )}
        style={{ scrollMarginTop: "6rem" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
