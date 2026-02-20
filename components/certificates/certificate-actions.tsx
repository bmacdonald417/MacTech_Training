"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

export function CertificateActions() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Download className="h-4 w-4 mr-2" />
        Download as PDF
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  )
}
