import Link from "next/link"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
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
      <PageHeader
        title="Groups"
        description="Manage user groups for bulk assignments"
        action={
          <Button asChild className="gap-2">
            <Link href={`/org/${params.slug}/admin/groups/new`}>
              <Plus className="h-4 w-4" />
              Create Group
            </Link>
          </Button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create a group to assign training to multiple users at once."
          action={
            <Button asChild className="gap-2">
              <Link href={`/org/${params.slug}/admin/groups/new`}>
                <Plus className="h-4 w-4" />
                Create group
              </Link>
            </Button>
          }
        />
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
