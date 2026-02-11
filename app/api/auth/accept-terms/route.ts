import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"
import { requireActiveTermsVersion, hashIp, recordTermsAcceptance } from "@/lib/terms"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const termsAccepted = body?.termsAccepted === true
    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the acknowledgment to continue." },
        { status: 400 }
      )
    }

    const activeTerms = await requireActiveTermsVersion()
    const headersList = await headers()
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? headersList.get("x-real-ip") : headersList.get("x-real-ip")
    const userAgent = headersList.get("user-agent") ?? ""

    const userId = session.user.id
    const membership = await prisma.membership.findFirst({
      where: { userId },
      select: { orgId: true },
    })
    const orgId = membership?.orgId ?? null

    await recordTermsAcceptance({
      userId,
      orgId,
      termsVersionId: activeTerms.id,
      ipHash: hashIp(ip),
      userAgent,
      acceptanceContext: "reacceptance",
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Accept terms error:", e)
    return NextResponse.json({ error: "Failed to record acceptance." }, { status: 500 })
  }
}
