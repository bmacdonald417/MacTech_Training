import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getActiveTermsVersion, hashIp, recordTermsAcceptance } from "@/lib/terms"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(200),
  referralSource: z.string().min(1, "Please select how you heard about us"),
  joinCode: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the acknowledgment to register." }),
  }),
})

async function getClientIpAndAgent(): Promise<{ ip: string | null; userAgent: string }> {
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? headersList.get("x-real-ip") : headersList.get("x-real-ip")
  const userAgent = headersList.get("user-agent") ?? ""
  return { ip, userAgent }
}

const UNAVAILABLE_MSG = "Registration is temporarily unavailable. Please try again later or contact support."

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors?.termsAccepted?.[0]
        ?? (parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "Invalid input")
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const { email, password, name, referralSource, joinCode } = parsed.data

    let activeTerms: Awaited<ReturnType<typeof getActiveTermsVersion>>
    try {
      activeTerms = await getActiveTermsVersion()
    } catch (termsErr) {
      console.error("Register: getActiveTermsVersion failed", termsErr)
      return NextResponse.json({ error: UNAVAILABLE_MSG }, { status: 503 })
    }
    if (!activeTerms) {
      console.error("Register: No active terms version configured. Run db:seed to create one.")
      return NextResponse.json({ error: UNAVAILABLE_MSG }, { status: 503 })
    }

    let ip: string | null = null
    let userAgent = ""
    try {
      const client = await getClientIpAndAgent()
      ip = client.ip
      userAgent = client.userAgent
    } catch {
      // non-fatal
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 })
    }

    let orgId: string
    let groupId: string | null = null

    if (joinCode) {
      const group = await prisma.group.findUnique({
        where: { joinCode },
        include: { org: true },
      })
      if (!group) {
        return NextResponse.json({ error: "Invalid or expired join link." }, { status: 400 })
      }
      orgId = group.orgId
      groupId = group.id
    } else {
      const defaultSlug = process.env.DEFAULT_ORG_SLUG ?? "demo"
      const org = await prisma.organization.findUnique({ where: { slug: defaultSlug } })
      if (org) {
        orgId = org.id
      } else {
        const first = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } })
        if (!first) {
          return NextResponse.json({ error: "No organization available for sign-up." }, { status: 503 })
        }
        orgId = first.id
      }
      // New users without a join link go into the "intro" group
      const introGroup = await prisma.group.findFirst({
        where: { orgId, name: "intro" },
        select: { id: true },
      })
      if (introGroup) groupId = introGroup.id
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name.trim(),
        referralSource: referralSource.trim() || null,
      },
    })

    await prisma.membership.create({
      data: {
        userId: user.id,
        orgId,
        role: "USER",
      },
    })

    try {
      await recordTermsAcceptance({
        userId: user.id,
        orgId,
        termsVersionId: activeTerms.id,
        ipHash: hashIp(ip),
        userAgent,
        acceptanceContext: "registration",
      })
    } catch (termsErr) {
      console.error("Register: recordTermsAcceptance failed", termsErr)
      return NextResponse.json({ error: UNAVAILABLE_MSG }, { status: 503 })
    }

    if (groupId) {
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: user.id,
        },
      })
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      })
      if (group?.name !== "intro") {
        const { enrollUserInGroupAssignments } = await import("@/lib/enroll-group-member")
        await enrollUserInGroupAssignments(user.id, groupId)
      }
    }
    // If no group yet (e.g. org has no "intro" group), ensure intro exists and add user
    if (!groupId) {
      let introGroup = await prisma.group.findFirst({
        where: { orgId, name: "intro" },
        select: { id: true },
      })
      if (!introGroup) {
        introGroup = await prisma.group.create({
          data: { orgId, name: "intro" },
          select: { id: true },
        })
      }
      await prisma.groupMember.create({
        data: { groupId: introGroup.id, userId: user.id },
      })
      // Do not auto-enroll intro group; they see "Get started" on dashboard and self-assign
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (e: unknown) {
    console.error("Register error:", e)

    const isDev = process.env.NODE_ENV === "development"
    let message = "Registration failed. Please try again."

    if (e && typeof e === "object" && "code" in e) {
      const code = (e as { code?: string }).code
      if (code === "P2002") {
        message = "An account with this email already exists."
      } else if (code === "P2003" || code === "P2010") {
        message = "Database setup issue. Please ensure migrations have been run (e.g. npm run db:push or db:migrate)."
      } else if (isDev && "message" in e && typeof (e as { message: string }).message === "string") {
        message = (e as { message: string }).message
      }
    } else if (isDev && e instanceof Error) {
      message = e.message
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
