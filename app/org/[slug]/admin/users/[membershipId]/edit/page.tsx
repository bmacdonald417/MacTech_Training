import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { EditRoleForm } from "./edit-role-form"

interface EditUserRolePageProps {
  params: Promise<{ slug: string; membershipId: string }>
}

export default async function EditUserRolePage({ params }: EditUserRolePageProps) {
  const { slug, membershipId } = await params
  const membership = await requireAdmin(slug)

  const record = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId: membership.orgId,
    },
    include: { user: true },
  })

  if (!record) {
    notFound()
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={`/org/${slug}/admin/users`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Edit role
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {record.user.name || record.user.email} · {record.user.email}
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Role</CardTitle>
          <CardDescription>
            Change this member&apos;s role in the organization. Admins can manage users and settings; trainers can manage content and assignments; trainees can view assigned training.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditRoleForm
            orgSlug={slug}
            membershipId={membershipId}
            currentRole={record.role}
          />
        </CardContent>
      </Card>
    </div>
  )
}
