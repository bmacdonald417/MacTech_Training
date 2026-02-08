"use client"

import { signOut } from "next-auth/react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { LogOut, ChevronDown, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopbarProps {
  userName?: string | null
  userEmail?: string | null
  pageTitle?: string
  onMenuClick?: () => void
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

export function Topbar({ userName, userEmail, pageTitle, onMenuClick }: TopbarProps) {
  const initials = getInitials(userName, userEmail)
  const displayName = userName || userEmail || "User"

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          {pageTitle ? (
            <h2 className="truncate text-sm font-medium tracking-tight text-foreground sm:text-base">
              {pageTitle}
            </h2>
          ) : (
            <p className="truncate text-sm text-muted-foreground">{displayName}</p>
          )}
        </div>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-left outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="User menu"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
              title={userEmail ?? undefined}
            >
              {initials}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(
              "min-w-[12rem] rounded-xl border border-border/60 bg-card p-1 shadow-card",
              "transition-opacity duration-150"
            )}
            sideOffset={6}
            align="end"
          >
            <div className="px-2 py-2">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              {userEmail && (
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-border/60" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground outline-none transition-colors duration-150 hover:bg-muted focus:bg-muted focus:outline-none"
              onSelect={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  )
}
