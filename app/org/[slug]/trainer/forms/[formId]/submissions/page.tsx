import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { notFound } from "next/navigation"
import { FileText } from "lucide-react"
import { format } from "date-fns"
import { ExportButton } from "@/components/forms/export-button"

interface FormSubmissionsPageProps {
  params: Promise<{ slug: string; formId: string }>
}

export default async function FormSubmissionsPage({
  params,
}: FormSubmissionsPageProps) {
  const { slug, formId } = await params
  const membership = await requireTrainerOrAdmin(slug)

  const formTemplate = await prisma.formTemplate.findUnique({
    where: { id: formId },
    include: {
      contentItem: true,
      submissions: {
        include: {
          user: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  })

  if (!formTemplate || formTemplate.contentItem.orgId !== membership.orgId) {
    notFound()
  }

  // Parse schema to get field labels
  let fields: Array<{ id: string; label: string }> = []
  try {
    const schema = JSON.parse(formTemplate.schemaJson || "[]")
    fields = Array.isArray(schema)
      ? schema.map((f: any) => ({ id: f.id, label: f.label }))
      : []
  } catch (e) {
    console.error("Error parsing form schema:", e)
  }


  return (
    <div className="space-y-10">
      <PageHeader
        title="Form Submissions"
        description={formTemplate.contentItem.title}
        action={
          formTemplate.submissions.length > 0 ? (
            <ExportButton
              formTitle={formTemplate.contentItem.title}
              submissions={formTemplate.submissions}
              fields={fields}
            />
          ) : undefined
        }
      />

      {formTemplate.submissions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No submissions yet"
          description="Submissions will appear here when users complete this form."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {formTemplate.submissions.length} Submission
              {formTemplate.submissions.length !== 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              All form submissions for this template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formTemplate.submissions.map((submission) => {
                const answers = JSON.parse(submission.answersJson)

                return (
                  <div
                    key={submission.id}
                    className="rounded-xl border border-border/60 bg-card p-5 space-y-3 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <div className="font-medium text-foreground">
                          {submission.user.name || submission.user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Submitted: {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {fields.map((field) => (
                        <div key={field.id}>
                          <div className="text-sm font-medium text-muted-foreground">
                            {field.label}
                          </div>
                          <div className="text-sm text-foreground mt-1">
                            {answers[field.id] !== undefined && answers[field.id] !== null
                              ? String(answers[field.id])
                              : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
