import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string; attestationId: string }> }
) {
  try {
    const { slug, attestationId } = await context.params
    const membership = await requireAuth(slug)
    const { typedName, enrollmentId, userId } = await req.json()

    if (userId !== membership.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get IP address from request headers
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown"

    // Create attestation record
    await prisma.attestationRecord.create({
      data: {
        templateId: attestationId,
        userId: membership.userId,
        typedName: typedName || null,
        ipAddress,
      },
    })

    // Log event
    await prisma.eventLog.create({
      data: {
        orgId: membership.orgId,
        userId: membership.userId,
        type: "ATTESTATION_SIGNED",
        metadata: JSON.stringify({
          attestationId,
          enrollmentId,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error signing attestation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
