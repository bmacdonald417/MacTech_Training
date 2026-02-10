"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/lib/rbac"

const VALID_ROLES: Role[] = ["ADMIN", "TRAINER", "TRAINEE"]

export async function updateMemberRole(
  orgSlug: string,
  membershipId: string,
  role: string
): Promise<{ error?: string }> {
  try {
    const membership = await requireAdmin(orgSlug)
    const validRole = VALID_ROLES.includes(role as Role) ? (role as Role) : null
    if (!validRole) {
      return { error: "Invalid role." }
    }

    const existing = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        orgId: membership.orgId,
      },
    })
    if (!existing) {
      return { error: "Membership not found." }
    }

    await prisma.membership.update({
      where: { id: membershipId },
      data: { role: validRole },
    })

    revalidatePath(`/org/${orgSlug}/admin/users`)
    revalidatePath(`/org/${orgSlug}/admin/users/${membershipId}/edit`)
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to update roles." }
    }
    console.error("updateMemberRole:", err)
    return { error: "Failed to update role." }
  }
}
