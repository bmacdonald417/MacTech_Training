import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const joinCode = searchParams.get("joinCode")
  if (!joinCode) {
    return NextResponse.json({ error: "Missing joinCode" }, { status: 400 })
  }
  const group = await prisma.group.findUnique({
    where: { joinCode },
    select: { name: true },
  })
  if (!group) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 404 })
  }
  return NextResponse.json({ groupName: group.name })
}
