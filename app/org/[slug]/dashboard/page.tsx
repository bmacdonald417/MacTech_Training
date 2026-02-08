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
  params: { slug: string }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions)
  const membership = await requireAuth(params.slug)

  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
  })

  let stats = {
    totalAssignments: 0,
    inProgress: 0,
    completed: 0,
    certificates: 0,
  }

  if (membership.role === "TRAINEE") {
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
  } else if (membership.role === "TRAINER" || membership.role === "ADMIN") {
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
  const isTrainerOrAdmin = membership.role === "TRAINER" || membership.role === "ADMIN"

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        description="Training activity and completion at a glance"
        action={
          isAdmin ? (
            <Button asChild>
              <Link href={`/org/${params.slug}/trainer/assignments/new`}>
                <PlusCircle className="h-4 w-4" />
                Create Assignment
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Assignments"
          value={stats.totalAssignments}
          icon={BookOpen}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={FileText}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={Award}
        />
        <StatCard
          label="Certificates Issued"
          value={stats.certificates}
          icon={Award}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Recent Activity"
          description="Latest assignments and completions"
        >
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="New assignments and completions will appear here."
          />
        </SectionCard>

        <SectionCard
          title="Upcoming Deadlines"
          description="Due soon"
        >
          <EmptyState
            icon={Calendar}
            title="No upcoming deadlines"
            description="Assignments with due dates will show here."
          />
        </SectionCard>
      </div>

      {isTrainerOrAdmin && (
        <SectionCard
          title="Quick Actions"
          description="Shortcuts for common tasks"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto justify-start gap-3 py-3" asChild>
              <Link href={`/org/${params.slug}/trainer/content`}>
                <FileText className="h-4 w-4 shrink-0" />
                Create content
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-3 py-3" asChild>
              <Link href={`/org/${params.slug}/trainer/assignments/new`}>
                <ClipboardList className="h-4 w-4 shrink-0" />
                Assign training
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" className="h-auto justify-start gap-3 py-3" asChild>
                <Link href={`/org/${params.slug}/admin/users`}>
                  <UserPlus className="h-4 w-4 shrink-0" />
                  Manage users
                </Link>
              </Button>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
