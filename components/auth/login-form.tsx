"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "./loading-spinner"
import { AlertCircle } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Sign in</h2>
        <p className="text-slate-600 text-base leading-relaxed">
          Access your training, progress, and certificates.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 text-base rounded-xl border-slate-300 bg-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-slate-400"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-sm text-red-600 flex items-center gap-1.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700 font-medium">
              Password
            </Label>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-12 text-base rounded-xl border-slate-300 bg-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-slate-400"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p
              id="password-error"
              className="text-sm text-red-600 flex items-center gap-1.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1.5">
            Use your organization credentials.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner className="h-5 w-5" />
              Continue
            </span>
          ) : (
            "Continue"
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          Powered by MacTech
        </p>
      </div>
    </div>
  )
}
