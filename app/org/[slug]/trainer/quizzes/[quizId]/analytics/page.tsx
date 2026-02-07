import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Users, TrendingUp } from "lucide-react"

interface QuizAnalyticsPageProps {
  params: { slug: string; quizId: string }
}

export default async function QuizAnalyticsPage({ params }: QuizAnalyticsPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      contentItem: true,
      questions: {
        include: {
          choices: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      attempts: {
        include: {
          user: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  })

  if (!quiz || quiz.contentItem.orgId !== membership.orgId) {
    notFound()
  }

  const totalAttempts = quiz.attempts.length
  const passedAttempts = quiz.attempts.filter((a) => a.passed).length
  const failedAttempts = totalAttempts - passedAttempts
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          quiz.attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
        )
      : 0

  // Unique users who attempted
  const uniqueUsers = new Set(quiz.attempts.map((a) => a.userId)).size

  // Question-level analytics
  const questionStats = quiz.questions.map((question) => {
    const correctAnswers = quiz.attempts.filter((attempt) => {
      const answers = JSON.parse(attempt.answers)
      const userChoiceId = answers[question.id]
      const correctChoice = question.choices.find((c) => c.isCorrect)
      return userChoiceId === correctChoice?.id
    }).length

    const correctRate =
      totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0

    return {
      question,
      correctAnswers,
      correctRate,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quiz Analytics</h1>
        <p className="mt-2 text-gray-600">{quiz.contentItem.title}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">{uniqueUsers} unique users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
            <p className="text-xs text-muted-foreground">
              {passedAttempts} passed, {failedAttempts} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground">Passing: {quiz.passingScore}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Question Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Question Performance</CardTitle>
          <CardDescription>
            Percentage of users who answered each question correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questionStats.map((stat, index) => (
              <div key={stat.question.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Q{index + 1}: {stat.question.text}
                  </span>
                  <span className="text-sm text-gray-600">
                    {stat.correctRate}% correct ({stat.correctAnswers}/{totalAttempts})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${stat.correctRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
          <CardDescription>Latest quiz submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {quiz.attempts.length === 0 ? (
            <p className="text-sm text-gray-600">No attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {quiz.attempts.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {attempt.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {attempt.user.name || attempt.user.email}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(attempt.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{attempt.score}%</div>
                    <div className="text-sm text-gray-600">
                      {attempt.passed ? "Passed" : "Failed"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
