import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { canAcknowledgeDocument, canSeeDocument, normalizeDocumentRole } from "@/lib/documents"

/**
 * POST /api/org/[slug]/documents/[id]/acknowledge
 * Record that the current user has read/acknowledged the current effective version.
 * Required for documents with requiresAcknowledgment (e.g. SOPs).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const role = normalizeDocumentRole(membership.role)
    if (!canAcknowledgeDocument(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const doc = await prisma.controlledDocument.findFirst({
      where: { id: params.id, orgId: membership.orgId },
      include: { currentVersion: true },
    })
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    if (!canSeeDocument(role, doc.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const versionToAcknowledge = doc.currentVersion
    if (!versionToAcknowledge) {
      return NextResponse.json(
        { error: "Document has no version to acknowledge." },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { typedName } = body as { typedName?: string }

    await prisma.documentAcknowledgment.upsert({
      where: {
        documentVersionId_userId: {
          documentVersionId: versionToAcknowledge.id,
          userId: membership.userId,
        },
      },
      update: { acknowledgedAt: new Date(), typedName: typedName?.trim() || null },
      create: {
        documentVersionId: versionToAcknowledge.id,
        userId: membership.userId,
        typedName: typedName?.trim() || null,
      },
    })

    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "DOCUMENT_ACKNOWLEDGMENT_COMPLETED",
        metadata: JSON.stringify({
          documentId: doc.id,
          documentCode: doc.documentId,
          documentVersionId: versionToAcknowledge.id,
          version: versionToAcknowledge.version,
        }),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents/[id]/acknowledge POST]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
