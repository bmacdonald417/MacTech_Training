"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ContentType } from "@prisma/client"
import { requireTrainerOrAdmin } from "@/lib/rbac"

export async function createContent(
  orgSlug: string,
  data: {
    type: ContentType
    title: string
    description?: string
    videoUrl?: string
    videoDuration?: number
    articleContent?: string
    slideTitles?: string[]
    formSchemaJson?: string
    attestationText?: string
  }
) {
  const membership = await requireTrainerOrAdmin(orgSlug)

  const title = data.title?.trim()
  if (!title) {
    return { error: "Title is required" }
  }

  switch (data.type) {
    case "VIDEO": {
      const url = data.videoUrl?.trim()
      if (!url) return { error: "Video URL is required" }
      const contentItem = await prisma.contentItem.create({
        data: {
          orgId: membership.orgId,
          type: ContentType.VIDEO,
          title,
          description: data.description?.trim() || null,
        },
      })
      await prisma.video.create({
        data: {
          contentItemId: contentItem.id,
          url,
          duration: data.videoDuration ?? null,
        },
      })
      revalidatePath(`/org/${orgSlug}/trainer/content`)
      redirect(`/org/${orgSlug}/trainer/content/${contentItem.id}`)
    }
    case "SLIDE_DECK": {
      const contentItem = await prisma.contentItem.create({
        data: {
          orgId: membership.orgId,
          type: ContentType.SLIDE_DECK,
          title,
          description: data.description?.trim() || null,
        },
      })
      const slideDeck = await prisma.slideDeck.create({
        data: { contentItemId: contentItem.id },
      })
      const titles = data.slideTitles?.length
        ? data.slideTitles
        : ["Slide 1"]
      await prisma.slide.createMany({
        data: titles.map((t, i) => ({
          slideDeckId: slideDeck.id,
          title: t.trim() || `Slide ${i + 1}`,
          content: "",
          order: i + 1,
        })),
      })
      revalidatePath(`/org/${orgSlug}/trainer/content`)
      redirect(`/org/${orgSlug}/trainer/content/${contentItem.id}`)
    }
    case "ARTICLE": {
      const contentItem = await prisma.contentItem.create({
        data: {
          orgId: membership.orgId,
          type: ContentType.ARTICLE,
          title,
          description: data.description?.trim() || null,
        },
      })
      await prisma.article.create({
        data: {
          contentItemId: contentItem.id,
          content: data.articleContent?.trim() || "",
        },
      })
      revalidatePath(`/org/${orgSlug}/trainer/content`)
      redirect(`/org/${orgSlug}/trainer/content/${contentItem.id}`)
    }
    case "FORM": {
      const contentItem = await prisma.contentItem.create({
        data: {
          orgId: membership.orgId,
          type: ContentType.FORM,
          title,
          description: data.description?.trim() || null,
        },
      })
      await prisma.formTemplate.create({
        data: {
          contentItemId: contentItem.id,
          schemaJson: data.formSchemaJson?.trim() || "[]",
          required: true,
        },
      })
      revalidatePath(`/org/${orgSlug}/trainer/content`)
      redirect(`/org/${orgSlug}/trainer/content/${contentItem.id}`)
    }
    case "QUIZ": {
      const contentItem = await prisma.contentItem.create({
        data: {
          orgId: membership.orgId,
          type: ContentType.QUIZ,
          title,
          description: data.description?.trim() || null,
        },
      })
      await prisma.quiz.create({
        data: {
          contentItemId: contentItem.id,
          passingScore: 70,
          allowRetry: false,
          showAnswersAfter: true,
        },
      })
      revalidatePath(`/org/${orgSlug}/trainer/content`)
      redirect(`/org/${orgSlug}/trainer/content/${contentItem.id}`)
    }
    case "ATTESTATION": {
      const contentItem = await prisma.contentItem.create({
        data: {
          orgId: membership.orgId,
          type: ContentType.ATTESTATION,
          title,
          description: data.description?.trim() || null,
        },
      })
      await prisma.attestationTemplate.create({
        data: {
          contentItemId: contentItem.id,
          text: data.attestationText?.trim() || "I acknowledge the above.",
          requireTypedName: true,
        },
      })
      revalidatePath(`/org/${orgSlug}/trainer/content`)
      redirect(`/org/${orgSlug}/trainer/content/${contentItem.id}`)
    }
    default:
      return { error: "Invalid content type" }
  }
}

export type SlideInput = {
  id?: string
  title: string
  content: string
  order: number
  layoutType?: string | null
  notesRichText?: string | null
}
export type FormFieldInput = {
  id: string
  type: string
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]
  validation?: { min?: number; max?: number; pattern?: string }
}
export type QuizChoiceInput = { id?: string; text: string; isCorrect: boolean; order: number }
export type QuizQuestionInput = {
  id?: string
  text: string
  type: string
  explanation?: string
  order: number
  choices: QuizChoiceInput[]
}

export async function updateContent(
  orgSlug: string,
  contentItemId: string,
  data: {
    title: string
    description?: string
    videoUrl?: string
    videoDuration?: number
    articleContent?: string
    attestationText?: string
    slides?: SlideInput[]
    formSchemaJson?: string
    quizQuestions?: QuizQuestionInput[]
    quizPassingScore?: number
    quizAllowRetry?: boolean
    quizShowAnswersAfter?: boolean
  }
) {
  const membership = await requireTrainerOrAdmin(orgSlug)

  const existing = await prisma.contentItem.findFirst({
    where: { id: contentItemId, orgId: membership.orgId },
    include: {
      video: true,
      article: true,
      attestationTemplate: true,
      slideDeck: true,
      formTemplate: true,
      quiz: true,
    },
  })

  if (!existing) {
    return { error: "Content not found" }
  }

  const title = data.title?.trim()
  if (!title) return { error: "Title is required" }

  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { title, description: data.description?.trim() || null },
  })

  if (existing.type === "VIDEO" && existing.video) {
    const url = data.videoUrl?.trim()
    if (url)
      await prisma.video.update({
        where: { id: existing.video.id },
        data: {
          url,
          duration: data.videoDuration != null ? data.videoDuration : null,
        },
      })
  }
  if (existing.type === "ARTICLE" && existing.article) {
    await prisma.article.update({
      where: { id: existing.article.id },
      data: { content: data.articleContent?.trim() ?? "" },
    })
  }
  if (existing.type === "ATTESTATION" && existing.attestationTemplate) {
    await prisma.attestationTemplate.update({
      where: { id: existing.attestationTemplate.id },
      data: { text: data.attestationText?.trim() ?? "" },
    })
  }

  if (existing.type === "SLIDE_DECK" && existing.slideDeck && data.slides != null) {
    await prisma.slide.deleteMany({ where: { slideDeckId: existing.slideDeck.id } })
    if (data.slides.length > 0) {
      await prisma.slide.createMany({
        data: data.slides.map((s, i) => ({
          slideDeckId: existing.slideDeck!.id,
          title: (s.title || `Slide ${i + 1}`).trim(),
          content: s.content?.trim() ?? "",
          order: i + 1,
          layoutType: s.layoutType ?? null,
          notesRichText: s.notesRichText ?? null,
        })),
      })
    }
  }

  if (existing.type === "FORM" && existing.formTemplate && data.formSchemaJson != null) {
    await prisma.formTemplate.update({
      where: { id: existing.formTemplate.id },
      data: { schemaJson: data.formSchemaJson.trim() || "[]" },
    })
  }

  if (existing.type === "QUIZ" && existing.quiz) {
    if (
      data.quizPassingScore != null ||
      data.quizAllowRetry != null ||
      data.quizShowAnswersAfter != null
    ) {
      await prisma.quiz.update({
        where: { id: existing.quiz.id },
        data: {
          ...(data.quizPassingScore != null && { passingScore: data.quizPassingScore }),
          ...(data.quizAllowRetry != null && { allowRetry: data.quizAllowRetry }),
          ...(data.quizShowAnswersAfter != null && { showAnswersAfter: data.quizShowAnswersAfter }),
        },
      })
    }
    if (data.quizQuestions != null && data.quizQuestions.length >= 0) {
      const quizId = existing.quiz.id
      const existingQuestions = await prisma.question.findMany({
        where: { quizId },
        include: { choices: true },
      })
      for (const q of existingQuestions) {
        await prisma.choice.deleteMany({ where: { questionId: q.id } })
      }
      await prisma.question.deleteMany({ where: { quizId } })
      for (let i = 0; i < data.quizQuestions.length; i++) {
        const q = data.quizQuestions[i]
        const question = await prisma.question.create({
          data: {
            quizId,
            text: (q.text || `Question ${i + 1}`).trim(),
            type: q.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
            explanation: q.explanation?.trim() || null,
            order: i + 1,
          },
        })
        for (let j = 0; j < (q.choices?.length ?? 0); j++) {
          const c = q.choices[j]
          await prisma.choice.create({
            data: {
              questionId: question.id,
              text: (c.text || "").trim(),
              isCorrect: !!c.isCorrect,
              order: j + 1,
            },
          })
        }
      }
    }
  }

  revalidatePath(`/org/${orgSlug}/trainer/content`)
  redirect(`/org/${orgSlug}/trainer/content/${contentItemId}`)
}
