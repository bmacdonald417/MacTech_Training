import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(200),
  referralSource: z.string().min(1, "Please select how you heard about us"),
  joinCode: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "Invalid input" },
        { status: 400 }
      )
    }
    const { email, password, name, referralSource, joinCode } = parsed.data

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

    if (groupId) {
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: user.id,
        },
      })
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (e) {
    console.error("Register error:", e)
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
  }
}
