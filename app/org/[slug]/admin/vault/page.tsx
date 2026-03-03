import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import { VaultTable } from "./vault-table"

interface VaultPageProps {
  params: Promise<{ slug: string }>
}

export default async function VaultPage({ params }: VaultPageProps) {
  const { slug } = await params
  const membership = await requireAdmin(slug)

  const records = await prisma.completionVaultRecord.findMany({
    where: { orgId: membership.orgId },
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
        title="Completion vault"
        description="Tamper-evident records of training completions for auditor review"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Completion records
          </CardTitle>
          <CardDescription>
            Each row is stored with a SHA-256 verification hash. Use the hash to verify a completion
            externally. Records are created when a user completes an assignment and a certificate
            may be issued.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VaultTable records={records} />
        </CardContent>
      </Card>
    </div>
  )
}
