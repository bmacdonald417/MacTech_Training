import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { renderCertificateTemplate } from "@/lib/certificates"
import { getFullName, getDisplayId } from "@/lib/user-display"
import { format } from "date-fns"
import { notFound } from "next/navigation"
import { CertificateActions } from "@/components/certificates/certificate-actions"

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
      enrollment: {
        include: {
          assignment: true,
        },
      },
    },
  })

  if (!certificate || certificate.userId !== membership.userId) {
    notFound()
  }

  // Verify org access
  if (certificate.template.orgId !== membership.orgId) {
    notFound()
  }

  const vaultRecord = await prisma.completionVaultRecord.findFirst({
    where: { certificateId: certificate.id },
  })

  const issuedDate = format(new Date(certificate.issuedAt), "MMMM d, yyyy")
  const userName = getFullName(certificate.user)
  const userDisplayId = getDisplayId(certificate.user)
  const courseName = certificate.enrollment?.assignment?.title ?? undefined
  const curriculumTitle = undefined
  const contentItemTitle = undefined

  const html = renderCertificateTemplate(certificate.template.htmlTemplateRichText, {
    userName,
    certificateNumber: certificate.certificateNumber,
    issuedDate,
    curriculumTitle,
    contentItemTitle,
    courseName,
    userDisplayId,
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Certificate</h1>
        <CertificateActions certificateId={certificateId} orgSlug={slug} />
      </div>
      <div
        className="bg-white p-8 shadow-lg print:shadow-none print:p-12"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {vaultRecord && (
        <div className="mt-6 border-t border-border bg-muted/20 p-6 print:mt-8 print:pt-8 print:border-t-2 print:border-gray-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-600">
            Verification
          </p>
          <p className="mt-2 text-sm text-foreground print:text-black">
            This certificate can be verified using the SHA-256 hash below. Auditors may confirm completion against the organization&apos;s verification records.
          </p>
          <code className="mt-3 block break-all rounded bg-muted px-3 py-2 text-xs font-mono text-foreground print:bg-gray-100 print:text-black print:text-[11px]">
            {vaultRecord.verificationHash}
          </code>
          <p className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground print:border-gray-300 print:text-gray-600">
            MacTech Training — Tamper-evident completion record
          </p>
        </div>
      )}
    </div>
  )
}
