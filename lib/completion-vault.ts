import { createHash } from "crypto"
import { prisma } from "./prisma"

/**
 * Build a canonical payload string for the completion record.
 * Same payload must be used when verifying the hash (e.g. auditor tools).
 */
function buildPayload(params: {
  enrollmentId: string
  userId: string
  orgId: string
  certificateId: string | null
  certificateNumber: string | null
  assignmentTitle: string
  completedAt: Date
}): string {
  const parts = [
    params.enrollmentId,
    params.userId,
    params.orgId,
    params.certificateId ?? "",
    params.certificateNumber ?? "",
    params.assignmentTitle,
    params.completedAt.toISOString(),
  ]
  return parts.join("|")
}

/**
 * Compute SHA-256 hex hash of the payload (server-side).
 */
export function computeVerificationHash(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex")
}

/**
 * Record a training completion in the vault. Call when enrollment is fully
 * completed (and optionally when a certificate is issued).
 * Idempotent per enrollment: we upsert by enrollmentId so re-runs don't duplicate.
 */
export async function recordCompletionInVault(params: {
  enrollmentId: string
  orgId: string
  userId: string
  certificateId?: string | null
  certificateNumber?: string | null
  completedAt: Date
}): Promise<string> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.enrollmentId },
    include: {
      assignment: {
        include: {
          curriculum: true,
          contentItem: true,
        },
      },
    },
  })

  if (!enrollment) {
    throw new Error("Enrollment not found")
  }

  const assignmentTitle =
    enrollment.assignment.type === "CURRICULUM"
      ? enrollment.assignment.curriculum?.title ?? enrollment.assignment.title
      : enrollment.assignment.contentItem?.title ?? enrollment.assignment.title

  const payload = buildPayload({
    enrollmentId: params.enrollmentId,
    userId: params.userId,
    orgId: params.orgId,
    certificateId: params.certificateId ?? null,
    certificateNumber: params.certificateNumber ?? null,
    assignmentTitle,
    completedAt: params.completedAt,
  })

  const verificationHash = computeVerificationHash(payload)

  const existing = await prisma.completionVaultRecord.findFirst({
    where: { enrollmentId: params.enrollmentId },
  })

  if (existing) {
    await prisma.completionVaultRecord.update({
      where: { id: existing.id },
      data: {
        certificateId: params.certificateId ?? null,
        certificateNumber: params.certificateNumber ?? null,
        verificationHash,
        completedAt: params.completedAt,
      },
    })
    return existing.id
  }

  const record = await prisma.completionVaultRecord.create({
    data: {
      orgId: params.orgId,
      enrollmentId: params.enrollmentId,
      userId: params.userId,
      certificateId: params.certificateId ?? null,
      certificateNumber: params.certificateNumber ?? null,
      assignmentTitle,
      completedAt: params.completedAt,
      verificationHash,
    },
  })

  return record.id
}
