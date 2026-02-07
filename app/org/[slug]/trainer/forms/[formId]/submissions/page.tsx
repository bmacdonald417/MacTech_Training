import { requireTrainerOrAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import { FileText } from "lucide-react"
import { format } from "date-fns"
import { ExportButton } from "@/components/forms/export-button"

interface FormSubmissionsPageProps {
  params: { slug: string; formId: string }
}

export default async function FormSubmissionsPage({
  params,
}: FormSubmissionsPageProps) {
  const membership = await requireTrainerOrAdmin(params.slug)

  const formTemplate = await prisma.formTemplate.findUnique({
    where: { id: params.formId },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
          <p className="mt-2 text-gray-600">{formTemplate.contentItem.title}</p>
        </div>
        {formTemplate.submissions.length > 0 && (
          <ExportButton
            formTitle={formTemplate.contentItem.title}
            submissions={formTemplate.submissions}
            fields={fields}
          />
        )}
      </div>

      {formTemplate.submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No submissions yet.</p>
          </CardContent>
        </Card>
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
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="font-medium">
                          {submission.user.name || submission.user.email}
                        </div>
                        <div className="text-sm text-gray-600">
                          Submitted: {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {fields.map((field) => (
                        <div key={field.id}>
                          <div className="text-sm font-medium text-gray-700">
                            {field.label}
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
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
