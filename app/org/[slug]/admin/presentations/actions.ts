"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function updateSlideNotesRichText(
  orgSlug: string,
  slideDeckId: string,
  slideId: string,
  notesRichText: string | null
) {
  try {
    const membership = await requireAdmin(orgSlug)

    const slide = await prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        slideDeck: {
          select: {
            id: true,
            contentItem: { select: { orgId: true } },
          },
        },
      },
    })

    if (
      !slide?.slideDeck ||
      slide.slideDeck.id !== slideDeckId ||
      slide.slideDeck.contentItem.orgId !== membership.orgId
    ) {
      return { error: "Slide not found" }
    }

    await prisma.slide.update({
      where: { id: slideId },
      data: { notesRichText: notesRichText?.trim() ? notesRichText : null },
    })

    revalidatePath(`/org/${orgSlug}/admin/presentations/${slideDeckId}`)
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to update this presentation." }
    }
    console.error("updateSlideNotesRichText:", err)
    return { error: "Failed to save notes." }
  }
}

