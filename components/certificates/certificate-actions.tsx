"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileArchive, Loader2, Printer } from "lucide-react"

interface CertificateActionsProps {
  certificateId: string
  orgSlug: string
}

export function CertificateActions({ certificateId, orgSlug }: CertificateActionsProps) {
  const [downloading, setDownloading] = useState<"pdf" | "zip" | null>(null)

  const handlePrint = () => {
    window.print()
  }

  const download = async (format: "pdf" | "zip") => {
    setDownloading(format)
    try {
      const res = await fetch(
        `/api/org/${orgSlug}/certificates/${certificateId}/download?format=${format}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Download failed")
      }
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition")
      const match = disposition?.match(/filename="?([^";\n]+)"?/)
      const filename = match?.[1] ?? (format === "pdf" ? "certificate.pdf" : "certificate.zip")
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Download failed")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => download("pdf")}
        disabled={!!downloading}
      >
        {downloading === "pdf" ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download certificate (PDF)
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => download("zip")}
        disabled={!!downloading}
      >
        {downloading === "zip" ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileArchive className="h-4 w-4 mr-2" />
        )}
        Certificate + metadata (ZIP)
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  )
}
