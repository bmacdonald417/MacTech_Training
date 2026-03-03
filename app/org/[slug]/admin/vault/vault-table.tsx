"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

type VaultRecord = {
  id: string
  enrollmentId: string
  userId: string
  certificateId: string | null
  certificateNumber: string | null
  assignmentTitle: string
  completedAt: Date
  verificationHash: string
  createdAt: Date
  user: { email: string; name: string | null } | null
}

export function VaultTable({
  records,
  showUserColumn = true,
  emptyMessage = "No completion records yet. Records are added when users complete training.",
}: {
  records: VaultRecord[]
  showUserColumn?: boolean
  emptyMessage?: string
}) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Completed</th>
            {showUserColumn && <th className="text-left p-3 font-medium">User</th>}
            <th className="text-left p-3 font-medium">Assignment</th>
            <th className="text-left p-3 font-medium">Certificate #</th>
            <th className="text-left p-3 font-medium">Verification hash</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b last:border-0">
              <td className="p-3 whitespace-nowrap">
                {format(new Date(record.completedAt), "PPp")}
              </td>
              {showUserColumn && (
                <td className="p-3">
                  <span className="font-medium">{record.user?.name ?? "—"}</span>
                  <br />
                  <span className="text-muted-foreground text-xs">{record.user?.email ?? record.userId}</span>
                </td>
              )}
              <td className="p-3">{record.assignmentTitle}</td>
              <td className="p-3 font-mono text-xs">{record.certificateNumber ?? "—"}</td>
              <td className="p-3">
                <HashCell hash={record.verificationHash} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HashCell({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false)

  async function copyHash() {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all max-w-[200px] truncate" title={hash}>
        {hash}
      </code>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyHash} title="Copy hash">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}
