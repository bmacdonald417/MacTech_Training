"use server"

import { revalidatePath } from "next/cache"
import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export type SectionInput = {
  title: string
  description?: string
  contentItemIds: string[]
}

export async function createCurriculum(
  orgSlug: string,
  payload: { title: string; description?: string; sections: SectionInput[] }
) {
  const { title, description, sections } = payload
  if (!title?.trim()) {
    return { error: "Curriculum title is required." }
  }
  if (!sections?.length || sections.every((s) => !s.title?.trim())) {
    return { error: "Add at least one section with a title." }
  }

  try {
    const membership = await requireTrainerOrAdmin(orgSlug)

    const curriculum = await prisma.curriculum.create({
      data: {
        orgId: membership.orgId,
        title: title.trim(),
        description: description?.trim() || null,
      },
    })

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      if (!sec.title?.trim()) continue
      const section = await prisma.curriculumSection.create({
        data: {
          curriculumId: curriculum.id,
          title: sec.title.trim(),
          description: sec.description?.trim() || null,
          order: i,
        },
      })
      const contentItemIds = (sec.contentItemIds || []).filter(Boolean)
      for (let j = 0; j < contentItemIds.length; j++) {
        await prisma.curriculumItem.create({
          data: {
            sectionId: section.id,
            contentItemId: contentItemIds[j],
            order: j,
            required: true,
          },
        })
      }
    }

    revalidatePath(`/org/${orgSlug}/trainer/curricula`)
    return { success: true, curriculumId: curriculum.id }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to create curricula." }
    }
    console.error("createCurriculum:", err)
    return { error: "Failed to create curriculum." }
  }
}

export async function updateCurriculum(
  orgSlug: string,
  curriculumId: string,
  payload: { title: string; description?: string; sections: SectionInput[] }
) {
  const { title, sections } = payload
  if (!title?.trim()) {
    return { error: "Curriculum title is required." }
  }
  if (!sections?.length || sections.every((s) => !s.title?.trim())) {
    return { error: "Add at least one section with a title." }
  }

  try {
    const membership = await requireTrainerOrAdmin(orgSlug)

    const existing = await prisma.curriculum.findFirst({
      where: { id: curriculumId, orgId: membership.orgId },
      include: { sections: { include: { items: true } } },
    })
    if (!existing) {
      return { error: "Curriculum not found." }
    }

    await prisma.curriculum.update({
      where: { id: curriculumId },
      data: {
        title: title.trim(),
        description: payload.description?.trim() || null,
      },
    })

    // Replace sections and items: delete existing items/sections, then create new
    for (const section of existing.sections) {
      await prisma.curriculumItem.deleteMany({ where: { sectionId: section.id } })
    }
    await prisma.curriculumSection.deleteMany({ where: { curriculumId: curriculumId } })

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      if (!sec.title?.trim()) continue
      const section = await prisma.curriculumSection.create({
        data: {
          curriculumId: curriculumId,
          title: sec.title.trim(),
          description: sec.description?.trim() || null,
          order: i,
        },
      })
      const contentItemIds = (sec.contentItemIds || []).filter(Boolean)
      for (let j = 0; j < contentItemIds.length; j++) {
        await prisma.curriculumItem.create({
          data: {
            sectionId: section.id,
            contentItemId: contentItemIds[j],
            order: j,
            required: true,
          },
        })
      }
    }

    revalidatePath(`/org/${orgSlug}/trainer/curricula`)
    revalidatePath(`/org/${orgSlug}/trainer/curricula/${curriculumId}`)
    revalidatePath(`/org/${orgSlug}/trainer/curricula/${curriculumId}/edit`)
    return { success: true }
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return { error: "You don't have permission to update this curriculum." }
    }
    console.error("updateCurriculum:", err)
    return { error: "Failed to update curriculum." }
  }
}
