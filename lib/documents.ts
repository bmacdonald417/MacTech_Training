import type { DocumentStatus } from "@prisma/client"

/**
 * Server-side document access control (GDP / ISO 17025).
 * - Admin: full control, can see OBSOLETE.
 * - Trainer (Quality Manager): create, edit, submit, review, approve; can see IN_REVIEW, APPROVED, EFFECTIVE.
 * - Trainee/Staff: read-only EFFECTIVE (and optionally APPROVED if policy allows).
 * - External: never see internal QMS.
 */

export type DocumentRole = "ADMIN" | "USER"

const CAN_SEE_OBSOLETE: DocumentRole[] = ["ADMIN"]
const CAN_EDIT_DRAFT: DocumentRole[] = ["ADMIN"]
const CAN_SUBMIT_FOR_REVIEW: DocumentRole[] = ["ADMIN"]
const CAN_APPROVE: DocumentRole[] = ["ADMIN"]
const CAN_MAKE_EFFECTIVE: DocumentRole[] = ["ADMIN"]
const CAN_OBSOLETE: DocumentRole[] = ["ADMIN"]
const CAN_SEE_DRAFT_OR_IN_REVIEW: DocumentRole[] = ["ADMIN"]

/** Statuses visible to regular users (read-only). */
const STAFF_VISIBLE_STATUSES: DocumentStatus[] = ["EFFECTIVE", "APPROVED"]

export function canSeeDocument(role: DocumentRole, status: DocumentStatus): boolean {
  if (role === "ADMIN") return true
  if (role === "USER") return STAFF_VISIBLE_STATUSES.includes(status)
  return false
}

export function canEditDocument(role: DocumentRole, status: DocumentStatus): boolean {
  if (status !== "DRAFT") return false
  return CAN_EDIT_DRAFT.includes(role)
}

export function canSubmitForReview(role: DocumentRole, status: DocumentStatus): boolean {
  if (status !== "DRAFT") return false
  return CAN_SUBMIT_FOR_REVIEW.includes(role)
}

export function canApprove(role: DocumentRole, status: DocumentStatus): boolean {
  if (status !== "IN_REVIEW") return false
  return CAN_APPROVE.includes(role)
}

export function canMakeEffective(role: DocumentRole, status: DocumentStatus): boolean {
  if (status !== "APPROVED") return false
  return CAN_MAKE_EFFECTIVE.includes(role)
}

export function canObsolete(role: DocumentRole, status: DocumentStatus): boolean {
  if (status !== "EFFECTIVE") return false
  return CAN_OBSOLETE.includes(role)
}

export function canAcknowledgeDocument(role: DocumentRole): boolean {
  return ["ADMIN", "USER"].includes(role)
}

export function normalizeDocumentRole(role: string): DocumentRole {
  if (role === "ADMIN" || role === "USER") return role
  return "USER"
}
