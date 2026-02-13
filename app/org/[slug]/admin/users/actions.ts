"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { enrollUserInGroupAssignments } from "@/lib/enroll-group-member"
import type { Role } from "@/lib/rbac"

const VALID_ROLES: Role[] = ["ADMIN", "USER"]

/** Set a user's single group in this org: remove from other org groups, add to selected (or remove from all if groupId is empty). */
export async function setUserGroup(
  orgSlug: string,
  userId: string,
  groupId: string | null
): Promise<{ error?: string }> {
  try {
    const membership = await requireAdmin(orgSlug)
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })
    if (!org) return { error: "Organization not found." }

    const orgGroups = await prisma.group.findMany({
      where: { orgId: org.id },
      select: { id: true },
    })
    const orgGroupIds = orgGroups.map((g) => g.id)

    const userMembership = await prisma.membership.findFirst({
      where: { userId, orgId: org.id },
    })
    if (!userMembership) return { error: "User is not a member of this organization." }

    await prisma.groupMember.deleteMany({
      where: {
        userId,
        groupId: { in: orgGroupIds },
      },
    })

    if (groupId && orgGroupIds.includes(groupId)) {
      await prisma.groupMember.create({
        data: { groupId, userId },
      })
      await enrollUserInGroupAssignments(userId, groupId)
    }

    revalidatePath(`/org/${orgSlug}/admin/users`)
    revalidatePath(`/org/${orgSlug}/my-training`)
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to update groups." }
    }
    console.error("setUserGroup:", err)
    return { error: "Failed to update group." }
  }
}

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
