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
          asset_type: string
          created_at: string | null
          criticality: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          owner: string | null
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          criticality?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          owner?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          criticality?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          owner?: string | null
          updated_at?: string | null
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
      controls: {
        Row: {
          control_id: string
          created_at: string | null
          domain: string
          guida_errori: string | null
          guida_evidenze: string | null
          guida_implementazione: string | null
          guida_significato: string | null
          id: string
          implementation_notes: string | null
          last_verification_date: string | null
          objective: string | null
          responsible: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          control_id: string
          created_at?: string | null
          domain: string
          guida_errori?: string | null
          guida_evidenze?: string | null
          guida_implementazione?: string | null
          guida_significato?: string | null
          id?: string
          implementation_notes?: string | null
          last_verification_date?: string | null
          objective?: string | null
          responsible?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          control_id?: string
          created_at?: string | null
          domain?: string
          guida_errori?: string | null
          guida_evidenze?: string | null
          guida_implementazione?: string | null
          guida_significato?: string | null
          id?: string
          implementation_notes?: string | null
          last_verification_date?: string | null
          objective?: string | null
          responsible?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      organization: {
        Row: {
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
          name: string
          operational_address_city: string | null
          operational_address_country: string | null
          operational_address_province: string | null
          operational_address_street: string | null
          operational_address_zip: string | null
          piva: string | null
          responsabile_paghe: string | null
          scope: string | null
          sector: string | null
          system_administrator: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
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
          name: string
          operational_address_city?: string | null
          operational_address_country?: string | null
          operational_address_province?: string | null
          operational_address_street?: string | null
          operational_address_zip?: string | null
          piva?: string | null
          responsabile_paghe?: string | null
          scope?: string | null
          sector?: string | null
          system_administrator?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
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
          name?: string
          operational_address_city?: string | null
          operational_address_country?: string | null
          operational_address_province?: string | null
          operational_address_street?: string | null
          operational_address_zip?: string | null
          piva?: string | null
          responsabile_paghe?: string | null
          scope?: string | null
          sector?: string | null
          system_administrator?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          content: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          policy_name: string
          policy_type: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          policy_name: string
          policy_type: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          policy_name?: string
          policy_type?: string
          status?: string | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "auditor" | "viewer"
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
    Enums: {
      app_role: ["admin", "auditor", "viewer"],
    },
  },
} as const
