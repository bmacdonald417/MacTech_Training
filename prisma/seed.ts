import "dotenv/config"
import { PrismaClient, ContentType } from "@prisma/client"
import bcrypt from "bcryptjs"

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
    ],
  })

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
