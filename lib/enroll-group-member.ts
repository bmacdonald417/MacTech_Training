import { prisma } from "@/lib/prisma"

/**
 * When a user is added to a group, create Enrollment records for that user
 * for every Assignment that is tied to that group (so they see it in My Training).
 * Skips assignments for which the user already has an enrollment.
 */
export async function enrollUserInGroupAssignments(
  userId: string,
  groupId: string
): Promise<{ enrolledCount: number }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, orgId: true },
  })
  if (!group) return { enrolledCount: 0 }

  const assignments = await prisma.assignment.findMany({
    where: { groupId: group.id, orgId: group.orgId },
    select: { id: true },
  })
  if (assignments.length === 0) return { enrolledCount: 0 }

  const existing = await prisma.enrollment.findMany({
    where: {
      userId,
      assignmentId: { in: assignments.map((a) => a.id) },
    },
    select: { assignmentId: true },
  })
  const existingAssignmentIds = new Set(existing.map((e) => e.assignmentId))
  const toCreate = assignments.filter((a) => !existingAssignmentIds.has(a.id))

  if (toCreate.length === 0) return { enrolledCount: 0 }

  await prisma.enrollment.createMany({
    data: toCreate.map((a) => ({
      assignmentId: a.id,
      userId,
    })),
  })

  return { enrolledCount: toCreate.length }
}
