"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function createGroup(orgSlug: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length < 1) {
    return { error: "Group name is required." }
  }

  try {
    const membership = await requireAdmin(orgSlug)

    await prisma.group.create({
      data: {
        orgId: membership.orgId,
        name,
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
