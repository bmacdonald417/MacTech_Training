import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { normalizeDocumentRole } from "@/lib/documents"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { DocumentType, DocumentStatus } from "@prisma/client"

interface DocumentsPageProps {
  params: { slug: string }
  searchParams: { documentType?: string; status?: string }
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  QAM: "Quality Manual",
  POL: "Policy",
  SOP: "SOP",
  WIP: "Work Instruction",
  FRM: "Form",
  RTP: "Record / Template",
  METHOD: "Test Method",
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  EFFECTIVE: "Effective",
  OBSOLETE: "Obsolete",
}

export default async function DocumentsPage({ params, searchParams }: DocumentsPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)
  const role = normalizeDocumentRole(membership.role)

  const documentType = searchParams.documentType as DocumentType | undefined
  const status = searchParams.status as DocumentStatus | undefined

  const where: {
    orgId: string
    documentType?: DocumentType
    status?: DocumentStatus | { not: DocumentStatus } | { in: DocumentStatus[] }
  } = { orgId: membership.orgId }

  if (documentType) where.documentType = documentType
  if (role === "ADMIN") {
    if (status) where.status = status
  } else {
    if (status === "OBSOLETE") {
      // Trainer cannot see OBSOLETE
      const documents: never[] = []
      return (
        <div className="space-y-10">
          <PageHeader title="Internal QMS" description="Controlled documents" />
          <p className="text-sm text-muted-foreground">No documents match the selected filters.</p>
        </div>
      )
    }
    where.status = status ?? { not: "OBSOLETE" }
  }

  const documents = await prisma.controlledDocument.findMany({
    where,
    include: {
      currentVersion: true,
    },
    orderBy: [{ documentType: "asc" }, { documentId: "asc" }],
  })

  const basePath = `/org/${params.slug}/trainer/documents`

  return (
    <div className="space-y-10">
      <PageHeader
        title="Internal QMS"
        description="Controlled documents, policies, SOPs, and forms"
        action={
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="h-4 w-4" />
              New document
            </Link>
          }
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={basePath}>All types</Link>
        </Button>
        {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
          <Button
            key={type}
            variant={documentType === type ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`${basePath}?documentType=${type}`}>{DOCUMENT_TYPE_LABELS[type]}</Link>
          </Button>
        ))}
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No controlled documents match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{doc.documentId}</CardTitle>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-medium " +
                      (doc.status === "EFFECTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : doc.status === "DRAFT"
                          ? "bg-muted text-muted-foreground"
                          : doc.status === "OBSOLETE"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400")
                    }
                  >
                    {STATUS_LABELS[doc.status]}
                  </span>
                </div>
                <CardDescription>
                  {doc.title} · {DOCUMENT_TYPE_LABELS[doc.documentType]}
                  {doc.currentVersion ? ` · v${doc.currentVersion.version}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`${basePath}/${doc.id}`}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
