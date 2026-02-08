import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrganizationProfileForm } from "./organization-profile-form"

interface SettingsPageProps {
  params: { slug: string }
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const membership = await requireAdmin(params.slug)

  const org = await prisma.organization.findUnique({
    where: { id: membership.orgId },
  })

  if (!org) {
    return null
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        description="Manage organization settings and preferences"
      />

      <div className="grid gap-6">
        <OrganizationProfileForm
          orgSlug={params.slug}
          initialName={org.name}
          orgSlugDisplay={org.slug}
        />

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure data retention policies (Configuration only for MVP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Retention settings will be configurable in a future update.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logging</CardTitle>
            <CardDescription>View and manage audit logs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Audit logs are automatically recorded for all system events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
