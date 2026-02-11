import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"

const TERMS_VERSION_SEED_ID = "terms-2026-02-11-v1"

/** Get the current active TermsVersion (single active version). */
export async function getActiveTermsVersion() {
  return prisma.termsVersion.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  })
}

/** Hash IP for storage (privacy-preserving). */
export function hashIp(ip: string | null): string {
  if (!ip || ip.trim() === "") return "unknown"
  return createHash("sha256").update(ip.trim()).digest("hex")
}

export type RecordTermsAcceptanceParams = {
  userId: string
  orgId: string | null
  termsVersionId: string
  ipHash: string
  userAgent: string
  acceptanceContext: "registration" | "reacceptance"
}

/** Record terms acceptance and optionally write EventLog. Call within a transaction if creating user in same flow. */
export async function recordTermsAcceptance(params: RecordTermsAcceptanceParams) {
  const { userId, orgId, termsVersionId, ipHash, userAgent, acceptanceContext } = params
  const terms = await prisma.termsVersion.findUnique({
    where: { id: termsVersionId },
    select: { version: true },
  })
  if (!terms) throw new Error("Terms version not found")

  const acceptance = await prisma.userTermsAcceptance.create({
    data: {
      userId,
      orgId,
      termsVersionId,
      ipHash,
      userAgent: userAgent.slice(0, 2000),
      acceptanceContext,
    },
  })

  await prisma.eventLog.create({
    data: {
      userId,
      orgId,
      type: "TERMS_ACCEPTED",
      metadata: JSON.stringify({
        termsVersion: terms.version,
        acceptanceContext,
        acceptanceId: acceptance.id,
      }),
    },
  })

  return acceptance
}

/** Check if user has accepted the current active terms version. */
export async function userHasAcceptedCurrentTerms(userId: string): Promise<boolean> {
  const active = await getActiveTermsVersion()
  if (!active) return true
  const acceptance = await prisma.userTermsAcceptance.findFirst({
    where: {
      userId,
      termsVersionId: active.id,
    },
  })
  return !!acceptance
}

/** Get active terms version id; throws if none (enforcement point). */
export async function requireActiveTermsVersion(): Promise<{ id: string; version: string }> {
  const terms = await getActiveTermsVersion()
  if (!terms) throw new Error("No active terms version configured.")
  return { id: terms.id, version: terms.version }
}
