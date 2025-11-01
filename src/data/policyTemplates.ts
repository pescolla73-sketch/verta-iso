export interface PolicySection {
  title: string;
  content: string;
  placeholders: string[];
  editable: boolean;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  category: 'mandatory' | 'recommended' | 'custom';
  iso_reference: string[];
  nis2_reference?: string[];
  sections: PolicySection[];
  customizable: boolean;
  description: string;
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  // ===== MANDATORY ISO 27001:2022 POLICIES =====
  {
    id: 'iso-info-security-policy',
    name: 'Information Security Policy',
    category: 'mandatory',
    iso_reference: ['5.2', 'A.5.1'],
    description: 'Top-level policy defining organization commitment to information security',
    customizable: true,
    sections: [
      {
        title: '1. PURPOSE & SCOPE',
        content: `{{organization_name}} is committed to protecting the confidentiality, integrity, and availability of all information assets under its control. This Information Security Policy establishes the framework for managing information security risks and ensuring compliance with applicable legal, regulatory, and contractual requirements.

**Scope:** This policy applies to all employees, contractors, partners, and third parties who have access to {{organization_name}}'s information systems and data.`,
        placeholders: ['{{organization_name}}'],
        editable: true
      },
      {
        title: '2. POLICY STATEMENT',
        content: `{{organization_name}} recognizes that information is a critical business asset and must be adequately protected. Management is committed to:

• Protecting information assets from unauthorized access, disclosure, modification, or destruction
• Ensuring compliance with ISO 27001:2022 and applicable laws and regulations
• Providing adequate resources for information security management
• Continuously improving the Information Security Management System (ISMS)
• Raising awareness about information security throughout the organization`,
        placeholders: ['{{organization_name}}'],
        editable: true
      },
      {
        title: '3. ROLES & RESPONSIBILITIES',
        content: `**Chief Information Security Officer (CISO):** {{ciso_name}}
- Overall responsibility for ISMS implementation and management
- Reports to executive management on security status

**Information Security Manager:** {{iso_manager_name}}
- Day-to-day management of security controls
- Coordinates security incident response

**Asset Owners:** Department managers
- Responsible for classifying and protecting information assets within their domain

**All Personnel:**
- Comply with security policies and procedures
- Report security incidents immediately
- Complete mandatory security awareness training`,
        placeholders: ['{{ciso_name}}', '{{iso_manager_name}}'],
        editable: true
      },
      {
        title: '4. INFORMATION CLASSIFICATION',
        content: `All information must be classified according to its sensitivity:

**PUBLIC:** Information intended for public disclosure (e.g., marketing materials)

**INTERNAL:** Information for internal use only (e.g., internal procedures, memos)

**CONFIDENTIAL:** Sensitive business information (e.g., financial data, customer lists)
- Requires authorization for access
- Must be encrypted when stored or transmitted

**STRICTLY CONFIDENTIAL:** Critical business information (e.g., trade secrets, personal data)
- Highly restricted access
- Requires additional security controls`,
        placeholders: [],
        editable: true
      },
      {
        title: '5. ACCEPTABLE USE',
        content: `All personnel must use {{organization_name}}'s information systems and data responsibly:

**PERMITTED:**
• Using systems for authorized business purposes
• Accessing only data necessary for job functions
• Reporting security concerns immediately

**PROHIBITED:**
• Unauthorized access to systems or data
• Sharing credentials with others
• Installing unauthorized software
• Using company resources for illegal activities
• Circumventing security controls

Detailed requirements are specified in the Acceptable Use Policy.`,
        placeholders: ['{{organization_name}}'],
        editable: true
      },
      {
        title: '6. INCIDENT REPORTING',
        content: `All security incidents, suspected incidents, or security weaknesses must be reported immediately to:

**Security Incident Email:** {{incident_email}}
**Security Hotline:** {{incident_phone}}
**Incident Response Manager:** {{incident_manager}}

Examples of reportable incidents:
• Suspected malware infection
• Lost or stolen devices
• Unauthorized access attempts
• Data breaches or leaks
• Phishing emails
• Security system malfunctions`,
        placeholders: ['{{incident_email}}', '{{incident_phone}}', '{{incident_manager}}'],
        editable: true
      },
      {
        title: '7. NON-COMPLIANCE',
        content: `Violations of this policy may result in disciplinary action, up to and including:
• Written warning
• Suspension of system access
• Termination of employment or contract
• Legal action where appropriate

Breaches will be investigated and may be reported to law enforcement authorities if criminal activity is suspected.`,
        placeholders: [],
        editable: true
      },
      {
        title: '8. POLICY REVIEW',
        content: `This policy will be reviewed annually by {{review_owner}} or whenever significant changes occur to:
• Business operations
• Technology infrastructure
• Legal or regulatory requirements
• Security threat landscape

All personnel will be notified of policy updates and required to acknowledge their understanding.`,
        placeholders: ['{{review_owner}}'],
        editable: true
      }
    ]
  },

  {
    id: 'iso-access-control-policy',
    name: 'Access Control Policy',
    category: 'mandatory',
    iso_reference: ['A.5.15', 'A.5.16', 'A.5.18', 'A.8.2', 'A.8.3'],
    description: 'Controls for managing user access to systems and data',
    customizable: true,
    sections: [
      {
        title: '1. PURPOSE',
        content: `This policy establishes requirements for controlling access to {{organization_name}}'s information systems and data to prevent unauthorized access and ensure appropriate access based on business needs.`,
        placeholders: ['{{organization_name}}'],
        editable: true
      },
      {
        title: '2. USER ACCESS MANAGEMENT',
        content: `**User Registration:**
• Access requests must be approved by line managers and {{it_manager}}
• Unique user IDs assigned to each individual
• No sharing of credentials
• Access provisioned based on job role (Role-Based Access Control)

**Access Reviews:**
• User access rights reviewed quarterly
• Privileged access reviewed monthly
• Terminated users removed immediately from all systems

**Password Requirements:**
• Minimum 12 characters
• Mix of uppercase, lowercase, numbers, and symbols
• Changed every 90 days
• No password reuse (last 12 passwords)
• Multi-factor authentication (MFA) required for:
  - Remote access
  - Privileged accounts
  - Access to confidential data`,
        placeholders: ['{{it_manager}}'],
        editable: true
      },
      {
        title: '3. PRIVILEGED ACCESS MANAGEMENT',
        content: `**Administrative Accounts:**
• Separate from regular user accounts
• Used only for administrative tasks
• All actions logged and monitored
• Additional approval required for granting privileged access

**Third-Party Access:**
• Limited to minimum required for service delivery
• Time-bound access where possible
• NDA and security agreements required
• Access logged and monitored`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'iso-asset-management-policy',
    name: 'Asset Management Policy',
    category: 'mandatory',
    iso_reference: ['A.5.9', 'A.5.10', 'A.5.11', 'A.5.12'],
    description: 'Requirements for identifying, classifying and protecting information assets',
    customizable: true,
    sections: [
      {
        title: '1. ASSET INVENTORY',
        content: `All information assets must be:
• Identified and documented in the asset register
• Assigned an owner responsible for protection
• Classified according to information classification scheme
• Reviewed annually for accuracy

**Asset Categories:**
• Hardware (servers, workstations, mobile devices, network equipment)
• Software (applications, operating systems, utilities)
• Data (databases, files, backups)
• Services (cloud services, managed services)
• People (key personnel with specialized knowledge)`,
        placeholders: [],
        editable: true
      },
      {
        title: '2. ACCEPTABLE USE',
        content: `**Company Assets:**
• Used primarily for business purposes
• Protected according to classification level
• Not to be removed from premises without authorization
• Returned upon termination of employment

**Personal Devices (BYOD):**
• Requires approval and security controls
• Must comply with company security requirements
• Company reserves right to wipe corporate data`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'iso-cryptography-policy',
    name: 'Cryptographic Controls Policy',
    category: 'mandatory',
    iso_reference: ['A.8.24'],
    description: 'Requirements for using cryptography to protect information',
    customizable: true,
    sections: [
      {
        title: '1. ENCRYPTION REQUIREMENTS',
        content: `**Data at Rest:**
• Confidential data must be encrypted using AES-256 or equivalent
• Full disk encryption required on all laptops and mobile devices
• Database encryption for confidential/sensitive data
• Encrypted backups

**Data in Transit:**
• TLS 1.2 or higher for all network communications
• VPN required for remote access
• Secure file transfer protocols (SFTP, HTTPS) for sensitive data

**Key Management:**
• Encryption keys managed by {{key_manager}}
• Keys stored securely separate from encrypted data
• Key rotation annually or when compromised
• Secure key destruction when no longer needed`,
        placeholders: ['{{key_manager}}'],
        editable: true
      }
    ]
  },

  // ===== RECOMMENDED NIS2 POLICIES =====
  {
    id: 'nis2-incident-response-policy',
    name: 'Security Incident Response Policy',
    category: 'recommended',
    iso_reference: ['A.5.24', 'A.5.25', 'A.5.26'],
    nis2_reference: ['Article 23'],
    description: 'Procedures for handling security incidents (NIS2 mandatory)',
    customizable: true,
    sections: [
      {
        title: '1. INCIDENT RESPONSE TEAM',
        content: `**Incident Response Manager:** {{incident_manager}}
**CISO:** {{ciso_name}}
**IT Manager:** {{it_manager}}
**Legal Counsel:** {{legal_counsel}}
**Communications Manager:** {{comm_manager}}

**Contact:**
Email: {{incident_email}}
Phone: {{incident_phone}} (24/7)`,
        placeholders: ['{{incident_manager}}', '{{ciso_name}}', '{{it_manager}}', '{{legal_counsel}}', '{{comm_manager}}', '{{incident_email}}', '{{incident_phone}}'],
        editable: true
      },
      {
        title: '2. INCIDENT CLASSIFICATION',
        content: `**CRITICAL (P1):**
• Data breach affecting personal data
• Complete system outage affecting essential services
• Active cyber attack
• Ransomware infection
**Response Time:** Immediate (within 15 minutes)
**Notification:** Executive management and NIS2 authorities within 24 hours

**HIGH (P2):**
• Partial system outage
• Malware detected
• Significant security vulnerability
**Response Time:** Within 1 hour

**MEDIUM (P3):**
• Suspicious activity
• Policy violations
• Minor security issues
**Response Time:** Within 4 hours

**LOW (P4):**
• Security awareness issues
• Non-urgent security questions
**Response Time:** Within 24 hours`,
        placeholders: [],
        editable: true
      },
      {
        title: '3. INCIDENT RESPONSE PHASES',
        content: `**1. DETECTION & REPORTING (0-15 min)**
• Incident identified by monitoring, users, or external notification
• Initial report created with available details
• Incident Response Manager notified

**2. ASSESSMENT & CLASSIFICATION (15-60 min)**
• Severity determined
• Scope evaluated
• Resources mobilized
• Initial containment actions

**3. CONTAINMENT (1-4 hours)**
• Isolate affected systems
• Prevent further damage
• Preserve evidence
• Document all actions

**4. ERADICATION (varies)**
• Remove threat/vulnerability
• Apply patches/fixes
• Verify complete removal

**5. RECOVERY (varies)**
• Restore systems to normal operation
• Verify security controls
• Enhanced monitoring

**6. POST-INCIDENT (within 7 days)**
• Root cause analysis
• Lessons learned
• Update procedures
• Report to authorities (if required)`,
        placeholders: [],
        editable: true
      },
      {
        title: '4. NIS2 REPORTING OBLIGATIONS',
        content: `For incidents affecting essential services, {{organization_name}} will:

**Early Warning (within 24 hours of awareness):**
• Notification to CSIRT/national authority
• Initial assessment of severity and impact

**Incident Notification (within 72 hours):**
• Detailed incident report
• Impact assessment
• Severity indicators
• Cross-border implications

**Final Report (within 1 month):**
• Comprehensive incident analysis
• Root cause
• Corrective measures implemented
• Preventive actions

**Contact:** National CSIRT: {{csirt_contact}}`,
        placeholders: ['{{organization_name}}', '{{csirt_contact}}'],
        editable: true
      }
    ]
  },

  {
    id: 'nis2-business-continuity-policy',
    name: 'Business Continuity & Disaster Recovery Policy',
    category: 'recommended',
    iso_reference: ['A.5.29', 'A.5.30'],
    nis2_reference: ['Article 21(2)(e)'],
    description: 'Plans for maintaining operations during disruptions (NIS2 requirement)',
    customizable: true,
    sections: [
      {
        title: '1. OBJECTIVES',
        content: `{{organization_name}} is committed to:
• Ensuring continuity of essential services during disruptions
• Minimizing impact on customers and stakeholders
• Meeting regulatory requirements including NIS2
• Protecting personnel and assets

**Recovery Objectives:**
• Recovery Time Objective (RTO): {{rto_hours}} hours for critical systems
• Recovery Point Objective (RPO): {{rpo_hours}} hours maximum data loss
• Minimum Business Continuity Objective (MBCO): {{mbco_percentage}}% of normal capacity`,
        placeholders: ['{{organization_name}}', '{{rto_hours}}', '{{rpo_hours}}', '{{mbco_percentage}}'],
        editable: true
      },
      {
        title: '2. BACKUP STRATEGY',
        content: `**Backup Schedule:**
• Critical systems: Real-time replication + daily backups
• Important systems: Daily incremental, weekly full backup
• Standard systems: Weekly full backup

**Backup Storage:**
• Primary: On-site encrypted storage
• Secondary: Off-site/cloud encrypted storage (3-2-1 rule)
• Retention: 30 days online, 7 years archived

**Testing:**
• Backup restoration tested monthly
• Full disaster recovery test annually
• Results documented and reviewed`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'nis2-supply-chain-security',
    name: 'Supply Chain Security Policy',
    category: 'recommended',
    iso_reference: ['A.5.19', 'A.5.20', 'A.5.21', 'A.5.22', 'A.5.23'],
    nis2_reference: ['Article 21(2)(d)'],
    description: 'Security requirements for suppliers and service providers (NIS2)',
    customizable: true,
    sections: [
      {
        title: '1. SUPPLIER ASSESSMENT',
        content: `All suppliers with access to {{organization_name}}'s systems or data must undergo security assessment:

**Pre-Contract:**
• Security questionnaire completion
• Risk assessment based on access level
• Financial stability check
• References verification

**Risk Categories:**
• HIGH: Access to confidential data or critical systems
  - Detailed security audit required
  - ISO 27001 certification preferred
• MEDIUM: Limited data access or standard services
  - Security questionnaire review
  - NDA required
• LOW: No data access
  - Standard contract terms`,
        placeholders: ['{{organization_name}}'],
        editable: true
      },
      {
        title: '2. CONTRACT REQUIREMENTS',
        content: `Supplier contracts must include:
• Data protection clauses (GDPR compliance)
• Security requirements and controls
• Right to audit
• Incident notification obligations (within 24 hours)
• Liability and indemnification
• Service level agreements (SLAs)
• Exit and data return procedures
• NIS2 compliance requirements (where applicable)`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'nis2-vulnerability-management',
    name: 'Vulnerability Management Policy',
    category: 'recommended',
    iso_reference: ['A.8.8'],
    nis2_reference: ['Article 21(2)(b)'],
    description: 'Process for identifying and remediating vulnerabilities (NIS2)',
    customizable: true,
    sections: [
      {
        title: '1. VULNERABILITY SCANNING',
        content: `**Automated Scanning:**
• Internal network scan: Weekly
• External perimeter scan: Weekly
• Web application scan: Monthly
• Authenticated scans for deeper assessment

**Scope:**
• All internet-facing systems
• Internal servers and workstations
• Network devices
• Web applications
• Cloud infrastructure`,
        placeholders: [],
        editable: true
      },
      {
        title: '2. PATCH MANAGEMENT',
        content: `**Patch Schedule:**
• CRITICAL vulnerabilities (CVSS 9.0-10.0): Within 48 hours
• HIGH vulnerabilities (CVSS 7.0-8.9): Within 7 days
• MEDIUM vulnerabilities (CVSS 4.0-6.9): Within 30 days
• LOW vulnerabilities (CVSS 0.1-3.9): Next maintenance window

**Process:**
1. Patch assessment and testing in dev environment
2. Change approval
3. Deployment to production
4. Verification
5. Documentation

**Emergency Patching:**
For actively exploited zero-day vulnerabilities, emergency patching procedures may override normal change management.`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'nis2-data-protection-policy',
    name: 'Data Protection & Privacy Policy',
    category: 'recommended',
    iso_reference: ['A.5.33', 'A.5.34'],
    nis2_reference: ['Article 21'],
    description: 'GDPR and data protection requirements',
    customizable: true,
    sections: [
      {
        title: '1. DATA PROTECTION PRINCIPLES',
        content: `{{organization_name}} processes personal data in accordance with GDPR principles:

**Lawfulness, Fairness, Transparency:**
• Clear legal basis for processing
• Privacy notices provided
• Transparent processing activities

**Purpose Limitation:**
• Data collected for specified purposes only
• No further incompatible processing

**Data Minimization:**
• Only necessary data collected
• Regular review of data holdings

**Accuracy:**
• Data kept accurate and up to date
• Mechanisms for correction

**Storage Limitation:**
• Retention periods defined
• Secure deletion when no longer needed

**Integrity & Confidentiality:**
• Appropriate security measures
• Protection against unauthorized access

**Accountability:**
• Documentation of compliance
• Data Protection Officer: {{dpo_name}}`,
        placeholders: ['{{organization_name}}', '{{dpo_name}}'],
        editable: true
      }
    ]
  },

  {
    id: 'remote-work-policy',
    name: 'Remote Work Security Policy',
    category: 'recommended',
    iso_reference: ['A.6.7'],
    description: 'Security requirements for remote and mobile workers',
    customizable: true,
    sections: [
      {
        title: '1. REMOTE ACCESS REQUIREMENTS',
        content: `**Mandatory Security Controls:**
• VPN connection for all company resource access
• Multi-factor authentication (MFA) enabled
• Company-provided or approved devices only
• Full disk encryption
• Up-to-date antivirus/EDR software
• Automatic screen lock (5 minutes)

**Network Security:**
• No use of public Wi-Fi without VPN
• Secure home network setup guidance provided
• Personal firewall enabled

**Physical Security:**
• Devices kept secure when unattended
• No unauthorized persons viewing screen
• Privacy screens recommended for public spaces`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'security-awareness-policy',
    name: 'Security Awareness & Training Policy',
    category: 'recommended',
    iso_reference: ['A.6.3'],
    description: 'Requirements for security training and awareness',
    customizable: true,
    sections: [
      {
        title: '1. TRAINING REQUIREMENTS',
        content: `**New Employee Onboarding:**
• Security orientation during first week
• Policy acknowledgment required
• Account setup and credential issuance

**Annual Training (Mandatory):**
• Information security fundamentals
• Data protection and privacy
• Phishing awareness
• Incident reporting
• Social engineering defense
• Mobile device security

**Role-Specific Training:**
• Developers: Secure coding practices
• Administrators: Privileged access management
• Managers: Security risk management

**Awareness Activities:**
• Monthly security tips
• Simulated phishing campaigns (quarterly)
• Security awareness posters and reminders
• Security newsletter`,
        placeholders: [],
        editable: true
      }
    ]
  },

  {
    id: 'byod-policy',
    name: 'Bring Your Own Device (BYOD) Policy',
    category: 'recommended',
    iso_reference: ['A.6.7', 'A.8.1'],
    description: 'Requirements for using personal devices for work',
    customizable: true,
    sections: [
      {
        title: '1. APPROVED DEVICES & ENROLLMENT',
        content: `**Eligible Devices:**
• Smartphones (iOS 15+, Android 12+)
• Tablets (iOS 15+, Android 12+)
• Laptops (approved on case-by-case basis)

**Enrollment Process:**
• Request approval from {{it_manager}}
• Install Mobile Device Management (MDM) agent
• Accept security policies
• Complete security configuration

**Security Requirements:**
• Device passcode/biometric enabled (6+ digits)
• Automatic lock after 5 minutes
• Encryption enabled
• Find My Device/Remote Wipe capability
• Separate work profile/container for company data`,
        placeholders: ['{{it_manager}}'],
        editable: true
      },
      {
        title: '2. DATA SEPARATION & PRIVACY',
        content: `**Company Rights:**
• Install and manage security software
• Remote wipe company data (not personal data)
• Monitor company app usage
• Enforce security policies

**User Rights:**
• Personal data remains private
• Company only accesses work-related data
• User informed before any remote action

**Prohibited:**
• Jailbreaking or rooting devices
• Disabling security features
• Storing confidential data outside company apps`,
        placeholders: [],
        editable: true
      }
    ]
  }
];

export const EMPTY_POLICY_TEMPLATE: PolicyTemplate = {
  id: 'custom-blank',
  name: 'Blank Policy Template',
  category: 'custom',
  iso_reference: [],
  description: 'Start from scratch',
  customizable: true,
  sections: [
    {
      title: '1. Purpose & Scope',
      content: 'Describe the purpose of this policy...',
      placeholders: [],
      editable: true
    },
    {
      title: '2. Policy Statement',
      content: 'Define the policy requirements...',
      placeholders: [],
      editable: true
    },
    {
      title: '3. Responsibilities',
      content: 'Define roles and responsibilities...',
      placeholders: [],
      editable: true
    }
  ]
};

// Helper to get templates by category
export const getTemplatesByCategory = (category: PolicyTemplate['category']) => {
  return POLICY_TEMPLATES.filter(t => t.category === category);
};

export const getMandatoryTemplates = () => getTemplatesByCategory('mandatory');
export const getRecommendedTemplates = () => getTemplatesByCategory('recommended');
