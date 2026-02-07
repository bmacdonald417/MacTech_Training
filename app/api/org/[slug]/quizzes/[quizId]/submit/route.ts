import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; quizId: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const { answers, enrollmentId, userId } = await req.json()

    if (userId !== membership.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: {
          include: {
            choices: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Calculate score
    let correct = 0
    const total = quiz.questions.length

    quiz.questions.forEach((question) => {
      const userChoiceId = answers[question.id]
      const correctChoice = question.choices.find((c) => c.isCorrect)
      if (userChoiceId === correctChoice?.id) {
        correct++
      }
    })

    const score = Math.round((correct / total) * 100)
    const passed = score >= quiz.passingScore

    // Save attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: params.quizId,
        userId: membership.userId,
        score,
        passed,
        answers: JSON.stringify(answers),
      },
    })

    // Log event
    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: passed ? "QUIZ_SUBMITTED" : "QUIZ_FAILED",
        metadata: JSON.stringify({
          quizId: params.quizId,
          attemptId: attempt.id,
          score,
          passed,
          enrollmentId,
        }),
      },
    })

    return NextResponse.json({ score, passed, attemptId: attempt.id })
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
