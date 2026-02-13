"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LoginLayout } from "@/components/auth/login-layout"
import { BrandMark } from "@/components/auth/brand-mark"
import { TrustCues } from "@/components/auth/trust-cues"
import { LoginForm } from "@/components/auth/login-form"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <LoginLayout
      leftPanel={
        <>
          <BrandMark />
          <TrustCues />
        </>
      }
      rightPanel={
        <>
          {error === "Configuration" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>Auth configuration error.</strong> Set <code className="rounded bg-amber-100 px-1">NEXTAUTH_SECRET</code> in{" "}
              <code className="rounded bg-amber-100 px-1">.env.local</code> (e.g. run{" "}
              <code className="rounded bg-amber-100 px-1">openssl rand -base64 32</code> and add{" "}
              <code className="rounded bg-amber-100 px-1">NEXTAUTH_SECRET=&lt;value&gt;</code>). For local dev add{" "}
              <code className="rounded bg-amber-100 px-1">NEXTAUTH_URL=http://localhost:3000</code>.
            </div>
          )}
          <LoginForm />
        </>
      }
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLayout leftPanel={null} rightPanel={<div className="animate-pulse rounded bg-slate-100 h-64" />} />}>
      <LoginContent />
    </Suspense>
  )
}
