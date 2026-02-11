import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getActiveTermsVersion, hashIp, recordTermsAcceptance, requireActiveTermsVersion } from "@/lib/terms"

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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors?.termsAccepted?.[0]
        ?? (parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "Invalid input")
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const { email, password, name, referralSource, joinCode } = parsed.data

    const activeTerms = await requireActiveTermsVersion()
    const { ip, userAgent } = await getClientIpAndAgent()

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
        role: "TRAINEE",
      },
    })

    await recordTermsAcceptance({
      userId: user.id,
      orgId,
      termsVersionId: activeTerms.id,
      ipHash: hashIp(ip),
      userAgent,
      acceptanceContext: "registration",
    })

    if (groupId) {
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: user.id,
        },
      })
      const { enrollUserInGroupAssignments } = await import("@/lib/enroll-group-member")
      await enrollUserInGroupAssignments(user.id, groupId)
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
