import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Certificates
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          View your earned certificates
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No certificates earned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="border-2">
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
