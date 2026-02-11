import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">
          MacTech Solutions LLC (&quot;MacTech&quot;) is committed to protecting your privacy. This page is a placeholder;
          a full Privacy Policy will be published here.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          For questions about how we collect, use, or disclose your information, please contact your administrator or
          MacTech Solutions LLC.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  )
}
