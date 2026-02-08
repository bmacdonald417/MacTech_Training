"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopbarProps {
  userName?: string | null
  userEmail?: string | null
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "U"
}

export function Topbar({ userName, userEmail }: TopbarProps) {
  const initials = getInitials(userName, userEmail)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-card/80 px-6 backdrop-blur-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-muted-foreground">
          {userName || userEmail || "User"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
          title={userEmail ?? undefined}
        >
          {initials}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
