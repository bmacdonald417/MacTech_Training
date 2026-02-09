import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import {
  canSeeDocument,
  canEditDocument,
  canSubmitForReview,
  canApprove,
  canMakeEffective,
  canObsolete,
  normalizeDocumentRole,
} from "@/lib/documents"

/**
 * GET /api/org/[slug]/documents/[id]
 * Get one controlled document with current version and approval history.
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
      include: {
        currentVersion: true,
        versions: {
          orderBy: { createdAt: "desc" },
          include: {
            approvals: true,
          },
        },
        supersedes: true,
        supersededBy: true,
      },
    })

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    if (!canSeeDocument(role, doc.status)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(doc)
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents/[id] GET]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/org/[slug]/documents/[id]
 * Workflow actions: submitForReview | approve | makeEffective | obsolete
 * Or update DRAFT only (title, content, etc.).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const role = normalizeDocumentRole(membership.role)
    const body = await req.json()
    const { action } = body as { action?: string }

    const doc = await prisma.controlledDocument.findFirst({
      where: { id: params.id, orgId: membership.orgId },
      include: { currentVersion: true, versions: { include: { approvals: true } } },
    })
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const membershipRecord = await prisma.membership.findUnique({
      where: {
        userId_orgId: { userId: membership.userId, orgId: membership.orgId },
      },
    })
    const myMembershipId = membershipRecord?.id ?? ""

    switch (action) {
      case "submitForReview": {
        if (!canSubmitForReview(role, doc.status)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        await prisma.controlledDocument.update({
          where: { id: params.id },
          data: { status: "IN_REVIEW" },
        })
        await prisma.eventLog.create({
          data: {
            orgId: membership.orgId,
            userId: membership.userId,
            type: "DOCUMENT_REVISED",
            metadata: JSON.stringify({
              documentId: doc.id,
              documentCode: doc.documentId,
              action: "submitForReview",
            }),
          },
        })
        break
      }
      case "approve": {
        if (!canApprove(role, doc.status)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { typedName, role: approverRole, meaningOfSignature } = body as {
          typedName?: string
          role?: string
          meaningOfSignature?: string
        }
        if (!typedName?.trim()) {
          return NextResponse.json(
            { error: "typedName is required for approval." },
            { status: 400 }
          )
        }
        const currentVersion = doc.currentVersion
        if (!currentVersion) {
          return NextResponse.json(
            { error: "Document has no version to approve." },
            { status: 400 }
          )
        }
        const existingApproval = await prisma.documentApprovalRecord.findFirst({
          where: {
            documentVersionId: currentVersion.id,
            approverMembershipId: myMembershipId,
          },
        })
        if (existingApproval) {
          return NextResponse.json(
            { error: "You have already approved this version." },
            { status: 409 }
          )
        }
        if (currentVersion.createdByMembershipId === myMembershipId) {
          return NextResponse.json(
            { error: "Approver cannot be the author." },
            { status: 400 }
          )
        }
        await prisma.documentApprovalRecord.create({
          data: {
            documentVersionId: currentVersion.id,
            approverMembershipId: myMembershipId,
            typedName: typedName.trim(),
            role: approverRole?.trim() || "Approver",
            meaningOfSignature: meaningOfSignature?.trim() || "Approval for use",
          },
        })
        const approvalCount = await prisma.documentApprovalRecord.count({
          where: { documentVersionId: currentVersion.id },
        })
        if (approvalCount >= 1) {
          await prisma.controlledDocument.update({
            where: { id: params.id },
            data: { status: "APPROVED" },
          })
        }
        await prisma.eventLog.create({
          data: {
            orgId: membership.orgId,
            userId: membership.userId,
            type: "DOCUMENT_VERSION_APPROVED",
            metadata: JSON.stringify({
              documentId: doc.id,
              documentCode: doc.documentId,
              versionId: currentVersion.id,
              version: currentVersion.version,
            }),
          },
        })
        break
      }
      case "makeEffective": {
        if (!canMakeEffective(role, doc.status)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const effectiveDate = body.effectiveDate
          ? new Date(body.effectiveDate)
          : new Date()
        await prisma.controlledDocument.update({
          where: { id: params.id },
          data: { status: "EFFECTIVE", effectiveDate },
        })
        await prisma.eventLog.create({
          data: {
            orgId: membership.orgId,
            userId: membership.userId,
            type: "DOCUMENT_EFFECTIVE",
            metadata: JSON.stringify({
              documentId: doc.id,
              documentCode: doc.documentId,
              effectiveDate: effectiveDate.toISOString(),
            }),
          },
        })
        break
      }
      case "obsolete": {
        if (!canObsolete(role, doc.status)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const { supersededByDocumentId } = body as { supersededByDocumentId?: string }
        await prisma.controlledDocument.update({
          where: { id: params.id },
          data: {
            status: "OBSOLETE",
            supersededByDocumentId: supersededByDocumentId || null,
          },
        })
        await prisma.eventLog.create({
          data: {
            orgId: membership.orgId,
            userId: membership.userId,
            type: "DOCUMENT_OBSOLETED",
            metadata: JSON.stringify({
              documentId: doc.id,
              documentCode: doc.documentId,
              supersededByDocumentId: supersededByDocumentId || null,
            }),
          },
        })
        break
      }
      default: {
        if (!canEditDocument(role, doc.status)) {
          return NextResponse.json({ error: "Forbidden or document not in DRAFT" }, { status: 403 })
        }
        const { title, reviewDueDate, retentionPeriodYears, requiresAcknowledgment } = body as {
          title?: string
          reviewDueDate?: string
          retentionPeriodYears?: number
          requiresAcknowledgment?: boolean
        }
        const updateData: Record<string, unknown> = {}
        if (typeof title === "string" && title.trim()) updateData.title = title.trim()
        if (reviewDueDate !== undefined) updateData.reviewDueDate = reviewDueDate ? new Date(reviewDueDate) : null
        if (typeof retentionPeriodYears === "number") updateData.retentionPeriodYears = retentionPeriodYears
        if (typeof requiresAcknowledgment === "boolean") updateData.requiresAcknowledgment = requiresAcknowledgment
        if (Object.keys(updateData).length > 0) {
          await prisma.controlledDocument.update({
            where: { id: params.id },
            data: updateData,
          })
        }
      }
    }

    const updated = await prisma.controlledDocument.findFirst({
      where: { id: params.id, orgId: membership.orgId },
      include: {
        currentVersion: true,
        versions: {
          orderBy: { createdAt: "desc" },
          include: { approvals: true },
        },
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    if (String(e).includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[documents/[id] PATCH]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
