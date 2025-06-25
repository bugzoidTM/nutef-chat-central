export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendant_sectors: {
        Row: {
          attendant_id: string
          created_at: string
          id: string
          sector: Database["public"]["Enums"]["sector_type"]
          sector_id: string | null
        }
        Insert: {
          attendant_id: string
          created_at?: string
          id?: string
          sector: Database["public"]["Enums"]["sector_type"]
          sector_id?: string | null
        }
        Update: {
          attendant_id?: string
          created_at?: string
          id?: string
          sector?: Database["public"]["Enums"]["sector_type"]
          sector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendant_sectors_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendant_sectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          conversation_id: string
          created_at: string | null
          id: string
          priority: number
          sector_id: string
          status: string
          timeout_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          priority?: number
          sector_id: string
          status?: string
          timeout_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          priority?: number
          sector_id?: string
          status?: string
          timeout_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_queue_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_transfers: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          from_attendant_id: string | null
          from_sector_id: string | null
          id: string
          is_automatic: boolean | null
          reason: string | null
          status: string | null
          timeout_reason: string | null
          to_attendant_id: string | null
          to_sector_id: string | null
          transferred_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          from_attendant_id?: string | null
          from_sector_id?: string | null
          id?: string
          is_automatic?: boolean | null
          reason?: string | null
          status?: string | null
          timeout_reason?: string | null
          to_attendant_id?: string | null
          to_sector_id?: string | null
          transferred_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          from_attendant_id?: string | null
          from_sector_id?: string | null
          id?: string
          is_automatic?: boolean | null
          reason?: string | null
          status?: string | null
          timeout_reason?: string | null
          to_attendant_id?: string | null
          to_sector_id?: string | null
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_transfers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_from_attendant_id_fkey"
            columns: ["from_attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_from_sector_id_fkey"
            columns: ["from_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_to_attendant_id_fkey"
            columns: ["to_attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_to_sector_id_fkey"
            columns: ["to_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          client_name: string | null
          client_phone: string
          created_at: string
          id: string
          instance_id: string
          last_message_at: string
          sector: Database["public"]["Enums"]["sector_type"]
          sector_id: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_name?: string | null
          client_phone: string
          created_at?: string
          id?: string
          instance_id: string
          last_message_at?: string
          sector: Database["public"]["Enums"]["sector_type"]
          sector_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_name?: string | null
          client_phone?: string
          created_at?: string
          id?: string
          instance_id?: string
          last_message_at?: string
          sector?: Database["public"]["Enums"]["sector_type"]
          sector_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          instance_name: string
          phone: string
          qr_code: string | null
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          instance_name: string
          phone: string
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          instance_name?: string
          phone?: string
          qr_code?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instances_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          from_phone: string
          id: string
          is_read: boolean | null
          message_type: Database["public"]["Enums"]["message_type"]
          sender_name: string | null
          sender_sector: string | null
          sequence_number: number
          timestamp: string
          to_phone: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          from_phone: string
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_name?: string | null
          sender_sector?: string | null
          sequence_number?: number
          timestamp?: string
          to_phone: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          from_phone?: string
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_name?: string | null
          sender_sector?: string | null
          sequence_number?: number
          timestamp?: string
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          can_transfer: boolean | null
          created_at: string
          email: string
          id: string
          instance_name: string | null
          is_active: boolean
          is_admin: boolean | null
          managed_by: string | null
          max_concurrent_chats: number | null
          name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          sector: Database["public"]["Enums"]["sector_type"] | null
          sector_id: string | null
          setup_completed: boolean | null
          updated_at: string
          user_id: string
          whatsapp_connected: boolean | null
        }
        Insert: {
          can_transfer?: boolean | null
          created_at?: string
          email: string
          id?: string
          instance_name?: string | null
          is_active?: boolean
          is_admin?: boolean | null
          managed_by?: string | null
          max_concurrent_chats?: number | null
          name: string
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_id?: string | null
          setup_completed?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_connected?: boolean | null
        }
        Update: {
          can_transfer?: boolean | null
          created_at?: string
          email?: string
          id?: string
          instance_name?: string | null
          is_active?: boolean
          is_admin?: boolean | null
          managed_by?: string | null
          max_concurrent_chats?: number | null
          name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          sector?: Database["public"]["Enums"]["sector_type"] | null
          sector_id?: string | null
          setup_completed?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_connected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_managed_by_fkey"
            columns: ["managed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_response_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_response_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_responses: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          sector_id: string | null
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          sector_id?: string | null
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          sector_id?: string | null
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_responses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "quick_response_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_responses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_responses_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_survey_requests: {
        Row: {
          conversation_id: string
          created_at: string
          expires_at: string
          id: string
          sent_at: string
          status: string
          token: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          expires_at?: string
          id?: string
          sent_at?: string
          status?: string
          token?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          sent_at?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_survey_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          attendant_id: string | null
          client_phone: string
          comment: string | null
          conversation_id: string
          created_at: string
          id: string
          rating: number
          sector_id: string | null
          submitted_at: string
        }
        Insert: {
          attendant_id?: string | null
          client_phone: string
          comment?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          rating: number
          sector_id?: string | null
          submitted_at?: string
        }
        Update: {
          attendant_id?: string | null
          client_phone?: string
          comment?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          rating?: number
          sector_id?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sectors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          is_active: boolean
          updated_at: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          is_active?: boolean
          updated_at?: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          is_active?: boolean
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_conversation: {
        Args: { conversation_id: string }
        Returns: boolean
      }
      can_edit_conversation: {
        Args: { conversation_id: string }
        Returns: boolean
      }
      can_transfer_conversations: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_expired_survey_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_queue_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_message_counts_by_conversation: {
        Args: { conversation_ids: string[] }
        Returns: {
          conversation_id: string
          count: number
        }[]
      }
      get_queue_stats: {
        Args: { p_sector_id?: string }
        Returns: Json
      }
      get_satisfaction_stats: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_sector_id?: string
          p_attendant_id?: string
        }
        Returns: Json
      }
      increment_quick_response_usage: {
        Args: { response_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_queue_timeouts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      conversation_status: "new" | "in_progress" | "finished"
      message_direction: "incoming" | "outgoing"
      message_type: "text" | "image" | "audio" | "document"
      sector_type: "support" | "financial" | "sales"
      user_role: "admin" | "attendant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conversation_status: ["new", "in_progress", "finished"],
      message_direction: ["incoming", "outgoing"],
      message_type: ["text", "image", "audio", "document"],
      sector_type: ["support", "financial", "sales"],
      user_role: ["admin", "attendant"],
    },
  },
} as const
