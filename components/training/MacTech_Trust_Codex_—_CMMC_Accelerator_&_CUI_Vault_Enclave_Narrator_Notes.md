# Narrator Notes — MacTech_Trust_Codex_—_CMMC_Accelerator_&_CUI_Vault_Enclave

Generated narrator script for each slide. Use as speaker notes or for TTS.

---

## Slide 1: MACTECH

*Source: speaker notes from PPTX*

Welcome, everyone. Today we're introducing MacTech's Trust Codex — our CMMC Accelerator and CUI Vault Enclave solution. If you're a government contractor, especially a small business, you know that CMMC 2.0 Level 2 compliance isn't optional anymore — it's the price of entry for federal and DoD contracts. What we've built is a turnkey system that gets you from zero to fully aligned with all 110 NIST 800-171 controls in under one week. This isn't theory or consulting — it's a delivered, evidence-ready CUI environment that you can step into immediately. Let's walk through what this is, why you need it, and how we make it simple, contained, and seamless.

---

## Slide 2: The Challenge

*Source: speaker notes from PPTX*

Let's start with why this matters. If you handle Controlled Unclassified Information — or CUI — for any federal or Department of Defense contract, you're now required to meet CMMC 2.0 Level 2. That means implementing all 110 security controls from NIST 800-171 and proving it to a certified third-party assessor, called a C3PAO. No compliance means you're not eligible to bid or continue on contracts. And here's the kicker: small businesses face the exact same requirements as the big defense contractors. You can't skip it, and you can't fake it. The assessor needs clear boundaries, reproducible evidence, and a coherent story about how you protect CUI. That's the challenge we're solving.

---

## Slide 3: The Problem

*Source: speaker notes from PPTX*

The biggest mistake contractors make is letting CUI spread across their entire IT environment — laptops, file shares, email, cloud storage, you name it. When CUI is everywhere, your assessment scope becomes everything. That means every device, every server, every network segment has to meet all 110 controls. Evidence collection turns into a scavenger hunt. Auditors can't draw a clear boundary, so they have to assume the worst. Remediation drags on for months, and even then, you might fail the assessment. And while you're scrambling to get compliant, you're losing contract opportunities. The problem isn't just technical — it's architectural. You need a clear boundary, and most organizations don't have one.

---

## Slide 4: The Solution

*Source: speaker notes from PPTX*

Our solution is simple: create one vault — a single, contained environment — where all CUI is stored and worked on. Think of it as a secure room in the cloud. No CUI lives on everyday laptops or file shares. Staff access the vault only by connecting through a VPN and remote desktop to a dedicated virtual machine. That's the whole scope. One system. When the auditor asks, "Where's your CUI?" you point to the vault. When they ask, "How do you protect it?" you show them the controls built into the vault. When they ask for evidence, you hand them the index. The vault is the scope — nothing more, nothing less. That's the architectural foundation that makes everything else possible.

---

## Slide 5: The Strategy

*Source: speaker notes from PPTX*

The vault isn't just infrastructure — it's backed by the Trust Codex. The Codex is a comprehensive manual that maps every one of the 110 NIST 800-171 requirements to how the enclave satisfies them and where the evidence lives. It's not a generic compliance guide — it's specific to your vault. For example, control AC-2 requires account management. The Codex documents how accounts are created in the vault, where the logs are stored, what the policy says, and how to demonstrate it to an auditor. Every control gets the same treatment. We also include pre-built governance — policies, procedures, templates, and runbooks — so evidence collection and validation are repeatable, not ad hoc. The Codex turns your vault into an evidence-ready, auditor-friendly CUI environment from day one.

---

## Slide 6: Why a Vault? Speed and Confidence

*Source: speaker notes from PPTX*

Without a purpose-built approach, CMMC compliance can take months — and even then, there's no guarantee you'll pass. With the CUI Vault Enclave and Trust Codex accelerator, we're talking about full CMMC 2.0 Level 2 alignment in under one week for small businesses. How? Because the architecture is pre-built, the hardening is already done, and the governance is bundled and ready to deploy. There's no guesswork. Every control is already mapped. Every piece of evidence is indexed. You're not starting from zero — you're stepping into a structure that's already built for the 110 controls. You walk into your C3PAO assessment with confidence, knowing your vault is ready. This is speed without shortcuts.

---

## Slide 7: How We Make It Simple

*Source: speaker notes from PPTX*

Let's talk about how we make this simple. First, one boundary: the enclave is the scope. You're not trying to secure your entire IT environment — just the vault. Second, one control set: the 110 NIST 800-171 controls are already mapped in the Trust Codex. You don't have to interpret the requirements or figure out how to apply them — we've done that work. Third, pre-built governance: policies, procedures, and templates are included. And fourth, a runbook so evidence collection and validation are repeatable. You're not scrambling at the last minute trying to find logs or screenshots. Everything is documented, indexed, and ready. That's what we mean by simple.

---

## Slide 8: How We Make It Contained

*Source: speaker notes from PPTX*

Containment is critical. The vault is a hardened virtual machine — typically Windows Server running in Azure or another secure cloud. There's no public RDP access. Staff connect only through a VPN and then remote desktop into the vault. Identity and multi-factor authentication are enforced using something like Microsoft Entra ID. We disable USB redirection, clipboard sharing, and removable media. CUI stays inside the vault — no leakage, no exceptions. This isn't just best practice — it's how we satisfy controls around access control, boundary protection, and data-at-rest encryption. Containment is what makes the vault auditable. The auditor can see exactly where CUI lives and exactly how it's protected.

---

## Slide 9: How We Make It Delivered Seamlessly

*Source: speaker notes from PPTX*

Here's where it all comes together. MacTech delivers the Trust Codex plus the VM deployment. That includes the architecture, the hardening, the governance bundle, the evidence index, and automation — like evidence collection and validation scripts. You get a turnkey CUI enclave and the playbook to keep it compliant and assessment-ready. Small businesses don't have to build this from zero. You don't need a compliance team or a security architect on staff. You step into a structure that's already built for the 110 controls. We hand you the keys, the manual, and the runbook. That's what we mean by delivered seamlessly.

---

## Slide 10: What You Get

*Source: speaker notes from PPTX*

Let's break down what's included in the delivery. First, the CUI Vault Enclave itself — a hardened virtual machine, fully configured and deployed. Second, the Trust Codex manual, which maps all 110 controls to your vault. Third, the governance bundle: policies, procedures, templates, and runbooks. Fourth, an evidence index that tells you exactly where every piece of evidence lives — logs, configs, screenshots, policy documents. Fifth, automation scripts for evidence collection and validation, so you're not doing this manually. And sixth, ongoing support for maintenance, updates, and assessment prep. This isn't a one-time delivery — it's a partnership. We make sure you stay compliant and assessment-ready.

---

## Slide 11: Who This Is For

*Source: speaker notes from PPTX*

Who is this for? Government contractors — especially small businesses — who handle CUI and need to meet CMMC 2.0 Level 2. If you don't have a large IT team or a dedicated compliance staff, this is for you. If you're facing your first CMMC assessment and don't know where to start, this is for you. If you need to get compliant fast without cutting corners, this is for you. And if you want a clear, auditable, evidence-ready CUI environment that you can explain to an assessor in five minutes, this is definitely for you. We built this for the contractors who are doing the work but don't have the resources to build a compliance program from scratch. Now, let's talk about why MacTech is the right partner for this.

---

## Slide 12: Why MacTech?

*Source: speaker notes from PPTX*

Why MacTech? First, we have deep expertise in CMMC 2.0, NIST 800-171, and federal compliance. We know what assessors look for because we've been through it. Second, this is a pre-built, tested architecture — not custom consulting. You're not paying us to figure it out as we go. Third, turnkey delivery. You get a working vault, not a plan. Fourth, it's evidence-ready from day one. You can hand the Codex to your C3PAO and they'll understand exactly what you've built. And fifth, this is a proven approach. It's designed for small businesses and validated by assessors. We've done the hard work so you don't have to. So, how do you get started?

---

## Slide 13: Getting Started

*Source: speaker notes from PPTX*

So what's the path forward? Three simple steps. First, engage. We start with an initial consultation to understand your CUI environment, your contract requirements, and your timeline. Second, deploy. MacTech delivers and configures your CUI Vault Enclave and Trust Codex. This includes the VM, the governance bundle, the evidence index, and the runbook. Third, assess. You walk into your C3PAO assessment with confidence, knowing you have a clear boundary, documented controls, and reproducible evidence. The timeline? Under one week for small businesses. That's from engagement to deployment to assessment-ready. We move fast because the architecture is already built. Now, let's talk about the urgency of this.

---

## Slide 14: Call to Action

*Source: speaker notes from PPTX*

Here's the bottom line: CMMC 2.0 Level 2 is required, not optional. If you're handling CUI, you need to be compliant or you'll lose contract eligibility. Scattered CUI and ad hoc compliance will fail the assessment. The CUI Vault Enclave and Trust Codex get you compliant fast — with a clear boundary, documented controls, and reproducible evidence. Don't let compliance block your contracts. Contact MacTech today to start your CMMC accelerator engagement. We'll get you assessment-ready in under one week. Let's make compliance simple, contained, and seamless. Here's how to reach us.

---

## Slide 15: MACTECH

*Source: speaker notes from PPTX*

Thank you for your time. If you have questions or want to get started, here's how to reach us. Visit our website, send us an email, or give us a call. We're here to help you get CMMC 2.0 Level 2 compliant and assessment-ready. Remember: simple, contained, delivered seamlessly. That's the MacTech Trust Codex. Let's get you compliant and back to winning contracts. Thank you.

---
