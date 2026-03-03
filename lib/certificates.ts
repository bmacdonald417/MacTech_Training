import { prisma } from "./prisma"

export async function generateCertificateNumber(): Promise<string> {
  // Generate format: CERT-YYYYMMDD-XXXXXX (6 random alphanumeric)
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const datePrefix = `${year}${month}${day}`

  // Generate random suffix
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing chars
  let suffix = ""
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const certNumber = `CERT-${datePrefix}-${suffix}`

  // Ensure uniqueness
  const exists = await prisma.certificateIssued.findUnique({
    where: { certificateNumber: certNumber },
  })

  if (exists) {
    // Retry with new suffix
    return generateCertificateNumber()
  }

  return certNumber
}

export function renderCertificateTemplate(
  template: string,
  data: {
    userName: string
    certificateNumber: string
    issuedDate: string
    curriculumTitle?: string
    contentItemTitle?: string
    courseName?: string // assignment title, e.g. "CUI Enclave Required User Training"
    userDisplayId?: string | null // computer-generated user ID
  }
): string {
  let html = template
  const courseName =
    data.courseName ||
    data.curriculumTitle ||
    data.contentItemTitle ||
    "CUI Enclave Required User Training"

  // Replace placeholders
  html = html.replace(/\{\{userName\}\}/g, data.userName || "User")
  html = html.replace(/\{\{certificateNumber\}\}/g, data.certificateNumber)
  html = html.replace(/\{\{issuedDate\}\}/g, data.issuedDate)
  html = html.replace(/\{\{curriculumTitle\}\}/g, data.curriculumTitle || "")
  html = html.replace(/\{\{contentItemTitle\}\}/g, data.contentItemTitle || "")
  html = html.replace(/\{\{courseName\}\}/g, courseName)
  html = html.replace(/\{\{userDisplayId\}\}/g, data.userDisplayId ?? "")
  const userDisplayIdBlock = data.userDisplayId
    ? `<p style="font-size: 16px; margin-bottom: 24px; color: #64748b;">User ID: ${data.userDisplayId}</p>`
    : ""
  html = html.replace(/\{\{userDisplayIdBlock\}\}/g, userDisplayIdBlock)

  return html
}

/** Data needed to render a certificate PDF (for MAC-SEC-110 download). */
export interface CertificatePdfData {
  userName: string
  certificateNumber: string
  issuedDate: string
  curriculumTitle?: string
  contentItemTitle?: string
  courseName?: string
  userDisplayId?: string | null
  verificationHash?: string
}

/**
 * Generate certificate as PDF buffer (for download).
 * Layout mirrors the HTML template; includes verification hash when provided (tamper-evident).
 */
export async function generateCertificatePdf(data: CertificatePdfData): Promise<Buffer> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const boxW = pageW - margin * 2
  const boxH = pageH - margin * 2

  // Border (mirror template: 8px solid #0F2438)
  doc.setDrawColor(15, 36, 56)
  doc.setLineWidth(2)
  doc.rect(margin, margin, boxW, boxH)

  const centerX = pageW / 2
  let y = margin + 28

  doc.setFontSize(32)
  doc.setTextColor(15, 36, 56)
  doc.setFont("helvetica", "bold")
  doc.text("Certificate of Completion", centerX, y, { align: "center" })
  y += 18

  doc.setFontSize(14)
  doc.setTextColor(71, 85, 105)
  doc.setFont("helvetica", "normal")
  doc.text("This is to certify that", centerX, y, { align: "center" })
  y += 14

  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "bold")
  doc.text(data.userName || "User", centerX, y, { align: "center" })
  y += 14

  if (data.userDisplayId) {
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.setFont("helvetica", "normal")
    doc.text("User ID: " + data.userDisplayId, centerX, y, { align: "center" })
    y += 10
  }

  doc.setFontSize(12)
  doc.setTextColor(71, 85, 105)
  doc.setFont("helvetica", "normal")
  doc.text("has successfully completed", centerX, y, { align: "center" })
  y += 14

  const courseTitle =
    data.courseName ||
    data.curriculumTitle ||
    data.contentItemTitle ||
    "CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training"
  doc.setFontSize(16)
  doc.setTextColor(15, 36, 56)
  doc.setFont("helvetica", "bold")
  const split = doc.splitTextToSize(courseTitle, boxW - 24)
  doc.text(split, centerX, y, { align: "center" })
  y += split.length * 8 + 8

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.setFont("helvetica", "normal")
  doc.text("AT.L2-3.2.1 / AT.L2-3.2.2 / AT.L2-3.2.3", centerX, y, { align: "center" })
  y += 14

  doc.setFontSize(11)
  doc.text("Issued on " + data.issuedDate, centerX, y, { align: "center" })
  y += 10

  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text("Certificate Number: " + data.certificateNumber, centerX, y, { align: "center" })

  if (data.verificationHash) {
    y += 20
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.rect(margin + 10, y - 6, boxW - 20, 28)
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text("Verification (SHA-256). Auditors may confirm completion against the organization's verification records.", centerX, y + 2, { align: "center" })
    doc.setFont("courier", "normal")
    const hashSplit = doc.splitTextToSize(data.verificationHash, boxW - 24)
    doc.text(hashSplit[0] ?? data.verificationHash, centerX, y + 10, { align: "center" })
    doc.setFontSize(6)
    doc.text("MacTech Training — Tamper-evident completion record", centerX, y + 20, { align: "center" })
  }

  return Buffer.from(doc.output("arraybuffer"))
}
