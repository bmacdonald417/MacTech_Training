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
  }
): string {
  let html = template

  // Replace placeholders
  html = html.replace(/\{\{userName\}\}/g, data.userName || "User")
  html = html.replace(/\{\{certificateNumber\}\}/g, data.certificateNumber)
  html = html.replace(/\{\{issuedDate\}\}/g, data.issuedDate)
  html = html.replace(/\{\{curriculumTitle\}\}/g, data.curriculumTitle || "")
  html = html.replace(/\{\{contentItemTitle\}\}/g, data.contentItemTitle || "")

  return html
}
