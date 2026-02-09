import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { canEditDocument, normalizeDocumentRole } from "@/lib/documents"
import type { DocumentChangeType } from "@prisma/client"

/**
 * GET /api/org/[slug]/documents/[id]/versions
 * List all versions (change history) for the document.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const role = normalizeDocumentRole(membership.role)

    const doc = await prisma.controlledDocument.findFirst({
      where: { id: params.id, orgId: membership.orgId },
    })
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: doc.id },
      orderBy: { createdAt: "desc" },
      include: { approvals: true },
    })
    return NextResponse.json({ versions })
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents/[id]/versions GET]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/org/[slug]/documents/[id]/versions
 * Create a new version (DRAFT only). Requires changeSummary, content, changeType.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const role = normalizeDocumentRole(membership.role)

    const doc = await prisma.controlledDocument.findFirst({
      where: { id: params.id, orgId: membership.orgId },
      include: { currentVersion: true, versions: { orderBy: { createdAt: "desc" }, take: 1 } },
    })
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    if (!canEditDocument(role, doc.status)) {
      return NextResponse.json(
        { error: "Document must be in DRAFT to create a new version." },
        { status: 403 }
      )
    }

    const membershipRecord = await prisma.membership.findUnique({
      where: {
        userId_orgId: { userId: membership.userId, orgId: membership.orgId },
      },
    })
    const authorMembershipId = membershipRecord?.id ?? ""

    const body = await req.json()
    const {
      version,
      changeType,
      changeSummary,
      changedSections,
      content,
    } = body as {
      version?: string
      changeType: DocumentChangeType
      changeSummary: string
      changedSections?: string
      content: string
    }

    if (!changeSummary?.trim() || content === undefined) {
      return NextResponse.json(
        { error: "changeSummary and content are required." },
        { status: 400 }
      )
    }

    const lastVersion = doc.versions[0]
    const nextVersion = version?.trim() || (lastVersion
      ? incrementVersion(lastVersion.version)
      : "1.0")

    const existingVersion = await prisma.documentVersion.findUnique({
      where: {
        documentId_version: { documentId: params.id, version: nextVersion },
      },
    })
    if (existingVersion) {
      return NextResponse.json(
        { error: `Version ${nextVersion} already exists.` },
        { status: 409 }
      )
    }

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        version: nextVersion,
        changeType: changeType || "MINOR",
        changeSummary: changeSummary.trim(),
        changedSections: changedSections?.trim() || null,
        content: typeof content === "string" ? content : "",
        createdByMembershipId: authorMembershipId,
      },
    })

    await prisma.controlledDocument.update({
      where: { id: params.id },
      data: { currentVersionId: newVersion.id },
    })

    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "DOCUMENT_REVISED",
        metadata: JSON.stringify({
          documentId: doc.id,
          documentCode: doc.documentId,
          versionId: newVersion.id,
          version: newVersion.version,
        }),
      },
    })

    const updated = await prisma.controlledDocument.findFirst({
      where: { id: params.id, orgId: membership.orgId },
      include: { currentVersion: true, versions: { include: { approvals: true } } },
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents/[id]/versions POST]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function incrementVersion(v: string): string {
  const parts = v.split(".")
  const major = parseInt(parts[0], 10) || 1
  const minor = parseInt(parts[1], 10) ?? 0
  return `${major}.${minor + 1}`
}
