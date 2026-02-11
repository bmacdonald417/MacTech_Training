import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { userHasAcceptedCurrentTerms } from "@/lib/terms"
import { AppShell } from "./app-shell"
import { redirect } from "next/navigation"

interface OrgLayoutProps {
  children: React.ReactNode
  params: { slug: string }
}

export default async function OrgLayout({
  children,
  params,
}: OrgLayoutProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const membership = await requireAuth(params.slug)

  const acceptedTerms = await userHasAcceptedCurrentTerms(membership.userId)
  if (!acceptedTerms) {
    redirect(`/accept-terms?callbackUrl=${encodeURIComponent(`/org/${params.slug}/dashboard`)}`)
  }

  const userGroupMemberships = await prisma.groupMember.findMany({
    where: {
      userId: membership.userId,
      group: { orgId: membership.orgId },
    },
    include: { group: { select: { name: true } } },
  })
  const userGroupNames = userGroupMemberships.map((gm) => gm.group.name)

  return (
    <AppShell
      orgSlug={params.slug}
      role={membership.role}
      userName={session.user.name}
      userEmail={session.user.email}
      userGroupNames={userGroupNames}
    >
      {children}
    </AppShell>
  )
}
