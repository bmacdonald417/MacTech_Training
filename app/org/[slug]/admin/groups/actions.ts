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
