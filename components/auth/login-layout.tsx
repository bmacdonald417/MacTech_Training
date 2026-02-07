"use client"

import { ReactNode } from "react"

interface LoginLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
}

export function LoginLayout({ leftPanel, rightPanel }: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Trust Cues */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-0" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16">
          {leftPanel}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -z-0" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile: Show brand at top */}
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">MacTech Training</h1>
            <p className="text-sm text-slate-600">Professional training platform</p>
          </div>
          {rightPanel}
        </div>
      </div>
    </div>
  )
}
