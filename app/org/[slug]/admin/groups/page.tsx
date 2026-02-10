import Link from "next/link"
import { headers } from "next/headers"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { GroupJoinQR } from "@/components/group-join-qr"
import { GroupJoinCodeGenerateButton } from "./group-join-code-button"
import { Users, Plus } from "lucide-react"

interface GroupsPageProps {
  params: { slug: string }
}

function getBaseUrl() {
  try {
    const h = headers()
    const host = h.get("host") ?? ""
    const proto = h.get("x-forwarded-proto") === "https" ? "https" : "http"
    return `${proto}://${host}`
  } catch {
    return ""
  }
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const membership = await requireAdmin(params.slug)
  const baseUrl = getBaseUrl()

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
                  {[group.groupType?.toLowerCase(), `${group.members.length} members`].filter(Boolean).join(" · ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.joinCode && baseUrl ? (
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Join link / QR code</span>
                    <div className="flex items-center gap-4">
                      <GroupJoinQR
                        joinUrl={`${baseUrl}/join/${group.joinCode}`}
                        size={100}
                        className="rounded border bg-white p-1"
                      />
                      <div className="text-xs text-muted-foreground break-all">
                        {baseUrl}/join/{group.joinCode}
                      </div>
                    </div>
                  </div>
                ) : (
                  <GroupJoinCodeGenerateButton groupId={group.id} orgSlug={params.slug} />
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    View Members
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
