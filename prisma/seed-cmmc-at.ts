/**
 * CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training
 * AT.L2-3.2.1 / AT.L2-3.2.2 / AT.L2-3.2.3
 *
 * Production-ready seed: 40 slides (fleshed out with verbatim instructor notes), 20-question quiz (80% pass) from markdown, attestation, curriculum, certificate.
 */

import { PrismaClient, ContentType } from "@prisma/client"
import { loadCmmcQuizFromMarkdown } from "../lib/quiz-parse-md"

const CMMC_COURSE_TITLE =
  "CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training (AT.L2-3.2.1/3.2.2/3.2.3)"

/** Slide: title + content (on-slide bullets + instructor notes + control mapping) */
function slide(
  title: string,
  bulletPoints: string[],
  instructorNotes: string,
  controlMapping: string
): { title: string; content: string } {
  const bullets = bulletPoints.length ? "- " + bulletPoints.join("\n- ") : ""
  const content = [
    bullets,
    "",
    "**Instructor notes:**",
    instructorNotes,
    "",
    "**Control mapping:** " + controlMapping,
  ].join("\n")
  return { title, content }
}

/** Build all 40 slides with production-ready content */
function buildSlides(): { title: string; content: string }[] {
  return [
    slide(
      "Welcome and course purpose",
      [
        "Why this training exists",
        "What “good” looks like",
        "How this maps to CMMC AT controls",
      ],
      "Welcome to our CMMC Level 2 Awareness and Training course. Today's session is not just compliance theater. It is operational training to help each person protect Controlled Unclassified Information, reduce business risk, and pass assessment scrutiny. This single course is intentionally structured to satisfy three Level 2 practices: AT.L2-3.2.1, AT.L2-3.2.2, and AT.L2-3.2.3. By the end, you will know what your responsibilities are, how to perform security duties tied to your role, and how to recognize and report potential insider threat indicators.",
      "3.2.1, 3.2.2, 3.2.3"
    ),
    slide(
      "Compliance context in plain English",
      [
        "CMMC Level 2 protects CUI",
        "Level 2 maps to NIST SP 800-171 Rev. 2",
        "AT family is mandatory, not optional",
      ],
      "CMMC Level 2 is the DoD's required model for protecting CUI in many contractor environments. At Level 2, the security requirements align to NIST SP 800-171 Revision 2. Within that set, the Awareness and Training requirements we cover today are mandatory practices that must be implemented and evidenced.",
      "Governance framing for all AT controls. Source: Level 2 guide + NIST text."
    ),
    slide(
      "What the assessor looks for",
      [
        "Trained people",
        "Role-appropriate training",
        "Insider threat awareness + reporting knowledge",
        "Objective evidence",
      ],
      "Assessors don't just ask whether training happened. They verify: did the right people receive it, was it role-appropriate, did insider threat content exist, and can the organization produce objective evidence such as rosters, training materials, dates, versions, and completion records.",
      "3.2.1, 3.2.2, 3.2.3. Source: CMMC Assessment Guide intent and evidence-oriented approach."
    ),
    slide(
      "Learning outcomes and pass criteria",
      [
        "80% quiz threshold",
        "Attestation required",
        "Role module completion required",
        "Missed learners require remediation",
      ],
      "To complete this course, each learner must pass the knowledge check at 80% or higher, complete required role-specific modules, and sign the security obligations attestation. If someone misses the threshold, we assign remediation within a defined window and track closure.",
      "3.2.1 / 3.2.2 evidence execution"
    ),
    // Module 1: Core awareness
    slide(
      "Threat landscape relevant to our business",
      [
        "Phishing and social engineering",
        "Credential theft and MFA fatigue",
        "Ransomware and data exfiltration",
        "Insider and third-party risk",
      ],
      "Our environment is targeted by both opportunistic and persistent threats. The top recurring vectors include phishing, credential compromise, business email fraud, cloud misconfiguration, and insider misuse. Security starts with user behavior: slow down, verify, and escalate suspicious events early.",
      "3.2.1"
    ),
    slide(
      "FCI vs CUI: what users must know",
      [
        "FCI basics: Federal Contract Information; basic safeguarding applies",
        "CUI basics: Controlled Unclassified Information; stricter handling and dissemination controls",
        "Why CUI handling has stricter expectations and consequences",
      ],
      "Federal Contract Information and Controlled Unclassified Information are not interchangeable. When in doubt, treat sensitive work products conservatively, follow handling procedures, and ask security for classification guidance. Improper handling can trigger contractual, legal, and reputational consequences.",
      "3.2.1"
    ),
    slide(
      "Acceptable use and security obligations",
      [
        "Authorized use only",
        "No credential sharing",
        "Lock screens, clean desk, least privilege",
        "Report anomalies promptly",
      ],
      "Your account is your responsibility. Do not share credentials, do not bypass controls for convenience, and do not move work data to unsanctioned tools. When something feels off, report immediately. Fast reporting limits blast radius.",
      "3.2.1"
    ),
    slide(
      "Passwords, MFA, and identity hygiene",
      [
        "Strong passphrases and password managers",
        "MFA enrollment and prompt discipline",
        "Recognize push fatigue attacks",
        "Access reviews and role changes",
      ],
      "Identity is the front door. Use approved password methods, enroll and maintain MFA, and reject unexpected prompts. If you receive MFA prompts you did not initiate, treat it as suspicious activity and report right away.",
      "3.2.1, 3.2.2 (role relevance for privileged users)"
    ),
    slide(
      "Email, links, attachments, and external comms",
      [
        "Verify sender and context",
        "Hover, inspect, and confirm before click",
        "Use approved transfer methods",
        "Never bypass secure channels",
      ],
      "Most breaches begin with social engineering. Before clicking, validate context: would this sender normally ask this? Use sanctioned channels for data sharing. If uncertain, stop and escalate.",
      "3.2.1"
    ),
    slide(
      "Device and endpoint security basics",
      [
        "Patch, EDR, encryption, lock policy",
        "USB and media restrictions",
        "Remote work and public Wi-Fi cautions",
        "Lost or stolen device response",
      ],
      "Endpoints are high-value targets. Keep devices compliant, avoid unknown removable media, and never expose sensitive work over insecure channels. If a device is lost or stolen, report immediately—time is critical.",
      "3.2.1"
    ),
    slide(
      "Data handling do's and don'ts",
      [
        "Storage locations: approved systems only",
        "Sharing and access control: least privilege",
        "Retention and disposal basics",
        "Screenshot and copy/paste risks",
      ],
      "Data must live in approved systems only. Do not export sensitive material to personal apps or unmanaged storage. Apply least privilege when sharing and follow approved deletion and retention procedures.",
      "3.2.1"
    ),
    slide(
      "Incident reporting fundamentals",
      [
        "What counts as an incident",
        "What to report immediately",
        "Who to contact and how",
        "What not to do during triage",
      ],
      "An incident can be suspicious behavior, unexpected access, malware indicators, or policy violations. When in doubt, report. Do not self-investigate in ways that destroy evidence. Preserve context and notify the security channel.",
      "3.2.1 and sets up 3.2.3"
    ),
    // Module 2: Role-based
    slide(
      "Why role-based training exists",
      [
        "Same risk, different responsibilities",
        "Duties drive training depth",
        "Role matrix defines required modules",
      ],
      "AT.L2-3.2.2 requires personnel to be trained for the security duties tied to their assigned responsibilities. That means not everyone gets identical depth. Role mapping is how we prove appropriateness.",
      "3.2.2"
    ),
    slide(
      "Role matrix overview",
      [
        "Standard user track",
        "Manager track",
        "IT/Admin track",
        "Developer track",
        "Contracts/HR/Finance track",
      ],
      "Each role has required and optional modules. Completion requirements are tracked per role. When roles change, training assignments update automatically and must be completed within policy timelines.",
      "3.2.2"
    ),
    slide(
      "Manager module: accountability and escalation",
      [
        "Approvals and exception discipline",
        "Performance and behavior risk signals",
        "Enforcing separation of duties",
        "Timely escalation responsibilities",
      ],
      "Managers are risk multipliers. You must challenge policy exceptions, monitor concerning behavior patterns, and escalate quickly. Tone at the top is a control, not a slogan.",
      "3.2.2, 3.2.3"
    ),
    slide(
      "IT/Admin module: privileged access controls",
      [
        "Least privilege and break-glass use",
        "Admin account separation",
        "Change control and logging",
        "Secure remote administration",
      ],
      "Privileged access is the highest-value target. Never use privileged credentials for daily user activity. All admin actions should be accountable, approved where required, and logged.",
      "3.2.2"
    ),
    slide(
      "IT/Admin module: hardening and monitoring",
      [
        "Baseline configurations",
        "Patch and vulnerability response",
        "SIEM and alert triage basics",
        "Backup integrity and restore testing",
      ],
      "Security operations depend on consistent baselines and disciplined remediation. Unpatched systems and alert fatigue are common failure points. Protecting confidentiality means defending availability and integrity too.",
      "3.2.2"
    ),
    slide(
      "Developer module: secure SDLC behaviors",
      [
        "Secrets handling: never hardcode",
        "Dependency hygiene",
        "Code review for security defects",
        "Branch protections and CI/CD safeguards",
      ],
      "Developers directly influence enterprise risk. Never hardcode secrets, review dependencies, and enforce secure pipeline controls. Security is part of definition-of-done, not post-release cleanup.",
      "3.2.2"
    ),
    slide(
      "Contracts/HR/Finance module: high-risk workflows",
      [
        "Invoice and payment fraud red flags",
        "Sensitive personnel and contract artifacts",
        "Third-party communications validation",
        "Confidentiality during vendor coordination",
      ],
      "Business functions are prime social-engineering targets. Verify payment changes out-of-band, validate authority, and protect sensitive records using approved channels only.",
      "3.2.2, 3.2.3"
    ),
    slide(
      "Guest and upload-only users",
      [
        "Minimal access principles",
        "Upload constraints and monitoring",
        "Prohibited behaviors",
        "Mandatory reporting path",
      ],
      "Guest users get the minimum required access. Even limited accounts can create security impact. Guests must receive concise role-appropriate security instructions and reporting procedures before use.",
      "3.2.2"
    ),
    // Module 3: Insider threat
    slide(
      "Insider threat: what it is and what it is not",
      [
        "Malicious insider vs negligent insider",
        "Compromised account behavior",
        "No vigilantism: report, don't investigate solo",
      ],
      "Insider threat includes malicious actions, negligent behavior, and externally compromised accounts acting as insiders. Your role is detection and reporting—not private investigation.",
      "3.2.3"
    ),
    slide(
      "Behavioral and technical indicators",
      [
        "Unusual access time or pattern",
        "Excessive downloads or data movement",
        "Repeated policy circumvention",
        "Emotional or behavioral distress plus access changes",
      ],
      "One indicator alone may be benign; clusters are riskier. Watch for unusual access patterns, repeated control bypass, and abrupt behavior shifts paired with privileged access.",
      "3.2.3"
    ),
    slide(
      "Reporting insider threat indicators",
      [
        "Confidential reporting channels",
        "Required report content",
        "Immediate vs non-immediate events",
        "Anti-retaliation and good-faith reporting",
      ],
      "Report what you observed, when, where, and why it seemed abnormal. Use official channels. Good-faith reporting is protected. Timely reporting protects people and mission.",
      "3.2.3"
    ),
    slide(
      "Scenario exercise 1: email exfiltration",
      [
        "Scenario setup: colleague forwards unusual volumes of attachments to personal email late at night",
        "Decision points: confront vs report",
        "Correct response: do not confront directly; preserve evidence context; notify security through designated channel immediately",
      ],
      "Scenario: A colleague forwards unusual volumes of attachments to personal email late at night. Correct response: do not confront directly, preserve evidence context, notify security through designated channel immediately.",
      "3.2.3"
    ),
    slide(
      "Scenario exercise 2: privileged misuse",
      [
        "Access outside job scope",
        "Log anomalies",
        "Response and escalation: validate whether approved change exists; escalate to SOC/security lead; preserve logs",
      ],
      "Scenario: An admin account repeatedly accesses unrelated sensitive repositories. Action: validate whether approved change exists, escalate to SOC/security lead, and preserve logs.",
      "3.2.2, 3.2.3"
    ),
    slide(
      "Scenario exercise 3: social engineering and urgency",
      [
        "“CEO urgent request” pattern",
        "Payment and change controls",
        "Verification discipline: follow established verification workflow; no shortcuts under urgency pressure",
      ],
      "Scenario: urgent executive request for sensitive transfer. Response: follow established verification workflow, no shortcuts under urgency pressure.",
      "3.2.1, 3.2.2"
    ),
    // Module 4: Policy integration
    slide(
      "Mapping training content to company policies",
      [
        "Acceptable Use Policy",
        "Access Control Policy",
        "Incident Response Policy",
        "Data Handling and CUI Procedures",
      ],
      "This slide is your policy crosswalk. Training must align with approved policy language and current versions. Outdated policy references are a common assessment finding.",
      "3.2.1"
    ),
    slide(
      "Exceptions, waivers, and prohibited workarounds",
      [
        "Exception process only",
        "No informal bypasses",
        "Temporary approvals with expiry",
        "Documentation requirements",
      ],
      "No one gets to bypass security by convenience. If business necessity exists, use the documented exception workflow with expiration and compensating controls.",
      "3.2.1, 3.2.2"
    ),
    slide(
      "Human factors and secure culture",
      [
        "Psychological safety for reporting",
        "No blame-first culture",
        "Learn fast, improve fast",
        "Trust but verify",
      ],
      "Security culture improves reporting quality and response speed. We reward early escalation and honest reporting. Silence is risk.",
      "Supports 3.2.3 effectiveness"
    ),
    // Module 5: Knowledge checks
    slide(
      "Knowledge check instructions",
      [
        "20-question quiz",
        "80% pass",
        "Retake and coaching process",
        "Deadline and SLA",
      ],
      "This assessment verifies comprehension and creates objective evidence. If score is below threshold, remediation is assigned and must be completed within policy timelines.",
      "3.2.1 / 3.2.2 / 3.2.3 evidence"
    ),
    slide(
      "Sample quiz items: awareness",
      [
        "Phishing recognition",
        "MFA fatigue response",
        "CUI handling choices",
      ],
      "These examples test practical judgment, not memorization. We care whether you can apply policy under realistic pressure.",
      "3.2.1"
    ),
    slide(
      "Sample quiz items: role-based",
      [
        "Privileged account separation",
        "Change control steps",
        "Secure coding and secret handling",
      ],
      "These items are role-specific. The goal is to verify users can perform assigned duties securely.",
      "3.2.2"
    ),
    slide(
      "Sample quiz items: insider threat",
      [
        "Indicator identification",
        "Correct reporting channel",
        "Evidence preservation basics",
      ],
      "These questions reinforce rapid, confidential reporting and proper escalation.",
      "3.2.3"
    ),
    slide(
      "Attestation statement",
      [
        "I completed training",
        "I understand obligations",
        "I will follow policy and report incidents",
        "Signature, date, and version tracking",
      ],
      "Attestation is a formal acknowledgement of obligations. It must be versioned and retained as assessment evidence.",
      "3.2.1–3.2.3 evidence support"
    ),
    // Module 6: Operationalization
    slide(
      "Metrics and KPIs",
      [
        "Completion rate by role",
        "Quiz performance trends",
        "Reporting rates and time-to-report",
        "Retraining triggers",
      ],
      "Training is a control, and controls need measurable effectiveness. Track lagging and leading indicators to tune content and reduce repeat failure patterns.",
      "Supports control sustainment"
    ),
    slide(
      "Common findings and how to avoid them",
      [
        "Generic one-size-fits-all training",
        "Missing role evidence",
        "Outdated content versions",
        "No proof of insider-threat coverage",
      ],
      "Most findings are evidence failures, not intent failures. Keep role mapping current, preserve records, and refresh content on policy or threat changes.",
      "3.2.1 / 3.2.2 / 3.2.3"
    ),
    slide(
      "Remediation workflow when gaps are found",
      [
        "Identify gap",
        "Assign corrective action",
        "Complete retraining",
        "Re-test and close",
      ],
      "When training gaps appear, use corrective action with owners and deadlines. Document closure and retain auditable artifacts.",
      "Assessor-defensible management"
    ),
    slide(
      "Final recap",
      [
        "Awareness obligations",
        "Role-based duties",
        "Insider-threat reporting discipline",
      ],
      "Today you learned baseline awareness, role-specific security duties, and insider-threat detection and reporting. These are daily operating behaviors, not annual check-the-box activities.",
      "All three AT controls"
    ),
    slide(
      "Reporting contacts and escalation paths",
      [
        "SOC, helpdesk, security mailbox",
        "Urgent incident hotline",
        "Manager escalation path",
        "Anonymous or confidential reporting option",
      ],
      "Save these contacts now. During real events, speed and clarity matter more than perfection.",
      "3.2.1, 3.2.3"
    ),
    slide(
      "Course completion and next steps",
      [
        "Complete quiz and attestation",
        "Complete role module if pending",
        "Acknowledge policy updates",
        "Annual refresher schedule",
      ],
      "Complete all assigned components by deadline. Training records will be maintained as compliance evidence and operational proof of readiness.",
      "All AT controls"
    ),
  ]
}

/** Ready-to-use attestation language (verbatim) */
const ATTESTATION_TEXT = `I acknowledge that I completed the organization's CMMC Level 2 Awareness and Training program, including security awareness content, role-based responsibilities applicable to my duties, and insider threat recognition/reporting guidance. I understand my obligation to follow organizational security policies and procedures, protect sensitive information, and promptly report suspicious activity, incidents, or potential insider threat indicators through approved channels.`

/** Quiz: 20 questions, 80% pass. Mix of awareness, role-based, insider threat. */
function buildQuizData() {
  return {
    passingScore: 80,
    allowRetry: true,
    showAnswersAfter: true,
    questions: [
      {
        text: "What does this training satisfy for CMMC Level 2?",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "This course is structured to satisfy AT.L2-3.2.1 (awareness), AT.L2-3.2.2 (role-based training), and AT.L2-3.2.3 (insider threat).",
        order: 1,
        choices: [
          { text: "AT.L2-3.2.1, 3.2.2, and 3.2.3 (Awareness, role-based training, insider threat)", isCorrect: true, order: 1 },
          { text: "Only incident response", isCorrect: false, order: 2 },
          { text: "Only technical controls", isCorrect: false, order: 3 },
          { text: "CMMC Level 1 only", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "When you receive MFA prompts you did not initiate, you should:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Unexpected MFA prompts can indicate someone is trying to use your credentials. Treat as suspicious and report immediately.",
        order: 2,
        choices: [
          { text: "Treat as suspicious and report immediately", isCorrect: true, order: 1 },
          { text: "Approve them to stop the prompts", isCorrect: false, order: 2 },
          { text: "Ignore them", isCorrect: false, order: 3 },
          { text: "Share your backup codes", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "FCI and CUI are interchangeable terms.",
        type: "TRUE_FALSE" as const,
        explanation: "Federal Contract Information (FCI) and Controlled Unclassified Information (CUI) are not interchangeable; CUI has stricter handling expectations.",
        order: 3,
        choices: [
          { text: "True", isCorrect: false, order: 1 },
          { text: "False", isCorrect: true, order: 2 },
        ],
      },
      {
        text: "What should you do when something feels off or suspicious?",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Fast reporting limits blast radius. Do not self-investigate in ways that destroy evidence.",
        order: 4,
        choices: [
          { text: "Report immediately through the designated channel", isCorrect: true, order: 1 },
          { text: "Wait to see if it happens again", isCorrect: false, order: 2 },
          { text: "Confront the person yourself", isCorrect: false, order: 3 },
          { text: "Delete suspicious emails and move on", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Your role in insider threat is to:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Personnel are responsible for detection and reporting through official channels, not private investigation.",
        order: 5,
        choices: [
          { text: "Detect and report through official channels; do not investigate solo", isCorrect: true, order: 1 },
          { text: "Conduct your own investigation first", isCorrect: false, order: 2 },
          { text: "Ignore indicators unless you have proof", isCorrect: false, order: 3 },
          { text: "Only report if you are sure it is malicious", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Privileged (admin) accounts should be used for daily email and browsing.",
        type: "TRUE_FALSE" as const,
        explanation: "Privileged credentials must not be used for daily user activity; they are high-value targets and must be protected.",
        order: 6,
        choices: [
          { text: "True", isCorrect: false, order: 1 },
          { text: "False", isCorrect: true, order: 2 },
        ],
      },
      {
        text: "Where may sensitive work data be stored or shared?",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Data must live in approved systems only. Personal apps and unmanaged storage are not allowed.",
        order: 7,
        choices: [
          { text: "Only in approved organizational systems and sanctioned channels", isCorrect: true, order: 1 },
          { text: "Personal email and cloud drives for convenience", isCorrect: false, order: 2 },
          { text: "USB drives for backup", isCorrect: false, order: 3 },
          { text: "Any tool that has a password", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Good-faith reporting of insider threat indicators is protected.",
        type: "TRUE_FALSE" as const,
        explanation: "Good-faith reporting is protected; anti-retaliation and confidential channels support this.",
        order: 8,
        choices: [
          { text: "True", isCorrect: true, order: 1 },
          { text: "False", isCorrect: false, order: 2 },
        ],
      },
      {
        text: "If a colleague forwards large volumes of work attachments to personal email late at night, you should:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Do not confront directly; preserve evidence context and notify security through the designated channel.",
        order: 9,
        choices: [
          { text: "Report through the designated security channel; do not confront directly", isCorrect: true, order: 1 },
          { text: "Confront the colleague first", isCorrect: false, order: 2 },
          { text: "Do nothing unless you have proof", isCorrect: false, order: 3 },
          { text: "Forward the same data to your personal email to compare", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Exception to security policy is allowed when:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Exceptions must go through the documented exception workflow with expiration and compensating controls.",
        order: 10,
        choices: [
          { text: "Documented exception process is used with expiry and compensating controls", isCorrect: true, order: 1 },
          { text: "It is more convenient for the team", isCorrect: false, order: 2 },
          { text: "A manager verbally approves it", isCorrect: false, order: 3 },
          { text: "You need to meet a deadline", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Developers should never hardcode secrets (passwords, API keys) in source code.",
        type: "TRUE_FALSE" as const,
        explanation: "Secrets must be handled through secure mechanisms; hardcoding creates serious risk.",
        order: 11,
        choices: [
          { text: "True", isCorrect: true, order: 1 },
          { text: "False", isCorrect: false, order: 2 },
        ],
      },
      {
        text: "Assessors look for which of the following as evidence of training?",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Assessors verify trained people, role-appropriate training, insider threat content, and objective evidence (rosters, materials, completion records).",
        order: 12,
        choices: [
          { text: "Rosters, training materials, completion records, and role-appropriate content", isCorrect: true, order: 1 },
          { text: "Only a policy document", isCorrect: false, order: 2 },
          { text: "Only technical controls", isCorrect: false, order: 3 },
          { text: "Verbal attestation only", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "One behavioral indicator alone is usually enough to confirm an insider threat.",
        type: "TRUE_FALSE" as const,
        explanation: "One indicator may be benign; clusters of indicators are riskier and should be reported.",
        order: 13,
        choices: [
          { text: "True", isCorrect: false, order: 1 },
          { text: "False", isCorrect: true, order: 2 },
        ],
      },
      {
        text: "When you receive an urgent request from an executive to transfer sensitive data quickly, you should:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Follow the established verification workflow; no shortcuts under urgency pressure.",
        order: 14,
        choices: [
          { text: "Follow the established verification workflow; do not skip steps for urgency", isCorrect: true, order: 1 },
          { text: "Comply immediately to avoid delaying the executive", isCorrect: false, order: 2 },
          { text: "Transfer to personal email first for speed", isCorrect: false, order: 3 },
          { text: "Ignore the request", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "To pass this course you must:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Completion requires 80% on the quiz, required role modules, and signed attestation.",
        order: 15,
        choices: [
          { text: "Pass the quiz at 80% or higher, complete required role modules, and sign the attestation", isCorrect: true, order: 1 },
          { text: "Only view the slides", isCorrect: false, order: 2 },
          { text: "Only sign the attestation", isCorrect: false, order: 3 },
          { text: "Pass the quiz at 50%", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Managers should challenge policy exceptions and escalate concerning behavior quickly.",
        type: "TRUE_FALSE" as const,
        explanation: "Managers are risk multipliers; tone at the top and timely escalation are controls.",
        order: 16,
        choices: [
          { text: "True", isCorrect: true, order: 1 },
          { text: "False", isCorrect: false, order: 2 },
        ],
      },
      {
        text: "Guest and limited-access users still need:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Even minimal access can create impact; guests need role-appropriate security instructions and reporting procedures.",
        order: 17,
        choices: [
          { text: "Role-appropriate security instructions and reporting procedures", isCorrect: true, order: 1 },
          { text: "No training", isCorrect: false, order: 2 },
          { text: "Full admin training", isCorrect: false, order: 3 },
          { text: "Only a password", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "During an incident, you should preserve context and notify security rather than self-investigating in ways that could destroy evidence.",
        type: "TRUE_FALSE" as const,
        explanation: "Preserving evidence and notifying the security channel is correct; self-investigation can destroy evidence.",
        order: 18,
        choices: [
          { text: "True", isCorrect: true, order: 1 },
          { text: "False", isCorrect: false, order: 2 },
        ],
      },
      {
        text: "Security culture should reward:",
        type: "MULTIPLE_CHOICE" as const,
        explanation: "Early escalation and honest reporting improve response; silence is risk.",
        order: 19,
        choices: [
          { text: "Early escalation and honest reporting", isCorrect: true, order: 1 },
          { text: "Keeping issues quiet to avoid blame", isCorrect: false, order: 2 },
          { text: "Only reporting when proof is certain", isCorrect: false, order: 3 },
          { text: "Bypassing channels for speed", isCorrect: false, order: 4 },
        ],
      },
      {
        text: "Training records are maintained as compliance evidence and proof of readiness.",
        type: "TRUE_FALSE" as const,
        explanation: "Completion records, attestations, and role mapping are retained for assessors and operational readiness.",
        order: 20,
        choices: [
          { text: "True", isCorrect: true, order: 1 },
          { text: "False", isCorrect: false, order: 2 },
        ],
      },
    ],
  }
}

/** Quiz data shape used by seed (accepts both buildQuizData and parsed markdown; explanation may be null). */
type CmmcQuizData = {
  passingScore: number
  allowRetry: boolean
  showAnswersAfter: boolean
  questions: Array<{
    text: string
    type: string
    explanation: string | null
    order: number
    choices: Array<{ text: string; isCorrect: boolean; order: number }>
  }>
}

export async function seedCmmcAt(prisma: PrismaClient, orgId: string) {
  const slidesData = buildSlides()
  let quizData: CmmcQuizData
  try {
    quizData = loadCmmcQuizFromMarkdown()
  } catch {
    quizData = buildQuizData()
  }

  // 1) Slide deck (40 slides) — appears in Trainer → Content → Public → Slide decks with other modules
  const slideDeckContent = await prisma.contentItem.create({
    data: {
      orgId,
      type: ContentType.SLIDE_DECK,
      title: CMMC_COURSE_TITLE,
      description:
        "Single course covering AT.L2-3.2.1 (security awareness), AT.L2-3.2.2 (role-based training), and AT.L2-3.2.3 (insider threat). 90–120 min. Production-ready with instructor notes and control mapping.",
    },
  })

  const slideDeck = await prisma.slideDeck.create({
    data: { contentItemId: slideDeckContent.id },
  })

  await prisma.slide.createMany({
    data: slidesData.map((s, i) => ({
      slideDeckId: slideDeck.id,
      title: s.title,
      content: s.content,
      order: i + 1,
    })),
  })

  console.log("Created CMMC AT slide deck (40 slides)")

  // 2) Quiz (20 questions, 80% pass) — content from CMMC Level 2 Security Awareness Training Quiz.md when present
  const quizContent = await prisma.contentItem.create({
    data: {
      orgId,
      type: ContentType.QUIZ,
      title: "CMMC Level 2 Security Awareness Training Quiz",
      description: "20 questions. 80% required to pass. Covers AT.L2-3.2.1, AT.L2-3.2.2, and AT.L2-3.2.3 (awareness, role-based duties, insider threat).",
    },
  })

  const quiz = await prisma.quiz.create({
    data: {
      contentItemId: quizContent.id,
      passingScore: quizData.passingScore,
      allowRetry: quizData.allowRetry,
      showAnswersAfter: quizData.showAnswersAfter,
    },
  })

  for (const q of quizData.questions) {
    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        text: q.text,
        type: q.type,
        explanation: q.explanation ?? null,
        order: q.order,
      },
    })
    await prisma.choice.createMany({
      data: q.choices.map((c, i) => ({
        questionId: question.id,
        text: c.text,
        isCorrect: c.isCorrect,
        order: i + 1,
      })),
    })
  }

  console.log("Created CMMC AT quiz (20 questions, 80% pass)")

  // 3) Attestation
  const attestationContent = await prisma.contentItem.create({
    data: {
      orgId,
      type: ContentType.ATTESTATION,
      title: "CMMC Level 2 Security Obligations Attestation",
      description: "Formal acknowledgment of training completion and security obligations. Versioned and retained as evidence.",
    },
  })

  await prisma.attestationTemplate.create({
    data: {
      contentItemId: attestationContent.id,
      text: ATTESTATION_TEXT,
      requireTypedName: true,
    },
  })

  console.log("Created CMMC AT attestation")

  // 4) Curriculum: one course — Slide deck → Quiz → Attestation
  const curriculum = await prisma.curriculum.create({
    data: {
      orgId,
      title: CMMC_COURSE_TITLE,
      description:
        "Core awareness (all personnel), role-based training (AT.L2-3.2.2), insider threat (AT.L2-3.2.3), knowledge check (80%), and attestation. Assessor-defensible; 90–120 min.",
      sections: {
        create: [
          {
            title: "Awareness, role-based, and insider threat training",
            description: "40-slide deck: core awareness, role matrix, insider threat, policy integration, knowledge check overview",
            order: 0,
            items: {
              create: [{ contentItemId: slideDeckContent.id, required: true, order: 0 }],
            },
          },
          {
            title: "Knowledge check",
            description: "20 questions; 80% pass required. Remediation if below threshold.",
            order: 1,
            items: {
              create: [{ contentItemId: quizContent.id, required: true, order: 0 }],
            },
          },
          {
            title: "Attestation",
            description: "Sign security obligations acknowledgment. Retained as evidence.",
            order: 2,
            items: {
              create: [{ contentItemId: attestationContent.id, required: true, order: 0 }],
            },
          },
        ],
      },
    },
  })

  console.log("Created CMMC AT curriculum")

  // 5) Certificate template
  await prisma.certificateTemplate.create({
    data: {
      orgId,
      curriculumId: curriculum.id,
      name: "CMMC Level 2 Security Awareness & Training — Certificate of Completion",
      htmlTemplateRichText: `
        <div style="text-align: center; padding: 60px; border: 8px solid #0F2438; max-width: 800px; margin: 0 auto; font-family: 'Times New Roman', serif;">
          <h1 style="font-size: 48px; margin-bottom: 20px; color: #0F2438;">Certificate of Completion</h1>
          <p style="font-size: 24px; margin-bottom: 40px; color: #475569;">This is to certify that</p>
          <h2 style="font-size: 36px; margin-bottom: 40px; color: #1e293b; font-weight: bold;">{{userName}}</h2>
          <p style="font-size: 20px; margin-bottom: 40px; color: #475569;">has successfully completed</p>
          <h3 style="font-size: 28px; margin-bottom: 20px; color: #0F2438;">CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training</h3>
          <p style="font-size: 16px; margin-bottom: 20px; color: #64748b;">AT.L2-3.2.1 / AT.L2-3.2.2 / AT.L2-3.2.3</p>
          <p style="font-size: 18px; margin-top: 60px; color: #64748b;">Issued on {{issuedDate}}</p>
          <p style="font-size: 14px; margin-top: 40px; color: #94a3b8;">Certificate Number: {{certificateNumber}}</p>
        </div>
      `,
    },
  })

  console.log("Created CMMC AT certificate template")

  return {
    slideDeckContentId: slideDeckContent.id,
    quizContentId: quizContent.id,
    attestationContentId: attestationContent.id,
    curriculumId: curriculum.id,
  }
}
