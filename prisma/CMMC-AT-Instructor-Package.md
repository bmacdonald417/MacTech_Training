# CMMC Level 2 AT Course — Instructor Package

**Course:** CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training (AT.L2-3.2.1/3.2.2/3.2.3)  
**Delivery:** 90–120 minutes | Live, virtual, or self-paced LMS + Q&A  
**Source:** `prisma/seed-cmmc-at.ts` (seed); curriculum created in LMS for org.

---

## Evidence artifacts checklist (critical for assessors)

Store and retain the following for assessment and audits:

| Artifact | Where / How |
|----------|-------------|
| Course outline + slide deck versions | Export from LMS (content version/date); slide deck = 40 slides |
| Instructor notes version/date | Embedded on each slide under **Instructor notes:** in the course content |
| Attendance / completion exports | LMS completion records by user, date, curriculum |
| Quiz bank + learner scores | LMS quiz (20 questions, 80% pass); retain attempt and score records |
| Attestation records | LMS attestation signings: user, typed name, date, IP if captured |
| Role mapping matrix | Document which roles get which modules (Standard, Manager, IT/Admin, Developer, Business Ops, Guest) |
| Retraining records | Event-driven and annual refresher completion evidence |
| Policy version crosswalk | Map training content to Acceptable Use, Access Control, Incident Response, Data Handling/CUI policy versions |

---

## Ready-to-use attestation language (verbatim)

Use this exact text for the course attestation (already seeded in the course):

> I acknowledge that I completed the organization's CMMC Level 2 Awareness and Training program, including security awareness content, role-based responsibilities applicable to my duties, and insider threat recognition/reporting guidance. I understand my obligation to follow organizational security policies and procedures, protect sensitive information, and promptly report suspicious activity, incidents, or potential insider threat indicators through approved channels.

Attestation must be **versioned** and **retained** as assessment evidence. Require typed name and date; capture IP if available.

---

## Role-based breakout decks (for AT.L2-3.2.2)

Build or link **5 mini-decks** (15–25 min each) and assign by role:

1. **Manager** — Accountability, approvals, exception discipline, behavior risk signals, escalation.
2. **IT/Admin** — Privileged access, hardening, monitoring, change control, logging.
3. **Developer** — Secure SDLC, secrets, dependencies, code review, CI/CD safeguards.
4. **Business Ops (HR/Finance/Contracts)** — Invoice/payment fraud red flags, sensitive artifacts, vendor validation.
5. **Guest/External user** — Minimal access, upload constraints, prohibited behaviors, reporting path.

Each mini-deck should include:

- 3 role-specific threat scenarios  
- 5 role-specific “must-do” controls  
- 10-question role quiz  

The main course slide deck already includes **role matrix overview** and **role-specific slides** (Manager, IT/Admin, Developer, Contracts/HR/Finance, Guest). Use these as the core; extend with breakout decks if you need deeper role-only sessions.

---

## Scenario bank (for realism + retention)

Build **12 scenarios** in total:

- **4** phishing/BEC (email, links, urgency, payment redirection)  
- **3** privileged misuse (access outside scope, log anomalies, break-glass abuse)  
- **3** data handling mistakes (wrong storage, sharing, export to personal)  
- **2** insider behavior cluster cases (multiple indicators; report, don’t investigate)  

The main course includes **3 scenario exercises** (email exfiltration, privileged misuse, CEO-urgency social engineering). Use the scenario bank for live discussion or additional quiz/lab items.

---

## Cadence (assessor-defensible)

- **Onboarding:** Before access where feasible.  
- **Annual refresher:** Every 12 months maximum.  
- **Event-driven retraining:** Policy change, incident trend, role change.  

Track and retain completion dates and assignment logic (e.g., by group/role) for evidence.

---

## Control mapping (NIST SP 800-171 Rev. 2)

| Practice | Description |
|----------|-------------|
| **3.2.1** | Security awareness (risks, policies, procedures) — core slides + quiz + attestation |
| **3.2.2** | Role-based training for assigned security duties — role matrix + role slides + role quiz |
| **3.2.3** | Insider threat recognition and reporting — insider threat slides + scenarios + reporting contacts |

Each slide in the seeded deck includes a **Control mapping** line at the bottom for traceability.
