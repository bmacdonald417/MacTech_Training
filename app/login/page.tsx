"use client"

import { LoginLayout } from "@/components/auth/login-layout"
import { BrandMark } from "@/components/auth/brand-mark"
import { TrustCues } from "@/components/auth/trust-cues"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <LoginLayout
      leftPanel={
        <>
          <BrandMark />
          <TrustCues />
        </>
      }
      rightPanel={<LoginForm />}
    />
  )
}
