import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { checkEnrollmentCompletion, issueCertificate } from "@/lib/completion"

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; enrollmentId: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const { contentItemId } = await req.json()

    // Verify enrollment belongs to user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.enrollmentId },
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
          enrollmentId: params.enrollmentId,
          contentItemId,
        },
      },
      update: {
        status: "COMPLETED",
        completed: true,
        completedAt: new Date(),
      },
      create: {
        enrollmentId: params.enrollmentId,
        contentItemId,
        status: "COMPLETED",
        completed: true,
        completedAt: new Date(),
      },
    })

    // Update enrollment status if needed
    if (enrollment.status === "ASSIGNED") {
      await prisma.enrollment.update({
        where: { id: params.enrollmentId },
        data: {
          status: "IN_PROGRESS",
          startedAt: enrollment.startedAt || new Date(),
        },
      })
    }

    // Check if enrollment is fully complete
    const completionCheck = await checkEnrollmentCompletion(params.enrollmentId)

    if (completionCheck.isComplete) {
      await prisma.enrollment.update({
        where: { id: params.enrollmentId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      })

      // Issue certificate
      await issueCertificate(params.enrollmentId, membership.orgId, membership.userId)
    }

    // Log event
    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "ENROLLMENT_COMPLETED",
        metadata: JSON.stringify({
          enrollmentId: params.enrollmentId,
          contentItemId,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
