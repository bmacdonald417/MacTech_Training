import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { canSeeDocument, normalizeDocumentRole } from "@/lib/documents"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { DocumentStatus } from "@prisma/client"

const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  EFFECTIVE: "Effective",
  OBSOLETE: "Obsolete",
}

interface DocumentPageProps {
  params: { slug: string; id: string }
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)
  const role = normalizeDocumentRole(membership.role)

  const doc = await prisma.controlledDocument.findFirst({
    where: { id: params.id, orgId: membership.orgId },
    include: {
      currentVersion: true,
      versions: {
        orderBy: { createdAt: "desc" },
        include: { approvals: true },
      },
      supersededBy: true,
    },
  })

  if (!doc || !canSeeDocument(role, doc.status)) notFound()

  const basePath = `/org/${params.slug}/trainer/documents`
  const content = doc.currentVersion?.content ?? "*No content.*"

  return (
    <div className="space-y-10">
      <PageHeader
        title={doc.title}
        description={`${doc.documentId} · ${STATUS_LABELS[doc.status]}${doc.currentVersion ? ` · v${doc.currentVersion.version}` : ""}`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={basePath}>
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Link>
          }
        }
      />

      {doc.supersededBy && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
          <CardContent className="py-3 text-sm text-amber-800 dark:text-amber-200">
            This document is obsolete. Superseded by: {doc.supersededBy.documentId} —{" "}
            {doc.supersededBy.title}.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="relative py-6">
          <p className="absolute right-4 top-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Uncontrolled when printed
          </p>
          <div className="mt-6 whitespace-pre-wrap font-sans text-sm text-foreground">
            {content}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
