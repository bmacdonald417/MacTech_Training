import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Shield, GraduationCap, User } from "lucide-react"

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Users
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage organization users and roles
          </p>
        </div>
        <Button asChild>
          <a href={`/org/${params.slug}/admin/users/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            {memberships.length} total members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {memberships.map((m) => {
              const RoleIcon = roleIcons[m.role as keyof typeof roleIcons] || User

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-transparent px-4 py-4 transition-colors hover:border-border/60 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {m.user.name || m.user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">{m.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {m.role}
                    </span>
                    <Button variant="outline" size="sm">
                      Edit Role
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
