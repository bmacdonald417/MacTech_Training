import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Award, FileText } from "lucide-react"

interface DashboardPageProps {
  params: { slug: string }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions)
  const membership = await requireAuth(params.slug)

  // Get organization
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
  })

  // Get stats based on role
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
        assignment: {
          orgId: membership.orgId,
        },
      },
    })

    stats.totalAssignments = enrollments.length
    stats.inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length
    stats.completed = enrollments.filter((e) => e.status === "COMPLETED").length

    const certs = await prisma.certificateIssued.findMany({
      where: {
        userId: membership.userId,
        template: {
          orgId: membership.orgId,
        },
      },
    })
    stats.certificates = certs.length
  } else if (membership.role === "TRAINER" || membership.role === "ADMIN") {
    const assignments = await prisma.assignment.findMany({
      where: { orgId: membership.orgId },
    })
    stats.totalAssignments = assignments.length

    const enrollments = await prisma.enrollment.findMany({
      where: {
        assignment: {
          orgId: membership.orgId,
        },
      },
    })
    stats.inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length
    stats.completed = enrollments.filter((e) => e.status === "COMPLETED").length

    const certs = await prisma.certificateIssued.findMany({
      where: {
        template: {
          orgId: membership.orgId,
        },
      },
    })
    stats.certificates = certs.length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to {org?.name}
        </h1>
        <p className="mt-2 text-gray-600">
          {membership.role === "ADMIN" && "Manage your organization's training platform"}
          {membership.role === "TRAINER" && "Create and manage training content"}
          {membership.role === "TRAINEE" && "View your training progress and assignments"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificates}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
