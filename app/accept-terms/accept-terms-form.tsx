"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export function AcceptTermsForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accepted) {
      setError("You must accept the acknowledgment to continue.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termsAccepted: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        setLoading(false)
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="accept-terms-checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <label htmlFor="accept-terms-checkbox" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
          I acknowledge that all materials on this platform are confidential and proprietary to MacTech Solutions LLC. I agree not to copy, record, screenshot, distribute, or reproduce any content without prior written authorization. I agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>
          .
        </label>
      </div>
      <p className="text-xs text-slate-500">This acknowledgment is required to continue.</p>
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <Button type="submit" disabled={!accepted || loading} className="w-full h-12">
        {loading ? "Saving…" : "Continue"}
      </Button>
    </form>
  )
}
