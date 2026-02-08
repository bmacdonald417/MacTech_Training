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
import { Plus, Shield, GraduationCap, User } from "lucide-react"

interface UsersPageProps {
  params: { slug: string }
}

const roleIcons = {
  ADMIN: Shield,
  TRAINER: GraduationCap,
  TRAINEE: User,
}

export default async function UsersPage({ params }: UsersPageProps) {
  const membership = await requireAdmin(params.slug)

  const memberships = await prisma.membership.findMany({
    where: { orgId: membership.orgId },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Users"
        description="Manage organization users and roles"
        action={
          <Button asChild className="gap-2">
            <Link href={`/org/${params.slug}/admin/users/new`}>
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
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className="bg-muted text-muted-foreground">{m.role}</Badge>
                  <Button variant="outline" size="sm">
                    Edit Role
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
