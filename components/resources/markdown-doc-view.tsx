"use client"

import * as React from "react"
import { extractToc } from "@/lib/markdown"
import { cn } from "@/lib/utils"

export interface MarkdownDocViewProps {
  /** Rendered HTML from markdownToHtml(content) */
  html: string
  /** Optional title override (otherwise first h1 in content is the doc title) */
  title?: string
  /** Optional short description shown under the title */
  description?: string
  /** Show sticky table of contents on the side (default true when TOC has entries) */
  showToc?: boolean
  className?: string
}

export function MarkdownDocView({
  html,
  title,
  description,
  showToc = true,
  className,
}: MarkdownDocViewProps) {
  const toc = React.useMemo(() => extractToc(html), [html])
  const hasToc = toc.length > 0 && showToc

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

      <div className="flex flex-col lg:flex-row">
        {/* Sticky TOC — left on large screens */}
        {hasToc && (
          <aside
            className={cn(
              "shrink-0 border-b border-border/40 lg:border-b-0 lg:border-r lg:w-56 xl:w-64",
              "bg-muted/10 lg:bg-transparent",
              "px-6 py-5 lg:py-8 lg:pl-8 lg:pr-6"
            )}
          >
            <nav aria-label="On this page" className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                On this page
              </p>
              <ul className="space-y-1.5">
                {toc.map(({ id, text, level }) => (
                  <li
                    key={id}
                    className={cn(
                      level === 3 && "pl-3 border-l border-border/40 ml-0.5"
                    )}
                  >
                    <a
                      href={`#${id}`}
                      className={cn(
                        "block py-0.5 text-sm transition-colors rounded-md",
                        "text-muted-foreground hover:text-foreground hover:bg-white/5",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <article
            className={cn(
              "markdown-doc-prose",
              "px-6 py-8 sm:px-8 sm:py-10",
              hasToc ? "lg:pr-12 lg:pl-10" : "lg:px-12"
            )}
            style={{ scrollMarginTop: "6rem" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
