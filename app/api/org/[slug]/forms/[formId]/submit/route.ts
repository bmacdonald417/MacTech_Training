import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; formId: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const { answersJson, enrollmentId, userId } = await req.json()

    if (userId !== membership.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Verify form template exists and belongs to org
    const formTemplate = await prisma.formTemplate.findUnique({
      where: { id: params.formId },
      include: {
        contentItem: true,
      },
    })

    if (!formTemplate || formTemplate.contentItem.orgId !== membership.orgId) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    // Create submission
    await prisma.formSubmission.create({
      data: {
        formTemplateId: params.formId,
        userId: membership.userId,
        enrollmentId: enrollmentId || null,
        answersJson: JSON.stringify(answersJson),
      },
    })

    // Log event
    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "FORM_SUBMITTED",
        metadata: JSON.stringify({
          formTemplateId: params.formId,
          enrollmentId,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting form:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
