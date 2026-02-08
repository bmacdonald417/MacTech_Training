"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Award,
  FileText,
  GraduationCap,
  Users,
  Settings,
  BarChart3,
} from "lucide-react"

interface SidebarProps {
  orgSlug: string
  role: string
}

export function Sidebar({ orgSlug, role }: SidebarProps) {
  const pathname = usePathname()

  const traineeLinks = [
    { href: `/org/${orgSlug}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/org/${orgSlug}/my-training`, label: "My Training", icon: BookOpen },
    { href: `/org/${orgSlug}/certificates`, label: "Certificates", icon: Award },
  ]

  const trainerLinks = [
    { href: `/org/${orgSlug}/trainer/content`, label: "Content", icon: FileText },
    { href: `/org/${orgSlug}/trainer/curricula`, label: "Curricula", icon: GraduationCap },
    { href: `/org/${orgSlug}/trainer/assignments`, label: "Assignments", icon: BookOpen },
  ]

  const adminLinks = [
    { href: `/org/${orgSlug}/admin/users`, label: "Users", icon: Users },
    { href: `/org/${orgSlug}/admin/groups`, label: "Groups", icon: Users },
    { href: `/org/${orgSlug}/admin/reports`, label: "Reports", icon: BarChart3 },
    { href: `/org/${orgSlug}/admin/settings`, label: "Settings", icon: Settings },
  ]

  const getLinks = () => {
    const links = [...traineeLinks]
    if (role === "TRAINER" || role === "ADMIN") {
      links.push(...trainerLinks)
    }
    if (role === "ADMIN") {
      links.push(...adminLinks)
    }
    return links
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border/60 bg-card">
      <div className="flex h-14 items-center px-5">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          MacTech Training
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {getLinks().map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
