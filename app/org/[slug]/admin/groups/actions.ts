"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

export async function createGroup(orgSlug: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length < 1) {
    return { error: "Group name is required." }
  }

  const groupType = (formData.get("groupType") as string)?.trim() || null

  try {
    const membership = await requireAdmin(orgSlug)

    let joinCode: string
    let attempts = 0
    do {
      joinCode = nanoid(8)
      const existing = await prisma.group.findUnique({ where: { joinCode } })
      if (!existing) break
      attempts++
    } while (attempts < 5)
    if (attempts >= 5) {
      joinCode = nanoid(12)
    }

    await prisma.group.create({
      data: {
        orgId: membership.orgId,
        name,
        groupType: groupType || undefined,
        joinCode,
      },
    })

    revalidatePath(`/org/${orgSlug}/admin/groups`)
    return { success: true }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to create groups." }
    }
    console.error("createGroup:", err)
    return { error: "Failed to create group." }
  }
}

export async function ensureGroupJoinCode(orgSlug: string, groupId: string) {
  try {
    const membership = await requireAdmin(orgSlug)
    const group = await prisma.group.findFirst({
      where: { id: groupId, orgId: membership.orgId },
    })
    if (!group) return { error: "Group not found." }
    if (group.joinCode) {
      revalidatePath(`/org/${orgSlug}/admin/groups`)
      return { success: true, joinCode: group.joinCode }
    }
    let joinCode = nanoid(8)
    const existing = await prisma.group.findUnique({ where: { joinCode } })
    if (existing) joinCode = nanoid(12)
    await prisma.group.update({
      where: { id: groupId },
      data: { joinCode },
    })
    revalidatePath(`/org/${orgSlug}/admin/groups`)
    return { success: true, joinCode }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission." }
    }
    console.error("ensureGroupJoinCode:", err)
    return { error: "Failed to generate join link." }
  }
}

/** Wipe all curricula for the org (and their assignments/enrollments). Admin only. */
export async function wipeCurriculaForOrg(
  orgSlug: string
): Promise<{ error?: string; wiped?: number }> {
  try {
    const membership = await requireAdmin(orgSlug)
    const curricula = await prisma.curriculum.findMany({
      where: { orgId: membership.orgId },
      select: { id: true },
    })
    if (curricula.length === 0) {
      revalidatePath(`/org/${orgSlug}/admin/groups`)
      revalidatePath(`/org/${orgSlug}/admin/groups/[groupId]/assign-curriculum`)
      return { wiped: 0 }
    }
    const curriculumIds = curricula.map((c) => c.id)
    const assignments = await prisma.assignment.findMany({
      where: { curriculumId: { in: curriculumIds } },
      select: { id: true },
    })
    const assignmentIds = assignments.map((a) => a.id)
    if (assignmentIds.length > 0) {
      await prisma.enrollmentItemProgress.deleteMany({
        where: { enrollment: { assignmentId: { in: assignmentIds } } },
      })
      await prisma.enrollment.deleteMany({
        where: { assignmentId: { in: assignmentIds } },
      })
      await prisma.assignment.deleteMany({
        where: { id: { in: assignmentIds } },
      })
    }
    await prisma.curriculum.deleteMany({
      where: { orgId: membership.orgId },
    })
    revalidatePath(`/org/${orgSlug}/admin/groups`)
    revalidatePath(`/org/${orgSlug}/admin/groups/[groupId]/assign-curriculum`)
    revalidatePath(`/org/${orgSlug}/trainer/curricula`)
    revalidatePath(`/org/${orgSlug}/trainer/assignments`)
    return { wiped: curricula.length }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission." }
    }
    console.error("wipeCurriculaForOrg:", err)
    return { error: "Failed to wipe curricula." }
  }
}

/** Assign a single content item (e.g. slide deck) to a group. Creates one Assignment and enrollments. */
export async function assignContentItemToGroup(
  orgSlug: string,
  groupId: string,
  contentItemId: string,
  title: string,
  dueDate?: string | null
): Promise<{ error?: string; enrolledCount?: number }> {
  try {
    const membership = await requireAdmin(orgSlug)
    const [group, contentItem] = await Promise.all([
      prisma.group.findFirst({
        where: { id: groupId, orgId: membership.orgId },
        include: { members: { select: { userId: true } } },
      }),
      prisma.contentItem.findFirst({
        where: { id: contentItemId, orgId: membership.orgId },
        select: { id: true, title: true },
      }),
    ])
    if (!group) return { error: "Group not found." }
    if (!contentItem) return { error: "Content not found." }
    const assignmentTitle = title?.trim() || contentItem.title

    const userIds = group.members.map((m) => m.userId)
    const isIntroGroup = group.name === "intro"

    const assignment = await prisma.assignment.create({
      data: {
        orgId: membership.orgId,
        type: "CONTENT_ITEM",
        contentItemId: contentItem.id,
        groupId: group.id,
        title: assignmentTitle,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    if (!isIntroGroup && userIds.length > 0) {
      await prisma.enrollment.createMany({
        data: userIds.map((userId) => ({
          assignmentId: assignment.id,
          userId,
        })),
      })
    }

    revalidatePath(`/org/${orgSlug}/admin/groups`)
    revalidatePath(`/org/${orgSlug}/admin/groups/${groupId}/assign-curriculum`)
    revalidatePath(`/org/${orgSlug}/trainer/assignments`)
    revalidatePath(`/org/${orgSlug}/my-training`)
    return {
      enrolledCount: isIntroGroup ? 0 : userIds.length,
      message: isIntroGroup
        ? "Assignment added to intro group. Members will see it on the dashboard as available and can self-assign."
        : undefined,
    }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to assign training." }
    }
    console.error("assignContentItemToGroup:", err)
    return { error: "Failed to assign to group." }
  }
}

/** Assign a curriculum to a group: creates one Assignment and one Enrollment per user in the group. */
export async function assignCurriculumToGroup(
  orgSlug: string,
  groupId: string,
  curriculumId: string,
  title: string,
  dueDate?: string | null
): Promise<{ error?: string; enrolledCount?: number }> {
  try {
    const membership = await requireAdmin(orgSlug)
    const [group, curriculum] = await Promise.all([
      prisma.group.findFirst({
        where: { id: groupId, orgId: membership.orgId },
        include: { members: { select: { userId: true } } },
      }),
      prisma.curriculum.findFirst({
        where: { id: curriculumId, orgId: membership.orgId },
      }),
    ])
    if (!group) return { error: "Group not found." }
    if (!curriculum) return { error: "Curriculum not found." }
    const assignmentTitle = title?.trim() || curriculum.title

    const userIds = group.members.map((m) => m.userId)
    const isIntroGroup = group.name === "intro"

    const assignment = await prisma.assignment.create({
      data: {
        orgId: membership.orgId,
        type: "CURRICULUM",
        curriculumId: curriculum.id,
        groupId: group.id,
        title: assignmentTitle,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    if (!isIntroGroup && userIds.length > 0) {
      await prisma.enrollment.createMany({
        data: userIds.map((userId) => ({
          assignmentId: assignment.id,
          userId,
        })),
      })
    }

    revalidatePath(`/org/${orgSlug}/admin/groups`)
    revalidatePath(`/org/${orgSlug}/admin/groups/${groupId}/assign-curriculum`)
    revalidatePath(`/org/${orgSlug}/trainer/assignments`)
    revalidatePath(`/org/${orgSlug}/my-training`)
    return {
      enrolledCount: isIntroGroup ? 0 : userIds.length,
      message: isIntroGroup
        ? "Assignment added to intro group. Members will see it on the dashboard as available and can self-assign."
        : undefined,
    }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to assign curricula." }
    }
    console.error("assignCurriculumToGroup:", err)
    return { error: "Failed to assign curriculum to group." }
  }
}

/** Remove a curriculum assignment from a group. Deletes the assignment and its enrollments. */
export async function removeAssignmentFromGroup(
  orgSlug: string,
  assignmentId: string
): Promise<{ error?: string }> {
  try {
    const membership = await requireAdmin(orgSlug)
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, orgId: membership.orgId, groupId: { not: null } },
    })
    if (!assignment) return { error: "Assignment not found or not a group assignment." }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    })

    revalidatePath(`/org/${orgSlug}/admin/groups`)
    revalidatePath(`/org/${orgSlug}/admin/groups/${assignment.groupId}/assign-curriculum`)
    revalidatePath(`/org/${orgSlug}/trainer/assignments`)
    revalidatePath(`/org/${orgSlug}/my-training`)
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission." }
    }
    console.error("removeAssignmentFromGroup:", err)
    return { error: "Failed to remove training from group." }
  }
}
