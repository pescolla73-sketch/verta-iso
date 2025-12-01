export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_id: string
          asset_type: string
          availability_required: boolean | null
          category: string | null
          confidentiality: string | null
          created_at: string | null
          criticality: string
          department: string | null
          description: string | null
          id: string
          integrity_required: boolean | null
          license_info: string | null
          location: string | null
          name: string
          notes: string | null
          organization_id: string | null
          owner: string | null
          purchase_date: string | null
          related_controls: string[] | null
          status: string | null
          updated_at: string | null
          vendor: string | null
          version: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_id: string
          asset_type: string
          availability_required?: boolean | null
          category?: string | null
          confidentiality?: string | null
          created_at?: string | null
          criticality?: string
          department?: string | null
          description?: string | null
          id?: string
          integrity_required?: boolean | null
          license_info?: string | null
          location?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          owner?: string | null
          purchase_date?: string | null
          related_controls?: string[] | null
          status?: string | null
          updated_at?: string | null
          vendor?: string | null
          version?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: string
          availability_required?: boolean | null
          category?: string | null
          confidentiality?: string | null
          created_at?: string | null
          criticality?: string
          department?: string | null
          description?: string | null
          id?: string
          integrity_required?: boolean | null
          license_info?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          owner?: string | null
          purchase_date?: string | null
          related_controls?: string[] | null
          status?: string | null
          updated_at?: string | null
          vendor?: string | null
          version?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_checklist_items: {
        Row: {
          audit_id: string | null
          audit_notes: string | null
          auto_create_nc: boolean | null
          control_reference: string
          control_title: string
          created_at: string | null
          evidence_found: string | null
          evidence_required: string | null
          id: string
          pre_audit_status: string | null
          requirement: string
          result: string | null
          source_type: string | null
          update_linked: boolean | null
        }
        Insert: {
          audit_id?: string | null
          audit_notes?: string | null
          auto_create_nc?: boolean | null
          control_reference: string
          control_title: string
          created_at?: string | null
          evidence_found?: string | null
          evidence_required?: string | null
          id?: string
          pre_audit_status?: string | null
          requirement: string
          result?: string | null
          source_type?: string | null
          update_linked?: boolean | null
        }
        Update: {
          audit_id?: string | null
          audit_notes?: string | null
          auto_create_nc?: boolean | null
          control_reference?: string
          control_title?: string
          created_at?: string | null
          evidence_found?: string | null
          evidence_required?: string | null
          id?: string
          pre_audit_status?: string | null
          requirement?: string
          result?: string | null
          source_type?: string | null
          update_linked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_checklist_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "internal_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_id: string | null
          control_reference: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          recommended_action: string | null
          severity: string
          status: string | null
          title: string
        }
        Insert: {
          audit_id?: string | null
          control_reference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          recommended_action?: string | null
          severity: string
          status?: string | null
          title: string
        }
        Update: {
          audit_id?: string | null
          control_reference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          recommended_action?: string | null
          severity?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "internal_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          organization_id: string
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          organization_id: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          organization_id?: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          changes: Json | null
          description: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          ip_address: string | null
          linked_entity_id: string | null
          linked_entity_name: string | null
          linked_entity_type: string | null
          module: string
          organization_id: string
          timestamp: string | null
          triggered_by: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          description?: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          ip_address?: string | null
          linked_entity_id?: string | null
          linked_entity_name?: string | null
          linked_entity_type?: string | null
          module: string
          organization_id: string
          timestamp?: string | null
          triggered_by?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          description?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          linked_entity_id?: string | null
          linked_entity_name?: string | null
          linked_entity_type?: string | null
          module?: string
          organization_id?: string
          timestamp?: string | null
          triggered_by?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      audits: {
        Row: {
          audit_date: string
          audit_name: string
          audit_type: string
          auditor: string | null
          created_at: string | null
          findings: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          audit_date: string
          audit_name: string
          audit_type: string
          auditor?: string | null
          created_at?: string | null
          findings?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_date?: string
          audit_name?: string
          audit_type?: string
          auditor?: string | null
          created_at?: string | null
          findings?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      certification_audits: {
        Row: {
          audit_code: string | null
          audit_date: string
          audit_end_date: string | null
          audit_report_url: string | null
          audit_result: string | null
          audit_scope: string | null
          audit_team: string | null
          audit_type: string
          certificate_expiry_date: string | null
          certificate_issue_date: string | null
          certificate_number: string | null
          certification_body: string | null
          certifier_name: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_auditor: string | null
          major_findings_count: number | null
          minor_findings_count: number | null
          notes: string | null
          observations_count: number | null
          organization_id: string
          outcome: string | null
          report_url: string | null
          standards: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          audit_code?: string | null
          audit_date: string
          audit_end_date?: string | null
          audit_report_url?: string | null
          audit_result?: string | null
          audit_scope?: string | null
          audit_team?: string | null
          audit_type: string
          certificate_expiry_date?: string | null
          certificate_issue_date?: string | null
          certificate_number?: string | null
          certification_body?: string | null
          certifier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_auditor?: string | null
          major_findings_count?: number | null
          minor_findings_count?: number | null
          notes?: string | null
          observations_count?: number | null
          organization_id: string
          outcome?: string | null
          report_url?: string | null
          standards?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_code?: string | null
          audit_date?: string
          audit_end_date?: string | null
          audit_report_url?: string | null
          audit_result?: string | null
          audit_scope?: string | null
          audit_team?: string | null
          audit_type?: string
          certificate_expiry_date?: string | null
          certificate_issue_date?: string | null
          certificate_number?: string | null
          certification_body?: string | null
          certifier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_auditor?: string | null
          major_findings_count?: number | null
          minor_findings_count?: number | null
          notes?: string | null
          observations_count?: number | null
          organization_id?: string
          outcome?: string | null
          report_url?: string | null
          standards?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      certifier_findings: {
        Row: {
          audit_id: string | null
          certification_audit_id: string | null
          closed_date: string | null
          created_at: string | null
          description: string | null
          evidence_provided: string | null
          finding_code: string | null
          finding_type: string | null
          id: string
          iso_clause: string | null
          iso_control: string | null
          linked_nc_id: string | null
          organization_id: string
          organization_response: string | null
          required_action: string | null
          response_deadline: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audit_id?: string | null
          certification_audit_id?: string | null
          closed_date?: string | null
          created_at?: string | null
          description?: string | null
          evidence_provided?: string | null
          finding_code?: string | null
          finding_type?: string | null
          id?: string
          iso_clause?: string | null
          iso_control?: string | null
          linked_nc_id?: string | null
          organization_id: string
          organization_response?: string | null
          required_action?: string | null
          response_deadline?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audit_id?: string | null
          certification_audit_id?: string | null
          closed_date?: string | null
          created_at?: string | null
          description?: string | null
          evidence_provided?: string | null
          finding_code?: string | null
          finding_type?: string | null
          id?: string
          iso_clause?: string | null
          iso_control?: string | null
          linked_nc_id?: string | null
          organization_id?: string
          organization_response?: string | null
          required_action?: string | null
          response_deadline?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifier_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "certification_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifier_findings_certification_audit_id_fkey"
            columns: ["certification_audit_id"]
            isOneToOne: false
            referencedRelation: "certification_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifier_findings_linked_nc_id_fkey"
            columns: ["linked_nc_id"]
            isOneToOne: false
            referencedRelation: "non_conformities"
            referencedColumns: ["id"]
          },
        ]
      }
      controlled_documents: {
        Row: {
          access_level: string | null
          approval_date: string | null
          approval_notes: string | null
          approver: string | null
          created_at: string | null
          created_by: string | null
          current_version: string
          description: string | null
          document_category: string | null
          document_code: string
          document_location: string | null
          document_owner: string
          document_title: string
          document_type: string
          id: string
          last_review_date: string | null
          next_review_date: string | null
          notes: string | null
          organization_id: string
          purpose: string | null
          related_policy_id: string | null
          related_procedure_id: string | null
          review_frequency_months: number | null
          reviewer: string | null
          scope: string | null
          status: string
          updated_at: string | null
          version_date: string
        }
        Insert: {
          access_level?: string | null
          approval_date?: string | null
          approval_notes?: string | null
          approver?: string | null
          created_at?: string | null
          created_by?: string | null
          current_version?: string
          description?: string | null
          document_category?: string | null
          document_code: string
          document_location?: string | null
          document_owner: string
          document_title: string
          document_type: string
          id?: string
          last_review_date?: string | null
          next_review_date?: string | null
          notes?: string | null
          organization_id: string
          purpose?: string | null
          related_policy_id?: string | null
          related_procedure_id?: string | null
          review_frequency_months?: number | null
          reviewer?: string | null
          scope?: string | null
          status?: string
          updated_at?: string | null
          version_date?: string
        }
        Update: {
          access_level?: string | null
          approval_date?: string | null
          approval_notes?: string | null
          approver?: string | null
          created_at?: string | null
          created_by?: string | null
          current_version?: string
          description?: string | null
          document_category?: string | null
          document_code?: string
          document_location?: string | null
          document_owner?: string
          document_title?: string
          document_type?: string
          id?: string
          last_review_date?: string | null
          next_review_date?: string | null
          notes?: string | null
          organization_id?: string
          purpose?: string | null
          related_policy_id?: string | null
          related_procedure_id?: string | null
          review_frequency_months?: number | null
          reviewer?: string | null
          scope?: string | null
          status?: string
          updated_at?: string | null
          version_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "controlled_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controlled_documents_related_policy_id_fkey"
            columns: ["related_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controlled_documents_related_procedure_id_fkey"
            columns: ["related_procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      controls: {
        Row: {
          audit_history: Json | null
          control_id: string
          created_at: string | null
          domain: string
          guida_errori: string | null
          guida_evidenze: string | null
          guida_implementazione: string | null
          guida_significato: string | null
          id: string
          implementation_notes: string | null
          justification: string | null
          last_audit_date: string | null
          last_audit_result: string | null
          last_verification_date: string | null
          objective: string | null
          responsible: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audit_history?: Json | null
          control_id: string
          created_at?: string | null
          domain: string
          guida_errori?: string | null
          guida_evidenze?: string | null
          guida_implementazione?: string | null
          guida_significato?: string | null
          id?: string
          implementation_notes?: string | null
          justification?: string | null
          last_audit_date?: string | null
          last_audit_result?: string | null
          last_verification_date?: string | null
          objective?: string | null
          responsible?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audit_history?: Json | null
          control_id?: string
          created_at?: string | null
          domain?: string
          guida_errori?: string | null
          guida_evidenze?: string | null
          guida_implementazione?: string | null
          guida_significato?: string | null
          id?: string
          implementation_notes?: string | null
          justification?: string | null
          last_audit_date?: string | null
          last_audit_result?: string | null
          last_verification_date?: string | null
          objective?: string | null
          responsible?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_change_requests: {
        Row: {
          change_description: string
          change_justification: string
          created_at: string | null
          decision: string | null
          decision_date: string | null
          document_id: string
          id: string
          implementation_date: string | null
          new_version_id: string | null
          organization_id: string
          request_code: string
          request_date: string
          requested_by: string
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          change_description: string
          change_justification: string
          created_at?: string | null
          decision?: string | null
          decision_date?: string | null
          document_id: string
          id?: string
          implementation_date?: string | null
          new_version_id?: string | null
          organization_id: string
          request_code: string
          request_date?: string
          requested_by: string
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          change_description?: string
          change_justification?: string
          created_at?: string | null
          decision?: string | null
          decision_date?: string | null
          document_id?: string
          id?: string
          implementation_date?: string | null
          new_version_id?: string | null
          organization_id?: string
          request_code?: string
          request_date?: string
          requested_by?: string
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_change_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "controlled_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_change_requests_new_version_id_fkey"
            columns: ["new_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          change_reason: string | null
          change_summary: string
          change_type: string
          created_at: string | null
          created_by: string | null
          document_id: string
          file_hash: string | null
          file_size: number | null
          file_url: string | null
          id: string
          organization_id: string
          version_date: string
          version_number: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          change_reason?: string | null
          change_summary: string
          change_type: string
          created_at?: string | null
          created_by?: string | null
          document_id: string
          file_hash?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          organization_id: string
          version_date?: string
          version_number: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          change_reason?: string | null
          change_summary?: string
          change_type?: string
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          file_hash?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          organization_id?: string
          version_date?: string
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "controlled_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      evidences: {
        Row: {
          control_id: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          control_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          control_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidences_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_actions: {
        Row: {
          action_code: string
          action_plan: string
          action_type: string
          closure_date: string | null
          closure_notes: string | null
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          description: string
          effectiveness_check_date: string | null
          effectiveness_notes: string | null
          effectiveness_verified: boolean | null
          estimated_cost: number | null
          estimated_effort: string | null
          expected_benefit: string | null
          id: string
          implementation_notes: string | null
          implementation_status: string | null
          opportunity_statement: string | null
          organization_id: string
          priority: string
          problem_statement: string | null
          resources_required: string | null
          responsible_person: string
          root_cause_analysis: string | null
          source: string
          source_id: string | null
          start_date: string | null
          status: string
          success_criteria: string | null
          support_team: string | null
          target_date: string
          title: string
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          action_code: string
          action_plan: string
          action_type: string
          closure_date?: string | null
          closure_notes?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          effectiveness_check_date?: string | null
          effectiveness_notes?: string | null
          effectiveness_verified?: boolean | null
          estimated_cost?: number | null
          estimated_effort?: string | null
          expected_benefit?: string | null
          id?: string
          implementation_notes?: string | null
          implementation_status?: string | null
          opportunity_statement?: string | null
          organization_id: string
          priority?: string
          problem_statement?: string | null
          resources_required?: string | null
          responsible_person: string
          root_cause_analysis?: string | null
          source: string
          source_id?: string | null
          start_date?: string | null
          status?: string
          success_criteria?: string | null
          support_team?: string | null
          target_date: string
          title: string
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          action_code?: string
          action_plan?: string
          action_type?: string
          closure_date?: string | null
          closure_notes?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          effectiveness_check_date?: string | null
          effectiveness_notes?: string | null
          effectiveness_verified?: boolean | null
          estimated_cost?: number | null
          estimated_effort?: string | null
          expected_benefit?: string | null
          id?: string
          implementation_notes?: string | null
          implementation_status?: string | null
          opportunity_statement?: string | null
          organization_id?: string
          priority?: string
          problem_statement?: string | null
          resources_required?: string | null
          responsible_person?: string
          root_cause_analysis?: string | null
          source?: string
          source_id?: string | null
          start_date?: string | null
          status?: string
          success_criteria?: string | null
          support_team?: string | null
          target_date?: string
          title?: string
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "improvement_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_audits: {
        Row: {
          audit_code: string
          audit_date: string
          audit_scope: string
          audit_type: string
          auditee_name: string | null
          auditor_name: string
          completed_date: string | null
          conclusion: string | null
          created_at: string | null
          id: string
          objective: string | null
          organization_id: string
          overall_result: string | null
          planned_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          audit_code: string
          audit_date: string
          audit_scope: string
          audit_type: string
          auditee_name?: string | null
          auditor_name: string
          completed_date?: string | null
          conclusion?: string | null
          created_at?: string | null
          id?: string
          objective?: string | null
          organization_id: string
          overall_result?: string | null
          planned_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          audit_code?: string
          audit_date?: string
          audit_scope?: string
          audit_type?: string
          auditee_name?: string | null
          auditor_name?: string
          completed_date?: string | null
          conclusion?: string | null
          created_at?: string | null
          id?: string
          objective?: string | null
          organization_id?: string
          overall_result?: string | null
          planned_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      management_reviews: {
        Row: {
          action_items: Json | null
          attendees: string[] | null
          audit_results_summary: string | null
          chairman: string | null
          created_at: string | null
          created_by: string | null
          decisions: Json | null
          external_internal_changes: string | null
          id: string
          improvement_opportunities: string | null
          isms_changes_needed: string | null
          isms_performance_feedback: string | null
          location: string | null
          meeting_date: string
          meeting_duration: number | null
          minutes_approval_date: string | null
          minutes_approved_by: string | null
          minutes_draft: string | null
          monitoring_results: string | null
          nonconformities_summary: string | null
          organization_id: string
          previous_actions_status: string | null
          resource_needs: string | null
          review_id: string
          secretary: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          attendees?: string[] | null
          audit_results_summary?: string | null
          chairman?: string | null
          created_at?: string | null
          created_by?: string | null
          decisions?: Json | null
          external_internal_changes?: string | null
          id?: string
          improvement_opportunities?: string | null
          isms_changes_needed?: string | null
          isms_performance_feedback?: string | null
          location?: string | null
          meeting_date: string
          meeting_duration?: number | null
          minutes_approval_date?: string | null
          minutes_approved_by?: string | null
          minutes_draft?: string | null
          monitoring_results?: string | null
          nonconformities_summary?: string | null
          organization_id: string
          previous_actions_status?: string | null
          resource_needs?: string | null
          review_id: string
          secretary?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          attendees?: string[] | null
          audit_results_summary?: string | null
          chairman?: string | null
          created_at?: string | null
          created_by?: string | null
          decisions?: Json | null
          external_internal_changes?: string | null
          id?: string
          improvement_opportunities?: string | null
          isms_changes_needed?: string | null
          isms_performance_feedback?: string | null
          location?: string | null
          meeting_date?: string
          meeting_duration?: number | null
          minutes_approval_date?: string | null
          minutes_approved_by?: string | null
          minutes_draft?: string | null
          monitoring_results?: string | null
          nonconformities_summary?: string | null
          organization_id?: string
          previous_actions_status?: string | null
          resource_needs?: string | null
          review_id?: string
          secretary?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      non_conformities: {
        Row: {
          affected_clause: string | null
          closed_at: string | null
          closure_notes: string | null
          corrective_action: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          detected_date: string | null
          detection_method: string | null
          effectiveness_verified: boolean | null
          evidence: string | null
          id: string
          implementation_date: string | null
          implementation_notes: string | null
          nc_code: string
          nc_date: string | null
          organization_id: string
          related_control: string | null
          responsible_person: string | null
          root_cause_analysis: string | null
          severity: string
          source: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          verification_date: string | null
          verified_by: string | null
        }
        Insert: {
          affected_clause?: string | null
          closed_at?: string | null
          closure_notes?: string | null
          corrective_action?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          detected_date?: string | null
          detection_method?: string | null
          effectiveness_verified?: boolean | null
          evidence?: string | null
          id?: string
          implementation_date?: string | null
          implementation_notes?: string | null
          nc_code: string
          nc_date?: string | null
          organization_id: string
          related_control?: string | null
          responsible_person?: string | null
          root_cause_analysis?: string | null
          severity: string
          source?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          verification_date?: string | null
          verified_by?: string | null
        }
        Update: {
          affected_clause?: string | null
          closed_at?: string | null
          closure_notes?: string | null
          corrective_action?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          detected_date?: string | null
          detection_method?: string | null
          effectiveness_verified?: boolean | null
          evidence?: string | null
          id?: string
          implementation_date?: string | null
          implementation_notes?: string | null
          nc_code?: string
          nc_date?: string | null
          organization_id?: string
          related_control?: string | null
          responsible_person?: string | null
          root_cause_analysis?: string | null
          severity?: string
          source?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          verification_date?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      organization: {
        Row: {
          applicable_regulations: string[] | null
          backup_operator: string | null
          ceo: string | null
          ciso: string | null
          communication_manager: string | null
          contact_email: string | null
          contact_pec: string | null
          contact_phone: string | null
          created_at: string | null
          cto: string | null
          dpo: string | null
          help_desk_manager: string | null
          hr_manager: string | null
          id: string
          incident_response_manager: string | null
          isms_boundaries: string | null
          isms_scope: string | null
          it_manager: string | null
          legal_address_city: string | null
          legal_address_country: string | null
          legal_address_province: string | null
          legal_address_street: string | null
          legal_address_zip: string | null
          logo_url: string | null
          nace_sector: string | null
          name: string
          operational_address_city: string | null
          operational_address_country: string | null
          operational_address_province: string | null
          operational_address_street: string | null
          operational_address_zip: string | null
          piva: string | null
          quality_manager: string | null
          responsabile_paghe: string | null
          scope: string | null
          sector: string | null
          system_administrator: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          applicable_regulations?: string[] | null
          backup_operator?: string | null
          ceo?: string | null
          ciso?: string | null
          communication_manager?: string | null
          contact_email?: string | null
          contact_pec?: string | null
          contact_phone?: string | null
          created_at?: string | null
          cto?: string | null
          dpo?: string | null
          help_desk_manager?: string | null
          hr_manager?: string | null
          id?: string
          incident_response_manager?: string | null
          isms_boundaries?: string | null
          isms_scope?: string | null
          it_manager?: string | null
          legal_address_city?: string | null
          legal_address_country?: string | null
          legal_address_province?: string | null
          legal_address_street?: string | null
          legal_address_zip?: string | null
          logo_url?: string | null
          nace_sector?: string | null
          name: string
          operational_address_city?: string | null
          operational_address_country?: string | null
          operational_address_province?: string | null
          operational_address_street?: string | null
          operational_address_zip?: string | null
          piva?: string | null
          quality_manager?: string | null
          responsabile_paghe?: string | null
          scope?: string | null
          sector?: string | null
          system_administrator?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          applicable_regulations?: string[] | null
          backup_operator?: string | null
          ceo?: string | null
          ciso?: string | null
          communication_manager?: string | null
          contact_email?: string | null
          contact_pec?: string | null
          contact_phone?: string | null
          created_at?: string | null
          cto?: string | null
          dpo?: string | null
          help_desk_manager?: string | null
          hr_manager?: string | null
          id?: string
          incident_response_manager?: string | null
          isms_boundaries?: string | null
          isms_scope?: string | null
          it_manager?: string | null
          legal_address_city?: string | null
          legal_address_country?: string | null
          legal_address_province?: string | null
          legal_address_street?: string | null
          legal_address_zip?: string | null
          logo_url?: string | null
          nace_sector?: string | null
          name?: string
          operational_address_city?: string | null
          operational_address_country?: string | null
          operational_address_province?: string | null
          operational_address_street?: string | null
          operational_address_zip?: string | null
          piva?: string | null
          quality_manager?: string | null
          responsabile_paghe?: string | null
          scope?: string | null
          sector?: string | null
          system_administrator?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          activated_at: string | null
          auth_user_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invited_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          organization_id: string
          updated_at: string | null
          user_email: string
          user_name: string
        }
        Insert: {
          activated_at?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          organization_id: string
          updated_at?: string | null
          user_email: string
          user_name: string
        }
        Update: {
          activated_at?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          organization_id?: string
          updated_at?: string | null
          user_email?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          category: string | null
          compliance_requirements: string | null
          content: string | null
          created_at: string | null
          custom_exceptions: string | null
          custom_notes: string | null
          custom_policy_statement: string | null
          custom_procedures: string | null
          custom_purpose: string | null
          generated_compliance: string | null
          generated_controls: Json | null
          generated_references: string | null
          generated_roles: Json | null
          generated_scope: string | null
          id: string
          is_legacy: boolean | null
          iso_reference: string[] | null
          last_auto_update: string | null
          next_review_date: string | null
          nis2_reference: string[] | null
          organization_id: string | null
          policy_id: string | null
          policy_name: string
          policy_statement: string | null
          policy_type: string
          prepared_by: string | null
          procedures: string | null
          purpose: string | null
          review_requirements: string | null
          roles_responsibilities: string | null
          scope: string | null
          sections: Json | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          compliance_requirements?: string | null
          content?: string | null
          created_at?: string | null
          custom_exceptions?: string | null
          custom_notes?: string | null
          custom_policy_statement?: string | null
          custom_procedures?: string | null
          custom_purpose?: string | null
          generated_compliance?: string | null
          generated_controls?: Json | null
          generated_references?: string | null
          generated_roles?: Json | null
          generated_scope?: string | null
          id?: string
          is_legacy?: boolean | null
          iso_reference?: string[] | null
          last_auto_update?: string | null
          next_review_date?: string | null
          nis2_reference?: string[] | null
          organization_id?: string | null
          policy_id?: string | null
          policy_name: string
          policy_statement?: string | null
          policy_type: string
          prepared_by?: string | null
          procedures?: string | null
          purpose?: string | null
          review_requirements?: string | null
          roles_responsibilities?: string | null
          scope?: string | null
          sections?: Json | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          compliance_requirements?: string | null
          content?: string | null
          created_at?: string | null
          custom_exceptions?: string | null
          custom_notes?: string | null
          custom_policy_statement?: string | null
          custom_procedures?: string | null
          custom_purpose?: string | null
          generated_compliance?: string | null
          generated_controls?: Json | null
          generated_references?: string | null
          generated_roles?: Json | null
          generated_scope?: string | null
          id?: string
          is_legacy?: boolean | null
          iso_reference?: string[] | null
          last_auto_update?: string | null
          next_review_date?: string | null
          nis2_reference?: string[] | null
          organization_id?: string | null
          policy_id?: string | null
          policy_name?: string
          policy_statement?: string | null
          policy_type?: string
          prepared_by?: string | null
          procedures?: string | null
          purpose?: string | null
          review_requirements?: string | null
          roles_responsibilities?: string | null
          scope?: string | null
          sections?: Json | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_templates: {
        Row: {
          category: string
          compliance_template: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          iso_reference: string[] | null
          name: string
          nis2_reference: string[] | null
          order_index: number | null
          policy_statement_template: string | null
          procedures_template: string | null
          purpose_template: string | null
          review_template: string | null
          roles_template: string | null
          scope_template: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          compliance_template?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso_reference?: string[] | null
          name: string
          nis2_reference?: string[] | null
          order_index?: number | null
          policy_statement_template?: string | null
          procedures_template?: string | null
          purpose_template?: string | null
          review_template?: string | null
          roles_template?: string | null
          scope_template?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          compliance_template?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso_reference?: string[] | null
          name?: string
          nis2_reference?: string[] | null
          order_index?: number | null
          policy_statement_template?: string | null
          procedures_template?: string | null
          purpose_template?: string | null
          review_template?: string | null
          roles_template?: string | null
          scope_template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      policy_versions: {
        Row: {
          change_description: string | null
          changed_by: string | null
          content: string | null
          created_at: string | null
          id: string
          policy_id: string
          sections: Json | null
          version: string
        }
        Insert: {
          change_description?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          policy_id: string
          sections?: Json | null
          version: string
        }
        Update: {
          change_description?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          policy_id?: string
          sections?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_templates: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          iso_reference: string[] | null
          name: string
          order_index: number | null
          purpose_template: string | null
          records_template: string | null
          related_policy: string | null
          responsibilities_template: string | null
          scope_template: string | null
          steps_template: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso_reference?: string[] | null
          name: string
          order_index?: number | null
          purpose_template?: string | null
          records_template?: string | null
          related_policy?: string | null
          responsibilities_template?: string | null
          scope_template?: string | null
          steps_template?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso_reference?: string[] | null
          name?: string
          order_index?: number | null
          purpose_template?: string | null
          records_template?: string | null
          related_policy?: string | null
          responsibilities_template?: string | null
          scope_template?: string | null
          steps_template?: string | null
        }
        Relationships: []
      }
      procedures: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          category: string
          created_at: string | null
          created_by: string | null
          definitions: string | null
          id: string
          iso_reference: string[] | null
          next_review_date: string | null
          organization_id: string | null
          prepared_by: string | null
          procedure_id: string | null
          procedure_steps: string
          purpose: string
          records: string | null
          related_documents: string | null
          related_policy_id: string | null
          responsibilities: string | null
          scope: string
          status: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          definitions?: string | null
          id?: string
          iso_reference?: string[] | null
          next_review_date?: string | null
          organization_id?: string | null
          prepared_by?: string | null
          procedure_id?: string | null
          procedure_steps: string
          purpose: string
          records?: string | null
          related_documents?: string | null
          related_policy_id?: string | null
          responsibilities?: string | null
          scope: string
          status?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          definitions?: string | null
          id?: string
          iso_reference?: string[] | null
          next_review_date?: string | null
          organization_id?: string | null
          prepared_by?: string | null
          procedure_id?: string | null
          procedure_steps?: string
          purpose?: string
          records?: string | null
          related_documents?: string | null
          related_policy_id?: string | null
          responsibilities?: string | null
          scope?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_related_policy_id_fkey"
            columns: ["related_policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          selected_organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          selected_organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          selected_organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_organization_id_fkey"
            columns: ["selected_organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      review_action_items: {
        Row: {
          action_number: number
          completion_date: string | null
          completion_notes: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          responsible_person: string
          review_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_number: number
          completion_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          responsible_person: string
          review_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_number?: number
          completion_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          responsible_person?: string
          review_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_action_items_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "management_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          affected_asset_ids: string[] | null
          asset_id: string | null
          created_at: string | null
          description: string | null
          id: string
          identified_date: string | null
          inherent_impact: string
          inherent_probability: string
          inherent_risk_level: string | null
          inherent_risk_score: number | null
          last_review_date: string | null
          last_verification_date: string | null
          name: string
          next_review_date: string | null
          notes: string | null
          organization_id: string | null
          related_controls: string[] | null
          residual_impact: string | null
          residual_probability: string | null
          residual_risk_level: string | null
          residual_risk_score: number | null
          risk_id: string
          risk_type: string | null
          scope: string | null
          status: string | null
          threat_id: string | null
          treatment_cost: number | null
          treatment_deadline: string | null
          treatment_description: string | null
          treatment_responsible: string | null
          treatment_strategy: string | null
          updated_at: string | null
          verification_audit_id: string | null
          verification_status: string | null
          vulnerability_id: string | null
        }
        Insert: {
          affected_asset_ids?: string[] | null
          asset_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          identified_date?: string | null
          inherent_impact: string
          inherent_probability: string
          inherent_risk_level?: string | null
          inherent_risk_score?: number | null
          last_review_date?: string | null
          last_verification_date?: string | null
          name: string
          next_review_date?: string | null
          notes?: string | null
          organization_id?: string | null
          related_controls?: string[] | null
          residual_impact?: string | null
          residual_probability?: string | null
          residual_risk_level?: string | null
          residual_risk_score?: number | null
          risk_id: string
          risk_type?: string | null
          scope?: string | null
          status?: string | null
          threat_id?: string | null
          treatment_cost?: number | null
          treatment_deadline?: string | null
          treatment_description?: string | null
          treatment_responsible?: string | null
          treatment_strategy?: string | null
          updated_at?: string | null
          verification_audit_id?: string | null
          verification_status?: string | null
          vulnerability_id?: string | null
        }
        Update: {
          affected_asset_ids?: string[] | null
          asset_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          identified_date?: string | null
          inherent_impact?: string
          inherent_probability?: string
          inherent_risk_level?: string | null
          inherent_risk_score?: number | null
          last_review_date?: string | null
          last_verification_date?: string | null
          name?: string
          next_review_date?: string | null
          notes?: string | null
          organization_id?: string | null
          related_controls?: string[] | null
          residual_impact?: string | null
          residual_probability?: string | null
          residual_risk_level?: string | null
          residual_risk_score?: number | null
          risk_id?: string
          risk_type?: string | null
          scope?: string | null
          status?: string | null
          threat_id?: string | null
          treatment_cost?: number | null
          treatment_deadline?: string | null
          treatment_description?: string | null
          treatment_responsible?: string | null
          treatment_strategy?: string | null
          updated_at?: string | null
          verification_audit_id?: string | null
          verification_status?: string | null
          vulnerability_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "threats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_verification_audit_id_fkey"
            columns: ["verification_audit_id"]
            isOneToOne: false
            referencedRelation: "internal_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_vulnerability_id_fkey"
            columns: ["vulnerability_id"]
            isOneToOne: false
            referencedRelation: "vulnerabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          role_code: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          role_code: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          role_code?: string
          role_name?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_assets: string[] | null
          affected_users_count: number | null
          assigned_to: string | null
          authority_reference: string | null
          category: string
          closed_at: string | null
          containment_actions: string | null
          created_at: string | null
          created_by: string | null
          data_compromised: boolean | null
          description: string
          detected_at: string
          eradication_actions: string | null
          estimated_impact: string | null
          financial_impact_eur: number | null
          id: string
          immediate_actions: string | null
          incident_id: string
          lessons_learned: string | null
          nis2_incident_type: string | null
          organization_id: string
          preventive_actions: string | null
          recovery_actions: string | null
          related_controls: string[] | null
          related_risks: string[] | null
          reported_at: string | null
          reported_to_authorities: boolean | null
          reported_to_dpo: boolean | null
          resolved_at: string | null
          response_team: string[] | null
          root_cause: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_assets?: string[] | null
          affected_users_count?: number | null
          assigned_to?: string | null
          authority_reference?: string | null
          category: string
          closed_at?: string | null
          containment_actions?: string | null
          created_at?: string | null
          created_by?: string | null
          data_compromised?: boolean | null
          description: string
          detected_at: string
          eradication_actions?: string | null
          estimated_impact?: string | null
          financial_impact_eur?: number | null
          id?: string
          immediate_actions?: string | null
          incident_id: string
          lessons_learned?: string | null
          nis2_incident_type?: string | null
          organization_id: string
          preventive_actions?: string | null
          recovery_actions?: string | null
          related_controls?: string[] | null
          related_risks?: string[] | null
          reported_at?: string | null
          reported_to_authorities?: boolean | null
          reported_to_dpo?: boolean | null
          resolved_at?: string | null
          response_team?: string[] | null
          root_cause?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_assets?: string[] | null
          affected_users_count?: number | null
          assigned_to?: string | null
          authority_reference?: string | null
          category?: string
          closed_at?: string | null
          containment_actions?: string | null
          created_at?: string | null
          created_by?: string | null
          data_compromised?: boolean | null
          description?: string
          detected_at?: string
          eradication_actions?: string | null
          estimated_impact?: string | null
          financial_impact_eur?: number | null
          id?: string
          immediate_actions?: string | null
          incident_id?: string
          lessons_learned?: string | null
          nis2_incident_type?: string | null
          organization_id?: string
          preventive_actions?: string | null
          recovery_actions?: string | null
          related_controls?: string[] | null
          related_risks?: string[] | null
          reported_at?: string | null
          reported_to_authorities?: boolean | null
          reported_to_dpo?: boolean | null
          resolved_at?: string | null
          response_team?: string[] | null
          root_cause?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      soa_documents: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          classification: string | null
          compliance_percentage: number
          created_at: string
          document_id: string | null
          file_url: string | null
          generated_date: string
          id: string
          implemented: number
          issue_date: string | null
          next_review_date: string | null
          not_applicable: number
          not_implemented: number
          organization_id: string | null
          partially_implemented: number
          prepared_by: string | null
          revision_date: string | null
          status: string | null
          total_controls: number
          updated_at: string
          version: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          classification?: string | null
          compliance_percentage: number
          created_at?: string
          document_id?: string | null
          file_url?: string | null
          generated_date?: string
          id?: string
          implemented?: number
          issue_date?: string | null
          next_review_date?: string | null
          not_applicable?: number
          not_implemented?: number
          organization_id?: string | null
          partially_implemented?: number
          prepared_by?: string | null
          revision_date?: string | null
          status?: string | null
          total_controls?: number
          updated_at?: string
          version: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          classification?: string | null
          compliance_percentage?: number
          created_at?: string
          document_id?: string | null
          file_url?: string | null
          generated_date?: string
          id?: string
          implemented?: number
          issue_date?: string | null
          next_review_date?: string | null
          not_applicable?: number
          not_implemented?: number
          organization_id?: string | null
          partially_implemented?: number
          prepared_by?: string | null
          revision_date?: string | null
          status?: string | null
          total_controls?: number
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "soa_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      soa_items: {
        Row: {
          applicability: string
          compliance_score: number | null
          control_reference: string
          control_title: string
          created_at: string | null
          evidence_documents: Json | null
          id: string
          implementation_date: string | null
          implementation_status: string
          justification: string | null
          last_audit_date: string | null
          last_audit_id: string | null
          last_audit_result: string | null
          last_review_date: string | null
          next_review_date: string | null
          organization_id: string
          related_assets: string[] | null
          related_risks: string[] | null
          responsible_person: string | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          applicability?: string
          compliance_score?: number | null
          control_reference: string
          control_title: string
          created_at?: string | null
          evidence_documents?: Json | null
          id?: string
          implementation_date?: string | null
          implementation_status?: string
          justification?: string | null
          last_audit_date?: string | null
          last_audit_id?: string | null
          last_audit_result?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          organization_id: string
          related_assets?: string[] | null
          related_risks?: string[] | null
          responsible_person?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          applicability?: string
          compliance_score?: number | null
          control_reference?: string
          control_title?: string
          created_at?: string | null
          evidence_documents?: Json | null
          id?: string
          implementation_date?: string | null
          implementation_status?: string
          justification?: string | null
          last_audit_date?: string | null
          last_audit_id?: string | null
          last_audit_result?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          organization_id?: string
          related_assets?: string[] | null
          related_risks?: string[] | null
          responsible_person?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soa_items_last_audit_id_fkey"
            columns: ["last_audit_id"]
            isOneToOne: false
            referencedRelation: "internal_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_library: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          is_custom: boolean | null
          iso27001_controls: string[] | null
          name: string
          name_en: string | null
          nis2_incident_type: string | null
          organization_id: string | null
          relevant_sectors: string[] | null
          threat_id: string
          typical_impact: number | null
          typical_probability: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          is_custom?: boolean | null
          iso27001_controls?: string[] | null
          name: string
          name_en?: string | null
          nis2_incident_type?: string | null
          organization_id?: string | null
          relevant_sectors?: string[] | null
          threat_id: string
          typical_impact?: number | null
          typical_probability?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          is_custom?: boolean | null
          iso27001_controls?: string[] | null
          name?: string
          name_en?: string | null
          nis2_incident_type?: string | null
          organization_id?: string | null
          relevant_sectors?: string[] | null
          threat_id?: string
          typical_impact?: number | null
          typical_probability?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      threats: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          threat_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          threat_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          threat_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          certificate_file_url: string | null
          certificate_issued: boolean | null
          certificate_number: string | null
          completion_score: number | null
          created_at: string | null
          department: string | null
          employee_email: string | null
          employee_name: string
          expiry_date: string | null
          id: string
          notes: string | null
          organization_id: string
          role: string | null
          status: string | null
          training_date: string
          training_duration_hours: number | null
          training_provider: string | null
          training_title: string
          training_type: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_file_url?: string | null
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_score?: number | null
          created_at?: string | null
          department?: string | null
          employee_email?: string | null
          employee_name: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          role?: string | null
          status?: string | null
          training_date: string
          training_duration_hours?: number | null
          training_provider?: string | null
          training_title: string
          training_type?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_file_url?: string | null
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_score?: number | null
          created_at?: string | null
          department?: string | null
          employee_email?: string | null
          employee_name?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          role?: string | null
          status?: string | null
          training_date?: string
          training_duration_hours?: number | null
          training_provider?: string | null
          training_title?: string
          training_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          organization_id: string
          role_id: string
          scope_type: string | null
          scope_value: string | null
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id: string
          role_id: string
          scope_type?: string | null
          scope_value?: string | null
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string
          role_id?: string
          scope_type?: string | null
          scope_value?: string | null
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_users"
            referencedColumns: ["id"]
          },
        ]
      }
      vulnerabilities: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string | null
          vulnerability_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
          vulnerability_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
          vulnerability_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vulnerabilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_audit_code: { Args: { org_id: string }; Returns: string }
      generate_change_request_code: {
        Args: { org_id: string }
        Returns: string
      }
      generate_document_code: {
        Args: { doc_type: string; org_id: string }
        Returns: string
      }
      generate_improvement_code: {
        Args: { action_type_param: string; org_id: string }
        Returns: string
      }
      generate_nc_code: { Args: { org_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
