import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { generateCertificatePdf } from "@/lib/certificates"
import { format } from "date-fns"
import {
  certificateFileName,
  metadataFileName,
  buildMetadataJson,
} from "@/lib/certificate-download"
import { getFullName, getDisplayId } from "@/lib/user-display"
import JSZip from "jszip"

export const dynamic = "force-dynamic"

type Format = "pdf" | "zip" | "metadata"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string; certificateId: string }> }
) {
  try {
    const { slug, certificateId } = await context.params
    const membership = await requireAuth(slug)
    const formatParam = (req.nextUrl.searchParams.get("format") || "pdf").toLowerCase() as Format
    if (!["pdf", "zip", "metadata"].includes(formatParam)) {
      return NextResponse.json({ error: "Invalid format. Use pdf, zip, or metadata." }, { status: 400 })
    }

    const certificate = await prisma.certificateIssued.findUnique({
      where: { id: certificateId },
      include: {
        template: true,
        user: true,
        enrollment: {
          include: {
            assignment: {
              include: {
                contentItem: true,
                curriculum: {
                  include: {
                    sections: {
                      include: {
                        items: {
                          include: {
                            contentItem: {
                              include: {
                                quiz: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!certificate || certificate.userId !== membership.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (certificate.template.orgId !== membership.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const vaultRecord = await prisma.completionVaultRecord.findFirst({
      where: { certificateId: certificate.id },
    })

    const issuedAt = new Date(certificate.issuedAt)
    const issuedDateDisplay = format(issuedAt, "MMMM d, yyyy")
    const completionDate = format(issuedAt, "yyyy-MM-dd")
    const userName = getFullName(certificate.user)
    const userDisplayId = getDisplayId(certificate.user)
    const courseName = certificate.enrollment?.assignment?.title
    const curriculumTitle =
      certificate.enrollment?.assignment?.type === "CURRICULUM"
        ? certificate.enrollment.assignment.curriculum?.title
        : undefined
    const contentItemTitle =
      certificate.enrollment?.assignment?.type === "CONTENT_ITEM"
        ? certificate.enrollment.assignment.contentItem?.title
        : undefined

    // Latest passed quiz attempt from this enrollment's curriculum (for assessmentResult)
    let assessmentResult: string | undefined
    const curriculum = certificate.enrollment?.assignment?.curriculum
    if (curriculum?.sections) {
      const quizIds: string[] = []
      for (const section of curriculum.sections) {
        for (const item of section.items) {
          if (item.contentItem?.quiz?.id) {
            quizIds.push(item.contentItem.quiz.id)
          }
        }
      }
      if (quizIds.length > 0) {
        const passedAttempt = await prisma.quizAttempt.findFirst({
          where: {
            quizId: { in: quizIds },
            userId: certificate.userId,
            passed: true,
          },
          orderBy: { submittedAt: "desc" },
        })
        if (passedAttempt?.score != null) {
          assessmentResult = `Pass (${passedAttempt.score}%)`
        }
      }
    }

    const role = membership.role === "ADMIN" ? "Admin" : "User"
    const certFileName = certificateFileName(userName, issuedAt, "pdf")
    const meta = buildMetadataJson({
      name: userName,
      role,
      completionDate,
      assessmentResult,
      fileName: certFileName,
      userDisplayId,
      courseName,
    })

    if (formatParam === "metadata") {
      return NextResponse.json(meta, {
        headers: {
          "Content-Disposition": `attachment; filename="${metadataFileName(certFileName)}"`,
        },
      })
    }

    const pdfData = {
      userName,
      certificateNumber: certificate.certificateNumber,
      issuedDate: issuedDateDisplay,
      curriculumTitle,
      contentItemTitle,
      courseName,
      userDisplayId,
      verificationHash: vaultRecord?.verificationHash,
    }
    const pdfBuffer = await generateCertificatePdf(pdfData)

    if (formatParam === "pdf") {
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${certFileName}"`,
          "Cache-Control": "no-store",
        },
      })
    }

    // formatParam === "zip"
    const zip = new JSZip()
    zip.file(certFileName, pdfBuffer)
    zip.file(metadataFileName(certFileName), JSON.stringify(meta, null, 2))
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
    const zipFilename = certFileName.replace(/\.pdf$/, ".zip")

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Certificate download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
