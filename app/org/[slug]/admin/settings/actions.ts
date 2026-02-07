"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function updateOrganizationProfile(
  orgSlug: string,
  formData: FormData
) {
  const name = (formData.get("name") as string)?.trim()
  if (!name || name.length < 1) {
    return { error: "Organization name is required." }
  }

  try {
    const membership = await requireAdmin(orgSlug)

    await prisma.organization.update({
      where: { id: membership.orgId },
      data: { name },
    })

    revalidatePath(`/org/${orgSlug}/admin/settings`)
    return { success: true }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to update settings." }
    }
    console.error("updateOrganizationProfile:", err)
    return { error: "Failed to save changes." }
  }
}
