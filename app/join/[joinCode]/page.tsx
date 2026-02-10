import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface JoinPageProps {
  params: Promise<{ joinCode: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { joinCode } = await params
  const group = await prisma.group.findUnique({
    where: { joinCode },
    select: { id: true },
  })
  if (!group) {
    redirect("/signup?error=invalid_join")
  }
  redirect(`/signup?joinCode=${encodeURIComponent(joinCode)}`)
}
