"use server"

import { revalidatePath } from "next/cache"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export type CreateAssignmentInput = {
  type: "CURRICULUM" | "CONTENT_ITEM"
  curriculumId?: string
  contentItemId?: string
  title: string
  description?: string
  dueDate?: string // ISO date
}

export async function createAssignment(orgSlug: string, payload: CreateAssignmentInput) {
  const { type, title } = payload
  if (!title?.trim()) {
    return { error: "Assignment title is required." }
  }
  if (type === "CURRICULUM" && !payload.curriculumId) {
    return { error: "Please select a curriculum." }
  }
  if (type === "CONTENT_ITEM" && !payload.contentItemId) {
    return { error: "Please select a content item." }
  }

  try {
    const membership = await requireTrainerOrAdmin(orgSlug)

    if (type === "CURRICULUM") {
      const curriculum = await prisma.curriculum.findFirst({
        where: { id: payload.curriculumId!, orgId: membership.orgId },
      })
      if (!curriculum) {
        return { error: "Curriculum not found." }
      }
    } else {
      const contentItem = await prisma.contentItem.findFirst({
        where: { id: payload.contentItemId!, orgId: membership.orgId },
      })
      if (!contentItem) {
        return { error: "Content item not found." }
      }
    }

    await prisma.assignment.create({
      data: {
        orgId: membership.orgId,
        type,
        curriculumId: type === "CURRICULUM" ? payload.curriculumId : null,
        contentItemId: type === "CONTENT_ITEM" ? payload.contentItemId : null,
        title: title.trim(),
        description: payload.description?.trim() || null,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      },
    })

    revalidatePath(`/org/${orgSlug}/trainer/assignments`)
    return { success: true }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to create assignments." }
    }
    console.error("createAssignment:", err)
    return { error: "Failed to create assignment." }
  }
}
