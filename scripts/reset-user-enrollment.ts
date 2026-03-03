/**
 * Reset a user's progress on a specific training (e.g. CUI Enclave User Training)
 * so they can complete it again and generate a hashed certificate.
 *
 * Usage: npx tsx scripts/reset-user-enrollment.ts <userEmail> [assignmentTitlePattern]
 *
 * Examples:
 *   npx tsx scripts/reset-user-enrollment.ts "dicks@cocks.com"
 *   npx tsx scripts/reset-user-enrollment.ts "dicks@cocks.com" "CUI Enclave"
 *
 * Database: Set DATABASE_URL in .env, or use Railway's public Postgres URL as
 * DATABASE_PUBLIC_URL and run: railway run npx tsx scripts/reset-user-enrollment.ts "user@example.com"
 */

import "dotenv/config"

// Use public DB URL when running locally against Railway (internal URL only works inside Railway)
if (process.env.DATABASE_PUBLIC_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL
}

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const userEmail = process.argv[2]
  const assignmentTitlePattern =
    process.argv[3] ?? "CUI Enclave"

  if (!userEmail) {
    console.error("Usage: npx tsx scripts/reset-user-enrollment.ts <userEmail> [assignmentTitlePattern]")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, email: true, name: true },
  })
  if (!user) {
    console.error(`User not found: ${userEmail}`)
    process.exit(1)
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { title: { contains: assignmentTitlePattern, mode: "insensitive" } },
        {
          curriculum: {
            title: { contains: assignmentTitlePattern, mode: "insensitive" },
          },
        },
      ],
    },
    include: {
      curriculum: { select: { title: true } },
      contentItem: { select: { title: true } },
    },
  })

  if (assignments.length === 0) {
    console.error(`No assignment found matching "${assignmentTitlePattern}". Try "CUI Enclave" or "CUI Enclave Required User Training".`)
    process.exit(1)
  }

  const assignmentIds = assignments.map((a) => a.id)
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      assignmentId: { in: assignmentIds },
    },
    include: {
      assignment: {
        include: {
          curriculum: {
            select: {
              title: true,
              id: true,
              sections: {
                include: {
                  items: { select: { contentItemId: true } },
                },
              },
            },
          },
          contentItem: { select: { title: true } },
        },
      },
    },
  })

  if (enrollments.length === 0) {
    console.error(`No enrollment found for ${user.email} on "${assignmentTitlePattern}".`)
    process.exit(1)
  }

  for (const enrollment of enrollments) {
    const title =
      enrollment.assignment.curriculum?.title ??
      enrollment.assignment.contentItem?.title ??
      enrollment.assignment.title

    console.log(`Resetting enrollment ${enrollment.id} (${title})...`)

    // Collect quiz IDs from this curriculum so we can clear quiz attempts
    let quizIds: string[] = []
    const curriculum = enrollment.assignment.curriculum
    if (curriculum?.sections) {
      const contentItemIds = curriculum.sections.flatMap((s) =>
        s.items.map((i) => i.contentItemId)
      )
      const quizzes = await prisma.quiz.findMany({
        where: { contentItemId: { in: contentItemIds } },
        select: { id: true },
      })
      quizIds = quizzes.map((q) => q.id)
    }

    await prisma.$transaction(async (tx) => {
      await tx.certificateIssued.deleteMany({
        where: { enrollmentId: enrollment.id },
      })
      await tx.completionVaultRecord.deleteMany({
        where: { enrollmentId: enrollment.id },
      })
      await tx.enrollmentItemProgress.deleteMany({
        where: { enrollmentId: enrollment.id },
      })
      if (quizIds.length > 0) {
        await tx.quizAttempt.deleteMany({
          where: {
            userId: user.id,
            quizId: { in: quizIds },
          },
        })
      }
      await tx.enrollment.delete({
        where: { id: enrollment.id },
      })
    })

    console.log(
      `  Removed enrollment (certificates, vault, progress${quizIds.length > 0 ? `, ${quizIds.length} quiz attempt(s)` : ""} deleted).`
    )
  }

  console.log(
    `Done. ${user.email} will see this training on the dashboard as "Get started" / available to self-assign, and can start it again for a fresh certificate.`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
