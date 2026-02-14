import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Award,
  FileText,
  ClipboardList,
  Calendar,
  PlusCircle,
  UserPlus,
  Activity,
} from "lucide-react"

interface DashboardPageProps {
  params: Promise<{ slug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  const membership = await requireAuth(slug)

  const org = await prisma.organization.findUnique({
    where: { slug },
  })

  let stats = {
    totalAssignments: 0,
    inProgress: 0,
    completed: 0,
    certificates: 0,
  }

  if (membership.role === "USER") {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: membership.userId,
        assignment: { orgId: membership.orgId },
      },
    })
    stats.totalAssignments = enrollments.length
    stats.inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length
    stats.completed = enrollments.filter((e) => e.status === "COMPLETED").length
    const certs = await prisma.certificateIssued.findMany({
      where: {
        userId: membership.userId,
        template: { orgId: membership.orgId },
      },
    })
    stats.certificates = certs.length
  } else if (membership.role === "ADMIN") {
    const assignments = await prisma.assignment.findMany({
      where: { orgId: membership.orgId },
    })
    stats.totalAssignments = assignments.length
    const enrollments = await prisma.enrollment.findMany({
      where: { assignment: { orgId: membership.orgId } },
    })
    stats.inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length
    stats.completed = enrollments.filter((e) => e.status === "COMPLETED").length
    const certs = await prisma.certificateIssued.findMany({
      where: { template: { orgId: membership.orgId } },
    })
    stats.certificates = certs.length
  }

  const isAdmin = membership.role === "ADMIN"

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        title="Dashboard"
        description="Training activity at a glance"
        action={
          isAdmin ? (
            <Button asChild>
              <Link href={`/org/${slug}/trainer/assignments/new`}>
                <PlusCircle className="h-4 w-4" />
                Create Assignment
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/org/${slug}/my-training`}>
                <BookOpen className="h-4 w-4" />
                My Training
              </Link>
            </Button>
          )
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Assignments"
          value={stats.totalAssignments}
          icon={BookOpen}
          href={isAdmin ? `/org/${slug}/trainer/assignments` : `/org/${slug}/my-training`}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={FileText}
          href={isAdmin ? `/org/${slug}/trainer/assignments` : `/org/${slug}/my-training`}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={Award}
          href={isAdmin ? `/org/${slug}/trainer/assignments` : `/org/${slug}/my-training`}
        />
        <StatCard
          label="Certificates Issued"
          value={stats.certificates}
          icon={Award}
          href={`/org/${slug}/certificates`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Recent Activity"
            description="Latest assignments and completions"
          >
            <EmptyState
              icon={Activity}
              title="No recent activity"
              hint="New assignments and completions will appear here."
            />
          </SectionCard>
        </div>
        <div className="space-y-6">
          <SectionCard title="Upcoming Deadlines" description="Due soon">
            <EmptyState
              icon={Calendar}
              title="No upcoming deadlines"
              hint="Assignments with due dates will show here."
            />
          </SectionCard>
          {isAdmin && (
            <SectionCard title="Quick Actions" description="Shortcuts">
              <div className="space-y-2">
                <Button variant="outline" className="h-auto w-full justify-start gap-3 py-2.5" asChild>
                  <Link href={`/org/${slug}/trainer/content`}>
                    <FileText className="h-4 w-4 shrink-0" />
                    Create content
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto w-full justify-start gap-3 py-2.5" asChild>
                  <Link href={`/org/${slug}/trainer/assignments/new`}>
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    Assign training
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="h-auto w-full justify-start gap-3 py-2.5" asChild>
                    <Link href={`/org/${slug}/admin/users`}>
                      <UserPlus className="h-4 w-4 shrink-0" />
                      Manage users
                    </Link>
                  </Button>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
