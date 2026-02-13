import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import {
  canSeeDocument,
  normalizeDocumentRole,
  canEditDocument,
} from "@/lib/documents"
import type { DocumentStatus, DocumentType } from "@prisma/client"

/**
 * GET /api/org/[slug]/documents
 * List controlled documents. Access: internal only. Filter by type, status.
 * Server enforces: USER sees only EFFECTIVE/APPROVED; ADMIN sees more; OBSOLETE only ADMIN.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireAuth(slug)
    const role = normalizeDocumentRole(membership.role)
    const { searchParams } = new URL(req.url)
    const documentType = searchParams.get("documentType") as DocumentType | null
    const status = searchParams.get("status") as DocumentStatus | null

    type Where = {
      orgId: string
      documentType?: DocumentType
      status?: DocumentStatus | { in: DocumentStatus[] } | { not: DocumentStatus }
    }
    const where: Where = { orgId: membership.orgId }
    if (documentType) where.documentType = documentType

    if (role === "USER") {
      if (status && status !== "EFFECTIVE" && status !== "APPROVED") {
        return NextResponse.json({ documents: [] })
      }
      where.status = status ? status : { in: ["EFFECTIVE", "APPROVED"] }
    } else {
      // ADMIN: full access; filter by status if requested
      if (status) where.status = status
    }

    const documents = await prisma.controlledDocument.findMany({
      where,
      include: {
        currentVersion: true,
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ documentType: "asc" }, { documentId: "asc" }],
    })

    const filtered = documents.filter((d) =>
      canSeeDocument(role, d.status)
    )

    return NextResponse.json({ documents: filtered })
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents GET]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/org/[slug]/documents
 * Create a new controlled document (DRAFT). Admin or Trainer only.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireAuth(slug)
    const role = normalizeDocumentRole(membership.role)
    if (!canEditDocument(role, "DRAFT")) {
      return NextResponse.json(
        { error: "Only Admin or Quality Manager can create documents." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      documentId,
      title,
      documentType,
      changeSummary,
      content,
      retentionPeriodYears,
      requiresAcknowledgment,
    } = body as {
      documentId: string
      title: string
      documentType: DocumentType
      changeSummary?: string
      content?: string
      retentionPeriodYears?: number
      requiresAcknowledgment?: boolean
    }

    if (!documentId?.trim() || !title?.trim() || !documentType) {
      return NextResponse.json(
        { error: "documentId, title, and documentType are required." },
        { status: 400 }
      )
    }

    const membershipRecord = await prisma.membership.findUnique({
      where: {
        userId_orgId: { userId: membership.userId, orgId: membership.orgId },
      },
    })
    const authorMembershipId = membershipRecord?.id ?? ""

    const exists = await prisma.controlledDocument.findUnique({
      where: {
        orgId_documentId: { orgId: membership.orgId, documentId: documentId.trim() },
      },
    })
    if (exists) {
      return NextResponse.json(
        { error: "A document with this Document ID already exists." },
        { status: 409 }
      )
    }

    const doc = await prisma.controlledDocument.create({
      data: {
        orgId: membership.orgId,
        documentId: documentId.trim(),
        title: title.trim(),
        documentType,
        status: "DRAFT",
        authorMembershipId,
        retentionPeriodYears: retentionPeriodYears ?? 7,
        requiresAcknowledgment: requiresAcknowledgment ?? false,
      },
    })

    const version = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        version: "1.0",
        changeType: "MAJOR",
        changeSummary: changeSummary || "Initial issue",
        content: content || "",
        createdByMembershipId: authorMembershipId,
      },
    })

    await prisma.controlledDocument.update({
      where: { id: doc.id },
      data: { currentVersionId: version.id },
    })

    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "DOCUMENT_CREATED",
        metadata: JSON.stringify({
          documentId: doc.id,
          documentCode: doc.documentId,
          title: doc.title,
        }),
      },
    })

    const updated = await prisma.controlledDocument.findUnique({
      where: { id: doc.id },
      include: { currentVersion: true, versions: true },
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents POST]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
