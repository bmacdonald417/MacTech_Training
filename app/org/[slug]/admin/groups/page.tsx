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
import { ViewGroupMembersButton } from "./view-group-members"
import { Users, Plus, BookOpen, GraduationCap } from "lucide-react"

interface GroupsPageProps {
  params: Promise<{ slug: string }>
}

async function getBaseUrl() {
  try {
    const h = await headers()
    const host = h.get("host") ?? ""
    const proto = h.get("x-forwarded-proto") === "https" ? "https" : "http"
    return `${proto}://${host}`
  } catch {
    return ""
  }
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const { slug } = await params
  const membership = await requireAdmin(slug)
  const baseUrl = await getBaseUrl()

  const groups = await prisma.group.findMany({
    where: { orgId: membership.orgId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      assignments: {
        where: { type: "CURRICULUM", curriculumId: { not: null } },
        include: {
          curriculum: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
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
            <Link href={`/org/${slug}/admin/groups/new`}>
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
              <Link href={`/org/${slug}/admin/groups/new`}>
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CardDescription>
                    {[group.groupType?.toLowerCase(), `${group.members.length} members`].filter(Boolean).join(" · ")}
                  </CardDescription>
                  <ViewGroupMembersButton groupName={group.name} members={group.members} />
                </div>
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
                  <GroupJoinCodeGenerateButton groupId={group.id} orgSlug={slug} />
                )}
                {group.assignments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Assigned curricula</span>
                    <ul className="space-y-1">
                      {group.assignments.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm text-foreground">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {a.curriculum?.title ?? a.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/org/${slug}/admin/groups/${group.id}/assign-curriculum`} className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Assign curriculum
                    </Link>
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
