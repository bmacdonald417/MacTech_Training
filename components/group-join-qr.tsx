"use client"

import { QRCodeSVG } from "qrcode.react"

interface GroupJoinQRProps {
  joinUrl: string
  size?: number
  className?: string
}

export function GroupJoinQR({ joinUrl, size = 128, className }: GroupJoinQRProps) {
  return (
    <div className={className}>
      <QRCodeSVG value={joinUrl} size={size} level="M" includeMargin />
    </div>
  )
}
