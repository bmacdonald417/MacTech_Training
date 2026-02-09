import type { DocumentStatus } from "@prisma/client"

/**
 * Server-side document access control (GDP / ISO 17025).
 * - Admin: full control, can see OBSOLETE.
 * - Trainer (Quality Manager): create, edit, submit, review, approve; can see IN_REVIEW, APPROVED, EFFECTIVE.
 * - Trainee/Staff: read-only EFFECTIVE (and optionally APPROVED if policy allows).
 * - External: never see internal QMS.
 */

export type DocumentRole = "ADMIN" | "TRAINER" | "TRAINEE"

const CAN_SEE_OBSOLETE: DocumentRole[] = ["ADMIN"]
const CAN_EDIT_DRAFT: DocumentRole[] = ["ADMIN", "TRAINER"]
const CAN_SUBMIT_FOR_REVIEW: DocumentRole[] = ["ADMIN", "TRAINER"]
const CAN_APPROVE: DocumentRole[] = ["ADMIN", "TRAINER"]
const CAN_MAKE_EFFECTIVE: DocumentRole[] = ["ADMIN", "TRAINER"]
const CAN_OBSOLETE: DocumentRole[] = ["ADMIN", "TRAINER"]
const CAN_SEE_DRAFT_OR_IN_REVIEW: DocumentRole[] = ["ADMIN", "TRAINER"]

/** Statuses visible to staff (read-only). */
const STAFF_VISIBLE_STATUSES: DocumentStatus[] = ["EFFECTIVE", "APPROVED"]

export function canSeeDocument(role: DocumentRole, status: DocumentStatus): boolean {
  if (role === "ADMIN") return true
  if (role === "TRAINER") return status !== "OBSOLETE" || CAN_SEE_OBSOLETE.includes(role)
  if (role === "TRAINEE") return STAFF_VISIBLE_STATUSES.includes(status)
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
  return ["ADMIN", "TRAINER", "TRAINEE"].includes(role)
}

export function normalizeDocumentRole(role: string): DocumentRole {
  if (role === "ADMIN" || role === "TRAINER" || role === "TRAINEE") return role
  return "TRAINEE"
}
