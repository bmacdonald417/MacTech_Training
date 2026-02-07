import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

interface GroupsPageProps {
  params: { slug: string }
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const membership = await requireAdmin(params.slug)

  const groups = await prisma.group.findMany({
    where: { orgId: membership.orgId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
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
            Groups
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage user groups for bulk assignments
          </p>
        </div>
        <Button asChild>
          <a href={`/org/${params.slug}/admin/groups/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </a>
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No groups yet.</p>
            <Button asChild>
              <a href={`/org/${params.slug}/admin/groups/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
                <CardDescription>
                  {group.members.length} members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Members
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
