import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TrainingPlayer } from "@/components/training/training-player"

interface TrainingPlayerPageProps {
  params: Promise<{ slug: string; enrollmentId: string }>
}

export default async function TrainingPlayerPage({
  params,
}: TrainingPlayerPageProps) {
  const { slug, enrollmentId } = await params
  const membership = await requireAuth(slug)

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      assignment: {
        include: {
          contentItem: {
            include: {
              article: true,
              slideDeck: {
                include: {
                  sourceFile: true,
                  slides: {
                    orderBy: { order: "asc" },
                  },
                },
              },
              video: true,
              quiz: {
                include: {
                  questions: {
                    include: {
                      choices: {
                        orderBy: { order: "asc" },
                      },
                    },
                    orderBy: { order: "asc" },
                  },
                },
              },
              attestationTemplate: true,
              formTemplate: true,
            },
          },
          curriculum: {
            include: {
              sections: {
                include: {
                  items: {
                    include: {
                      contentItem: {
                        include: {
                          article: true,
                          slideDeck: {
                            include: {
                              sourceFile: true,
                              slides: {
                                orderBy: { order: "asc" },
                              },
                            },
                          },
                          video: true,
                          quiz: {
                            include: {
                              questions: {
                                include: {
                                  choices: {
                                    orderBy: { order: "asc" },
                                  },
                                },
                                orderBy: { order: "asc" },
                              },
                            },
                          },
                          attestationTemplate: true,
                          formTemplate: true,
                        },
                      },
                    },
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      itemProgress: {
        include: {
          contentItem: true,
        },
      },
    },
  })

  if (!enrollment || enrollment.userId !== membership.userId) {
    redirect(`/org/${slug}/my-training`)
  }

  const canGenerateNarration =
    membership.role === "ADMIN" || membership.role === "TRAINER"

  return (
    <TrainingPlayer
      enrollment={enrollment}
      orgSlug={slug}
      userId={membership.userId}
      canGenerateNarration={canGenerateNarration}
    />
  )
}
