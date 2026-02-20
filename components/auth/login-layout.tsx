"use client"

import { ReactNode } from "react"
import Image from "next/image"

interface LoginLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
}

export function LoginLayout({ leftPanel, rightPanel }: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark brand area with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0c] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16">
          {leftPanel}
        </div>
      </div>

      {/* Right Panel - Login Form (light panel: force dark input text for readability) */}
      <div className="auth-form-panel flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile: Brand with logo on dark strip */}
          <div className="lg:hidden mb-8 -mx-4 sm:-mx-6 lg:mx-0 -mt-2 px-4 sm:px-6 pt-6 pb-8 rounded-b-xl bg-[#0a0a0c]">
            <Image
              src="/mactech.png"
              alt="MacTech Solutions"
              width={220}
              height={72}
              className="h-12 w-auto object-contain object-left invert"
              priority
            />
            <p className="text-sm text-slate-400 mt-3">Professional training platform</p>
          </div>
          {rightPanel}
        </div>
      </div>
    </div>
  )
}
