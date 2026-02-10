import { Suspense } from "react"
import { SignupForm } from "./signup-form"
import { LoginLayout } from "@/components/auth/login-layout"
import { BrandMark } from "@/components/auth/brand-mark"
import { TrustCues } from "@/components/auth/trust-cues"

function SignupFallback() {
  return (
    <LoginLayout
      leftPanel={
        <>
          <BrandMark />
          <TrustCues />
        </>
      }
      rightPanel={
        <div className="w-full animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
        </div>
      }
    />
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  )
}
