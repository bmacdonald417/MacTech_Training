"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { FileUp } from "lucide-react"

interface PresentationsUploadProps {
  orgSlug: string
}

export function PresentationsUpload({ orgSlug }: PresentationsUploadProps) {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setError("Please upload a .pptx file.")
      return
    }
    setError(null)
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/org/${orgSlug}/slides/import-pptx`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Import failed.")
        return
      }
      const slideDeckId = data.slideDeckId
      if (slideDeckId) {
        router.push(`/org/${orgSlug}/admin/presentations/${slideDeckId}`)
        return
      }
      setError("Import succeeded but no deck ID returned.")
    } catch {
      setError("Upload failed.")
    } finally {
      setImporting(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Upload PowerPoint (.pptx)
        </CardTitle>
        <CardDescription>
          Add a new slide deck to this table. After upload you’ll be taken to Manage to edit narrator notes and generate audio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <input
          type="file"
          accept=".pptx"
          className="hidden"
          id="admin-presentations-upload-pptx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ""
          }}
          disabled={importing}
        />
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            "border-primary/40 bg-background/80 hover:border-primary/60 hover:bg-primary/5",
            dragActive && "border-primary bg-primary/10",
            importing && "pointer-events-none opacity-70"
          )}
        >
          <p className="text-sm font-medium text-foreground mb-1">
            Drop your .pptx here or click to browse
          </p>
          <Button
            type="button"
            size="lg"
            onClick={() => document.getElementById("admin-presentations-upload-pptx")?.click()}
            disabled={importing}
            className="mt-3"
          >
            <FileUp className="h-4 w-4 mr-2" />
            {importing ? "Importing…" : "Upload PowerPoint"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
