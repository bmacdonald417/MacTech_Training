"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

interface AppShellProps {
  orgSlug: string
  role: string
  userName?: string | null
  userEmail?: string | null
  userGroupNames?: string[]
  children: React.ReactNode
}

export function AppShell({
  orgSlug,
  role,
  userName,
  userEmail,
  userGroupNames = [],
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Full-bleed pages: use the entire viewport area (no padded, scrollable main)
  // This prevents nested scrolling and gives slide decks maximum space.
  const isFullBleed =
    pathname.includes("/training/") ||
    pathname.includes("/trainer/content/")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        orgSlug={orgSlug}
        role={role}
        userGroupNames={userGroupNames}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main
          className={
            isFullBleed
              ? "flex-1 overflow-hidden bg-app-canvas p-0"
              : "flex-1 overflow-y-auto bg-app-canvas px-4 py-6 sm:px-6 lg:px-8"
          }
        >
          <div
            className={
              isFullBleed
                ? "h-full w-full max-w-none"
                : "mx-auto max-w-6xl"
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
