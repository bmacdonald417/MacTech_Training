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
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-semibold">MacTech Training</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {getLinks().map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
