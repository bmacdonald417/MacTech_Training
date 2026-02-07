import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth } from "@/lib/rbac"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={params.slug} role={membership.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userName={session.user.name} userEmail={session.user.email} />
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
