import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * Ensures the CUI Enclave Required User Training includes the 20-question quiz.
 * - If it's a curriculum: adds a "Knowledge check" section with the quiz.
 * - If it's a single slide deck (CONTENT_ITEM): creates a curriculum (slides + quiz) and switches the assignment to it.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const membership = await requireAdmin(slug)
    const orgId = membership.orgId

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

    const assignment = await prisma.assignment.findFirst({
      where: {
        orgId,
        OR: [
          { title: { contains: "CUI Enclave Required User Training", mode: "insensitive" } },
          { title: { contains: "CUI Enclave User Training", mode: "insensitive" } },
          { title: { contains: "CUI Enclave", mode: "insensitive" } },
        ],
      },
      include: {
        contentItem: { select: { id: true, type: true, title: true } },
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

    if (!assignment) {
      return NextResponse.json({
        ok: true,
        updated: false,
        message:
          "No assignment named \"CUI Enclave Required User Training\" (or similar) found. Create one: Admin → Groups → intro → Assign curriculum or Assign slide deck, and use that title.",
      })
    }

    let curriculum = assignment.curriculum ?? null

    if (assignment.type === "CONTENT_ITEM" && assignment.contentItemId) {
      const slideDeckContentId = assignment.contentItemId
      const newCurriculum = await prisma.curriculum.create({
        data: {
          orgId,
          title: "CUI Enclave Required User Training",
          description: "CUI Enclave training with slide deck and 20-question knowledge check.",
          sections: {
            create: [
              {
                title: "Training",
                description: "Slide deck",
                order: 0,
                items: {
                  create: [{ contentItemId: slideDeckContentId, required: true, order: 0 }],
                },
              },
              {
                title: "Knowledge check",
                description: "20 questions; 80% pass required.",
                order: 1,
                items: {
                  create: [{ contentItemId: quizContent.id, required: true, order: 0 }],
                },
              },
            ],
          },
        },
      })
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: {
          type: "CURRICULUM",
          curriculumId: newCurriculum.id,
          contentItemId: null,
        },
      })
      return NextResponse.json({
        ok: true,
        updated: true,
        message:
          "CUI Enclave Required User Training now includes the slide deck and the 20-question quiz. Users will see both steps when they take the training.",
      })
    }

    if (!curriculum) {
      const curriculumWithSections = await prisma.curriculum.findFirst({
        where: {
          orgId,
          OR: [
            { title: { contains: "CMMC Level 2", mode: "insensitive" } },
            { title: { contains: "CUI Enclave", mode: "insensitive" } },
          ],
        },
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
      })
      if (!curriculumWithSections) {
        return NextResponse.json({
          ok: true,
          updated: false,
          message:
            "No CUI Enclave or CMMC curriculum found. Run Install CMMC from Settings first, then assign that curriculum to a group and name it \"CUI Enclave Required User Training\".",
        })
      }
      curriculum = curriculumWithSections
    }

    const hasQuiz = curriculum.sections.some((s) =>
      s.items.some((i) => i.contentItem.type === "QUIZ")
    )
    if (hasQuiz) {
      return NextResponse.json({
        ok: true,
        updated: false,
        message: "Curriculum already includes the knowledge check quiz.",
      })
    }

    // Insert quiz section as order 1 (between slides and attestation)
    const quizSectionOrder = 1
    await prisma.curriculumSection.updateMany({
      where: {
        curriculumId: curriculum.id,
        order: { gte: quizSectionOrder },
      },
      data: { order: { increment: 1 } },
    })

    const newSection = await prisma.curriculumSection.create({
      data: {
        curriculumId: curriculum.id,
        title: "Knowledge check",
        description: "20 questions; 80% pass required.",
        order: quizSectionOrder,
      },
    })

    await prisma.curriculumItem.create({
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
