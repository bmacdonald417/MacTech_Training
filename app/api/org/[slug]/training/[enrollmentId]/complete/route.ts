import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { checkEnrollmentCompletion, issueCertificate } from "@/lib/completion"
import { recordCompletionInVault } from "@/lib/completion-vault"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string; enrollmentId: string }> }
) {
  try {
    const { slug, enrollmentId } = await context.params
    const membership = await requireAuth(slug)
    const { contentItemId } = await req.json()

    // Verify enrollment belongs to user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        assignment: true,
      },
    })

    if (!enrollment || enrollment.userId !== membership.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update or create progress
    await prisma.enrollmentItemProgress.upsert({
      where: {
        enrollmentId_contentItemId: {
          enrollmentId: enrollmentId,
          contentItemId,
        },
      },
      update: {
        status: "COMPLETED",
        completed: true,
        completedAt: new Date(),
      },
      create: {
        enrollmentId: enrollmentId,
        contentItemId,
        status: "COMPLETED",
        completed: true,
        completedAt: new Date(),
      },
    })

    // Update enrollment status if needed
    if (enrollment.status === "ASSIGNED") {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "IN_PROGRESS",
          startedAt: enrollment.startedAt || new Date(),
        },
      })
    }

    // Check if enrollment is fully complete
    const completionCheck = await checkEnrollmentCompletion(enrollmentId)

    let certificateId: string | null = null
    if (completionCheck.isComplete) {
      const completedAt = new Date()
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "COMPLETED",
          completedAt,
        },
      })

      // Issue certificate
      certificateId = await issueCertificate(enrollmentId, membership.orgId, membership.userId)
      const cert = certificateId
        ? await prisma.certificateIssued.findUnique({
            where: { id: certificateId },
          })
        : null

      // Store hashed completion record for auditors
      await recordCompletionInVault({
        enrollmentId,
        orgId: membership.orgId,
        userId: membership.userId,
        completedAt,
        certificateId: cert?.id ?? null,
        certificateNumber: cert?.certificateNumber ?? null,
      })
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "ENROLLMENT_COMPLETED",
        metadata: JSON.stringify({
          enrollmentId: enrollmentId,
          contentItemId,
        }),
      },
    })

    return NextResponse.json({ success: true, certificateId: certificateId ?? undefined })
  } catch (error) {
    console.error("Error completing item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
