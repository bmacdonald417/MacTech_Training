import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * Ensures the CUI Enclave Required User Training curriculum includes the 20-question quiz.
 * If the curriculum has no quiz step, adds a "Knowledge check" section with the org's CMMC quiz.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireAdmin(slug)
    const orgId = membership.orgId

    const assignment = await prisma.assignment.findFirst({
      where: {
        orgId,
        type: "CURRICULUM",
        curriculumId: { not: null },
        title: { contains: "CUI Enclave Required User Training" },
      },
      include: {
        curriculum: {
          include: {
            sections: {
              include: {
                items: {
                  include: {
                    contentItem: { select: { type: true } },
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!assignment?.curriculum) {
      return NextResponse.json({
        ok: true,
        updated: false,
        message: "No CUI Enclave Required User Training curriculum found.",
      })
    }

    const hasQuiz = assignment.curriculum.sections.some((s) =>
      s.items.some((i) => i.contentItem.type === "QUIZ")
    )
    if (hasQuiz) {
      return NextResponse.json({
        ok: true,
        updated: false,
        message: "Curriculum already includes the knowledge check quiz.",
      })
    }

    const quizContent = await prisma.contentItem.findFirst({
      where: {
        orgId,
        type: "QUIZ",
        title: { contains: "CMMC Level 2 Security Awareness" },
      },
    })
    if (!quizContent) {
      return NextResponse.json({
        ok: false,
        message: "Quiz content not found. Run Install CMMC from Settings first.",
      })
    }

    // Insert quiz section as order 1 (between slides and attestation)
    const quizSectionOrder = 1
    await prisma.curriculumSection.updateMany({
      where: {
        curriculumId: assignment.curriculum.id,
        order: { gte: quizSectionOrder },
      },
      data: { order: { increment: 1 } },
    })

    const newSection = await prisma.curriculumSection.create({
      data: {
        curriculumId: assignment.curriculum.id,
        title: "Knowledge check",
        description: "20 questions; 80% pass required.",
        order: quizSectionOrder,
      },
    })

    await prisma.curriculumSectionItem.create({
      data: {
        sectionId: newSection.id,
        contentItemId: quizContent.id,
        required: true,
        order: 0,
      },
    })

    return NextResponse.json({
      ok: true,
      updated: true,
      message:
        "Added 20-question knowledge check to CUI Enclave Required User Training. Users will see the quiz step when they take the training.",
    })
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error("POST /api/org/[slug]/admin/ensure-cui-quiz:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
