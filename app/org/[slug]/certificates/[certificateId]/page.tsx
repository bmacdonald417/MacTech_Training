import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { renderCertificateTemplate } from "@/lib/certificates"
import { format } from "date-fns"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/certificates/print-button"

interface CertificatePageProps {
  params: Promise<{ slug: string; certificateId: string }>
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { slug, certificateId } = await params
  const membership = await requireAuth(slug)

  const certificate = await prisma.certificateIssued.findUnique({
    where: { id: certificateId },
    include: {
      template: true,
      user: true,
    },
  })

  if (!certificate || certificate.userId !== membership.userId) {
    notFound()
  }

  // Verify org access
  if (certificate.template.orgId !== membership.orgId) {
    notFound()
  }

  const issuedDate = format(new Date(certificate.issuedAt), "MMMM d, yyyy")
  const userName = certificate.user.name || certificate.user.email
  const curriculumTitle = undefined
  const contentItemTitle = undefined

  const html = renderCertificateTemplate(certificate.template.htmlTemplateRichText, {
    userName,
    certificateNumber: certificate.certificateNumber,
    issuedDate,
    curriculumTitle,
    contentItemTitle,
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Certificate</h1>
        <PrintButton />
      </div>
      <div
        className="bg-white p-8 shadow-lg print:shadow-none print:p-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
