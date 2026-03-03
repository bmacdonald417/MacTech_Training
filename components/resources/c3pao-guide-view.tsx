"use client"

import * as React from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import type { C3PAOParsed, DocRow, PracticeRow } from "@/lib/c3pao-guide"

interface C3PAOGuideViewProps {
  data: C3PAOParsed
  overviewIntroHtml: string
  conclusionHtml: string
}

export function C3PAOGuideView({ data, overviewIntroHtml, conclusionHtml }: C3PAOGuideViewProps) {
  const tabValues = [
    "overview",
    ...data.domains.map((d) => d.id),
    "conclusion",
  ]
  const defaultTab = tabValues[0]

  return (
    <Tabs.Root defaultValue={defaultTab} className="w-full">
      <Tabs.List
        className={cn(
          "inline-flex w-full flex-wrap gap-1 rounded-xl bg-muted/50 p-1",
          "border border-border/40"
        )}
      >
        <Tabs.Trigger
          value="overview"
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
            "data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          Overview
        </Tabs.Trigger>
        {data.domains.map((d) => (
          <Tabs.Trigger
            key={d.id}
            value={d.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-muted/70"
            )}
          >
            {d.shortLabel}
          </Tabs.Trigger>
        ))}
        <Tabs.Trigger
          value="conclusion"
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
            "data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          Conclusion
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" className="mt-6 focus-visible:outline-none">
        <div className="space-y-8">
          <div
            className="resource-prose min-w-0 max-w-[65ch] prose prose-invert prose-p:text-muted-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: overviewIntroHtml }}
          />
          {data.generalDocsTable.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
              <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  General Documentation and Evidence Requirements
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  What C3PAOs typically request from the OSC
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-4 py-3 text-left font-medium text-foreground">Document</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.generalDocsTable.map((row: DocRow, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-foreground align-top">
                          {row.document}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground align-top">
                          {row.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Tabs.Content>

      {data.domains.map((domain) => (
        <Tabs.Content
          key={domain.id}
          value={domain.id}
          className="mt-6 focus-visible:outline-none"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">{domain.title}</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="w-32 shrink-0 px-4 py-3 text-left font-medium text-foreground">
                      Practice
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Interview</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Examine</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Test</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">
                      Codex Accelerator
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {domain.practices.map((row: PracticeRow, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="w-32 shrink-0 px-4 py-3 align-top">
                        <span className="font-medium text-foreground">{row.id}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{row.title}</span>
                      </td>
                      <td className="min-w-[12rem] max-w-md px-4 py-3 text-muted-foreground align-top">
                        {row.interview || "—"}
                      </td>
                      <td className="min-w-[12rem] max-w-md px-4 py-3 text-muted-foreground align-top">
                        {row.examine || "—"}
                      </td>
                      <td className="min-w-[12rem] max-w-md px-4 py-3 text-muted-foreground align-top">
                        {row.test || "—"}
                      </td>
                      <td className="min-w-[12rem] max-w-md px-4 py-3 text-muted-foreground align-top">
                        {row.codex || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>
      ))}

      <Tabs.Content value="conclusion" className="mt-6 focus-visible:outline-none">
        <div
          className="resource-prose min-w-0 max-w-[65ch] prose prose-invert prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: conclusionHtml }}
        />
      </Tabs.Content>
    </Tabs.Root>
  )
}
