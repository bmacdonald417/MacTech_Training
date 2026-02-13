# The C3PAO Interrogation Guide by MacTech

![MacTech Logo](mactech_logo.png)


## Empowering Your CMMC 2.0 Level 2 Journey

Navigating the complexities of CMMC 2.0 Level 2 compliance can be daunting for Defense Industrial Base (DIB) contractors. This guide, brought to you by MacTech, is designed to demystify the assessment process by providing an insider's look at what Certified Third-Party Assessment Organizations (C3PAOs) will be looking for during your CMMC Level 2 audit.

Based on the 14 domains and 110 practices of NIST SP 800-171 Rev 2, this comprehensive resource outlines the specific evidence required across the three assessment methods: **Interview**, **Examine**, and **Test**. Our goal is to equip you with the knowledge to prepare effectively, understand auditor expectations, and ultimately achieve your CMMC certification.

### The MacTech Advantage: Automating the Heavy Lifting

While this guide provides the roadmap, the real challenge lies in implementing the controls and meticulously gathering the evidence. This is where the **MacTech Codex Accelerator** comes in. Our innovative solution, including the Azure VM CUI Boundary Enclave and a suite of AI-powered companion tools, automates the configuration, continuous monitoring, and evidence provisioning for CMMC 2.0 Level 2. The Codex is engineered to transform your compliance journey from a manual, time-consuming burden into an efficient, audit-ready process. Learn more about how the Codex can get you to certification faster and with higher confidence at [MacTech Website/Codex-Accelerator].

## General Documentation and Evidence Requirements

Before diving into individual domains, C3PAOs will typically request the following high-level documentation from the Organization Seeking Certification (OSC). The **MacTech Codex Accelerator** streamlines the generation and management of many of these critical documents, ensuring they are always audit-ready and aligned with your system's actual configuration:

-   **System Security Plan (SSP)**: The primary document describing the system boundary, how security requirements are met, and any planned implementations. *The Codex Accelerator's SSP-GPT Engine can draft and maintain this document based on your enclave's telemetry.*
-   **Plan of Action and Milestones (POA&M)**: A document that tracks and manages the remediation of identified security weaknesses. *The Codex Accelerator helps track and report on POA&M items by continuously monitoring your environment.*
-   **Network and Data Flow Diagrams**: Visual representations of the network architecture and how Controlled Unclassified Information (CUI) flows through the system. *The Codex Accelerator's CUI Flow Mapper automatically generates and updates these critical visualizations.*
-   **Asset Inventory**: A comprehensive list of all hardware and software assets within the CMMC scope. *The Codex Accelerator integrates with Azure asset management to provide an up-to-date inventory.*
-   **Information Security Policies and Procedures**: The complete set of organizational policies and procedures governing information security. *The Codex Accelerator's Policy & Procedure Generator can help tailor these documents to your organization.*
-   **Risk Assessment Report**: The most recent risk assessment, including identified risks and mitigation strategies.
-   **Incident Response Plan**: The plan for responding to security incidents.
-   **Configuration Management Plan**: The plan for managing and controlling system configurations.
-   **Security Awareness and Training Records**: Evidence of security training for all personnel.
-   **Previous Assessment Reports**: Any previous self-assessments or third-party assessments.


## Domain 1: Access Control (AC)

### AC.L2-3.1.1: Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems).

*   **Interview**: Assessors will interview system administrators to understand how user access is provisioned, managed, and de-provisioned. They will also interview a sample of users to confirm they only have access to the resources necessary for their roles.
*   **Examine**: Assessors will examine access control policies and procedures, user account creation and modification records, and system audit logs for unauthorized access attempts.
*   **Test**: Assessors will attempt to access resources with an unauthorized account and attempt to escalate privileges with a standard user account. They will also verify that the Azure inheritance/shared responsibility artifact is present with a boundary statement.
    *   **How the Codex Accelerator Helps**: Our solution automates the configuration of Azure Active Directory and Role-Based Access Control (RBAC) to enforce least privilege. The **Evidence Auto-Pilot** automatically collects user access reports and audit logs, streamlining the examination process.

### AC.L2-3.1.2: Limit information system access to the types of transactions and functions that authorized users are permitted to execute.

*   **Interview**: Assessors will interview system administrators to understand how access to transactions and functions is managed based on roles and responsibilities.
*   **Examine**: Assessors will examine access control policies and procedures that define authorized transactions for different user roles, and system configurations that enforce RBAC.
*   **Test**: Assessors will attempt to perform a function or transaction not authorized for a specific user role.
    *   **How the Codex Accelerator Helps**: The Codex configures granular access controls within your Azure environment, ensuring users can only execute authorized transactions. Our **Policy & Procedure Generator** helps you articulate these controls clearly.

### AC.L2-3.1.3: Control the flow of CUI in accordance with approved authorizations.

*   **Interview**: Assessors will interview system administrators and data owners to understand how CUI flow is controlled and monitored.
*   **Examine**: Assessors will examine data flow diagrams for CUI, firewall and router configurations that control data flow, and Data Loss Prevention (DLP) tool configurations and logs.
*   **Test**: Assessors will attempt to exfiltrate CUI to an unauthorized location. They will also verify that RDP redirection (clipboard and drive) is disabled and Network Level Authentication (NLA) is enabled for remote desktop sessions.
    *   **How the Codex Accelerator Helps**: The **CUI Flow Mapper** automatically visualizes and documents CUI movement, while the **Continuous Drift Guard** monitors critical configurations like NLA to prevent deviations from your compliant baseline.

### AC.L2-3.1.4: Separate the duties of individuals to reduce the risk of malevolent activity without collusion.

*   **Interview**: Assessors will interview managers and system owners to understand how separation of duties is implemented for critical functions.
*   **Examine**: Assessors will examine policies and procedures defining roles and responsibilities to ensure separation of duties, and system configurations that enforce separation of duties.
*   **Test**: Assessors will attempt to perform conflicting duties with a single user account.
    *   **How the Codex Accelerator Helps**: Our solution helps define and enforce roles within Azure, and the **Policy & Procedure Generator** assists in documenting your separation of duties policies.

### AC.L2-3.1.5: Employ the principle of least privilege, including for specific security functions and privileged accounts.

*   **Interview**: Assessors will interview system administrators to understand how the principle of least privilege is enforced for user and privileged accounts.
*   **Examine**: Assessors will examine access control policies and procedures, and user and privileged account configurations to verify that only necessary privileges are granted.
*   **Test**: Assessors will attempt to access resources or perform functions beyond the defined privileges of a user account. They will also verify that User Account Control (UAC) prompts are enabled for administrators.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure RBAC and Just-in-Time (JIT) access for privileged accounts, enforcing least privilege. The **Evidence Auto-Pilot** collects configuration evidence for UAC and other privilege controls.

### AC.L2-3.1.6: Use non-privileged accounts or roles when accessing nonsecurity functions.

*   **Interview**: Assessors will interview privileged users to confirm they use non-privileged accounts for daily tasks.
*   **Examine**: Assessors will examine audit logs to verify that privileged accounts are only used for security functions.
*   **Test**: Assessors will observe a privileged user performing daily tasks to ensure they are using a non-privileged account.
    *   **How the Codex Accelerator Helps**: The Codex enforces policies that restrict privileged account usage to security functions, and the **Evidence Auto-Pilot** gathers audit logs to demonstrate compliance.

### AC.L2-3.1.7: Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.

*   **Interview**: Assessors will interview system administrators to understand how non-privileged users are prevented from executing privileged functions.
*   **Examine**: Assessors will examine system configurations that restrict access to privileged functions, and audit logs to verify that the execution of privileged functions is captured.
*   **Test**: Assessors will attempt to execute a privileged function with a non-privileged account.
    *   **How the Codex Accelerator Helps**: Our solution configures system-level restrictions and audit policies to prevent unauthorized execution of privileged functions, with **Evidence Auto-Pilot** capturing the necessary logs.

### AC.L2-3.1.8: Limit unsuccessful logon attempts.

*   **Interview**: Assessors will interview system administrators to understand the policy on unsuccessful logon attempts.
*   **Examine**: Assessors will examine account lockout policies and configurations.
*   **Test**: Assessors will attempt to log on with incorrect credentials multiple times to trigger the account lockout mechanism. They will also verify that the account lockout threshold is set to a finite number.
    *   **How the Codex Accelerator Helps**: The Codex automates the configuration of account lockout policies within Azure Active Directory, and the **Continuous Drift Guard** ensures these settings remain compliant.

### AC.L2-3.1.9: Provide privacy and security notices consistent with applicable CUI rules.

*   **Interview**: Assessors will interview system administrators to understand how privacy and security notices are displayed to users.
*   **Examine**: Assessors will examine the content of privacy and security notices.
*   **Test**: Assessors will log on to the system to verify that the privacy and security notice is displayed. They will also verify that the interactive logon notice is configured (caption + text present).
    *   **How the Codex Accelerator Helps**: The Codex assists in deploying and verifying the presence of required privacy and security notices across your Azure environment.

### AC.L2-3.1.10: Protect the confidentiality and integrity of CUI at rest.

*   **Interview**: Assessors will interview system administrators to understand how CUI at rest is protected.
*   **Examine**: Assessors will examine policies and procedures for protecting CUI at rest, and system configurations for encryption of CUI at rest.
*   **Test**: Assessors will verify that session lock is configured (secure screen saver enabled with timeout).
    *   **How the Codex Accelerator Helps**: The Codex ensures that CUI at rest within the Azure enclave is encrypted and that session lock mechanisms are properly configured and enforced.

### AC.L2-3.1.11: Terminate a user session after a defined condition.

*   **Interview**: Assessors will interview system administrators to understand the session termination policy.
*   **Examine**: Assessors will examine system configurations for session timeout.
*   **Test**: Assessors will leave a session idle to verify that it terminates after the defined period. They will also verify that the machine inactivity limit is configured (InactivityTimeoutSecs > 0).
    *   **How the Codex Accelerator Helps**: The Codex automates the configuration of session termination policies and inactivity limits across your Azure resources, and the **Continuous Drift Guard** ensures these settings are maintained.

### AC.L2-3.1.12: Control and monitor remote access sessions.

*   **Interview**: Assessors will interview system administrators to understand how remote access is controlled and monitored.
*   **Examine**: Assessors will examine remote access policies and procedures, and remote access logs.
*   **Test**: Assessors will initiate a remote access session and verify that it is logged and monitored. They will also verify that WinRM is disabled.
    *   **How the Codex Accelerator Helps**: The Codex configures secure remote access solutions within Azure, integrates with Azure Monitor for logging, and the **Continuous Drift Guard** verifies critical service statuses like WinRM.

### AC.L2-3.1.13: Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.

*   **Interview**: Assessors will interview system administrators to understand how remote access sessions are encrypted.
*   **Examine**: Assessors will examine VPN or other remote access solution configurations.
*   **Test**: Assessors will use a network sniffer to verify that remote access traffic is encrypted.
    *   **How the Codex Accelerator Helps**: The Codex deploys and configures FIPS-validated cryptographic solutions for remote access, ensuring confidentiality.

### AC.L2-3.1.14: Route remote access via managed access control points.

*   **Interview**: Assessors will interview network administrators to understand how remote access traffic is routed.
*   **Examine**: Assessors will examine network diagrams and firewall configurations.
*   **Test**: Assessors will attempt to establish a remote access session that bypasses the managed access control point.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure networking and firewall rules to enforce routing of remote access through managed control points, and the **CUI Flow Mapper** visualizes these routes.

### AC.L2-3.1.15: Authorize remote execution of privileged commands and remote access to security-relevant information.

*   **Interview**: Assessors will interview system administrators to understand the process for authorizing remote privileged access.
*   **Examine**: Assessors will examine remote access policies and procedures for privileged access, and records of authorized remote privileged access.
*   **Test**: Assessors will attempt to execute a privileged command remotely without authorization.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure PIM (Privileged Identity Management) and automates the logging and auditing of privileged command execution, with **Evidence Auto-Pilot** collecting the necessary records.

### AC.L2-3.1.16: Authorize and control wireless access to the information system.

*   **Interview**: Assessors will interview network administrators to understand how wireless access is authorized and controlled.
*   **Examine**: Assessors will examine wireless access policies and procedures, and wireless access point configurations.
*   **Test**: Assessors will attempt to connect to the wireless network with an unauthorized device.
    *   **How the Codex Accelerator Helps**: While the Codex focuses on the Azure enclave, it provides guidance and integrates with on-premise solutions to ensure wireless access controls are aligned with CMMC requirements.

### AC.L2-3.1.17: Protect wireless access using authentication and encryption.

*   **Interview**: Assessors will interview network administrators to understand how wireless access is protected.
*   **Examine**: Assessors will examine wireless access point configurations for authentication and encryption settings (e.g., WPA2/3).
*   **Test**: Assessors will use a wireless network analyzer to verify that wireless traffic is encrypted.
    *   **How the Codex Accelerator Helps**: The Codex provides best practices and configuration templates for secure wireless access, ensuring strong authentication and encryption are in place.

### AC.L2-3.1.18: Control the connection of mobile devices.

*   **Interview**: Assessors will interview system administrators to understand the policy on connecting mobile devices.
*   **Examine**: Assessors will examine mobile device management (MDM) policies and configurations.
*   **Test**: Assessors will attempt to connect an unauthorized mobile device to the network.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Microsoft Intune and other MDM solutions to enforce mobile device connection policies and collect compliance reports.

### AC.L2-3.1.19: Encrypt CUI on mobile devices and mobile computing platforms.

*   **Interview**: Assessors will interview system administrators to understand how CUI is encrypted on mobile devices.
*   **Examine**: Assessors will examine MDM policies and configurations that enforce encryption on mobile devices.
*   **Test**: Assessors will verify that a mobile device containing CUI is encrypted.
    *   **How the Codex Accelerator Helps**: The Codex leverages Microsoft Intune to enforce encryption policies on mobile devices accessing CUI, and **Evidence Auto-Pilot** helps verify these configurations.

### AC.L2-3.1.20: Verify and control/limit connections to and use of external information systems.

*   **Interview**: Assessors will interview system administrators to understand the policy on connecting to external information systems.
*   **Examine**: Assessors will examine firewall and proxy configurations that control connections to external systems.
*   **Test**: Assessors will attempt to connect to an unauthorized external information system.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure network controls and proxies to manage and limit connections to external systems, with **Continuous Drift Guard** monitoring these critical settings.

### AC.L2-3.1.21: Limit use of portable storage devices on external information systems.

*   **Interview**: Assessors will interview system administrators to understand the policy on using portable storage devices on external systems.
*   **Examine**: Assessors will examine policies and technical controls that restrict the use of portable storage devices.
*   **Test**: Assessors will attempt to use a portable storage device on an external system in a way that violates policy.
    *   **How the Codex Accelerator Helps**: The Codex implements technical controls (e.g., via Group Policy or Intune) to restrict the use of portable storage devices, and **Evidence Auto-Pilot** collects configuration proof.

### AC.L2-3.1.22: Control CUI posted or processed on publicly accessible information systems.

*   **Interview**: Assessors will interview personnel responsible for managing public-facing websites to understand the process for reviewing and approving content.
*   **Examine**: Assessors will examine policies and procedures for posting information on publicly accessible systems.
*   **Test**: Assessors will review publicly accessible systems for any unauthorized CUI.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance and tools for secure content management and data loss prevention to prevent unauthorized CUI exposure on public systems.


## Domain 2: Awareness and Training (AT)

### AT.L2-3.2.1: Establish and maintain a security awareness program for all information system users.

*   **Interview**: Assessors will interview management and employees to understand the scope and frequency of security awareness training.
*   **Examine**: Assessors will examine security awareness program documentation, training materials, and records of employee completion.
*   **Test**: Assessors may quiz employees on basic security awareness topics.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance on integrating security awareness training platforms and helps track completion records, ensuring your program meets CMMC requirements.

### AT.L2-3.2.2: Provide security awareness training on recognizing and reporting potential indicators of insider threat.

*   **Interview**: Assessors will interview employees to confirm they have received training on insider threat indicators and reporting procedures.
*   **Examine**: Assessors will examine training materials specifically addressing insider threat and reporting mechanisms.
*   **Test**: Assessors may present scenarios to employees to gauge their understanding of insider threat reporting.
    *   **How the Codex Accelerator Helps**: The Codex can integrate with specialized insider threat training modules and help document your organization's reporting procedures.

### AT.L2-3.2.3: Provide role-based security training to information system users with assigned security roles and responsibilities.

*   **Interview**: Assessors will interview personnel with security roles to confirm they have received appropriate role-based training.
*   **Examine**: Assessors will examine role-based training materials and records of completion for personnel with security responsibilities.
*   **Test**: Assessors may test personnel on their understanding of their specific security responsibilities.
    *   **How the Codex Accelerator Helps**: The Codex helps identify personnel with security roles and provides a framework for documenting and tracking their specialized training.

## Domain 3: Audit and Accountability (AU)

### AU.L2-3.3.1: Create and retain information system audit records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful, unauthorized, or inappropriate information system activity.

*   **Interview**: Assessors will interview system administrators to understand audit logging configurations and retention policies.
*   **Examine**: Assessors will examine audit log configurations, log retention policies, and sample audit records. They will also verify security audit log, audit policy queryable, audit policy subcategories, and event log max sizes.
*   **Test**: Assessors will attempt to perform an unauthorized action and verify that it is captured in the audit logs.
    *   **How the Codex Accelerator Helps**: The Codex configures comprehensive audit logging within Azure, integrates with Azure Sentinel for analysis, and the **Evidence Auto-Pilot** automatically collects audit log configurations and samples for review.

### AU.L2-3.3.2: Ensure that the actions of individual information system users can be uniquely traced to those users.

*   **Interview**: Assessors will interview system administrators to understand how user actions are attributed.
*   **Examine**: Assessors will examine user authentication mechanisms and audit logs to verify unique user traceability.
*   **Test**: Assessors will review audit logs to confirm that individual user actions are uniquely identifiable.
    *   **How the Codex Accelerator Helps**: The Codex enforces strong authentication and logging mechanisms within Azure, ensuring all actions are uniquely attributable to individual users.

### AU.L2-3.3.3: Protect audit information and audit tools from unauthorized access, modification, and deletion.

*   **Interview**: Assessors will interview system administrators to understand how audit logs and tools are protected.
*   **Examine**: Assessors will examine access controls on audit logs and tools, and review audit trails of access to audit information.
*   **Test**: Assessors will attempt to access, modify, or delete audit information or tools without authorization.
    *   **How the Codex Accelerator Helps**: The Codex configures secure storage for audit logs within Azure, leveraging immutable storage and granular access controls to protect audit information.

### AU.L2-3.3.4: Review and update audit records regularly.

*   **Interview**: Assessors will interview personnel responsible for reviewing audit logs to understand the review process and frequency.
*   **Examine**: Assessors will examine audit log review procedures and records of audit log reviews.
*   **Test**: Assessors will request a demonstration of the audit log review process.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure Sentinel to provide automated alerts and dashboards for audit log review, streamlining the process and ensuring regular oversight.

### AU.L2-3.3.5: Alert designated organizational officials or roles in the event of an audit processing failure.

*   **Interview**: Assessors will interview system administrators to understand how audit processing failures are detected and reported.
*   **Examine**: Assessors will examine procedures for handling audit processing failures and records of such alerts.
*   **Test**: Assessors will simulate an audit processing failure and verify that alerts are generated and received by designated personnel.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure Monitor and Sentinel to detect and alert on audit processing failures, ensuring timely notification to relevant personnel.

### AU.L2-3.3.6: Provide audit record generation capability for information system components.

*   **Interview**: Assessors will interview system administrators to understand the audit record generation capabilities of various system components.
*   **Examine**: Assessors will examine system configurations to verify that audit record generation is enabled for all relevant components.
*   **Test**: Assessors will verify that audit records are generated by various system components.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all relevant Azure components within the enclave are configured to generate comprehensive audit records, which are then centralized for analysis.

### AU.L2-3.3.7: Synchronize information system clocks with an authoritative time source.

*   **Interview**: Assessors will interview system administrators to understand how system clocks are synchronized.
*   **Examine**: Assessors will examine time synchronization policies and procedures, and system configurations for time synchronization settings.
*   **Test**: Assessors will verify that time synchronization is configured (W32Time running; source not Local CMOS Clock).
    *   **How the Codex Accelerator Helps**: The Codex automates the configuration of time synchronization services within the Azure enclave, ensuring all systems maintain accurate time, which is critical for audit log integrity.

### AU.L2-3.3.8: Utilize a centralized log management system.

*   **Interview**: Assessors will interview system administrators to understand the centralized log management solution in use.
*   **Examine**: Assessors will examine the configuration of the centralized log management system and verify that logs from all relevant components are being collected.
*   **Test**: Assessors will request a demonstration of log search and analysis capabilities within the centralized system.
    *   **How the Codex Accelerator Helps**: The Codex leverages Azure Monitor and Azure Sentinel as a centralized log management solution, providing a single pane of glass for all audit data within the enclave.

### AU.L2-3.3.9: Collect audit records from all components within the information system boundary.

*   **Interview**: Assessors will interview system administrators to understand how audit records are collected from all system components.
*   **Examine**: Assessors will examine the configuration of log collection agents and verify that all components are sending logs to the centralized system.
*   **Test**: Assessors will verify that audit records from various system components are present in the centralized log management system.
    *   **How the Codex Accelerator Helps**: The Codex ensures comprehensive log collection from all Azure components within the CUI boundary, feeding them into Azure Sentinel for complete audit coverage.


## Domain 4: Configuration Management (CM)

### CM.L2-3.4.1: Establish and maintain baseline configurations and inventories of organizational information systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.

*   **Interview**: Assessors will interview system administrators to understand how baseline configurations are established, maintained, and managed.
*   **Examine**: Assessors will examine configuration management plans, baseline configuration documentation, and asset inventories. They will also verify evidence bundle selection and OS identification.
*   **Test**: Assessors will compare a sample of system configurations against documented baselines to identify any deviations.
    *   **How the Codex Accelerator Helps**: The Codex automates the establishment and maintenance of secure baseline configurations for your Azure VM CUI Boundary Enclave. Our **Evidence Auto-Pilot** automatically collects configuration details and asset inventories, ensuring they are always up-to-date and audit-ready.

### CM.L2-3.4.2: Establish and enforce security configuration settings for information systems.

*   **Interview**: Assessors will interview system administrators to understand how security configuration settings are established and enforced.
*   **Examine**: Assessors will examine security configuration checklists (e.g., DISA STIGs, CIS Benchmarks) and system configurations to verify that security settings are enforced.
*   **Test**: Assessors will use a configuration scanning tool to verify that systems are configured in accordance with the organization's security configuration settings. They will also verify that the local security policy export (secpol.cfg) is present in the evidence bundle and is parseable.
    *   **How the Codex Accelerator Helps**: The Codex enforces robust security configuration settings through Azure Policy and Group Policy Objects (GPOs) within the enclave. The **Continuous Drift Guard** actively monitors these settings, alerting you to any deviations, and the **Evidence Auto-Pilot** collects the necessary configuration exports for examination.

### CM.L2-3.4.3: Track, review, approve, and audit changes to information systems.

*   **Interview**: Assessors will interview system administrators to understand the change management process.
*   **Examine**: Assessors will examine change management policies and procedures, change requests, approval records, and audit logs of system changes.
*   **Test**: Assessors will review a sample of recent system changes to verify that they followed the documented change management process.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure DevOps and other change management tools to track, review, and approve changes, while the **Evidence Auto-Pilot** collects audit trails of all system modifications.

### CM.L2-3.4.4: Analyze the security impact of changes prior to implementation.

*   **Interview**: Assessors will interview system administrators and security personnel to understand how security impact analyses are performed for proposed changes.
*   **Examine**: Assessors will examine security impact analysis documentation for a sample of system changes.
*   **Test**: Assessors may request a demonstration of the security impact analysis process.
    *   **How the Codex Accelerator Helps**: The Codex provides templates and guidance for conducting security impact analyses, and its integrated tools can help assess the potential impact of proposed changes on your CMMC posture.

### CM.L2-3.4.5: Employ automated mechanisms to achieve security configuration management and maintain an up-to-date, complete, accurate, and readily available record of the information system, including components residing outside the system boundary.

*   **Interview**: Assessors will interview system administrators to understand the automated mechanisms used for security configuration management.
*   **Examine**: Assessors will examine the configuration of automated tools and the records they generate.
*   **Test**: Assessors will request a demonstration of the automated configuration management process.
    *   **How the Codex Accelerator Helps**: The Codex *is* the automated mechanism for security configuration management within your Azure enclave, leveraging Azure Policy, Desired State Configuration (DSC), and the **Continuous Drift Guard** to maintain an accurate and up-to-date record of your system's security posture.

### CM.L2-3.4.6: Control and monitor the installation of system components, including both hardware and software.

*   **Interview**: Assessors will interview system administrators to understand how the installation of system components is controlled and monitored.
*   **Examine**: Assessors will examine policies and procedures for component installation, and records of installed components.
*   **Test**: Assessors will verify that unauthorized components cannot be installed.
    *   **How the Codex Accelerator Helps**: The Codex enforces strict controls over component installation within the Azure enclave through whitelisting and application control mechanisms. The **Evidence Auto-Pilot** collects logs of all installations for monitoring.

### CM.L2-3.4.7: Control and monitor the use of mobile code.

*   **Interview**: Assessors will interview system administrators to understand how mobile code is controlled and monitored.
*   **Examine**: Assessors will examine policies and procedures for mobile code, and configurations of controls (e.g., antivirus, application whitelisting).
*   **Test**: Assessors will attempt to execute unauthorized mobile code.
    *   **How the Codex Accelerator Helps**: The Codex implements robust controls for mobile code, including application whitelisting and advanced threat protection, and the **Continuous Drift Guard** monitors these controls.

### CM.L2-3.4.8: Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.

*   **Interview**: Assessors will interview system administrators to understand how VoIP technologies are controlled and monitored.
*   **Examine**: Assessors will examine policies and procedures for VoIP, and configurations of VoIP systems.
*   **Test**: Assessors will attempt to use unauthorized VoIP services.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance and configuration templates for securing VoIP within the Azure environment, ensuring compliance with CMMC requirements.

### CM.L2-3.4.9: Control and monitor the use of security functions for information system components.

*   **Interview**: Assessors will interview system administrators to understand how security functions are controlled and monitored.
*   **Examine**: Assessors will examine policies and procedures for security functions, and configurations of security controls.
*   **Test**: Assessors will attempt to bypass or disable security functions.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all security functions within the Azure enclave are properly configured, monitored, and protected from unauthorized modification, with the **Continuous Drift Guard** providing real-time oversight.

## Domain 5: Identification and Authentication (IA)

### IA.L2-3.5.1: Identify information system users, processes acting on behalf of users, or devices.

*   **Interview**: Assessors will interview system administrators to understand how users, processes, and devices are identified.
*   **Examine**: Assessors will examine user account lists and audit logs to verify that all actions are attributed to a specific user or process.
*   **Test**: Assessors will attempt to access the system without being identified. They will also verify that the Guest account is disabled and that automatic logon is disabled.
    *   **How the Codex Accelerator Helps**: The Codex leverages Azure Active Directory for robust identity management, ensuring unique identification for all users and devices. The **Continuous Drift Guard** verifies critical settings like disabled Guest accounts and automatic logon.

### IA.L2-3.5.2: Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.

*   **Interview**: Assessors will interview system administrators to understand the authentication mechanisms in place.
*   **Examine**: Assessors will examine authentication policies and procedures, and system configurations for authentication.
*   **Test**: Assessors will attempt to bypass authentication mechanisms.
    *   **How the Codex Accelerator Helps**: The Codex enforces strong authentication mechanisms, including multi-factor authentication (MFA), through Azure Active Directory, ensuring only verified identities gain access.

### IA.L2-3.5.3: Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.

*   **Interview**: Assessors will interview system administrators to understand the implementation of multifactor authentication (MFA).
*   **Examine**: Assessors will examine MFA policies and configurations for privileged and non-privileged accounts.
*   **Test**: Assessors will attempt to access privileged and non-privileged accounts without MFA.
    *   **How the Codex Accelerator Helps**: The Codex configures and enforces MFA for all relevant accounts within the Azure enclave, a critical component of CMMC Level 2 compliance.

### IA.L2-3.5.4: Prevent reuse of passwords for a specified number of generations.

*   **Interview**: Assessors will interview system administrators to understand password reuse policies.
*   **Examine**: Assessors will examine password policies and configurations.
*   **Test**: Assessors will attempt to reuse a password within the specified generation limit.
    *   **How the Codex Accelerator Helps**: The Codex automates the configuration of password policies within Azure Active Directory, ensuring compliance with password reuse requirements.

### IA.L2-3.5.5: Employ FIPS-validated cryptography for the storage and transmission of passwords.

*   **Interview**: Assessors will interview system administrators to understand how passwords are stored and transmitted securely.
*   **Examine**: Assessors will examine system configurations and cryptographic module certifications.
*   **Test**: Assessors will verify that FIPS-validated cryptography is used for password handling.
    *   **How the Codex Accelerator Helps**: The Azure environment, which the Codex leverages, inherently uses FIPS-validated cryptography for the storage and transmission of credentials, ensuring this requirement is met by design.

### IA.L2-3.5.6: Enforce a minimum password complexity and change of characters when new passwords are created.

*   **Interview**: Assessors will interview system administrators to understand password complexity requirements.
*   **Examine**: Assessors will examine password policies and configurations.
*   **Test**: Assessors will attempt to create a password that does not meet complexity requirements.
    *   **How the Codex Accelerator Helps**: The Codex configures and enforces robust password complexity policies within Azure Active Directory, ensuring all new passwords meet CMMC standards.

### IA.L2-3.5.7: Prohibit the use of group accounts or shared accounts that do not provide for individual accountability.

*   **Interview**: Assessors will interview system administrators to understand the use of group and shared accounts.
*   **Examine**: Assessors will examine account lists and audit logs to verify individual accountability for shared accounts.
*   **Test**: Assessors will attempt to use a shared account without individual accountability.
    *   **How the Codex Accelerator Helps**: The Codex promotes and enforces individual accountability through unique user accounts and robust logging, providing clear audit trails for all actions.

### IA.L2-3.5.8: Define and enforce a minimum password complexity and change of characters when new passwords are created.

*   **Interview**: Assessors will interview system administrators to understand password complexity requirements.
*   **Examine**: Assessors will examine password policies and configurations. They will also verify that the password history is set to 24.
*   **Test**: Assessors will attempt to create a password that does not meet complexity requirements.
    *   **How the Codex Accelerator Helps**: The Codex automates the configuration of password policies within Azure Active Directory, ensuring compliance with password complexity and history requirements.

### IA.L2-3.5.9: Employ automated mechanisms to support the management of account credentials.

*   **Interview**: Assessors will interview system administrators to understand the automated mechanisms used for credential management.
*   **Examine**: Assessors will examine the configuration of automated tools (e.g., password vaults, identity management systems).
*   **Test**: Assessors will request a demonstration of the automated credential management process.
    *   **How the Codex Accelerator Helps**: The Codex leverages Azure Active Directory and its integrated tools for automated credential management, simplifying the enforcement of strong password policies and lifecycle management.

### IA.L2-3.5.10: Employ automated mechanisms to support the management of cryptographic keys and certificates.

*   **Interview**: Assessors will interview system administrators to understand the automated mechanisms used for cryptographic key and certificate management.
*   **Examine**: Assessors will examine the configuration of automated tools (e.g., Azure Key Vault, certificate management systems).
*   **Test**: Assessors will request a demonstration of the automated key and certificate management process.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure Key Vault for secure and automated management of cryptographic keys and certificates, ensuring their proper lifecycle and protection.

### IA.L2-3.5.11: Authenticate users, processes, and devices before granting access to the information system.

*   **Interview**: Assessors will interview system administrators to understand the authentication process before granting access.
*   **Examine**: Assessors will examine authentication policies and procedures, and system configurations for authentication.
*   **Test**: Assessors will attempt to gain access to the information system without proper authentication.
    *   **How the Codex Accelerator Helps**: The Codex enforces robust pre-access authentication for all users, processes, and devices interacting with the Azure enclave, ensuring a secure perimeter.


## Domain 6: Incident Response (IR)

### IR.L2-3.6.1: Establish an operational incident handling capability for organizational information systems that includes preparation, detection and analysis, containment, eradication, and recovery.

*   **Interview**: Assessors will interview incident response team members to understand the incident handling process and their roles.
*   **Examine**: Assessors will examine the Incident Response Plan (IRP), incident handling procedures, and records of past incidents.
*   **Test**: Assessors may conduct a tabletop exercise or simulate an incident to observe the response process.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure Security Center and Azure Sentinel to provide robust incident detection and analysis capabilities. Our platform helps streamline incident response workflows and automates the collection of incident-related evidence.

### IR.L2-3.6.2: Track, document, and report incidents to appropriate officials and authorities.

*   **Interview**: Assessors will interview incident response personnel to understand incident tracking, documentation, and reporting procedures.
*   **Examine**: Assessors will examine incident reports, communication logs, and records of reporting to relevant authorities.
*   **Test**: Assessors will review a sample of incidents to verify proper tracking, documentation, and reporting.
    *   **How the Codex Accelerator Helps**: The Codex, through its integration with Azure Sentinel, provides centralized incident tracking and reporting, ensuring all incidents are thoroughly documented and reported in accordance with CMMC requirements.

### IR.L2-3.6.3: Test the organizational incident response capability.

*   **Interview**: Assessors will interview incident response management to understand the frequency and scope of incident response testing.
*   **Examine**: Assessors will examine incident response test plans, results, and lessons learned documentation.
*   **Test**: Assessors will observe an incident response test or review evidence of past tests.
    *   **How the Codex Accelerator Helps**: The Codex facilitates incident response testing by providing a controlled environment within the Azure enclave and helps automate the collection of evidence from test exercises.

## Domain 7: Maintenance (MA)

### MA.L2-3.7.1: Perform maintenance on information systems.

*   **Interview**: Assessors will interview system administrators to understand the maintenance schedule and procedures.
*   **Examine**: Assessors will examine maintenance policies and procedures, maintenance schedules, and records of maintenance performed.
*   **Test**: Assessors will review a sample of maintenance activities to verify they were performed as scheduled and documented.
    *   **How the Codex Accelerator Helps**: The Codex automates routine system maintenance within the Azure enclave, ensuring systems are kept up-to-date and secure. Our **Evidence Auto-Pilot** collects detailed maintenance logs for audit purposes.

### MA.L2-3.7.2: Provide controls on the tools, techniques, mechanisms, and personnel used to conduct information system maintenance.

*   **Interview**: Assessors will interview system administrators to understand the controls on maintenance activities and personnel.
*   **Examine**: Assessors will examine policies and procedures for maintenance, and records of authorized maintenance personnel and tools.
*   **Test**: Assessors will verify that only authorized personnel and tools are used for maintenance.
    *   **How the Codex Accelerator Helps**: The Codex enforces strict access controls for maintenance activities within the Azure enclave, ensuring only authorized personnel with approved tools can perform system maintenance.

### MA.L2-3.7.3: Ensure that all media containing CUI is sanitized or destroyed prior to disposal or release for reuse.

*   **Interview**: Assessors will interview personnel responsible for media sanitization to understand the process.
*   **Examine**: Assessors will examine media sanitization policies and procedures, and records of media sanitization or destruction.
*   **Test**: Assessors will verify that a sample of disposed or reused media was properly sanitized or destroyed.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance and tools for secure media sanitization within the Azure environment, aligning with NIST SP 800-88 guidelines for data destruction.

### MA.L2-3.7.4: Require multifactor authentication to establish nonlocal maintenance sessions via external network connections.

*   **Interview**: Assessors will interview system administrators to understand the requirements for nonlocal maintenance sessions.
*   **Examine**: Assessors will examine policies and procedures for nonlocal maintenance, and configurations for MFA on external connections.
*   **Test**: Assessors will attempt to establish a nonlocal maintenance session without MFA.
    *   **How the Codex Accelerator Helps**: The Codex enforces MFA for all nonlocal maintenance sessions, significantly enhancing the security of remote administrative access to your Azure enclave.

### MA.L2-3.7.5: Supervise the maintenance activities of personnel who are not routinely granted access to the information system.

*   **Interview**: Assessors will interview system administrators to understand how non-routine maintenance personnel are supervised.
*   **Examine**: Assessors will examine policies and procedures for supervising non-routine maintenance personnel, and records of supervision.
*   **Test**: Assessors will observe a non-routine maintenance activity to verify proper supervision.
    *   **How the Codex Accelerator Helps**: The Codex provides robust logging and monitoring capabilities within the Azure enclave, allowing for comprehensive oversight and auditing of all maintenance activities, including those performed by non-routine personnel.

### MA.L2-3.7.6: Protect maintenance tools from unauthorized use.

*   **Interview**: Assessors will interview system administrators to understand how maintenance tools are protected.
*   **Examine**: Assessors will examine policies and procedures for protecting maintenance tools, and access controls on maintenance tools.
*   **Test**: Assessors will attempt to use an unauthorized maintenance tool.
    *   **How the Codex Accelerator Helps**: The Codex enforces strict access controls and whitelisting for maintenance tools used within the Azure enclave, preventing unauthorized use and maintaining system integrity.


## Domain 8: Media Protection (MP)

### MP.L2-3.8.1: Protect (i.e., physically control and securely store) information system media containing CUI, both paper and digital.

*   **Interview**: Assessors will interview personnel to understand how information system media containing CUI is protected.
*   **Examine**: Assessors will examine policies and procedures for media protection, and physical security controls for storage areas. They will also verify that the OS volume is encrypted (BitLocker enabled).
*   **Test**: Assessors will attempt to access unprotected media containing CUI.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all digital media within the Azure enclave is encrypted (e.g., BitLocker for VMs, Azure Storage encryption) and provides guidance for physical media protection, with **Evidence Auto-Pilot** collecting configuration proof.

### MP.L2-3.8.2: Limit access to CUI on information system media to authorized users.

*   **Interview**: Assessors will interview personnel to understand how access to CUI on media is limited.
*   **Examine**: Assessors will examine access controls on media, and audit logs of access to CUI on media.
*   **Test**: Assessors will attempt to access CUI on media without authorization.
    *   **How the Codex Accelerator Helps**: The Codex enforces granular access controls on all storage containing CUI within the Azure enclave, ensuring only authorized users can access sensitive data.

### MP.L2-3.8.3: Sanitize or destroy information system media containing CUI before disposal or release for reuse.

*   **Interview**: Assessors will interview personnel responsible for media sanitization to understand the process.
*   **Examine**: Assessors will examine media sanitization policies and procedures, and records of media sanitization or destruction.
*   **Test**: Assessors will verify that a sample of disposed or reused media was properly sanitized or destroyed.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance and tools for secure media sanitization within the Azure environment, aligning with NIST SP 800-88 guidelines for data destruction.

### MP.L2-3.8.4: Mark information system media indicating the distribution limitations and handling caveats of the CUI.

*   **Interview**: Assessors will interview personnel to understand how CUI on media is marked.
*   **Examine**: Assessors will examine policies and procedures for marking CUI, and samples of marked media.
*   **Test**: Assessors will verify that CUI on media is appropriately marked.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance and templates for consistent marking of CUI, ensuring compliance with handling requirements.

### MP.L2-3.8.5: Control access to media containing CUI.

*   **Interview**: Assessors will interview personnel to understand how access to media containing CUI is controlled.
*   **Examine**: Assessors will examine policies and procedures for media access, and access logs for media storage areas.
*   **Test**: Assessors will attempt to access media containing CUI without authorization.
    *   **How the Codex Accelerator Helps**: The Codex enforces strict access controls on all storage containing CUI within the Azure enclave, ensuring only authorized users can access sensitive data.

### MP.L2-3.8.6: Protect media containing CUI during transport outside of controlled areas.

*   **Interview**: Assessors will interview personnel to understand how media containing CUI is protected during transport.
*   **Examine**: Assessors will examine policies and procedures for transporting CUI, and records of transported media.
*   **Test**: Assessors will observe the transport of media containing CUI to verify proper protection.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance on secure transport methods for CUI, including encryption and chain-of-custody documentation, applicable to both digital and physical media.

### MP.L2-3.8.7: Control the use of removable media.

*   **Interview**: Assessors will interview system administrators to understand the policy on removable media.
*   **Examine**: Assessors will examine policies and technical controls that restrict the use of removable media. They will also verify that USB mass storage is disabled.
*   **Test**: Assessors will attempt to use an unauthorized removable media device.
    *   **How the Codex Accelerator Helps**: The Codex implements technical controls (e.g., via Group Policy or Intune) to restrict the use of removable media within the Azure enclave, and **Evidence Auto-Pilot** collects configuration proof.

### MP.L2-3.8.8: Prohibit the use of personally owned removable media on organizational information systems.

*   **Interview**: Assessors will interview system administrators and users to understand the policy on personally owned removable media.
*   **Examine**: Assessors will examine policies and technical controls that prohibit the use of personally owned removable media.
*   **Test**: Assessors will attempt to use personally owned removable media on an organizational system.
    *   **How the Codex Accelerator Helps**: The Codex enforces policies and technical controls to prevent the use of personally owned removable media within the Azure enclave, mitigating data exfiltration risks.

### MP.L2-3.8.9: Protect information system media until the media is destroyed or sanitized.

*   **Interview**: Assessors will interview personnel to understand how information system media is protected until destruction or sanitization.
*   **Examine**: Assessors will examine policies and procedures for media protection prior to disposal, and storage conditions for media awaiting destruction.
*   **Test**: Assessors will verify that media awaiting destruction or sanitization is securely stored.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance on secure storage and handling of media containing CUI, ensuring it remains protected throughout its lifecycle until proper destruction or sanitization.

## Domain 9: Personnel Security (PS)

### PS.L2-3.9.1: Screen individuals prior to authorizing access to information systems containing CUI.

*   **Interview**: Assessors will interview HR and security personnel to understand the screening process for individuals with access to CUI.
*   **Examine**: Assessors will examine policies and procedures for personnel screening, and records of background checks or other screening activities.
*   **Test**: Assessors will review a sample of personnel files to verify that screening was conducted prior to granting access to CUI.
    *   **How the Codex Accelerator Helps**: The Codex provides a framework for documenting and managing personnel screening processes, ensuring compliance with CMMC requirements for authorizing access to CUI.

### PS.L2-3.9.2: Ensure that organizational systems containing CUI are protected during personnel actions such as terminations and transfers.

*   **Interview**: Assessors will interview HR and security personnel to understand how CUI is protected during personnel terminations and transfers.
*   **Examine**: Assessors will examine policies and procedures for personnel actions, and records of access revocation during terminations or transfers.
*   **Test**: Assessors will review a sample of terminated or transferred personnel to verify that CUI access was properly revoked.
    *   **How the Codex Accelerator Helps**: The Codex integrates with identity and access management systems to automate the revocation of access rights during personnel changes, ensuring CUI remains protected.


## Domain 10: Physical Protection (PE)

### PE.L2-3.10.1: Limit physical access to organizational information systems, equipment, and the respective operating environments to authorized individuals.

*   **Interview**: Assessors will interview security personnel to understand physical access controls.
*   **Examine**: Assessors will examine physical access control policies and procedures, access logs, and physical security measures (e.g., locks, cameras).
*   **Test**: Assessors will attempt to gain unauthorized physical access to facilities or equipment.
    *   **How the Codex Accelerator Helps**: While the Azure enclave is physically secured by Microsoft, the Codex provides guidance and best practices for securing on-premise physical access points that interface with the CUI boundary, and helps document your physical security plan.

### PE.L2-3.10.2: Protect physical access to information systems, equipment, and the respective operating environments.

*   **Interview**: Assessors will interview security personnel to understand how physical access is protected.
*   **Examine**: Assessors will examine physical security policies and procedures, and physical security measures (e.g., guards, alarm systems).
*   **Test**: Assessors will attempt to bypass physical protection mechanisms.
    *   **How the Codex Accelerator Helps**: The Codex leverages the robust physical security of Azure data centers. For any on-premise components, it provides templates for physical security policies and helps track their implementation.

### PE.L2-3.10.3: Monitor physical access to information systems, equipment, and the respective operating environments.

*   **Interview**: Assessors will interview security personnel to understand physical access monitoring.
*   **Examine**: Assessors will examine physical access monitoring policies and procedures, and monitoring records (e.g., CCTV footage, access logs).
*   **Test**: Assessors will verify that physical access is actively monitored.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance on integrating physical access monitoring systems with your overall security operations, and helps document monitoring procedures and evidence collection.

### PE.L2-3.10.4: Escort visitors and control visitor access to areas containing CUI.

*   **Interview**: Assessors will interview security personnel to understand visitor control procedures.
*   **Examine**: Assessors will examine visitor control policies and procedures, and visitor logs.
*   **Test**: Assessors will observe visitor control procedures.
    *   **How the Codex Accelerator Helps**: The Codex helps in documenting and implementing visitor control policies for any physical locations where CUI is handled, ensuring alignment with CMMC requirements.

### PE.L2-3.10.5: Maintain audit logs of physical access.

*   **Interview**: Assessors will interview security personnel to understand how physical access audit logs are maintained.
*   **Examine**: Assessors will examine physical access audit logs.
*   **Test**: Assessors will review a sample of physical access audit logs.
    *   **How the Codex Accelerator Helps**: The Codex provides guidance on integrating physical access control systems with centralized logging solutions, ensuring physical access audit logs are maintained and available for review.

### PE.L2-3.10.6: Control and manage physical access devices.

*   **Interview**: Assessors will interview security personnel to understand how physical access devices are controlled and managed.
*   **Examine**: Assessors will examine policies and procedures for physical access device management, and inventory of physical access devices.
*   **Test**: Assessors will verify that physical access devices are properly controlled and managed.
    *   **How the Codex Accelerator Helps**: The Codex assists in documenting and managing physical access devices, ensuring their lifecycle is controlled and aligned with CMMC security practices.

## Domain 11: Risk Assessment (RA)

### RA.L2-3.11.1: Periodically assess the risk to organizational operations (including mission, functions, image, and reputation), organizational assets, and individuals, resulting from the operation of organizational information systems and the associated processing, storage, and transmission of CUI.

*   **Interview**: Assessors will interview management and security personnel to understand the risk assessment process and frequency.
*   **Examine**: Assessors will examine risk assessment policies and procedures, and the most recent risk assessment report.
*   **Test**: Assessors will review the risk assessment methodology and verify its application.
    *   **How the Codex Accelerator Helps**: The Codex provides a structured framework for conducting periodic risk assessments within the Azure enclave, leveraging its continuous monitoring capabilities to inform risk analysis and reporting.

### RA.L2-3.11.2: Scan for vulnerabilities in the information system and applications periodically and when new vulnerabilities are identified.

*   **Interview**: Assessors will interview system administrators to understand vulnerability scanning processes and tools.
*   **Examine**: Assessors will examine vulnerability scanning policies and procedures, and recent vulnerability scan reports.
*   **Test**: Assessors will request a demonstration of vulnerability scanning or review scan results.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure Defender for Cloud and other vulnerability management tools to automate periodic vulnerability scanning of the Azure enclave, and the **Evidence Auto-Pilot** collects scan reports for audit.

### RA.L2-3.11.3: Remediate vulnerabilities in accordance with an organizational policy or procedure.

*   **Interview**: Assessors will interview system administrators to understand the vulnerability remediation process.
*   **Examine**: Assessors will examine vulnerability remediation policies and procedures, and records of vulnerability remediation activities.
*   **Test**: Assessors will review a sample of remediated vulnerabilities to verify that they were addressed in accordance with policy.
    *   **How the Codex Accelerator Helps**: The Codex assists in prioritizing and tracking vulnerability remediation efforts within the Azure enclave, integrating with ticketing systems and providing automated reporting on remediation status.


## Domain 12: Security Assessment (CA)

### CA.L2-3.12.1: Develop, disseminate, and update a security assessment plan that describes the scope of the assessment, the assessment procedures, and the assessment methodology.

*   **Interview**: Assessors will interview security personnel to understand the security assessment planning process.
*   **Examine**: Assessors will examine security assessment plans, policies, and procedures.
*   **Test**: Assessors will review a sample security assessment plan to verify its completeness and alignment with organizational requirements.
    *   **How the Codex Accelerator Helps**: The Codex provides templates and guidance for developing comprehensive security assessment plans, ensuring all CMMC requirements are addressed.

### CA.L2-3.12.2: Conduct security assessments at a frequency sufficient to determine the effectiveness of security controls and to identify security control weaknesses and deficiencies.

*   **Interview**: Assessors will interview security personnel to understand the frequency and scope of security assessments.
*   **Examine**: Assessors will examine security assessment reports and schedules.
*   **Test**: Assessors will review a sample of security assessment reports to verify that assessments are conducted regularly and thoroughly.
    *   **How the Codex Accelerator Helps**: The Codex, through its **Automated Gap Analysis** tool, can conduct continuous security assessments within the Azure enclave, providing real-time insights into control effectiveness and identifying weaknesses proactively.

### CA.L2-3.12.3: Develop and implement plans of action and milestones for security weaknesses and deficiencies identified during security assessments.

*   **Interview**: Assessors will interview security personnel to understand the POA&M development and implementation process.
*   **Examine**: Assessors will examine POA&Ms and records of remediation activities.
*   **Test**: Assessors will review a sample of POA&Ms to verify that identified weaknesses are being addressed.
    *   **How the Codex Accelerator Helps**: The Codex assists in generating and managing POA&Ms, tracking remediation efforts, and providing automated updates on progress, ensuring timely resolution of identified weaknesses.

### CA.L2-3.12.4: Employ automated mechanisms to support the security assessment process.

*   **Interview**: Assessors will interview security personnel to understand the automated mechanisms used for security assessments.
*   **Examine**: Assessors will examine the configuration of automated tools and the reports they generate.
*   **Test**: Assessors will request a demonstration of the automated security assessment process.
    *   **How the Codex Accelerator Helps**: The Codex *is* an automated mechanism for security assessments, leveraging tools like Azure Defender for Cloud, Azure Policy, and its **Automated Gap Analysis** to streamline the entire assessment process and generate audit-ready reports.

## Domain 13: System and Communications Protection (SC)

### SC.L2-3.13.1: Monitor, control, and protect organizational communications at the external boundaries and key internal boundaries of information systems.

*   **Interview**: Assessors will interview network administrators to understand how communications are monitored, controlled, and protected.
*   **Examine**: Assessors will examine network diagrams, firewall rules, and IDS/IPS configurations. They will also verify that the network boundary is enforced (firewall baseline in effect) and that SMB signing is required.
*   **Test**: Assessors will attempt to bypass boundary protections.
    *   **How the Codex Accelerator Helps**: The Codex automatically configures and enforces robust network security controls within the Azure enclave, including firewalls, NSGs, and advanced threat protection. The **Continuous Drift Guard** monitors these critical configurations, and the **Evidence Auto-Pilot** collects network configuration details and logs.

### SC.L2-3.13.2: Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.

*   **Interview**: Assessors will interview network administrators to understand the network segmentation strategy.
*   **Examine**: Assessors will examine network diagrams and configurations of subnetworks (e.g., DMZs).
*   **Test**: Assessors will attempt to access internal network resources from a publicly accessible subnetwork.
    *   **How the Codex Accelerator Helps**: The Codex deploys a secure Azure architecture with logically separated subnetworks for publicly accessible components, adhering to best practices for network segmentation.

### SC.L2-3.13.3: Deny by default, permit by exception network access to and from organizational information systems.

*   **Interview**: Assessors will interview network administrators to understand the network access control philosophy.
*   **Examine**: Assessors will examine firewall rules and network access control lists (ACLs) to verify a deny-by-default posture.
*   **Test**: Assessors will attempt to establish unauthorized network connections.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure Network Security Groups (NSGs) and Azure Firewall with a deny-by-default approach, ensuring only explicitly permitted traffic can flow.

### SC.L2-3.13.4: Prevent unauthorized disclosure of CUI over an unprotected network by using a cryptographic mechanism to protect the confidentiality of CUI.

*   **Interview**: Assessors will interview system administrators to understand how CUI is protected during transmission over networks.
*   **Examine**: Assessors will examine network configurations for VPNs, TLS, and other cryptographic mechanisms.
*   **Test**: Assessors will use a network sniffer to verify that CUI is encrypted during transmission over unprotected networks.
    *   **How the Codex Accelerator Helps**: The Codex enforces the use of FIPS-validated cryptographic mechanisms (e.g., TLS 1.2+, VPNs) for all CUI transmissions within and from the Azure enclave, preventing unauthorized disclosure.

### SC.L2-3.13.5: Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission over unprotected networks.

*   **Interview**: Assessors will interview system administrators to understand the cryptographic mechanisms used for CUI transmission.
*   **Examine**: Assessors will examine cryptographic configurations and certifications.
*   **Test**: Assessors will verify that appropriate cryptographic mechanisms are in place and functioning correctly.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all CUI transmitted over unprotected networks from the Azure enclave is protected by strong, FIPS-validated encryption, automatically configuring and verifying these controls.

### SC.L2-3.13.6: Implement cryptographic mechanisms to protect the integrity of CUI during transmission over unprotected networks.

*   **Interview**: Assessors will interview system administrators to understand the cryptographic mechanisms used to protect CUI integrity during transmission.
*   **Examine**: Assessors will examine cryptographic configurations and certifications. They will also verify Windows firewall baseline.
*   **Test**: Assessors will verify that appropriate cryptographic mechanisms are in place and functioning correctly to protect integrity.
    *   **How the Codex Accelerator Helps**: The Codex configures and enforces cryptographic integrity controls for CUI transmission within the Azure enclave, and the **Continuous Drift Guard** monitors critical settings like Windows Firewall baselines.

### SC.L2-3.13.7: Implement cryptographic mechanisms to protect the confidentiality of CUI at rest.

*   **Interview**: Assessors will interview system administrators to understand the cryptographic mechanisms used to protect CUI at rest.
*   **Examine**: Assessors will examine cryptographic configurations and certifications.
*   **Test**: Assessors will verify that appropriate cryptographic mechanisms are in place and functioning correctly to protect confidentiality of CUI at rest.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all CUI at rest within the Azure enclave is protected by FIPS-validated encryption, leveraging Azure Disk Encryption, Storage Service Encryption, and Azure Key Vault.

### SC.L2-3.13.8: Protect the integrity of CUI transmitted or otherwise communicated over networks.

*   **Interview**: Assessors will interview system administrators to understand how the integrity of CUI is protected during network communication.
*   **Examine**: Assessors will examine network configurations and cryptographic mechanisms. They will also verify TLS baseline.
*   **Test**: Assessors will verify that appropriate mechanisms are in place to protect the integrity of CUI during transmission.
    *   **How the Codex Accelerator Helps**: The Codex enforces strong cryptographic integrity controls, including TLS baselines, for all CUI communications within the Azure enclave, and the **Continuous Drift Guard** monitors these settings.

### SC.L2-3.13.9: Protect the confidentiality of CUI at rest.

*   **Interview**: Assessors will interview system administrators to understand how the confidentiality of CUI at rest is protected.
*   **Examine**: Assessors will examine storage configurations and encryption mechanisms.
*   **Test**: Assessors will verify that appropriate mechanisms are in place to protect the confidentiality of CUI at rest.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all CUI at rest within the Azure enclave is encrypted using FIPS-validated modules, leveraging Azure native encryption services.

### SC.L2-3.13.10: Implement cryptographic mechanisms to protect the integrity of CUI at rest.

*   **Interview**: Assessors will interview system administrators to understand the cryptographic mechanisms used to protect CUI integrity at rest.
*   **Examine**: Assessors will examine cryptographic configurations and certifications.
*   **Test**: Assessors will verify that appropriate cryptographic mechanisms are in place and functioning correctly to protect integrity of CUI at rest.
    *   **How the Codex Accelerator Helps**: The Codex configures and enforces cryptographic integrity controls for CUI at rest within the Azure enclave, ensuring data has not been tampered with.

### SC.L2-3.13.11: Employ FIPS-validated cryptography when used to protect the confidentiality or integrity of CUI.

*   **Interview**: Assessors will interview system administrators to understand the use of FIPS-validated cryptography.
*   **Examine**: Assessors will examine cryptographic module certifications and system configurations. They will also verify FIPS mode is enabled.
*   **Test**: Assessors will verify that FIPS-validated cryptography is employed where required.
    *   **How the Codex Accelerator Helps**: The Codex ensures that all cryptographic operations protecting CUI within the Azure enclave utilize FIPS-validated modules, automatically configuring and verifying this critical setting.

### SC.L2-3.13.12: Prevent unauthorized exfiltration of CUI.

*   **Interview**: Assessors will interview system administrators to understand how unauthorized exfiltration of CUI is prevented.
*   **Examine**: Assessors will examine Data Loss Prevention (DLP) policies and configurations, and network egress controls.
*   **Test**: Assessors will attempt to exfiltrate CUI to an unauthorized external destination.
    *   **How the Codex Accelerator Helps**: The Codex implements robust DLP and network egress controls within the Azure enclave, preventing unauthorized exfiltration of CUI. The **CUI Flow Mapper** visualizes potential exfiltration points.

### SC.L2-3.13.13: Implement a deny-by-default policy for network communications.

*   **Interview**: Assessors will interview network administrators to understand the network communication policy.
*   **Examine**: Assessors will examine firewall rules and network access control lists (ACLs) to verify a deny-by-default posture.
*   **Test**: Assessors will attempt to establish unauthorized network communications.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure Network Security Groups (NSGs) and Azure Firewall with a strict deny-by-default policy, minimizing the attack surface.

### SC.L2-3.13.14: Control and monitor the use of external information systems.

*   **Interview**: Assessors will interview system administrators to understand how external information systems are controlled and monitored.
*   **Examine**: Assessors will examine policies and procedures for external system use, and audit logs of external system connections.
*   **Test**: Assessors will attempt to connect to an unauthorized external information system.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure network controls and proxies to manage and limit connections to external systems, with **Continuous Drift Guard** monitoring these critical settings.

### SC.L2-3.13.15: Implement a security architecture that separates organizational systems into physically or logically distinct networks.

*   **Interview**: Assessors will interview network architects to understand the security architecture.
*   **Examine**: Assessors will examine network diagrams and architectural documentation to verify network separation.
*   **Test**: Assessors will attempt to bypass network separation controls.
    *   **How the Codex Accelerator Helps**: The Codex deploys a secure Azure architecture that inherently separates organizational systems into logically distinct networks, enhancing overall security posture.

### SC.L2-3.13.16: Protect the integrity of CUI at rest.

*   **Interview**: Assessors will interview system administrators to understand how the integrity of CUI at rest is protected.
*   **Examine**: Assessors will examine storage configurations and integrity protection mechanisms (e.g., hashing, digital signatures).
*   **Test**: Assessors will verify that appropriate mechanisms are in place to protect the integrity of CUI at rest.
    *   **How the Codex Accelerator Helps**: The Codex configures and enforces cryptographic integrity controls for CUI at rest within the Azure enclave, ensuring data has not been tampered with.

## Domain 14: System and Information Integrity (SI)

### SI.L2-3.14.1: Identify, report, and correct information system flaws in a timely manner.

*   **Interview**: Assessors will interview system administrators to understand the process for identifying, reporting, and correcting system flaws.
*   **Examine**: Assessors will examine vulnerability management policies and procedures, and records of identified and corrected flaws.
*   **Test**: Assessors will review a sample of system flaws to verify timely correction.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure Defender for Cloud and other vulnerability management tools to identify and report system flaws. Its **Automated Gap Analysis** helps prioritize and track corrections, ensuring timely remediation.

### SI.L2-3.14.2: Provide protection from malicious code.

*   **Interview**: Assessors will interview system administrators to understand the malicious code protection strategy.
*   **Examine**: Assessors will examine anti-malware policies and configurations, and recent anti-malware scan reports. They will also verify Defender real-time protection is active and updated.
*   **Test**: Assessors will verify that anti-malware solutions are active and up-to-date.
    *   **How the Codex Accelerator Helps**: The Codex configures and manages Azure Defender for Endpoint and other anti-malware solutions within the Azure enclave, providing robust protection against malicious code. The **Continuous Drift Guard** monitors their operational status.

### SI.L2-3.14.3: Update malicious code protection mechanisms when new releases are available.

*   **Interview**: Assessors will interview system administrators to understand the process for updating malicious code protection mechanisms.
*   **Examine**: Assessors will examine update policies and procedures, and records of anti-malware definition updates.
*   **Test**: Assessors will verify that anti-malware definitions are current.
    *   **How the Codex Accelerator Helps**: The Codex automates the update process for malicious code protection mechanisms within the Azure enclave, ensuring your defenses are always current against the latest threats.

### SI.L2-3.14.4: Perform periodic scans of the information system and real-time scans of files from external sources as the files are downloaded, opened, or executed.

*   **Interview**: Assessors will interview system administrators to understand the scanning schedule and real-time scanning capabilities.
*   **Examine**: Assessors will examine scanning policies and procedures, and scan reports.
*   **Test**: Assessors will verify that periodic and real-time scans are performed.
    *   **How the Codex Accelerator Helps**: The Codex configures Azure Defender for Endpoint to perform both periodic and real-time scans of files within the Azure enclave, providing continuous threat detection.

### SI.L2-3.14.5: Monitor information system security alerts and advisories and take action in response.

*   **Interview**: Assessors will interview security personnel to understand how security alerts and advisories are monitored and responded to.
*   **Examine**: Assessors will examine security alert monitoring policies and procedures, and records of responses to alerts.
*   **Test**: Assessors will review a sample of security alerts and verify appropriate actions were taken.
    *   **How the Codex Accelerator Helps**: The Codex integrates with Azure Sentinel to provide centralized monitoring of security alerts and advisories, enabling rapid response and automated actions to mitigate threats.

### SI.L2-3.14.6: Employ spam protection mechanisms at information system entry and exit points.

*   **Interview**: Assessors will interview system administrators to understand the spam protection mechanisms in place.
*   **Examine**: Assessors will examine spam protection policies and configurations.
*   **Test**: Assessors will verify that spam protection mechanisms are active and effective.
    *   **How the Codex Accelerator Helps**: The Codex leverages Azure security services like Exchange Online Protection and Azure Firewall to implement robust spam protection at the enclave's entry and exit points.

### SI.L2-3.14.7: Employ a security information and event management (SIEM) system to collect and analyze security-related information.

*   **Interview**: Assessors will interview security personnel to understand the SIEM system in use and its capabilities.
*   **Examine**: Assessors will examine SIEM configurations, dashboards, and reports.
*   **Test**: Assessors will request a demonstration of the SIEM system and its analysis capabilities.
    *   **How the Codex Accelerator Helps**: The Codex utilizes Azure Sentinel as its integrated SIEM solution, providing comprehensive collection, analysis, and correlation of security events across the Azure enclave, crucial for CMMC compliance.

## Conclusion: Your Path to CMMC 2.0 Level 2 with MacTech

This guide has provided an in-depth look at the CMMC 2.0 Level 2 assessment process from a C3PAO's perspective. While the requirements are extensive, achieving and maintaining compliance doesn't have to be an overwhelming burden. The **MacTech Codex Accelerator** is specifically designed to automate the heavy lifting of configuration, evidence collection, and continuous monitoring within a secure Azure CUI Boundary Enclave.

By leveraging the Codex, DIB contractors can:

*   **Accelerate Compliance**: Rapidly establish a CMMC Level 2 compliant environment.
*   **Automate Evidence**: Eliminate manual evidence gathering with intelligent automation.
*   **Ensure Continuous Readiness**: Proactively detect and remediate configuration drift.
*   **Reduce Cost & Complexity**: Streamline operations and reduce the need for extensive in-house expertise.

Don't just prepare for an audit; be audit-ready, every day. Contact MacTech today to learn how the Codex Accelerator can secure your CUI, simplify your compliance journey, and help you win more defense contracts.

[MacTech Website/Contact-Us]
