import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { userHasAcceptedCurrentTerms } from "@/lib/terms"
import { AcceptTermsForm } from "./accept-terms-form"
import { LoginLayout } from "@/components/auth/login-layout"
import { BrandMark } from "@/components/auth/brand-mark"

export const dynamic = "force-dynamic"

interface AcceptTermsPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function AcceptTermsPage({ searchParams }: AcceptTermsPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const { callbackUrl } = await searchParams
    redirect(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login")
  }

  const accepted = await userHasAcceptedCurrentTerms(session.user.id)
  const { callbackUrl } = await searchParams
  const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"

  if (accepted) {
    redirect(redirectTo)
  }

  return (
    <LoginLayout
      leftPanel={<BrandMark />}
      rightPanel={
        <div className="w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            Terms of Service updated
          </h2>
          <p className="text-slate-600 mb-6">
            Our Terms of Service have been updated. Please review and accept to continue.
          </p>
          <AcceptTermsForm callbackUrl={redirectTo} />
        </div>
      }
    />
  )
}
