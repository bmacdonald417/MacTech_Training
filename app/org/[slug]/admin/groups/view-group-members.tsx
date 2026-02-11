"use client"

import { useState } from "react"
import { UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Member = {
  id: string
  user: {
    name: string | null
    email: string
  }
}

export function ViewGroupMembersButton({
  groupName,
  members,
}: {
  groupName: string
  members: Member[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          title="View members"
        >
          <UsersRound className="h-4 w-4" />
          View members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogTitle>Members — {groupName}</DialogTitle>
        </DialogHeader>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members in this group yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((m) => (
              <li
                key={m.id}
                className="text-sm text-foreground flex flex-col gap-0.5 py-1 border-b border-border/50 last:border-0"
              >
                <span className="font-medium">{m.user.name ?? m.user.email}</span>
                {m.user.name && (
                  <span className="text-muted-foreground text-xs">{m.user.email}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
