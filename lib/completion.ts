import { prisma } from "./prisma"
import { generateCertificateNumber, renderCertificateTemplate } from "./certificates"
import { format } from "date-fns"

export async function checkEnrollmentCompletion(enrollmentId: string): Promise<{
  isComplete: boolean
  missingRequired: string[]
}> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      assignment: {
        include: {
          curriculum: {
            include: {
              sections: {
                include: {
                  items: {
                    include: {
                      contentItem: {
                        include: {
                          quiz: {
                            include: {
                              questions: true,
                            },
                          },
                          attestationTemplate: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          contentItem: {
            include: {
              quiz: {
                include: {
                  questions: true,
                },
              },
              attestationTemplate: true,
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

  if (!enrollment) {
    return { isComplete: false, missingRequired: [] }
  }

  // Single content item
  if (enrollment.assignment.type === "CONTENT_ITEM") {
    const progress = enrollment.itemProgress.find(
      (p) => p.contentItemId === enrollment.assignment.contentItemId!
    )
    return {
      isComplete: progress?.completed === true,
      missingRequired: progress?.completed ? [] : [enrollment.assignment.contentItemId!],
    }
  }

  // Curriculum - check all required items
  const curriculum = enrollment.assignment.curriculum
  if (!curriculum) {
    return { isComplete: false, missingRequired: [] }
  }

  const allItems: Array<{
    contentItemId: string
    required: boolean
    type: string
    quiz?: any
    attestation?: any
  }> = []

  curriculum.sections.forEach((section) => {
    section.items.forEach((item) => {
      allItems.push({
        contentItemId: item.contentItemId,
        required: item.required,
        type: item.contentItem.type,
        quiz: item.contentItem.quiz,
        attestation: item.contentItem.attestationTemplate,
      })
    })
  })

  const requiredItems = allItems.filter((item) => item.required)
  const missingRequired: string[] = []

  for (const item of requiredItems) {
    const progress = enrollment.itemProgress.find(
      (p) => p.contentItemId === item.contentItemId
    )

    if (!progress || !progress.completed) {
      missingRequired.push(item.contentItemId)
      continue
    }

    // Check quiz if applicable
    if (item.type === "QUIZ" && item.quiz) {
      const passedAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: item.quiz.id,
          userId: enrollment.userId!,
          passed: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      })

      if (!passedAttempt) {
        missingRequired.push(item.contentItemId)
        continue
      }
    }

    // Check attestation if applicable
    if (item.type === "ATTESTATION" && item.attestation) {
      const signed = await prisma.attestationRecord.findFirst({
        where: {
          templateId: item.attestation.id,
          userId: enrollment.userId!,
        },
      })

      if (!signed) {
        missingRequired.push(item.contentItemId)
        continue
      }
    }
  }

  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
  }
}

export async function issueCertificate(
  enrollmentId: string,
  orgId: string,
  userId: string
): Promise<string | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      assignment: {
        include: {
          curriculum: true,
          contentItem: true,
        },
      },
      user: true,
    },
  })

  if (!enrollment) {
    return null
  }

  // Find certificate template for this org
  const template = await prisma.certificateTemplate.findFirst({
    where: { orgId },
  })

  if (!template) {
    // No template configured, skip issuance
    return null
  }

  // Check if certificate already issued
  const existing = await prisma.certificateIssued.findFirst({
    where: {
      enrollmentId,
      userId,
    },
  })

  if (existing) {
    return existing.id
  }

  // Generate certificate number
  const certNumber = await generateCertificateNumber()

  // Prepare certificate data
  const issuedDate = format(new Date(), "MMMM d, yyyy")
  const userName = enrollment.user.name || enrollment.user.email
  const curriculumTitle =
    enrollment.assignment.type === "CURRICULUM"
      ? enrollment.assignment.curriculum?.title
      : undefined
  const contentItemTitle =
    enrollment.assignment.type === "CONTENT_ITEM"
      ? enrollment.assignment.contentItem?.title
      : undefined

  // Render template
  const html = renderCertificateTemplate(template.htmlTemplateRichText, {
    userName,
    certificateNumber: certNumber,
    issuedDate,
    curriculumTitle,
    contentItemTitle,
  })

  // Create certificate
  const certificate = await prisma.certificateIssued.create({
    data: {
      templateId: template.id,
      userId,
      enrollmentId,
      certificateNumber: certNumber,
    },
  })

  // Log event
  await prisma.eventLog.create({
    data: {
      orgId,
      userId,
      type: "CERTIFICATE_ISSUED",
      metadata: JSON.stringify({
        certificateId: certificate.id,
        enrollmentId,
        certificateNumber: certNumber,
      }),
    },
  })

  return certificate.id
}
