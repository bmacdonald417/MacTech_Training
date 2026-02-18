/**
 * Wipe all curriculum for an org (and cascade: sections, items, curriculum-type assignments, enrollments).
 * Usage: npx tsx scripts/wipe-curriculum.ts [--org=slug]
 * Default org: demo
 *
 * Local run needs DATABASE_URL in .env. For Railway: use the *public* Postgres URL
 * (Postgres service → Connect / Variables → RAILWAY_TCP_PROXY_DOMAIN + RAILWAY_TCP_PROXY_PORT),
 * e.g. DATABASE_URL="postgresql://postgres:PASSWORD@PROXY_HOST:PROXY_PORT/railway?schema=public"
 *
 * After running, create new curricula in Trainer > Curricula and assign to your "intro" group via Trainer > Assignments > New assignment.
 */

import "dotenv/config"

// Use public DB URL when running locally against Railway (private URL only works inside Railway)
if (process.env.DATABASE_PUBLIC_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL
}

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const orgSlug = process.argv.find((a) => a.startsWith("--org="))?.split("=")[1] ?? "demo"

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  })
  if (!org) {
    console.error(`Organization not found: ${orgSlug}`)
    process.exit(1)
  }

  const curricula = await prisma.curriculum.findMany({
    where: { orgId: org.id },
    select: { id: true },
  })
  if (curricula.length === 0) {
    console.log(`No curricula found for org "${orgSlug}" (${org.name}). Nothing to wipe.`)
    const intro = await prisma.group.findFirst({
      where: { orgId: org.id, name: { equals: "intro", mode: "insensitive" } },
      select: { id: true, name: true },
    })
    if (intro) console.log(`Intro group is ready: ${intro.name} (id: ${intro.id})`)
    return
  }

  const curriculumIds = curricula.map((c) => c.id)

  const assignments = await prisma.assignment.findMany({
    where: { curriculumId: { in: curriculumIds } },
    select: { id: true },
  })
  const assignmentIds = assignments.map((a) => a.id)

  if (assignmentIds.length > 0) {
    await prisma.enrollmentItemProgress.deleteMany({
      where: { enrollment: { assignmentId: { in: assignmentIds } } },
    })
    await prisma.enrollment.deleteMany({
      where: { assignmentId: { in: assignmentIds } },
    })
    await prisma.assignment.deleteMany({
      where: { id: { in: assignmentIds } },
    })
  }

  await prisma.curriculum.deleteMany({ where: { orgId: org.id } })
  console.log(`Wiped ${curricula.length} curriculum/curricula for org "${orgSlug}" (${org.name}).`)
  console.log("Removed related sections, items, curriculum assignments, and enrollments.")

  const intro = await prisma.group.findFirst({
    where: { orgId: org.id, name: { equals: "intro", mode: "insensitive" } },
    select: { id: true, name: true },
  })
  if (intro) {
    console.log(`\nIntro group ready for new assignments: "${intro.name}" (id: ${intro.id})`)
    console.log("Next: Trainer > Curricula (create new) > Assignments > New assignment > choose curriculum and assign to Intro group.")
  } else {
    console.log("\nNo group named 'intro' found. Create one in Admin > Groups if you want to assign training to an Intro group.")
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
