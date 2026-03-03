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
  MonitorPlay,
  Users,
  Settings,
  BarChart3,
  Archive,
  X,
  LayoutPanelLeft,
  Library,
  ShieldCheck,
} from "lucide-react"

interface SidebarProps {
  orgSlug: string
  role: string
  userGroupNames?: string[]
  mobileOpen?: boolean
  onClose?: () => void
}

const traineeLinks = [
  { href: (s: string) => `/org/${s}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { href: (s: string) => `/org/${s}/my-training`, label: "My Training", icon: BookOpen },
  { href: (s: string) => `/org/${s}/resources`, label: "Resources", icon: Library },
  { href: (s: string) => `/org/${s}/triptych`, label: "CUI Enclave User Training", icon: LayoutPanelLeft },
  { href: (s: string) => `/org/${s}/certificates`, label: "Certificates", icon: Award },
  { href: (s: string) => `/org/${s}/records`, label: "Verification records", icon: ShieldCheck },
]

const trainerLinks = [
  { href: (s: string) => `/org/${s}/trainer/content`, label: "Content", icon: FileText },
  { href: (s: string) => `/org/${s}/trainer/curricula`, label: "Curricula", icon: GraduationCap },
  { href: (s: string) => `/org/${s}/trainer/assignments`, label: "Assignments", icon: BookOpen },
]

const adminLinks = [
  { href: (s: string) => `/org/${s}/admin/users`, label: "Users", icon: Users },
  { href: (s: string) => `/org/${s}/admin/groups`, label: "Groups", icon: Users },
  { href: (s: string) => `/org/${s}/admin/presentations`, label: "Presentations", icon: MonitorPlay },
  { href: (s: string) => `/org/${s}/admin/reports`, label: "Reports", icon: BarChart3 },
  { href: (s: string) => `/org/${s}/admin/vault`, label: "Completion vault", icon: ShieldCheck },
  { href: (s: string) => `/org/${s}/admin/archive`, label: "Archive", icon: Archive },
  { href: (s: string) => `/org/${s}/admin/settings`, label: "Settings", icon: Settings },
]

function NavSection({
  title,
  links,
  orgSlug,
  pathname,
  onNavigate,
}: {
  title: string
  links: { href: (s: string) => string; label: string; icon: typeof FileText }[]
  orgSlug: string
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-0.5">
      <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      {links.map((link) => {
        const href = link.href(orgSlug)
        const Icon = link.icon
        const isActive =
          pathname === href ||
          (href.endsWith("/resources") && pathname.startsWith(href + "/"))
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors duration-150",
              isActive
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 h-[18px] w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                aria-hidden
              />
            )}
            <Icon
              className="h-[17px] w-[17px] shrink-0"
              strokeWidth={isActive ? 2.5 : 1.75}
            />
            <span className="tracking-tight">{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar({ orgSlug, role, userGroupNames = [], mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[212px] flex-col border-r border-border/40 bg-card/95 shadow-card backdrop-blur-md transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-12 shrink-0 items-center border-b border-border/40 px-3 py-3">
          <span className="text-[13px] font-semibold tracking-tight text-foreground">
            MacTech Training
          </span>
          {onClose && (
            <button
              type="button"
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Group
            </p>
            <div className="px-2.5 py-2">
              {userGroupNames.length > 0 ? (
                <p className="text-[13px] font-medium text-foreground">
                  {userGroupNames.join(", ")}
                </p>
              ) : (
                <p className="text-[13px] text-muted-foreground">No group assigned</p>
              )}
            </div>
          </div>
          <NavSection
            title="Overview"
            links={traineeLinks}
            orgSlug={orgSlug}
            pathname={pathname}
            onNavigate={onClose}
          />
          {role === "ADMIN" && (
            <NavSection
              title="Training"
              links={trainerLinks}
              orgSlug={orgSlug}
              pathname={pathname}
              onNavigate={onClose}
            />
          )}
          {role === "ADMIN" && (
            <NavSection
              title="Admin"
              links={adminLinks}
              orgSlug={orgSlug}
              pathname={pathname}
              onNavigate={onClose}
            />
          )}
        </nav>
      </aside>

      {mobileOpen && onClose && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={onClose}
        />
      )}
    </>
  )
}
