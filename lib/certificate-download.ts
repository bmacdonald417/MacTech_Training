/**
 * MAC-SEC-110 / Trust Codex: certificate download filename and metadata
 * for CUI Enclave Required User Training.
 * @see MAC-SEC-110_Training_Certificate_Technical_Spec.md
 */

/**
 * Build trainee name for filename: "LastName_FirstInitial" (e.g. Doe_J).
 * Falls back to "Trainee" if name/email not parseable.
 */
export function lastNameFirstInitial(displayName: string): string {
  const trimmed = (displayName || "").trim()
  if (!trimmed) return "Trainee"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Trainee"
  const last = parts[parts.length - 1]!.replace(/[^a-zA-Z0-9]/g, "")
  const first = parts[0]!.replace(/[^a-zA-Z0-9]/g, "").charAt(0) || "X"
  if (!last) return "Trainee"
  return `${last}_${first.toUpperCase()}`
}

/**
 * MAC-SEC-110 recommended certificate filename.
 * Pattern: LastName_FirstInitial_CUI-Training_YYYY-MM-DD.pdf
 */
export function certificateFileName(displayName: string, date: Date, ext: "pdf" | "png" | "jpg" = "pdf"): string {
  const base = lastNameFirstInitial(displayName)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${base}_CUI-Training_${yyyy}-${mm}-${dd}.${ext}`
}

/**
 * Metadata for Trust Codex Training Completion Log / upload form.
 * Same base name as certificate with .metadata.json
 */
export interface CertificateMetadataJson {
  name: string
  role?: string
  completionDate: string // YYYY-MM-DD
  assessmentResult?: string // e.g. "Pass (85%)"
  fileName: string
  userDisplayId?: string
  courseName?: string
}

export function metadataFileName(certFileName: string): string {
  const base = certFileName.replace(/\.(pdf|png|jpe?g)$/i, "")
  return `${base}.metadata.json`
}

export function buildMetadataJson(params: {
  name: string
  role?: string
  completionDate: string
  assessmentResult?: string
  fileName: string
  userDisplayId?: string | null
  courseName?: string
}): CertificateMetadataJson {
  return {
    name: params.name.replace(/\|/g, " "),
    role: params.role,
    completionDate: params.completionDate,
    assessmentResult: params.assessmentResult,
    fileName: params.fileName,
    ...(params.userDisplayId && { userDisplayId: params.userDisplayId }),
    ...(params.courseName && { courseName: params.courseName }),
  }
}
