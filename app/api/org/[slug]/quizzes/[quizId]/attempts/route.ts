import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; quizId: string } }
) {
  try {
    const membership = await requireAuth(params.slug)
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId || userId !== membership.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: params.quizId,
        userId: membership.userId,
      },
      orderBy: {
        submittedAt: "desc",
      },
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    console.error("Error fetching quiz attempts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
