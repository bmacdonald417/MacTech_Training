import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Award, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface CertificatesPageProps {
  params: { slug: string }
}

export default async function CertificatesPage({
  params,
}: CertificatesPageProps) {
  const membership = await requireAuth(params.slug)

  const certificates = await prisma.certificateIssued.findMany({
    where: {
      userId: membership.userId,
      template: {
        orgId: membership.orgId,
      },
    },
    include: {
      template: true,
    },
    orderBy: {
      issuedAt: "desc",
    },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        title="Certificates"
        description="View your earned certificates"
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete training to earn certificates."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-6 w-6 text-primary" />
                  <CardTitle>{cert.template.name}</CardTitle>
                </div>
                <CardDescription>
                  Issued on {format(new Date(cert.issuedAt), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Certificate #: {cert.certificateNumber}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/org/${params.slug}/certificates/${cert.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Certificate
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
