import "dotenv/config"
import { PrismaClient, ContentType } from "@prisma/client"
import bcrypt from "bcryptjs"
import { seedQms } from "./seed-qms"
import { seedCmmcAt } from "./seed-cmmc-at"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Organization",
    },
  })

  console.log("Created organization:", org.name)

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      password: hashedPassword,
      name: "Admin User",
    },
  })

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@demo.com" },
    update: {},
    create: {
      email: "trainer@demo.com",
      password: hashedPassword,
      name: "Trainer User",
    },
  })

  const trainee = await prisma.user.upsert({
    where: { email: "trainee@demo.com" },
    update: {},
    create: {
      email: "trainee@demo.com",
      password: hashedPassword,
      name: "Trainee User",
    },
  })

  console.log("Created users")

  // Create memberships
  await prisma.membership.upsert({
    where: {
      userId_orgId: {
        userId: admin.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      orgId: org.id,
      role: "ADMIN",
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_orgId: {
        userId: trainer.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: trainer.id,
      orgId: org.id,
      role: "TRAINER",
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_orgId: {
        userId: trainee.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: trainee.id,
      orgId: org.id,
      role: "TRAINEE",
    },
  })

  console.log("Created memberships")

  // Create slide deck content
  const slideDeckContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.SLIDE_DECK,
      title: "Government Contracting Compliance Fundamentals",
      description: "Introduction to compliance requirements for small businesses",
    },
  })

  const slideDeck = await prisma.slideDeck.create({
    data: {
      contentItemId: slideDeckContent.id,
      slides: {
        create: [
          {
            title: "Welcome",
            content: "Welcome to Government Contracting Compliance Fundamentals for Small Businesses",
            order: 1,
          },
          {
            title: "Why Compliance Matters",
            content: "Compliance ensures that contractors meet legal and regulatory requirements, protecting both the contractor and the government. It helps maintain fair competition and ensures taxpayer dollars are used appropriately.",
            order: 2,
          },
          {
            title: "High-Level Expectations",
            content: "As a government contractor, you are expected to:\n\n• Follow all applicable laws and regulations\n• Maintain accurate records\n• Submit truthful information\n• Protect sensitive government information\n• Meet quality and performance standards",
            order: 3,
          },
          {
            title: "FAR Overview",
            content: "The Federal Acquisition Regulation (FAR) is the primary regulation for government procurement. It establishes uniform policies and procedures for acquisition of supplies and services by executive agencies.",
            order: 4,
          },
          {
            title: "DFARS Overview",
            content: "The Defense Federal Acquisition Regulation Supplement (DFARS) applies to Department of Defense contracts. It includes additional requirements beyond the FAR, particularly for cybersecurity and controlled unclassified information (CUI).",
            order: 5,
          },
          {
            title: "NIST SP 800-171",
            content: "NIST SP 800-171 protects Controlled Unclassified Information (CUI) in non-federal systems. It requires contractors to implement 110 security controls across 14 families, including access control, incident response, and system integrity.",
            order: 6,
          },
          {
            title: "CMMC Overview",
            content: "The Cybersecurity Maturity Model Certification (CMMC) is a unified standard for implementing cybersecurity across the defense industrial base. It has five maturity levels, with Level 1 being basic cyber hygiene and Level 5 being advanced/progressive.",
            order: 7,
          },
          {
            title: "ISO Standards",
            content: "Common ISO standards for contractors:\n\n• ISO 9001: Quality management systems\n• ISO 27001: Information security management\n• ISO 17025: Testing and calibration laboratories\n\nThese demonstrate commitment to quality and security.",
            order: 8,
          },
          {
            title: "Common Challenges",
            content: "Small businesses often face:\n\n• Limited resources for compliance\n• Complex regulatory requirements\n• Lack of in-house expertise\n• Cost of implementation\n• Keeping up with changing regulations",
            order: 9,
          },
          {
            title: "Practical Roadmap",
            content: "Getting started:\n\n1. Assess your current state\n2. Identify applicable requirements\n3. Develop a compliance plan\n4. Implement controls incrementally\n5. Document everything\n6. Train your team\n7. Monitor and improve",
            order: 10,
          },
          {
            title: "Common Pitfalls",
            content: "Avoid these mistakes:\n\n• Waiting until contract award to start\n• Inadequate documentation\n• Not training staff\n• Ignoring cybersecurity requirements\n• Failing to maintain compliance\n• Not seeking help when needed",
            order: 11,
          },
          {
            title: "Getting Support",
            content: "You don't have to do this alone. Professional consulting support can help you:\n\n• Understand requirements\n• Develop implementation plans\n• Navigate complex regulations\n• Save time and reduce risk\n• Achieve compliance efficiently",
            order: 12,
          },
        ],
      },
    },
  })

  console.log("Created slide deck")

  // Create article content
  const articleContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.ARTICLE,
      title: "Understanding FAR Requirements",
      description: "A detailed guide to Federal Acquisition Regulation compliance",
    },
  })

  await prisma.article.create({
    data: {
      contentItemId: articleContent.id,
      content: `# Understanding FAR Requirements

The Federal Acquisition Regulation (FAR) is the primary regulation used by all federal executive agencies in their acquisition of supplies and services with appropriated funds.

## Key Principles

The FAR is built on several fundamental principles:

1. **Competition**: Full and open competition is required unless otherwise authorized
2. **Fairness**: All contractors must be treated fairly
3. **Transparency**: Acquisition processes must be transparent
4. **Efficiency**: Acquisitions should be efficient and effective

## Common FAR Clauses

Small businesses should be familiar with common FAR clauses that appear in contracts:

- **FAR 52.219-8**: Utilization of Small Business Concerns
- **FAR 52.203-13**: Contractor Code of Business Ethics and Conduct
- **FAR 52.204-21**: Basic Safeguarding of Covered Contractor Information Systems

## Compliance Requirements

To maintain FAR compliance, contractors must:

- Maintain accurate records
- Submit required reports on time
- Follow cost accounting standards (if applicable)
- Comply with labor laws and regulations
- Protect sensitive information

## Getting Help

If you're unsure about FAR requirements, consult with a qualified professional who specializes in government contracting compliance.`,
    },
  })

  console.log("Created article")

  // Create quiz
  const quizContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.QUIZ,
      title: "Compliance Fundamentals Quiz",
      description: "Test your knowledge of government contracting compliance",
    },
  })

  const quiz = await prisma.quiz.create({
    data: {
      contentItemId: quizContent.id,
      passingScore: 70,
      allowRetry: true,
      showAnswersAfter: true,
      questions: {
        create: [
          {
            text: "What does FAR stand for?",
            type: "MULTIPLE_CHOICE",
            explanation: "FAR stands for Federal Acquisition Regulation, the primary regulation for government procurement.",
            order: 1,
            choices: {
              create: [
                { text: "Federal Acquisition Regulation", isCorrect: true, order: 1 },
                { text: "Federal Accounting Rules", isCorrect: false, order: 2 },
                { text: "Federal Audit Requirements", isCorrect: false, order: 3 },
                { text: "Federal Administrative Rules", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "DFARS applies specifically to which type of contracts?",
            type: "MULTIPLE_CHOICE",
            explanation: "DFARS (Defense Federal Acquisition Regulation Supplement) applies specifically to Department of Defense contracts and includes additional requirements beyond the FAR.",
            order: 2,
            choices: {
              create: [
                { text: "Department of Defense contracts", isCorrect: true, order: 1 },
                { text: "All federal contracts", isCorrect: false, order: 2 },
                { text: "State contracts only", isCorrect: false, order: 3 },
                { text: "Commercial contracts", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "NIST SP 800-171 protects what type of information?",
            type: "MULTIPLE_CHOICE",
            order: 3,
            choices: {
              create: [
                { text: "Controlled Unclassified Information (CUI)", isCorrect: true, order: 1 },
                { text: "Classified information", isCorrect: false, order: 2 },
                { text: "Public information", isCorrect: false, order: 3 },
                { text: "Personal information only", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "CMMC has how many maturity levels?",
            type: "MULTIPLE_CHOICE",
            order: 4,
            choices: {
              create: [
                { text: "5", isCorrect: true, order: 1 },
                { text: "3", isCorrect: false, order: 2 },
                { text: "7", isCorrect: false, order: 3 },
                { text: "10", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "ISO 9001 relates to which area?",
            type: "MULTIPLE_CHOICE",
            order: 5,
            choices: {
              create: [
                { text: "Quality management systems", isCorrect: true, order: 1 },
                { text: "Information security", isCorrect: false, order: 2 },
                { text: "Environmental management", isCorrect: false, order: 3 },
                { text: "Financial reporting", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "True or False: Small businesses should wait until contract award to begin compliance efforts.",
            type: "TRUE_FALSE",
            order: 6,
            choices: {
              create: [
                { text: "True", isCorrect: false, order: 1 },
                { text: "False", isCorrect: true, order: 2 },
              ],
            },
          },
          {
            text: "Which is a common challenge for small businesses in compliance?",
            type: "MULTIPLE_CHOICE",
            order: 7,
            choices: {
              create: [
                { text: "All of the above", isCorrect: true, order: 1 },
                { text: "Limited resources", isCorrect: false, order: 2 },
                { text: "Lack of expertise", isCorrect: false, order: 3 },
                { text: "Complex requirements", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "True or False: Documentation is optional for compliance.",
            type: "TRUE_FALSE",
            order: 8,
            choices: {
              create: [
                { text: "True", isCorrect: false, order: 1 },
                { text: "False", isCorrect: true, order: 2 },
              ],
            },
          },
          {
            text: "What should be the first step in a compliance roadmap?",
            type: "MULTIPLE_CHOICE",
            order: 9,
            choices: {
              create: [
                { text: "Assess your current state", isCorrect: true, order: 1 },
                { text: "Implement all controls at once", isCorrect: false, order: 2 },
                { text: "Skip documentation", isCorrect: false, order: 3 },
                { text: "Wait for requirements to change", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "True or False: Professional consulting support can help small businesses achieve compliance more efficiently.",
            type: "TRUE_FALSE",
            order: 10,
            choices: {
              create: [
                { text: "True", isCorrect: true, order: 1 },
                { text: "False", isCorrect: false, order: 2 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log("Created quiz")

  // Create attestation
  const attestationContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.ATTESTATION,
      title: "Compliance Training Acknowledgment",
      description: "Acknowledge completion of compliance training",
    },
  })

  await prisma.attestationTemplate.create({
    data: {
      contentItemId: attestationContent.id,
      text: "I acknowledge that I have completed the Government Contracting Compliance Fundamentals training. I understand the key requirements and expectations for government contractors, including FAR, DFARS, NIST SP 800-171, and CMMC requirements. I commit to applying these principles in my work.",
      requireTypedName: true,
    },
  })

  console.log("Created attestation")

  // Create certificate template
  const certTemplate = await prisma.certificateTemplate.create({
    data: {
      orgId: org.id,
      name: "Compliance Fundamentals Certificate",
      htmlTemplateRichText: `
        <div style="text-align: center; padding: 60px; border: 8px solid #2563eb; max-width: 800px; margin: 0 auto; font-family: 'Times New Roman', serif;">
          <h1 style="font-size: 48px; margin-bottom: 20px; color: #1e40af;">Certificate of Completion</h1>
          <p style="font-size: 24px; margin-bottom: 40px; color: #64748b;">This is to certify that</p>
          <h2 style="font-size: 36px; margin-bottom: 40px; color: #1e293b; font-weight: bold;">{{userName}}</h2>
          <p style="font-size: 20px; margin-bottom: 40px; color: #64748b;">has successfully completed</p>
          <h3 style="font-size: 28px; margin-bottom: 20px; color: #1e40af;">{{curriculumTitle}}{{contentItemTitle}}</h3>
          <p style="font-size: 18px; margin-top: 60px; color: #64748b;">Issued on {{issuedDate}}</p>
          <p style="font-size: 14px; margin-top: 40px; color: #94a3b8;">Certificate Number: {{certificateNumber}}</p>
        </div>
      `,
    },
  })

  console.log("Created certificate template")

  // Create curriculum
  const curriculum = await prisma.curriculum.create({
    data: {
      orgId: org.id,
      title: "Government Contracting Compliance Fundamentals for Small Businesses",
      description: "A comprehensive introduction to compliance requirements for small business government contractors",
      sections: {
        create: [
          {
            title: "Introduction",
            description: "Getting started with compliance",
            order: 1,
            items: {
              create: [
                {
                  contentItemId: slideDeckContent.id,
                  required: true,
                  order: 1,
                },
              ],
            },
          },
          {
            title: "Deep Dive",
            description: "Detailed information on key topics",
            order: 2,
            items: {
              create: [
                {
                  contentItemId: articleContent.id,
                  required: true,
                  order: 1,
                },
              ],
            },
          },
          {
            title: "Assessment",
            description: "Test your knowledge",
            order: 3,
            items: {
              create: [
                {
                  contentItemId: quizContent.id,
                  required: true,
                  order: 1,
                },
              ],
            },
          },
          {
            title: "Acknowledgment",
            description: "Sign your attestation",
            order: 4,
            items: {
              create: [
                {
                  contentItemId: attestationContent.id,
                  required: true,
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  })

  console.log("Created curriculum")

  // ========== Government Cyber & Compliance Standards Module ==========
  const govSlideDeckContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.SLIDE_DECK,
      title: "Government Cyber & Compliance Standards — Practical Overview for Small Businesses Handling CUI",
      description: "Professional overview of ISO, NIST, CMMC, SOC 2, RMF, FedRAMP, CIA Triad, and defense in depth for small businesses handling CUI.",
    },
  })

  await prisma.slideDeck.create({
    data: {
      contentItemId: govSlideDeckContent.id,
      slides: {
        create: [
          {
            title: "Government Cyber & Compliance Standards",
            content: "Subtitle: Practical overview for small businesses handling CUI\n\n- Understand how key standards connect (ISO → NIST → CMMC)\n- Learn what the government is trying to protect (CIA Triad)\n- Identify common hurdles and practical next steps",
            order: 1,
          },
          {
            title: "Why Compliance Exists in Government Contracting",
            content: "- Government information is a high-value target\n- Contractors are part of the attack surface\n- Standards create a baseline of trust and accountability\n- Compliance is risk management, not perfection",
            order: 2,
          },
          {
            title: "The CIA Triad: The Core Security Goal",
            content: "- **Confidentiality**: only authorized access to CUI\n- **Integrity**: CUI stays accurate and unaltered\n- **Availability**: systems and data are accessible when needed\n- Most frameworks exist to reduce risk and maximize CIA",
            order: 3,
          },
          {
            title: "Defense in Depth: Layered Protection",
            content: "- Multiple layers reduce single-point failures\n- People + process + technology all matter\n- Examples: MFA + least privilege + monitoring + backups\n- The goal is resilience, not a single \"perfect tool\"",
            order: 4,
          },
          {
            title: "Build Security In Early (Don't Bolt It On)",
            content: "- Retrofitting is expensive and disruptive\n- Define scope and data boundaries first\n- Choose tools and workflows that support evidence and auditing\n- Make \"secure by default\" the operating model",
            order: 5,
          },
          {
            title: "The Standards Ecosystem (Not Separate Checklists)",
            content: "- ISO & SOC 2 establish governance and control discipline\n- NIST formalizes controls for U.S. government contexts\n- CMMC enforces NIST requirements via certification\n- RMF/FedRAMP apply rigorous controls to systems (especially cloud)",
            order: 6,
          },
          {
            title: "ISO: Governance and Continuous Improvement",
            content: "- ISO 27001: ISMS (security governance)\n- ISO 9001: quality management (repeatable processes)\n- ISO 17025: lab competence (if applicable)\n- ISO emphasizes: defined processes, risk, documentation, improvement",
            order: 7,
          },
          {
            title: "SOC 2: Evidence-Based Trust",
            content: "- Evaluates security and operational trust over time\n- Based on Trust Services Criteria (Security, Availability, etc.)\n- Auditor-driven and evidence-based\n- Often required by commercial customers and primes",
            order: 8,
          },
          {
            title: "NIST: The Backbone of Government Security Requirements",
            content: "- NIST SP 800-171: protecting CUI in contractor environments\n- NIST SP 800-53: broad federal control catalog\n- NIST provides specific, testable requirements\n- Documentation matters: SSP and POA&M are common artifacts",
            order: 9,
          },
          {
            title: "CUI Handling Starts With Scope",
            content: "- Identify where CUI is created, received, stored, processed, transmitted\n- Define a clear \"CUI boundary\" (systems, users, apps)\n- Reduce scope to reduce burden\n- Common leakage points: email, file shares, unmanaged endpoints",
            order: 10,
          },
          {
            title: "RMF: Controls as a Lifecycle",
            content: "- Categorize systems → select controls → implement → assess → authorize → monitor\n- Continuous monitoring is expected, not optional\n- RMF is common in federal system authorization contexts",
            order: 11,
          },
          {
            title: "FedRAMP: High Bar for Cloud Security",
            content: "- Applies RMF/800-53 rigor to cloud service providers\n- Requires strong documentation and continuous monitoring\n- Relevant if you're using or providing cloud services to federal agencies",
            order: 12,
          },
          {
            title: "CMMC: Enforced Requirements for DoD Contractors",
            content: "- CMMC is the DoD's certification program\n- Built primarily on NIST SP 800-171 for CUI\n- Contract requirements determine what level you need\n- Evidence + implementation + practices matter",
            order: 13,
          },
          {
            title: "CMMC Level 1 vs Level 2 (Plain English)",
            content: "- Level 1: basic safeguarding (lower sensitivity)\n- Level 2: CUI protection aligned to 800-171 (commonly required)\n- Level 2 typically requires third-party assessment\n- The difference is depth, evidence, and rigor",
            order: 14,
          },
          {
            title: "The Real Hurdles (What Makes This Hard)",
            content: "- Translating policy into actual controls\n- MFA everywhere + access control discipline\n- Logging, monitoring, and retention\n- Patch and vulnerability management\n- Evidence generation and documentation (SSP/POA&M)\n- Sustaining compliance over time",
            order: 15,
          },
          {
            title: "Avoid \"Paper Compliance\"",
            content: "- Policies without implementation\n- Tools without documentation or evidence\n- Shared accounts and unmanaged devices\n- CUI handled outside controlled boundaries\n- No repeatable process = fragile compliance",
            order: 16,
          },
          {
            title: "A Practical 30/60/90 Day Starter Plan",
            content: "**30 Days:**\n- Define CUI scope and boundary\n- Inventory assets/users\n- Establish access control + MFA\n\n**60 Days:**\n- Implement core safeguards and logging\n- Draft SSP and start POA&M\n- Start training and evidence collection\n\n**90 Days:**\n- Close high-risk gaps\n- Run internal readiness checks\n- Build sustainable operating cadence (patching, reviews, monitoring)",
            order: 17,
          },
          {
            title: "How MacTech Helps You Overcome These Hurdles",
            content: "- MacTech Solutions CUI Enclave: reduces scope, centralizes controls, simplifies CUI handling\n- CMMC Level 2 Accelerator: structured path, templates, evidence readiness, and implementation support\n- Built to help small businesses move fast without cutting corners\n- Next steps: assess scope → select approach → execute roadmap",
            order: 18,
          },
        ],
      },
    },
  })

  console.log("Created Government Cyber slide deck (18 slides)")

  const articleGlossaryContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.ARTICLE,
      title: "Quick Glossary & Acronyms (Government Contracting Cyber)",
      description: "Plain-English definitions for CUI, FCI, FAR, DFARS, NIST, CMMC, RMF, FedRAMP, ISO, SOC 2, SSP, POA&M, MFA, and more.",
    },
  })

  await prisma.article.create({
    data: {
      contentItemId: articleGlossaryContent.id,
      content: `# Quick Glossary & Acronyms (Government Contracting Cyber)

Short, plain-English definitions for terms you'll encounter when pursuing government contracting compliance and CMMC readiness.

## Core Terms

- **CUI (Controlled Unclassified Information)** — Information the government creates or possesses that requires safeguarding or dissemination controls. Contractors often handle CUI under DFARS and must protect it per NIST SP 800-171.

- **FCI (Federal Contract Information)** — Nonpublic information provided by the government under a contract that is not CUI. Basic safeguarding applies (e.g., FAR 52.204-21).

- **FAR (Federal Acquisition Regulation)** — The primary set of rules for federal procurement. Applies to most executive agency acquisitions.

- **DFARS (Defense Federal Acquisition Regulation Supplement)** — Supplements the FAR for DoD contracts. Includes clauses on cybersecurity and CUI (e.g., 252.204-7012, 7019, 7020).

## Standards & Frameworks

- **NIST SP 800-171** — Protects CUI in non-federal systems. Defines 110 controls in 14 families. The main reference for contractor CUI protection and CMMC Level 2.

- **NIST SP 800-53** — Broader federal control catalog. Used in RMF and FedRAMP for system authorization.

- **RMF (Risk Management Framework)** — A lifecycle for securing systems: categorize, select controls, implement, assess, authorize, monitor. Used for federal system authorization.

- **FedRAMP** — Authorization program for cloud services used by federal agencies. Applies RMF/800-53 rigor to cloud service providers.

- **CMMC Level 1** — Basic safeguarding. Focused on FCI and lower-sensitivity environments.

- **CMMC Level 2** — CUI protection aligned to NIST SP 800-171. Commonly required for DoD contractors handling CUI. Typically requires third-party assessment.

- **ISO 27001** — International standard for information security management systems (ISMS). Emphasizes governance, risk, and continuous improvement.

- **ISO 9001** — Quality management systems. Repeatable processes and documentation.

- **ISO 17025** — Competence of testing and calibration laboratories (when applicable).

- **SOC 2** — Service Organization Control report. Evidence-based evaluation of security and operational controls (Trust Services Criteria). Often required by commercial customers or primes; not a DoD certification.

## Artifacts & Practices

- **SSP (System Security Plan)** — Document describing how your system meets security requirements. Central artifact for 800-171 and CMMC.

- **POA&M (Plan of Action and Milestones)** — Tracks gaps and remediation plans. Used to show progress and planning for unmet controls.

- **MFA (Multi-Factor Authentication)** — Authentication using two or more factors (e.g., password + code). Expected for access to CUI systems.

- **Least privilege** — Users and systems get only the access needed to perform their role. Reduces blast radius of compromise.

- **Logging/monitoring** — Recording and reviewing events (logins, access, changes) to detect and respond to incidents. Required for CUI environments.`,
    },
  })

  const articleChecklistContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.ARTICLE,
      title: "Starter Checklist: First 30/60/90 Days Toward CMMC Readiness",
      description: "Structured checklist aligned to your first 30, 60, and 90 days plus subcontractor flow-downs, incident response, and evidence examples.",
    },
  })

  await prisma.article.create({
    data: {
      contentItemId: articleChecklistContent.id,
      content: `# Starter Checklist: First 30/60/90 Days Toward CMMC Readiness

Use this checklist alongside the slide deck's 30/60/90 roadmap. Adjust to your scope and contract requirements.

## 30 Days

- [ ] Define CUI scope: where is CUI created, received, stored, processed, transmitted?
- [ ] Draw a CUI boundary (systems, users, applications).
- [ ] Inventory assets and users that touch CUI.
- [ ] Establish access control policy and start enforcing least privilege.
- [ ] Enable MFA for all users with access to CUI or CUI systems.
- [ ] Identify subcontractor flow-downs: which subs receive CUI, and what do they need to do?

## 60 Days

- [ ] Implement core safeguards (access control, MFA, logging, encryption where required).
- [ ] Turn on and retain logging for CUI systems (per 800-171 expectations).
- [ ] Draft your System Security Plan (SSP) and start a POA&M for gaps.
- [ ] Begin training and document completion (training records as evidence).
- [ ] Start evidence collection: policies, screenshots, configs, logs samples.

## 90 Days

- [ ] Close high-risk gaps identified in your POA&M.
- [ ] Run internal readiness checks (e.g., self-assessment against 800-171).
- [ ] Establish sustainable cadence: patching, access reviews, monitoring.
- [ ] Basic incident response: define roles, contacts, and high-level steps (detect, contain, report).
- [ ] Evidence checklist examples: policy documents, MFA screenshots, training records, sample logs, access review records.

## Subcontractor Flow-Downs

- [ ] List subcontractors that will receive CUI or FCI.
- [ ] Determine flow-down clauses (DFARS, CMMC) and communicate requirements.
- [ ] Document how you verify their compliance (e.g., CMMC level, attestation).

## Incident Response (High Level)

- [ ] Designate who detects and reports incidents.
- [ ] Know reporting requirements (e.g., DoD in 72 hours per contract).
- [ ] Outline contain and remediate steps; keep it simple and actionable.`,
    },
  })

  const govQuizContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.QUIZ,
      title: "Government Cyber & Compliance Standards — Quiz",
      description: "Test your understanding of CIA Triad, defense in depth, NIST, CMMC, RMF, FedRAMP, scope, and common mistakes.",
    },
  })

  await prisma.quiz.create({
    data: {
      contentItemId: govQuizContent.id,
      passingScore: 70,
      allowRetry: true,
      showAnswersAfter: true,
      questions: {
        create: [
          {
            text: "Which statement best describes Confidentiality in the CIA Triad?",
            type: "MULTIPLE_CHOICE",
            explanation: "Confidentiality means only authorized people or systems can access the information. CUI must be protected so that access is limited to those with a need to know.",
            order: 1,
            choices: {
              create: [
                { text: "A. Only authorized access to sensitive information (e.g., CUI)", isCorrect: true, order: 1 },
                { text: "B. Data is always available 24/7", isCorrect: false, order: 2 },
                { text: "C. Data is never modified", isCorrect: false, order: 3 },
                { text: "D. Information is backed up daily", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "Why does Defense in Depth rely on multiple layers?",
            type: "MULTIPLE_CHOICE",
            explanation: "Multiple layers reduce the chance that a single failure (e.g., one control failing) leads to a full breach. People, process, and technology all contribute.",
            order: 2,
            choices: {
              create: [
                { text: "A. To reduce single-point failures and increase resilience", isCorrect: true, order: 1 },
                { text: "B. To satisfy auditors only", isCorrect: false, order: 2 },
                { text: "C. To replace the need for MFA", isCorrect: false, order: 3 },
                { text: "D. To minimize documentation", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "Why is defining scope and data boundaries early considered 'building security in'?",
            type: "MULTIPLE_CHOICE",
            explanation: "Defining scope early lets you design controls and workflows from the start. Retrofitting security later is costlier and more disruptive.",
            order: 3,
            choices: {
              create: [
                { text: "A. It allows you to design controls from the start and avoid costly retrofits", isCorrect: true, order: 1 },
                { text: "B. It reduces the number of slides in training", isCorrect: false, order: 2 },
                { text: "C. It is required only for Level 1", isCorrect: false, order: 3 },
                { text: "D. It replaces the need for NIST", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "Which standard is most directly tied to protecting CUI in contractor environments?",
            type: "MULTIPLE_CHOICE",
            explanation: "NIST SP 800-171 is the primary standard for protecting CUI in non-federal (contractor) systems. CMMC Level 2 is built on it.",
            order: 4,
            choices: {
              create: [
                { text: "A. NIST SP 800-171", isCorrect: true, order: 1 },
                { text: "B. ISO 9001", isCorrect: false, order: 2 },
                { text: "C. SOC 2", isCorrect: false, order: 3 },
                { text: "D. FedRAMP", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "What is the primary purpose of CMMC?",
            type: "MULTIPLE_CHOICE",
            explanation: "CMMC is the DoD's program to enforce cybersecurity requirements through certification. It verifies that contractors implement required practices (e.g., from NIST SP 800-171).",
            order: 5,
            choices: {
              create: [
                { text: "A. To enforce and verify contractor cybersecurity via certification", isCorrect: true, order: 1 },
                { text: "B. To replace the FAR", isCorrect: false, order: 2 },
                { text: "C. To audit commercial customers only", isCorrect: false, order: 3 },
                { text: "D. To eliminate the need for documentation", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "What is the main difference between CMMC Level 1 and Level 2 (at a high level)?",
            type: "MULTIPLE_CHOICE",
            explanation: "Level 1 focuses on basic safeguarding (e.g., FCI). Level 2 addresses CUI and is aligned to NIST SP 800-171, with greater depth, evidence, and typically third-party assessment.",
            order: 6,
            choices: {
              create: [
                { text: "A. Level 1 is basic safeguarding; Level 2 is CUI protection aligned to 800-171 with more rigor and evidence", isCorrect: true, order: 1 },
                { text: "B. Level 1 is harder than Level 2", isCorrect: false, order: 2 },
                { text: "C. Level 2 does not require documentation", isCorrect: false, order: 3 },
                { text: "D. Level 1 requires third-party assessment", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "What does RMF emphasize?",
            type: "MULTIPLE_CHOICE",
            explanation: "The Risk Management Framework is a lifecycle: categorize, select controls, implement, assess, authorize, and monitor. Continuous monitoring is a key part of the lifecycle.",
            order: 7,
            choices: {
              create: [
                { text: "A. A lifecycle of controls plus continuous monitoring", isCorrect: true, order: 1 },
                { text: "B. One-time certification only", isCorrect: false, order: 2 },
                { text: "C. Eliminating all risk", isCorrect: false, order: 3 },
                { text: "D. Replacing CMMC", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "FedRAMP applies primarily to what?",
            type: "MULTIPLE_CHOICE",
            explanation: "FedRAMP is the federal program for authorizing cloud service providers (CSPs) that serve federal agencies. It applies RMF and NIST 800-53 rigor to cloud offerings.",
            order: 8,
            choices: {
              create: [
                { text: "A. Authorization of cloud service providers serving federal agencies", isCorrect: true, order: 1 },
                { text: "B. All DoD contractors regardless of cloud use", isCorrect: false, order: 2 },
                { text: "C. State government only", isCorrect: false, order: 3 },
                { text: "D. Commercial-only products", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "Why does defining CUI scope and boundary matter?",
            type: "MULTIPLE_CHOICE",
            explanation: "Scope drives what systems and people are in scope for compliance. Mistakes in scope lead to audit failures, leakage, or unnecessary burden.",
            order: 9,
            choices: {
              create: [
                { text: "A. Scope drives what is in compliance scope; mistakes cause audit failures and leakage", isCorrect: true, order: 1 },
                { text: "B. It is optional for Level 2", isCorrect: false, order: 2 },
                { text: "C. It replaces the need for MFA", isCorrect: false, order: 3 },
                { text: "D. It only matters for SOC 2", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "Which is an example of 'paper compliance'?",
            type: "MULTIPLE_CHOICE",
            explanation: "Paper compliance means policies or plans exist on paper but are not actually implemented. Tools without documentation or evidence also fall short.",
            order: 10,
            choices: {
              create: [
                { text: "A. Having a policy that is not actually implemented or enforced", isCorrect: true, order: 1 },
                { text: "B. Writing an SSP and following it", isCorrect: false, order: 2 },
                { text: "C. Enabling MFA and documenting it", isCorrect: false, order: 3 },
                { text: "D. Doing a POA&M and closing gaps", isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: "True or False: SOC 2 is a DoD certification requirement for handling CUI.",
            type: "TRUE_FALSE",
            explanation: "SOC 2 is not a DoD or CMMC requirement. It is an evidence-based trust report often required by commercial customers or primes. CMMC is the DoD certification.",
            order: 11,
            choices: {
              create: [
                { text: "True", isCorrect: false, order: 1 },
                { text: "False", isCorrect: true, order: 2 },
              ],
            },
          },
          {
            text: "True or False: Reducing the scope of systems and users that handle CUI can reduce your compliance burden.",
            type: "TRUE_FALSE",
            explanation: "Yes. A smaller, well-defined CUI boundary means fewer systems and users in scope, which can reduce the cost and effort of implementing and sustaining controls.",
            order: 12,
            choices: {
              create: [
                { text: "True", isCorrect: true, order: 1 },
                { text: "False", isCorrect: false, order: 2 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log("Created Government Cyber quiz (12 questions)")

  const govAttestationContent = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      type: ContentType.ATTESTATION,
      title: "Training Acknowledgment",
      description: "Acknowledge completion and understand responsibilities for protecting CUI.",
    },
  })

  await prisma.attestationTemplate.create({
    data: {
      contentItemId: govAttestationContent.id,
      text: "I acknowledge that I completed this training module and understand my responsibilities for protecting Controlled Unclassified Information (CUI) and following required security practices within my organization's defined boundaries.",
      requireTypedName: true,
    },
  })

  console.log("Created Government Cyber attestation")

  const govCurriculum = await prisma.curriculum.create({
    data: {
      orgId: org.id,
      title: "Government Contracting Compliance Fundamentals for Small Businesses",
      description: "Government Cyber & Compliance Standards: slide deck, glossary, 30/60/90 checklist, quiz, and attestation. Quiz pass required.",
      sections: {
        create: [
          {
            title: "Government Cyber & Compliance Module",
            description: "Slide deck, supporting articles, assessment, and acknowledgment",
            order: 1,
            items: {
              create: [
                { contentItemId: govSlideDeckContent.id, required: true, order: 1 },
                { contentItemId: articleGlossaryContent.id, required: true, order: 2 },
                { contentItemId: articleChecklistContent.id, required: true, order: 3 },
                { contentItemId: govQuizContent.id, required: true, order: 4 },
                { contentItemId: govAttestationContent.id, required: true, order: 5 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log("Created Government Cyber curriculum")

  await prisma.certificateTemplate.create({
    data: {
      orgId: org.id,
      curriculumId: govCurriculum.id,
      name: "Certificate of Completion — Government Cyber & Compliance Standards",
      htmlTemplateRichText: `
        <div style="text-align: center; padding: 60px; border: 8px solid #0F2438; max-width: 800px; margin: 0 auto; font-family: 'Times New Roman', serif;">
          <h1 style="font-size: 48px; margin-bottom: 20px; color: #0F2438;">Certificate of Completion</h1>
          <p style="font-size: 24px; margin-bottom: 40px; color: #475569;">This is to certify that</p>
          <h2 style="font-size: 36px; margin-bottom: 40px; color: #1e293b; font-weight: bold;">{{userName}}</h2>
          <p style="font-size: 20px; margin-bottom: 40px; color: #475569;">has successfully completed</p>
          <h3 style="font-size: 28px; margin-bottom: 20px; color: #0F2438;">Government Cyber & Compliance Standards</h3>
          <p style="font-size: 18px; margin-top: 60px; color: #64748b;">Issued on {{issuedDate}}</p>
          <p style="font-size: 14px; margin-top: 40px; color: #94a3b8;">Certificate Number: {{certificateNumber}}</p>
        </div>
      `,
    },
  })

  console.log("Created Government Cyber certificate template")

  // Create event logs
  await prisma.eventLog.createMany({
    data: [
      {
        orgId: org.id,
        userId: admin.id,
        type: "CONTENT_CREATED",
        metadata: JSON.stringify({ contentType: "SLIDE_DECK", contentId: slideDeckContent.id }),
      },
      {
        orgId: org.id,
        userId: trainer.id,
        type: "CURRICULUM_CREATED",
        metadata: JSON.stringify({ curriculumId: curriculum.id }),
      },
      {
        orgId: org.id,
        userId: admin.id,
        type: "CONTENT_CREATED",
        metadata: JSON.stringify({ contentType: "SLIDE_DECK", contentId: govSlideDeckContent.id }),
      },
      {
        orgId: org.id,
        userId: trainer.id,
        type: "CURRICULUM_CREATED",
        metadata: JSON.stringify({ curriculumId: govCurriculum.id }),
      },
    ],
  })

  // ISO/IEC 17025 QMS document set (controlled documents, approved and effective)
  await seedQms(prisma, org.id, admin.id, trainer.id)

  // CMMC Level 2 AT course (AT.L2-3.2.1, 3.2.2, 3.2.3): 40 slides, quiz, attestation, curriculum
  await seedCmmcAt(prisma, org.id)

  console.log("Seeding completed!")
  console.log("\n=== Login Credentials ===")
  console.log("Admin: admin@demo.com / password123")
  console.log("Trainer: trainer@demo.com / password123")
  console.log("Trainee: trainee@demo.com / password123")
  console.log("\nOrganization slug: demo")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
