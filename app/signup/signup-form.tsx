"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { LoginLayout } from "@/components/auth/login-layout"
import { BrandMark } from "@/components/auth/brand-mark"
import { TrustCues } from "@/components/auth/trust-cues"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/auth/loading-spinner"
import { AlertCircle } from "lucide-react"

const REFERRAL_OPTIONS = [
  { value: "web", label: "Web page / search" },
  { value: "company", label: "Another company" },
  { value: "hiring_agency", label: "Hiring agency" },
  { value: "accelerator", label: "Accelerator" },
  { value: "event", label: "Event or conference" },
  { value: "social", label: "Social media" },
  { value: "referral", label: "Referral from someone" },
  { value: "other", label: "Other" },
]

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  referralSource: z.string().min(1, "Please select how you heard about us"),
})

type SignupForm = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const joinCode = searchParams.get("joinCode") ?? undefined
  const [groupName, setGroupName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!joinCode) return
    fetch(`/api/join-info?joinCode=${encodeURIComponent(joinCode)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.groupName && setGroupName(data.groupName))
      .catch(() => {})
  }, [joinCode])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { referralSource: "" },
  })

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          referralSource: data.referralSource,
          joinCode: joinCode || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? "Registration failed.")
        setIsLoading(false)
        return
      }
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.ok) {
        router.push("/")
        router.refresh()
      } else {
        router.push("/login?registered=1")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <LoginLayout
      leftPanel={
        <>
          <BrandMark />
          <TrustCues />
        </>
      }
      rightPanel={
        <div className="w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Create an account</h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {groupName
                ? `You're joining: ${groupName}. Sign up to get started.`
                : "Sign up to access training, progress, and certificates."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">Name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="h-12 text-base rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 text-base rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-12 text-base rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralSource" className="text-slate-700 font-medium">
                How did you hear about us?
              </Label>
              <select
                id="referralSource"
                className="flex h-12 w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 text-base shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("referralSource")}
              >
                <option value="">Select an option</option>
                {REFERRAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.referralSource && (
                <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {errors.referralSource.message}
                </p>
              )}
            </div>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3" role="alert">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner className="h-5 w-5" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Already have an account?{" "}
              <Link href={joinCode ? `/login?joinCode=${joinCode}` : "/login"} className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      }
    />
  )
}
