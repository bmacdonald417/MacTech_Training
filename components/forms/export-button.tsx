"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { format } from "date-fns"

interface ExportButtonProps {
  formTitle: string
  submissions: Array<{
    id: string
    user: { name: string | null; email: string }
    submittedAt: Date
    answersJson: string
  }>
  fields: Array<{ id: string; label: string }>
}

export function ExportButton({ formTitle, submissions, fields }: ExportButtonProps) {
  const handleExport = () => {
    const headers = ["User", "Submitted At", ...fields.map((f) => f.label)]
    const rows = submissions.map((submission) => {
      const answers = JSON.parse(submission.answersJson)
      return [
        submission.user.name || submission.user.email,
        format(new Date(submission.submittedAt), "yyyy-MM-dd HH:mm:ss"),
        ...fields.map((f) => answers[f.id] || ""),
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${formTitle}_submissions.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  )
}
