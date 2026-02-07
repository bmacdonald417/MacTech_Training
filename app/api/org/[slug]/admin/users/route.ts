import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/lib/rbac"

const VALID_ROLES: Role[] = ["ADMIN", "TRAINER", "TRAINEE"]

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const membership = await requireAdmin(params.slug)
    const orgId = membership.orgId

    const body = await req.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const name = typeof body.name === "string" ? body.name.trim() || null : null
    const password = typeof body.password === "string" ? body.password : ""
    const role = VALID_ROLES.includes(body.role) ? body.role : "TRAINEE"

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { orgId },
        },
      },
    })

    if (existingUser) {
      if (existingUser.memberships.length > 0) {
        return NextResponse.json(
          { error: "That user is already a member of this organization." },
          { status: 400 }
        )
      }
      await prisma.membership.create({
        data: {
          userId: existingUser.id,
          orgId,
          role,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required (at least 6 characters) for new users." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })

    await prisma.membership.create({
      data: {
        userId: newUser.id,
        orgId,
        role,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error("POST /api/org/[slug]/admin/users:", err)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
