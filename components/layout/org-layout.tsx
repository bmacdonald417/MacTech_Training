import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth } from "@/lib/rbac"
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

  return (
    <AppShell
      orgSlug={params.slug}
      role={membership.role}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </AppShell>
  )
}
