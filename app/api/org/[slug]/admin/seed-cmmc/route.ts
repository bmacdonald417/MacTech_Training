import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { seedCmmcAt } from "@/prisma/seed-cmmc-at"

const CMMC_CURRICULUM_TITLE =
  "CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training (AT.L2-3.2.1/3.2.2/3.2.3)"

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const membership = await requireAdmin(params.slug)
    const orgId = membership.orgId

    const existing = await prisma.curriculum.findFirst({
      where: {
        orgId,
        title: CMMC_CURRICULUM_TITLE,
      },
    })

    if (existing) {
      return NextResponse.json({
        ok: true,
        installed: false,
        message: "CMMC slide deck is already in your content library.",
      })
    }

    await seedCmmcAt(prisma, orgId)

    return NextResponse.json({
      ok: true,
      installed: true,
      message: "CMMC slide deck added. It appears in Content → Slide decks with your other slide decks.",
    })
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error("POST /api/org/[slug]/admin/seed-cmmc:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
