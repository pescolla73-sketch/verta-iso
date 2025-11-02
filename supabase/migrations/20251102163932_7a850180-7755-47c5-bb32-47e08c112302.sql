-- Create procedures table
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organization(id),
  
  -- Document identification
  procedure_id VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'custom',
  
  -- Classification
  iso_reference TEXT[],
  related_policy_id UUID REFERENCES policies(id),
  
  -- Content sections
  purpose TEXT NOT NULL,
  scope TEXT NOT NULL,
  responsibilities TEXT,
  procedure_steps TEXT NOT NULL,
  related_documents TEXT,
  definitions TEXT,
  records TEXT,
  
  -- Status & Versioning
  status VARCHAR(30) DEFAULT 'draft',
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Approval
  prepared_by VARCHAR(255),
  approved_by VARCHAR(255),
  approval_date DATE,
  next_review_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Auto-generate procedure ID
CREATE OR REPLACE FUNCTION generate_procedure_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.procedure_id IS NULL OR NEW.procedure_id = '' THEN
    NEW.procedure_id := 'PROC-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(procedure_id FROM 6) AS INTEGER)), 0) + 1
       FROM procedures 
       WHERE organization_id = NEW.organization_id 
       AND procedure_id IS NOT NULL)::TEXT, 
      3, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_procedure_id
  BEFORE INSERT ON procedures
  FOR EACH ROW
  EXECUTE FUNCTION generate_procedure_id();

-- Indexes
CREATE INDEX idx_procedures_org ON procedures(organization_id);
CREATE INDEX idx_procedures_category ON procedures(category);
CREATE INDEX idx_procedures_status ON procedures(status);

-- RLS
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view procedures for testing"
ON procedures FOR SELECT
USING (true);

CREATE POLICY "Public can insert procedures for testing"
ON procedures FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update procedures for testing"
ON procedures FOR UPDATE
USING (true);

CREATE POLICY "Public can delete procedures for testing"
ON procedures FOR DELETE
USING (true);

-- Procedure Templates table
CREATE TABLE IF NOT EXISTS procedure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  iso_reference TEXT[],
  related_policy VARCHAR(255),
  
  -- Template content
  purpose_template TEXT,
  scope_template TEXT,
  responsibilities_template TEXT,
  steps_template TEXT,
  records_template TEXT,
  
  -- Metadata
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for templates
ALTER TABLE procedure_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view procedure templates"
ON procedure_templates FOR SELECT
USING (true);

-- Insert mandatory procedure templates
INSERT INTO procedure_templates (name, category, iso_reference, related_policy, order_index, purpose_template, scope_template, responsibilities_template, steps_template, records_template) VALUES

('Risk Assessment Procedure', 'mandatory', ARRAY['6.1.2'], 'Risk Management Policy', 1,
'To define the process for identifying, analyzing, and evaluating information security risks in {{organization_name}}.',
'This procedure applies to all information assets, processes, and services within the ISMS scope.',
'• CISO: Overall responsibility for risk assessment process
• Risk Owners: Responsible for identifying and assessing risks in their areas
• Asset Owners: Provide input on asset criticality and vulnerabilities',
'1. ASSET IDENTIFICATION
   - Identify all information assets within scope
   - Document asset owners and classification
   
2. THREAT IDENTIFICATION
   - Identify potential threats for each asset
   - Consider internal and external threats
   
3. VULNERABILITY IDENTIFICATION
   - Identify vulnerabilities that could be exploited
   - Review technical and organizational vulnerabilities
   
4. RISK ANALYSIS
   - Assess likelihood of threat exploiting vulnerability
   - Assess potential impact to confidentiality, integrity, availability
   - Calculate risk level (Likelihood × Impact)
   
5. RISK EVALUATION
   - Compare risk levels against risk acceptance criteria
   - Prioritize risks requiring treatment
   
6. RISK TREATMENT
   - Select appropriate treatment option (mitigate, accept, avoid, transfer)
   - Document treatment plan and controls
   
7. REVIEW AND UPDATE
   - Review risk assessment at least annually
   - Update when significant changes occur',
'• Risk Register
• Risk Assessment Reports
• Risk Treatment Plans'),

('Access Control Procedure', 'mandatory', ARRAY['5.15', '5.16', '5.18'], 'Access Control Policy', 2,
'To ensure that access to {{organization_name}}''s information systems and data is properly managed and controlled.',
'This procedure applies to all users requiring access to information systems and data.',
'• IT Manager: Implements and maintains access controls
• System Owners: Approve access requests for their systems
• HR: Notifies IT of joiners/leavers
• All Users: Comply with access control requirements',
'1. ACCESS REQUEST
   - User or manager submits access request
   - Specify systems, data, and access level required
   - Provide business justification
   
2. APPROVAL
   - System owner reviews and approves/rejects request
   - Verify business need and principle of least privilege
   
3. PROVISIONING
   - IT creates user account with approved access rights
   - Assign appropriate security group memberships
   - Configure authentication requirements
   
4. USER NOTIFICATION
   - Notify user of account creation
   - Provide credentials securely
   - Require password change on first login
   
5. ACCESS REVIEW
   - Quarterly review of all user access rights
   - System owners verify access still required
   - Remove unnecessary access
   
6. ACCESS MODIFICATION
   - Process change requests (role changes, additional access)
   - Follow same approval workflow
   
7. ACCESS REVOCATION
   - HR notifies IT immediately upon termination
   - Disable account within 1 hour
   - Remove all access rights
   - Retrieve company devices and access tokens',
'• Access Request Forms
• Access Approval Records
• User Account Logs
• Access Review Reports'),

('Incident Response Procedure', 'mandatory', ARRAY['5.24', '5.25', '5.26', '5.27'], 'Incident Management Policy', 3,
'To establish a structured approach for detecting, reporting, and responding to information security incidents.',
'This procedure applies to all information security incidents affecting {{organization_name}}.',
'• Incident Response Team: Coordinates incident response
• All Employees: Report suspected incidents immediately
• IT Team: Technical investigation and containment
• Legal/Compliance: Advise on regulatory requirements',
'1. DETECTION & REPORTING
   - Monitor for security incidents via alerts, logs, reports
   - Any employee who suspects incident reports immediately
   - Report within 1 hour of discovery
   
2. INITIAL ASSESSMENT
   - Incident Response Team assesses severity:
     * Critical: Data breach, ransomware, system compromise
     * High: Attempted breach, malware infection
     * Medium: Policy violation, suspicious activity
     * Low: Failed security control, minor issue
   
3. CONTAINMENT
   - Critical/High: Isolate affected systems immediately
   - Disconnect from network if necessary
   - Preserve evidence for investigation
   - Prevent incident spread
   
4. INVESTIGATION
   - Analyze logs and affected systems
   - Determine root cause and attack vector
   - Identify scope of compromise
   - Document findings
   
5. ERADICATION
   - Remove malware/unauthorized access
   - Close vulnerabilities exploited
   - Verify threat eliminated
   
6. RECOVERY
   - Restore systems from clean backups
   - Verify system integrity before reconnecting
   - Monitor for recurrence
   
7. POST-INCIDENT REVIEW
   - Document lessons learned
   - Update controls and procedures
   - Conduct training if needed
   
8. NOTIFICATION
   - Notify authorities if required (GDPR breach within 72h)
   - Notify affected parties
   - Document all notifications',
'• Incident Reports
• Investigation Findings
• Remediation Actions
• Post-Incident Review Reports
• Notification Records'),

('Backup & Recovery Procedure', 'mandatory', ARRAY['8.13'], 'Backup Policy', 4,
'To ensure business-critical data is regularly backed up and can be recovered when needed.',
'This procedure applies to all systems and data classified as business-critical.',
'• IT Operations: Performs backups and tests recovery
• System Owners: Define backup requirements and RPO/RTO
• CISO: Ensures backup procedures are adequate',
'1. BACKUP SCHEDULE
   - Critical databases: Daily full + hourly incremental
   - File servers: Daily incremental, weekly full
   - Email: Daily
   - Configuration backups: After each change
   
2. BACKUP EXECUTION
   - Automated backups run per schedule
   - Verify backup completion via monitoring
   - Alert on backup failures
   
3. BACKUP STORAGE
   - Primary: On-site backup server
   - Secondary: Cloud backup (encrypted)
   - Retention: 
     * Daily backups: 7 days
     * Weekly backups: 4 weeks
     * Monthly backups: 12 months
     * Annual backups: 7 years
   
4. BACKUP VERIFICATION
   - Weekly: Verify backup integrity via checksums
   - Monthly: Test restore of random samples
   
5. RECOVERY TESTING
   - Quarterly: Full disaster recovery test
   - Document recovery time achieved
   - Update procedures based on lessons learned
   
6. RECOVERY PROCEDURE
   - Assess data loss and identify recovery point needed
   - Obtain approval from data owner
   - Restore data from appropriate backup
   - Verify data integrity post-recovery
   - Document recovery performed',
'• Backup Logs
• Backup Verification Reports
• Recovery Test Results
• Recovery Requests and Results'),

('Change Management Procedure', 'mandatory', ARRAY['8.32'], 'Change Management Policy', 5,
'To ensure changes to IT systems are controlled, tested, and documented to minimize risk.',
'This procedure applies to all changes to production systems, infrastructure, and applications.',
'• Change Manager: Approves changes and maintains change calendar
• Requestor: Submits change request with full details
• IT Team: Implements approved changes
• CAB (Change Advisory Board): Reviews high-risk changes',
'1. CHANGE REQUEST
   - Submit change request including:
     * Description of change
     * Business justification
     * Systems affected
     * Risk assessment
     * Rollback plan
     * Implementation timeline
   
2. CHANGE CLASSIFICATION
   - Standard: Pre-approved, low risk (e.g., password reset)
   - Normal: Requires approval, moderate risk
   - Emergency: Urgent, high risk (security incident response)
   
3. APPROVAL
   - Standard: Auto-approved
   - Normal: Change Manager approval required
   - Emergency: CISO + Business Owner approval
   - High-risk: CAB review and approval
   
4. SCHEDULING
   - Schedule change in maintenance window
   - Check change calendar for conflicts
   - Notify affected users
   
5. TESTING
   - Test change in non-production environment
   - Document test results
   - Obtain sign-off before production
   
6. IMPLEMENTATION
   - Follow implementation plan
   - Document each step
   - Monitor during implementation
   
7. VERIFICATION
   - Verify change successful
   - Test affected functionality
   - Confirm no adverse impacts
   
8. ROLLBACK (if needed)
   - Execute rollback plan if issues occur
   - Document reason for rollback
   - Reschedule after resolving issues
   
9. POST-IMPLEMENTATION REVIEW
   - Review change success
   - Document lessons learned
   - Update procedures if needed',
'• Change Requests
• Approval Records
• Implementation Logs
• Test Results
• Post-Implementation Reviews'),

('Vulnerability Management Procedure', 'mandatory', ARRAY['8.8'], 'Vulnerability Management Policy', 6,
'To identify, assess, and remediate technical vulnerabilities in a timely manner.',
'This procedure applies to all IT systems, applications, and infrastructure.',
'• IT Security: Performs vulnerability scanning and coordinates remediation
• System Owners: Prioritize and remediate vulnerabilities
• IT Operations: Implements patches and fixes',
'1. VULNERABILITY SCANNING
   - Automated scans: Weekly for internet-facing, monthly for internal
   - Use authenticated scanning where possible
   - Scan all systems, applications, network devices
   
2. VULNERABILITY ASSESSMENT
   - Review scan results
   - Validate findings (eliminate false positives)
   - Assess exploitability and impact
   
3. RISK PRIORITIZATION
   Based on CVSS score and context:
   - Critical (CVSS 9.0-10.0): Remediate within 7 days
   - High (CVSS 7.0-8.9): Remediate within 30 days
   - Medium (CVSS 4.0-6.9): Remediate within 90 days
   - Low (CVSS 0.1-3.9): Remediate within 180 days
   
4. REMEDIATION PLANNING
   - Determine remediation approach (patch, configuration, workaround)
   - Assign to responsible team
   - Schedule remediation
   
5. REMEDIATION IMPLEMENTATION
   - Test patches in non-production first
   - Apply patches per change management procedure
   - Document remediation actions
   
6. VERIFICATION
   - Re-scan to verify vulnerability resolved
   - Close ticket when verified
   
7. EXCEPTION HANDLING
   - If remediation not possible, document:
     * Reason remediation not feasible
     * Compensating controls
     * Risk acceptance approval
     * Review date
   
8. REPORTING
   - Monthly vulnerability metrics
   - Open vulnerabilities by severity
   - Mean time to remediate
   - Exception status',
'• Vulnerability Scan Reports
• Remediation Plans
• Patch Records
• Exception Approvals
• Metrics Reports'),

('Asset Management Procedure', 'mandatory', ARRAY['5.9'], 'Asset Management Policy', 7,
'To maintain an accurate inventory of information assets and ensure proper classification and handling.',
'This procedure applies to all information assets within the ISMS scope.',
'• Asset Owners: Responsible for classifying and protecting their assets
• IT Asset Manager: Maintains asset inventory
• All Employees: Handle assets according to classification',
'1. ASSET IDENTIFICATION
   - Identify all information assets (hardware, software, data, services)
   - Assign unique asset identifier
   - Assign asset owner
   
2. ASSET REGISTRATION
   - Register asset in inventory system
   - Record: type, location, owner, value, dependencies
   
3. ASSET CLASSIFICATION
   Owner classifies asset based on:
   - Public: No restriction (e.g., marketing materials)
   - Internal: Internal use only (e.g., policies)
   - Confidential: Restricted (e.g., financial data)
   - Strictly Confidential: Highly restricted (e.g., personal data)
   
4. LABELING
   - Label physical assets with classification
   - Mark documents/files with classification header/footer
   
5. HANDLING REQUIREMENTS
   Based on classification:
   - Strictly Confidential: Encrypted storage, MFA access, audit logs
   - Confidential: Access controls, secure disposal
   - Internal: Basic access controls
   - Public: No special controls
   
6. ASSET REVIEW
   - Quarterly: Review asset inventory
   - Verify assets still exist and classification still accurate
   - Update changes
   
7. ASSET DISPOSAL
   - Obtain disposal approval from asset owner
   - Sanitize/destroy per classification level:
     * Strictly Confidential: Cryptographic erasure or physical destruction
     * Confidential: Secure erasure (7-pass)
     * Internal/Public: Standard deletion
   - Document disposal
   - Remove from inventory',
'• Asset Inventory
• Asset Classification Records
• Asset Review Reports
• Asset Disposal Certificates'),

('Business Continuity Procedure', 'mandatory', ARRAY['5.29', '5.30'], 'Business Continuity Policy', 8,
'To ensure {{organization_name}} can continue critical operations during disruptions.',
'This procedure applies to all business-critical processes and IT systems.',
'• BC Coordinator: Maintains BC plans and coordinates testing
• Process Owners: Define recovery requirements
• Crisis Management Team: Activates and manages BC response',
'1. BUSINESS IMPACT ANALYSIS (BIA)
   - Identify critical business processes
   - Determine dependencies (people, systems, facilities)
   - Define Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
   
2. RECOVERY STRATEGIES
   For each critical process, define:
   - Alternate work locations
   - Technology recovery (failover, backup systems)
   - Workaround procedures
   - Resource requirements
   
3. BC PLAN MAINTENANCE
   - Document BC procedures for each critical process
   - Update plans when changes occur
   - Review plans annually
   
4. ACTIVATION
   When disruption occurs:
   - Assess situation and impact
   - Declare BC activation if needed
   - Activate Crisis Management Team
   - Notify stakeholders
   
5. RESPONSE
   - Implement recovery strategies per plan
   - Relocate to alternate site if needed
   - Restore critical systems
   - Resume critical operations within RTO
   
6. COMMUNICATION
   - Internal: Staff, management
   - External: Customers, suppliers, authorities
   - Regular status updates
   
7. RECOVERY
   - Assess damage to primary site/systems
   - Plan return to normal operations
   - Execute phased return
   
8. POST-INCIDENT REVIEW
   - Evaluate BC response effectiveness
   - Document lessons learned
   - Update BC plans
   
9. TESTING
   - Annual: Full BC exercise
   - Semi-annual: Desktop exercise
   - Quarterly: Recovery capability tests
   - Document test results and improvements',
'• Business Impact Analysis
• BC Plans
• Test Results
• Activation Records
• Post-Incident Reviews'),

('Physical Security Procedure', 'recommended', ARRAY['7.1', '7.2', '7.4'], 'Physical Security Policy', 9,
'To control physical access to {{organization_name}} facilities and protect physical assets.',
'This procedure applies to all facilities where information assets are stored or processed.',
'• Facilities Manager: Maintains physical security controls
• Security Team: Monitors access and responds to incidents
• All Employees: Comply with physical security requirements',
'1. ACCESS CONTROL
   - Badge-based access control system
   - Visitor registration and escort
   - Access rights based on role
   
2. MONITORING
   - CCTV surveillance of entry points
   - Security guard presence during business hours
   - Intrusion detection after hours
   
3. VISITOR MANAGEMENT
   - Sign in/out required
   - Issue visitor badge
   - Escort required in restricted areas
   - Log maintained
   
4. KEY/BADGE MANAGEMENT
   - Issue badges to authorized personnel
   - Collect badges upon termination
   - Report lost badges immediately
   - Rekey/reprogram if compromised',
'• Access Logs
• Visitor Logs
• Badge Issue Records
• Security Incident Reports'),

('Cryptographic Controls Procedure', 'recommended', ARRAY['8.24'], 'Cryptography Policy', 10,
'To ensure proper use of cryptography to protect information.',
'Applies to all systems processing sensitive data.',
'• IT Security: Defines cryptographic standards
• System Administrators: Implement encryption
• Developers: Use approved cryptographic libraries',
'1. DATA CLASSIFICATION REVIEW
   - Identify data requiring encryption
   
2. ENCRYPTION STANDARDS
   - Data at rest: AES-256
   - Data in transit: TLS 1.2+
   - Approved algorithms only
   
3. KEY MANAGEMENT
   - Generate keys using approved tools
   - Store keys securely (HSM/key vault)
   - Rotate keys annually
   - Revoke compromised keys immediately
   
4. IMPLEMENTATION
   - Enable encryption per standards
   - Test encryption functionality
   - Document implementation',
'• Encryption Configuration Records
• Key Generation Logs
• Key Rotation Records
• Cryptographic Audit Reports'),

('Audit and Logging Procedure', 'recommended', ARRAY['8.15'], 'Logging Policy', 11,
'To ensure security events are logged and monitored.',
'Applies to all IT systems.',
'• IT Operations: Configure and monitor logs
• Security Team: Reviews security events
• System Owners: Define logging requirements',
'1. LOG CONFIGURATION
   - Enable audit logging on all systems
   - Log: authentication, authorization, changes, errors
   - Synchronize clocks (NTP)
   
2. LOG COLLECTION
   - Centralize logs in SIEM
   - Retain logs 12 months
   
3. LOG MONITORING
   - Daily review of critical alerts
   - Investigate anomalies
   
4. LOG PROTECTION
   - Logs read-only for users
   - Tamper-evident storage
   - Encrypted transmission',
'• Log Configuration Records
• Security Event Logs
• Log Review Reports
• Incident Investigation Logs'),

('Supplier Security Procedure', 'recommended', ARRAY['5.21', '5.22'], 'Supply Chain Security Policy', 12,
'To manage information security risks in supplier relationships.',
'Applies to all suppliers with access to systems or data.',
'• Procurement: Ensures security requirements in contracts
• IT Security: Conducts security assessments
• Legal: Reviews contract clauses',
'1. SUPPLIER ASSESSMENT
   - Security questionnaire
   - Review certifications (ISO 27001, SOC 2)
   - Risk assessment
   
2. CONTRACTUAL REQUIREMENTS
   - Include security requirements in contracts
   - NDA required
   - Right to audit
   
3. ONGOING MONITORING
   - Annual security review
   - Incident notification requirement
   
4. OFFBOARDING
   - Revoke access
   - Return/destroy data
   - Final security review',
'• Supplier Security Assessments
• Security Questionnaires
• Contract Security Clauses
• Supplier Review Reports');