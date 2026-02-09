import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

export type Role = "ADMIN" | "TRAINER" | "TRAINEE"

// Admin has access to all features: everything a trainer can do (Content, Curricula, Assignments,
// Documents, Competency, etc.) plus admin-only (Users, Groups, Reports, Settings, Archive).

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }
  return session.user
}

export async function getUserMembership(orgSlug: string) {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const membership = user.memberships?.find((m) => m.orgSlug === orgSlug)
  if (!membership) {
    return null
  }

  return {
    ...membership,
    userId: user.id,
  }
}

export async function requireAuth(orgSlug: string) {
  const membership = await getUserMembership(orgSlug)
  if (!membership) {
    throw new Error("Unauthorized")
  }
  return membership
}

export async function requireRole(orgSlug: string, allowedRoles: Role[]) {
  const membership = await requireAuth(orgSlug)
  if (!allowedRoles.includes(membership.role as Role)) {
    throw new Error("Forbidden")
  }
  return membership
}

export async function requireAdmin(orgSlug: string) {
  return requireRole(orgSlug, ["ADMIN"])
}

/** Trainer or Admin. Admin has full access to all trainer features. */
export async function requireTrainerOrAdmin(orgSlug: string) {
  return requireRole(orgSlug, ["ADMIN", "TRAINER"])
}
