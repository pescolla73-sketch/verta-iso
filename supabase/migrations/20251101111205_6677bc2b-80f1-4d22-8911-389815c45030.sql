-- Add structured fields to policies table for better content management
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS policy_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS scope TEXT,
ADD COLUMN IF NOT EXISTS policy_statement TEXT,
ADD COLUMN IF NOT EXISTS roles_responsibilities TEXT,
ADD COLUMN IF NOT EXISTS procedures TEXT,
ADD COLUMN IF NOT EXISTS compliance_requirements TEXT,
ADD COLUMN IF NOT EXISTS review_requirements TEXT,
ADD COLUMN IF NOT EXISTS prepared_by VARCHAR(255);

-- Create unique index on policy_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_policies_policy_id ON policies(policy_id) WHERE policy_id IS NOT NULL;

-- Auto-generate policy ID function
CREATE OR REPLACE FUNCTION generate_policy_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.policy_id IS NULL OR NEW.policy_id = '' THEN
    NEW.policy_id := 'POL-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(policy_id FROM 5) AS INTEGER)), 0) + 1
       FROM policies 
       WHERE organization_id = NEW.organization_id 
       AND policy_id IS NOT NULL)::TEXT, 
      3, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto policy ID generation
DROP TRIGGER IF EXISTS set_policy_id ON policies;
CREATE TRIGGER set_policy_id
  BEFORE INSERT ON policies
  FOR EACH ROW
  EXECUTE FUNCTION generate_policy_id();

-- Create policy_templates table for reusable templates
CREATE TABLE IF NOT EXISTS policy_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- 'mandatory', 'recommended'
  iso_reference TEXT[],
  nis2_reference TEXT[],
  
  -- Template content with placeholders
  purpose_template TEXT,
  scope_template TEXT,
  policy_statement_template TEXT,
  roles_template TEXT,
  procedures_template TEXT,
  compliance_template TEXT,
  review_template TEXT,
  
  -- Metadata
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on policy_templates
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;

-- Public read access to templates (they're generic)
CREATE POLICY "Everyone can view policy templates"
ON policy_templates FOR SELECT
USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage policy templates"
ON policy_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert mandatory ISO 27001:2022 policy templates
INSERT INTO policy_templates (name, category, iso_reference, order_index, purpose_template, scope_template, policy_statement_template) VALUES
('Information Security Policy', 'mandatory', ARRAY['5.2'], 1,
'To establish {{organization_name}}''s commitment to information security and provide direction for the Information Security Management System (ISMS).',
'This policy applies to all employees, contractors, suppliers, and third parties who have access to {{organization_name}}''s information assets.',
'{{organization_name}} is committed to:
• Protecting the confidentiality, integrity, and availability of information
• Complying with legal, regulatory, and contractual requirements
• Continually improving the ISMS
• Providing adequate resources for information security
• Ensuring all personnel understand their security responsibilities'),

('Access Control Policy', 'mandatory', ARRAY['5.15', '5.18'], 2,
'To ensure that access to {{organization_name}}''s information and systems is appropriately controlled and monitored.',
'This policy applies to all users who require access to {{organization_name}}''s information systems and data.',
'Access to information systems shall be:
• Granted based on business need and least privilege principle
• Authorized by system/data owners
• Regularly reviewed and revoked when no longer needed
• Protected by strong authentication mechanisms
• Logged and monitored for security incidents'),

('Acceptable Use Policy', 'mandatory', ARRAY['5.10'], 3,
'To define acceptable use of {{organization_name}}''s information systems and resources.',
'This policy applies to all users of {{organization_name}}''s IT systems and devices.',
'Users must:
• Use systems only for authorized business purposes
• Not share credentials or allow unauthorized access
• Report security incidents immediately
• Comply with all security policies and procedures
• Respect intellectual property and data privacy'),

('Backup and Recovery Policy', 'mandatory', ARRAY['8.13'], 4,
'To ensure business-critical data is regularly backed up and can be recovered when needed.',
'This policy applies to all information systems and data classified as business-critical.',
'Backup procedures shall:
• Be performed regularly (daily/weekly/monthly based on criticality)
• Include offsite or cloud storage for disaster recovery
• Be tested periodically to ensure recoverability
• Support defined Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO)
• Be documented and maintained'),

('Physical Security Policy', 'mandatory', ARRAY['7.1', '7.2', '7.3', '7.4'], 5,
'To protect {{organization_name}}''s physical assets and prevent unauthorized physical access.',
'This policy applies to all {{organization_name}} facilities where information assets are stored or processed.',
'Physical security controls include:
• Access control systems and visitor management
• Environmental controls (fire, water, temperature)
• Equipment protection and secure disposal
• Clear desk and clear screen policies
• Security monitoring and incident response'),

('Incident Management Policy', 'mandatory', ARRAY['5.24', '5.25', '5.26', '5.27', '5.28'], 6,
'To establish procedures for detecting, reporting, assessing, and responding to information security incidents.',
'This policy applies to all information security incidents affecting {{organization_name}}.',
'Security incidents shall be:
• Reported immediately to the incident response team
• Assessed and prioritized based on severity and impact
• Responded to according to incident response procedures
• Documented with lessons learned
• Used to improve security controls and processes'),

('Business Continuity Policy', 'mandatory', ARRAY['5.29', '5.30'], 7,
'To ensure {{organization_name}} can continue critical operations during and after disruptions.',
'This policy applies to all business-critical processes and supporting IT systems.',
'Business continuity planning includes:
• Business impact analysis to identify critical processes
• Recovery strategies for different disruption scenarios
• BC/DR plans and procedures
• Regular testing and updates
• Training and awareness for all personnel'),

('Cryptography Policy', 'mandatory', ARRAY['8.24'], 8,
'To ensure appropriate cryptographic controls are used to protect sensitive information.',
'This policy applies to all systems that process, store, or transmit sensitive data.',
'Cryptographic controls shall:
• Use industry-standard algorithms and protocols
• Implement proper key management and lifecycle
• Be applied to data at rest and in transit
• Be regularly reviewed and updated
• Comply with legal and regulatory requirements');

-- Insert recommended NIS2-aligned policy templates
INSERT INTO policy_templates (name, category, iso_reference, nis2_reference, order_index, purpose_template, scope_template, policy_statement_template) VALUES
('Supply Chain Security Policy', 'recommended', ARRAY['5.21', '5.22', '5.23'], ARRAY['Art. 21'], 9,
'To manage information security risks in the supply chain and ensure third-party compliance.',
'This policy applies to all suppliers and service providers with access to {{organization_name}}''s systems or data.',
'Supplier security requirements:
• Security assessment before engagement
• Contractual security obligations
• Regular security reviews and audits
• Incident notification requirements
• Right to audit and terminate'),

('Vulnerability Management Policy', 'recommended', ARRAY['8.8'], ARRAY['Art. 21'], 10,
'To identify, assess, and remediate technical vulnerabilities in a timely manner.',
'This policy applies to all IT systems and applications operated by {{organization_name}}.',
'Vulnerability management includes:
• Regular vulnerability scanning and assessment
• Risk-based prioritization of remediation
• Timely patching (critical: 7 days, high: 30 days, medium: 90 days)
• Tracking and reporting
• Exception handling for systems that cannot be patched'),

('Change Management Policy', 'recommended', ARRAY['8.32'], NULL, 11,
'To ensure changes to IT systems are controlled, tested, and documented.',
'This policy applies to all changes to production systems and infrastructure.',
'All changes must:
• Be requested and approved through formal process
• Be tested in non-production environment
• Include rollback plans
• Be documented with change records
• Be communicated to affected stakeholders'),

('Mobile Device and Remote Work Policy', 'recommended', ARRAY['6.7', '6.8'], ARRAY['Art. 21'], 12,
'To secure mobile devices and enable safe remote working.',
'This policy applies to all employees working remotely or using mobile devices for work.',
'Remote work security requirements:
• VPN required for remote access to corporate systems
• Device encryption mandatory
• Secure home network configuration
• Physical security awareness
• Reporting of lost/stolen devices'),

('Data Protection and Privacy Policy', 'recommended', ARRAY['5.33', '5.34'], ARRAY['Art. 21'], 13,
'To ensure personal data is processed in compliance with privacy regulations.',
'This policy applies to all processing of personal data by {{organization_name}}.',
'Data protection principles:
• Process personal data lawfully and transparently
• Collect only necessary data for specified purposes
• Ensure data accuracy and integrity
• Implement appropriate security measures
• Respect data subject rights'),

('Security Awareness and Training Policy', 'recommended', ARRAY['6.3'], ARRAY['Art. 21'], 14,
'To ensure all personnel understand their security responsibilities through regular training.',
'This policy applies to all employees, contractors, and third parties.',
'Security awareness program includes:
• Mandatory onboarding security training
• Annual refresher training
• Role-specific training for sensitive positions
• Phishing simulation exercises
• Security awareness communications');

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_policy_templates_category ON policy_templates(category);
CREATE INDEX IF NOT EXISTS idx_policy_templates_order ON policy_templates(order_index);
CREATE INDEX IF NOT EXISTS idx_policy_templates_active ON policy_templates(is_active);