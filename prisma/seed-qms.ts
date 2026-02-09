import type { PrismaClient } from "@prisma/client"
import { DocumentType, DocumentChangeType } from "@prisma/client"

type SeedContext = {
  orgId: string
  authorMembershipId: string
  approverMembershipId: string
  approverTypedName: string
}

async function createDocumentWithVersion(
  prisma: PrismaClient,
  ctx: SeedContext,
  documentId: string,
  title: string,
  documentType: DocumentType,
  content: string,
  requiresAcknowledgment = false
) {
  const doc = await prisma.controlledDocument.create({
    data: {
      orgId: ctx.orgId,
      documentId,
      title,
      documentType,
      status: "DRAFT",
      authorMembershipId: ctx.authorMembershipId,
      retentionPeriodYears: 7,
      requiresAcknowledgment,
    },
  })
  const version = await prisma.documentVersion.create({
    data: {
      documentId: doc.id,
      version: "1.0",
      changeType: "MAJOR" as DocumentChangeType,
      changeSummary: "Initial issue",
      content,
      createdByMembershipId: ctx.authorMembershipId,
    },
  })
  await prisma.controlledDocument.update({
    where: { id: doc.id },
    data: { currentVersionId: version.id },
  })
  await prisma.documentApprovalRecord.create({
    data: {
      documentVersionId: version.id,
      approverMembershipId: ctx.approverMembershipId,
      typedName: ctx.approverTypedName,
      role: "Quality Manager",
      meaningOfSignature: "Approval for use",
    },
  })
  await prisma.controlledDocument.update({
    where: { id: doc.id },
    data: { status: "APPROVED" },
  })
  await prisma.controlledDocument.update({
    where: { id: doc.id },
    data: { status: "EFFECTIVE", effectiveDate: new Date() },
  })
  return doc
}

export async function seedQms(
  prisma: PrismaClient,
  orgId: string,
  adminUserId: string,
  trainerUserId: string
) {
  const existing = await prisma.controlledDocument.findFirst({
    where: { orgId, documentId: "QAM-001" },
  })
  if (existing) {
    console.log("QMS document set already present; skipping QMS seed")
    return
  }
  const adminMembership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: adminUserId, orgId } },
  })
  const trainerMembership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: trainerUserId, orgId } },
  })
  if (!adminMembership || !trainerMembership) {
    console.log("Skipping QMS seed: memberships not found")
    return
  }
  const ctx: SeedContext = {
    orgId,
    authorMembershipId: adminMembership.id,
    approverMembershipId: trainerMembership.id,
    approverTypedName: "Trainer User",
  }

  const qamContent = `# Quality Assurance Manual

**Document ID:** QAM-001 | **Version:** 1.0 | **ISO/IEC 17025:2017**

## 1 Scope and Application

This Quality Assurance Manual (QAM) defines the quality management system for the organization and applies to all activities that affect the quality of results. The system is designed and implemented in accordance with ISO/IEC 17025:2017.

## 2 Normative References

- ISO/IEC 17025:2017 — General requirements for the competence of testing and calibration laboratories
- ISO 9001:2015 — Quality management systems — Requirements

## 3 Terms and Definitions

As per ISO/IEC 17025:2017 Clause 3. Laboratory, customer, quality, competence, and other terms are used as defined in the standard.

## 4 Management Requirements

### 4.1 Organization
The organization shall be legally identifiable. Management shall define the structure and responsibilities of personnel. A quality manager shall be appointed with responsibility for the QMS regardless of other duties.

### 4.2 Management System
Policies and procedures required by this manual are maintained and communicated. Document control (POL-DOC, SOP-DOC-01) and record control (SOP-REC-01) ensure integrity and traceability.

### 4.3 Document Control
Controlled documents are approved prior to use. Changes are reviewed and re-approved. Obsolete documents are retained per record retention policy. See SOP-DOC-01.

### 4.4 Control of Records
Records are legible, readily retrievable, and protected. Retention periods are defined and enforced. See SOP-REC-01.

### 4.5–4.15 (Abridged)
Risk management (POL-RISK), corrective and preventive action (SOP-CAP, SOP-PAP), internal audit (SOP-AUD), and management review (SOP-MR) are established and maintained per referenced procedures.

## 5 Technical Requirements

Competence (SOP-PER), equipment (SOP-EQP), traceability (SOP-TRC), and sampling/method validation as applicable are addressed in the referenced SOPs.

---
*This document is controlled. Uncontrolled when printed. Review due: annual.*`

  await createDocumentWithVersion(
    prisma,
    ctx,
    "QAM-001",
    "Quality Assurance Manual",
    DocumentType.QAM,
    qamContent
  )

  const policies = [
    {
      id: "POL-001",
      title: "Quality Policy",
      content: `# Quality Policy

Management commits to meeting customer and applicable statutory/regulatory requirements and to continual improvement of the quality management system. Objectives are set, measured, and reviewed at management review. Personnel are made aware of this policy and their contribution to quality.`,
    },
    {
      id: "POL-002",
      title: "Impartiality Policy",
      content: `# Impartiality Policy

The organization shall act impartially in relation to its customers. Activities are structured and managed to safeguard impartiality. No commercial, financial, or other pressures shall compromise impartiality. Risks are identified and mitigated.`,
    },
    {
      id: "POL-003",
      title: "Confidentiality Policy",
      content: `# Confidentiality Policy

Information received from or about customers is treated as confidential. Personnel are bound by confidentiality obligations. Access to customer information is restricted to authorized personnel with a need to know.`,
    },
    {
      id: "POL-004",
      title: "Document Control Policy",
      content: `# Document Control Policy

Documents required by the QMS are controlled. Documents are approved prior to use, reviewed for currency, and uniquely identified. Changes are tracked; obsolete documents are removed from use and retained per retention schedule. See SOP-DOC-01.`,
    },
    {
      id: "POL-005",
      title: "Record Retention Policy",
      content: `# Record Retention Policy

Records are retained for a defined period to meet legal, contractual, and accreditation requirements. Retention periods are documented per record type. Records are stored securely and disposed of in a controlled manner when the retention period has elapsed.`,
    },
    {
      id: "POL-006",
      title: "Risk Management Policy",
      content: `# Risk Management Policy

The organization shall identify risks to the achievement of objectives and to impartiality. Risks are evaluated and treated. Risk assessment and treatment are documented and reviewed. See SOP-RISK where applicable.`,
    },
  ]

  for (const p of policies) {
    await createDocumentWithVersion(prisma, ctx, p.id, p.title, DocumentType.POL, p.content)
  }

  const sopContent = (id: string, title: string, purpose: string, scope: string, refs: string) =>
    `# ${title}

**Document ID:** ${id} | **Version:** 1.0

## 1 Purpose
${purpose}

## 2 Scope
${scope}

## 3 References
${refs}

## 4 Definitions
As applicable to this procedure.

## 5 Procedure
5.1 Responsibilities are assigned per the quality manual.
5.2 Steps are performed as documented; deviations require approval and record.
5.3 Records are maintained per SOP-REC-01 and the record retention policy.

## 6 Records
As defined in the procedure annex or form templates.

---
*Controlled document. Uncontrolled when printed.*`

  const sops = [
    {
      id: "SOP-DOC-01",
      title: "Document Control Procedure",
      purpose: "To ensure that documents required by the QMS are approved, current, and available where needed.",
      scope: "All controlled documents (QAM, policies, SOPs, WIPs, forms).",
      refs: "ISO/IEC 17025:2017 Clause 8.3; POL-004.",
    },
    {
      id: "SOP-REC-01",
      title: "Record Control Procedure",
      purpose: "To ensure that records provide evidence of conformity and effective operation of the QMS.",
      scope: "All QMS and technical records.",
      refs: "ISO/IEC 17025:2017 Clause 8.4; POL-005.",
    },
    {
      id: "SOP-CON-01",
      title: "Contract Review Procedure",
      purpose: "To ensure that requirements are defined, agreed, and the organization can meet them.",
      scope: "Contracts and tenders for laboratory work.",
      refs: "ISO/IEC 17025:2017 Clause 7.1.",
    },
    {
      id: "SOP-NCW-01",
      title: "Control of Nonconforming Work",
      purpose: "To identify, control, and resolve nonconforming work and prevent release.",
      scope: "All nonconforming activities and outputs.",
      refs: "ISO/IEC 17025:2017 Clause 7.7.",
    },
    {
      id: "SOP-CAP-01",
      title: "Corrective Action Procedure",
      purpose: "To eliminate the cause of nonconformities and prevent recurrence.",
      scope: "Corrective actions arising from nonconformities, complaints, or audits.",
      refs: "ISO/IEC 17025:2017 Clause 8.7.",
    },
    {
      id: "SOP-PAP-01",
      title: "Preventive Action Procedure",
      purpose: "To identify and eliminate potential causes of nonconformities.",
      scope: "Preventive actions based on risk or opportunity.",
      refs: "ISO/IEC 17025:2017 Clause 8.8.",
    },
    {
      id: "SOP-AUD-01",
      title: "Internal Audit Procedure",
      purpose: "To verify that the QMS conforms to planned arrangements and is effectively implemented.",
      scope: "Internal audits of the QMS and technical activities.",
      refs: "ISO/IEC 17025:2017 Clause 8.8.",
    },
    {
      id: "SOP-MR-01",
      title: "Management Review Procedure",
      purpose: "To ensure the continuing suitability, adequacy, and effectiveness of the QMS.",
      scope: "Periodic management reviews; inputs and outputs per standard.",
      refs: "ISO/IEC 17025:2017 Clause 8.9.",
    },
    {
      id: "SOP-PER-01",
      title: "Personnel Competence & Training",
      purpose: "To ensure personnel are competent and trained for their activities.",
      scope: "All personnel affecting quality; training and competence records.",
      refs: "ISO/IEC 17025:2017 Clause 6.2.",
    },
    {
      id: "SOP-EQP-01",
      title: "Equipment Management",
      purpose: "To ensure equipment is fit for purpose, maintained, and calibrated where required.",
      scope: "Equipment used for testing/calibration and affecting results.",
      refs: "ISO/IEC 17025:2017 Clause 6.4.",
    },
    {
      id: "SOP-TRC-01",
      title: "Measurement Traceability",
      purpose: "To ensure measurement results are traceable to the SI or agreed reference.",
      scope: "Equipment and methods where traceability is required.",
      refs: "ISO/IEC 17025:2017 Clause 6.5.",
    },
    {
      id: "SOP-DAT-01",
      title: "Data Integrity & IT Security",
      purpose: "To protect data and IT systems and ensure integrity of electronic records.",
      scope: "IT systems, data handling, and access control.",
      refs: "ISO/IEC 17025:2017 Clause 7.7; ISO 27001 where applicable.",
    },
  ]

  for (const s of sops) {
    await createDocumentWithVersion(
      prisma,
      ctx,
      s.id,
      s.title,
      DocumentType.SOP,
      sopContent(s.id, s.title, s.purpose, s.scope, s.refs),
      true
    )
  }

  const frmContent = (id: string, title: string, body: string) =>
    `# ${title}\n**Form ID:** ${id} | **Version:** 1.0\n\n${body}\n\n---\n*Controlled form. Uncontrolled when printed.*`

  await createDocumentWithVersion(
    prisma,
    ctx,
    "FRM-001",
    "Corrective Action Form",
    DocumentType.FRM,
    frmContent(
      "FRM-001",
      "Corrective Action Form",
      "**Date:** ___________ | **Raised by:** ___________\n**Nonconformity ref:** ___________\n**Description:**\n___________\n**Root cause:**\n___________\n**Action taken:**\n___________\n**Due date:** ___________ | **Completed by:** ___________"
    )
  )
  await createDocumentWithVersion(
    prisma,
    ctx,
    "FRM-002",
    "Internal Audit Checklist",
    DocumentType.FRM,
    frmContent(
      "FRM-002",
      "Internal Audit Checklist",
      "**Audit ref:** ___________ | **Date:** ___________\n**Area/Clause:** ___________\n**Criteria:** ___________\n**Finding (OK / NC / OFI):**\n___________\n**Evidence:**\n___________"
    )
  )

  console.log("Created QMS document set (QAM, POLs, SOPs, FRMs)")
}
