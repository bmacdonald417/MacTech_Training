import Link from "next/link"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TableShell,
  TableShellHeader,
  TableShellBody,
  TableShellRow,
} from "@/components/ui/table-shell"
import { UserGroupSelect } from "./user-group-select"
import { Plus, Shield, GraduationCap, User } from "lucide-react"

interface UsersPageProps {
  params: Promise<{ slug: string }>
}

const roleIcons = {
  ADMIN: Shield,
  USER: User,
  // Legacy roles map to USER for display
  TRAINER: User,
  TRAINEE: User,
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { slug } = await params
  const membership = await requireAdmin(slug)

  const memberships = await prisma.membership.findMany({
    where: { orgId: membership.orgId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  })
  const userIds = memberships.map((m) => m.userId)

  const [groups, groupMembersInOrg] = await Promise.all([
    prisma.group.findMany({
      where: { orgId: membership.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    userIds.length > 0
      ? prisma.groupMember.findMany({
          where: {
            group: { orgId: membership.orgId },
            userId: { in: userIds },
          },
          include: { group: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
  ])

  const userIdToGroup = new Map<string, { id: string; name: string }>()
  for (const gm of groupMembersInOrg) {
    if (!userIdToGroup.has(gm.userId)) {
      userIdToGroup.set(gm.userId, { id: gm.group.id, name: gm.group.name })
    }
  }

  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }))

  return (
    <div className="space-y-10">
      <PageHeader
        title="Users"
        description="Manage organization users, roles, and groups"
        action={
          <Button asChild className="gap-2">
            <Link href={`/org/${slug}/admin/users/new`}>
              <Plus className="h-4 w-4" />
              Add User
            </Link>
          </Button>
        }
      />

      <TableShell>
        <TableShellHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Organization Members
            </h2>
            <span className="text-sm text-muted-foreground">{memberships.length} total</span>
          </div>
        </TableShellHeader>
        <TableShellBody>
          {memberships.map((m) => {
            const RoleIcon = roleIcons[m.role as keyof typeof roleIcons] || User
            const currentGroup = userIdToGroup.get(m.userId)
            return (
              <TableShellRow key={m.id}>
                <div className="flex flex-1 items-center gap-4 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <RoleIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {m.user.name || m.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{m.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <Badge className="bg-muted text-muted-foreground">
                {m.role === "ADMIN" ? "Site Admin" : "User"}
              </Badge>
                  <UserGroupSelect
                    orgSlug={slug}
                    userId={m.userId}
                    groups={groupOptions}
                    currentGroupId={currentGroup?.id ?? null}
                    currentGroupName={currentGroup?.name ?? null}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/org/${slug}/admin/users/${m.id}/edit`}>
                      Edit Role
                    </Link>
                  </Button>
                </div>
              </TableShellRow>
            )
          })}
        </TableShellBody>
      </TableShell>
    </div>
  )
}
