"use client"

import { useEffect, useRef, useState } from "react"

const FETCH_TIMEOUT_MS = 15000
const PREVIEW_TIMEOUT_MS = 30000

/**
 * Local test page: loads /test-normalized.pptx and runs pptx-preview.
 * Run: npx tsx scripts/test-pptx-normalize-and-preview.ts
 * Then open /test-pptx-viewer
 */
export default function TestPptxViewerPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState<{ message: string; stack?: string } | null>(null)
  const [done, setDone] = useState(false)

  const append = (line: string) => {
    setLog((prev) => [...prev, line])
    console.log("[test-pptx]", line)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false

    const timeout = (ms: number, msg: string) =>
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${msg} (${ms}ms)`)), ms)
      )

    append("Fetching /test-normalized.pptx...")
    Promise.race([
      fetch("/test-normalized.pptx").then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.arrayBuffer()
      }),
      timeout(FETCH_TIMEOUT_MS, "Fetch timed out"),
    ])
      .then((buf) => {
        if (cancelled) return
        append(`Loaded ${(buf as ArrayBuffer).byteLength} bytes`)
        return import("pptx-preview").then(({ init }) => {
          if (cancelled) return
          append("pptx-preview loaded, initing...")
          const previewer = init(el, { width: 960, height: 540, mode: "slide" })
          append("Calling preview()...")
          return Promise.race([
            (previewer as { preview: (b: ArrayBuffer) => Promise<void> }).preview(buf as ArrayBuffer),
            timeout(PREVIEW_TIMEOUT_MS, "preview() timed out"),
          ]).then(() => {
            if (!cancelled) append("preview() resolved OK")
          })
        })
      })
      .then(() => {
        if (!cancelled) setDone(true)
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err?.message ?? String(err)
        const stack = err?.stack
        append("ERROR: " + msg)
        if (stack) append("STACK: " + stack)
        setError({ message: msg, stack })
        setDone(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-xl font-bold mb-4">PPTX preview test (normalized file)</h1>
      {!done && log.length === 0 && (
        <p className="mb-4 text-gray-400">
          Loading… If this hangs, run first:{" "}
          <code className="bg-gray-800 px-1 rounded">npx tsx scripts/test-pptx-normalize-and-preview.ts</code>
        </p>
      )}
      <div
        ref={containerRef}
        className="bg-black rounded overflow-hidden mb-4"
        style={{ width: 960, height: 540 }}
      />
      <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto max-h-64">
        {log.length ? log.join("\n") : "(waiting…)"}
      </pre>
      {error && (
        <div className="mt-4 p-4 bg-red-900/50 rounded">
          <p className="font-bold">Error:</p>
          <pre className="text-sm whitespace-pre-wrap mt-2">{error.message}</pre>
          {error.stack && (
            <pre className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
