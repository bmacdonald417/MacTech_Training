import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import { VaultTable } from "@/app/org/[slug]/admin/vault/vault-table"

interface RecordsPageProps {
  params: Promise<{ slug: string }>
}

export default async function RecordsPage({ params }: RecordsPageProps) {
  const { slug } = await params
  const membership = await requireAuth(slug)

  const records = await prisma.completionVaultRecord.findMany({
    where: {
      orgId: membership.orgId,
      userId: membership.userId,
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
    orderBy: { completedAt: "desc" },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Verification records"
        description="Your training completion records and verification hashes for auditors"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            My completion records
          </CardTitle>
          <CardDescription>
            Each completed training has a verification hash you can copy and provide to auditors to
            prove completion. Records are tamper-evident (SHA-256).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VaultTable
            records={records}
            showUserColumn={false}
            emptyMessage="You have no completion records yet. Complete assigned training to see verification records here."
          />
        </CardContent>
      </Card>
    </div>
  )
}
