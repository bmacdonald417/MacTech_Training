import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface JoinPageProps {
  params: { joinCode: string }
}

export default async function JoinPage({ params }: JoinPageProps) {
  const group = await prisma.group.findUnique({
    where: { joinCode: params.joinCode },
    select: { id: true },
  })
  if (!group) {
    redirect("/signup?error=invalid_join")
  }
  redirect(`/signup?joinCode=${encodeURIComponent(params.joinCode)}`)
}
