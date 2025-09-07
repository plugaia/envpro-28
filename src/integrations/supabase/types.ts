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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          id: string
          phone: string
          proposal_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          id?: string
          phone: string
          proposal_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          phone?: string
          proposal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          cnpj: string
          created_at: string
          id: string
          name: string
          responsible_email: string
          responsible_phone: string
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          cnpj: string
          created_at?: string
          id?: string
          name: string
          responsible_email: string
          responsible_phone: string
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          cnpj?: string
          created_at?: string
          id?: string
          name?: string
          responsible_email?: string
          responsible_phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          proposal_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          proposal_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          proposal_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_tokens_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          assignee: string | null
          cedible_value: number
          client_name: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_name: string | null
          process_number: string | null
          proposal_value: number
          receiver_type: string
          status: string
          updated_at: string
          valid_until: string
        }
        Insert: {
          assignee?: string | null
          cedible_value: number
          client_name: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_name?: string | null
          process_number?: string | null
          proposal_value: number
          receiver_type: string
          status?: string
          updated_at?: string
          valid_until: string
        }
        Update: {
          assignee?: string | null
          cedible_value?: number
          client_name?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_name?: string | null
          process_number?: string | null
          proposal_value?: number
          receiver_type?: string
          status?: string
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          attempts: number
          created_at: string
          id: string
          ip_address: unknown | null
          updated_at: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          action_type: string
          attempts?: number
          created_at?: string
          id?: string
          ip_address?: unknown | null
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          action_type?: string
          attempts?: number
          created_at?: string
          id?: string
          ip_address?: unknown | null
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          company_id: string
          created_at: string | null
          email: string
          expires_at: string
          first_name: string
          id: string
          invitation_token: string
          invited_by: string
          last_name: string
          status: string
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          first_name: string
          id?: string
          invitation_token: string
          invited_by: string
          last_name: string
          status?: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          last_name?: string
          status?: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { p_invitation_token: string; p_user_id: string }
        Returns: boolean
      }
      audit_sensitive_operation: {
        Args: { p_details?: Json; p_operation_type: string }
        Returns: string
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      create_audit_log: {
        Args: {
          p_action_type: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      create_proposal_access_token: {
        Args: { p_proposal_id: string }
        Returns: string
      }
      create_team_invitation: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_whatsapp_number?: string
        }
        Returns: {
          invitation_id: string
          invitation_token: string
        }[]
      }
      export_company_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_client_contact: {
        Args: { p_proposal_id: string }
        Returns: {
          email: string
          phone: string
        }[]
      }
      get_invitation_for_registration: {
        Args: { p_invitation_token: string }
        Returns: {
          company_name: string
          email: string
          first_name: string
          invitation_id: string
          is_valid: boolean
          last_name: string
        }[]
      }
      get_lawyer_info: {
        Args: { p_proposal_id: string }
        Returns: {
          avatar_url: string
          email: string
          first_name: string
          last_name: string
          phone: string
        }[]
      }
      get_proposal_by_id: {
        Args: { p_proposal_id: string }
        Returns: {
          assignee: string
          can_view_client_details: boolean
          cedible_value: number
          client_email: string
          client_name: string
          client_phone: string
          company_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          organization_name: string
          process_number: string
          proposal_value: number
          receiver_type: string
          status: string
          updated_at: string
          valid_until: string
        }[]
      }
      get_proposal_by_token: {
        Args: { access_token: string }
        Returns: {
          cedible_value: number
          client_name: string
          company_name: string
          created_at: string
          id: string
          organization_name: string
          process_number: string
          proposal_value: number
          receiver_type: string
          status: string
          valid_until: string
        }[]
      }
      get_user_company_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_proposals: {
        Args: Record<PropertyKey, never>
        Returns: {
          assignee: string
          can_view_client_details: boolean
          cedible_value: number
          client_email: string
          client_name: string
          client_phone: string
          company_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          organization_name: string
          process_number: string
          proposal_value: number
          receiver_type: string
          status: string
          updated_at: string
          valid_until: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password_input: string }
        Returns: boolean
      }
      verify_phone_digits: {
        Args: { p_last_digits: string; p_proposal_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_role: "admin" | "collaborator"
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
      app_role: ["admin", "moderator", "user"],
      user_role: ["admin", "collaborator"],
    },
  },
} as const
