"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

/**
 * Self-enroll in an assignment that is assigned to one of the user's groups.
 * Creates an enrollment so the training appears in My Training and the user can start it.
 */
export async function selfEnrollInAssignment(
  orgSlug: string,
  assignmentId: string
): Promise<{ enrollmentId?: string; error?: string }> {
  const membership = await requireAuth(orgSlug)

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      orgId: membership.orgId,
      groupId: { not: null },
    },
    include: {
      curriculum: { select: { id: true, title: true } },
      contentItem: { select: { id: true, title: true } },
    },
  })

  if (!assignment) {
    return { error: "Assignment not found or not available for self-enroll." }
  }

  const isMember = await prisma.groupMember.findFirst({
    where: {
      groupId: assignment.groupId!,
      userId: membership.userId,
    },
  })

  if (!isMember) {
    return { error: "This training is not assigned to your group." }
  }

  const existing = await prisma.enrollment.findFirst({
    where: {
      assignmentId: assignment.id,
      userId: membership.userId,
    },
  })

  if (existing) {
    return { enrollmentId: existing.id }
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      assignmentId: assignment.id,
      userId: membership.userId,
    },
  })

  revalidatePath(`/org/${orgSlug}/dashboard`)
  revalidatePath(`/org/${orgSlug}/my-training`)
  return { enrollmentId: enrollment.id }
}
