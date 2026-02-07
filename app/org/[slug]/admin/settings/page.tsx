import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage organization settings and preferences
        </p>
      </div>

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
