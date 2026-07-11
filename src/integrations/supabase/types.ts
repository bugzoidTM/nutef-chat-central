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
      chatbot_configs: {
        Row: {
          auto_escalation_keywords: string[] | null
          created_at: string
          escalation_message: string | null
          id: string
          is_enabled: boolean
          max_interaction_attempts: number | null
          sector_id: string | null
          updated_at: string
          welcome_message: string | null
          working_days: number[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          auto_escalation_keywords?: string[] | null
          created_at?: string
          escalation_message?: string | null
          id?: string
          is_enabled?: boolean
          max_interaction_attempts?: number | null
          sector_id?: string | null
          updated_at?: string
          welcome_message?: string | null
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          auto_escalation_keywords?: string[] | null
          created_at?: string
          escalation_message?: string | null
          id?: string
          is_enabled?: boolean
          max_interaction_attempts?: number | null
          sector_id?: string | null
          updated_at?: string
          welcome_message?: string | null
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_configs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: true
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_interactions: {
        Row: {
          bot_response: string
          confidence_score: number | null
          conversation_id: string | null
          created_at: string
          escalated_to_human: boolean | null
          escalation_reason: string | null
          id: string
          intent_detected: string | null
          knowledge_used_id: string | null
          message_id: string | null
          user_input: string
        }
        Insert: {
          bot_response: string
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          id?: string
          intent_detected?: string | null
          knowledge_used_id?: string | null
          message_id?: string | null
          user_input: string
        }
        Update: {
          bot_response?: string
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          id?: string
          intent_detected?: string | null
          knowledge_used_id?: string | null
          message_id?: string | null
          user_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_interactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_knowledge_used_id_fkey"
            columns: ["knowledge_used_id"]
            isOneToOne: false
            referencedRelation: "chatbot_knowledge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_knowledge: {
        Row: {
          answer: string
          confidence_threshold: number | null
          created_at: string
          created_by: string | null
          id: string
          intent: string | null
          is_active: boolean
          keywords: string[] | null
          question: string
          sector_id: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          answer: string
          confidence_threshold?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean
          keywords?: string[] | null
          question: string
          sector_id?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          answer?: string
          confidence_threshold?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean
          keywords?: string[] | null
          question?: string
          sector_id?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_knowledge_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_knowledge_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          bot_interaction_summary: string | null
          client_email: string | null
          client_issue_category: string | null
          client_name: string | null
          collected_data: Json | null
          conversation_id: string | null
          created_at: string
          escalation_reason: string | null
          id: string
          issue_description: string | null
          updated_at: string
        }
        Insert: {
          bot_interaction_summary?: string | null
          client_email?: string | null
          client_issue_category?: string | null
          client_name?: string | null
          collected_data?: Json | null
          conversation_id?: string | null
          created_at?: string
          escalation_reason?: string | null
          id?: string
          issue_description?: string | null
          updated_at?: string
        }
        Update: {
          bot_interaction_summary?: string | null
          client_email?: string | null
          client_issue_category?: string | null
          client_name?: string | null
          collected_data?: Json | null
          conversation_id?: string | null
          created_at?: string
          escalation_reason?: string | null
          id?: string
          issue_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_context_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
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
      contact_notes: {
        Row: {
          author_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_to: string | null
          client_name: string | null
          client_phone: string
          created_at: string
          crm_stage_id: string | null
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
          crm_stage_id?: string | null
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
          crm_stage_id?: string | null
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
      internal_comments: {
        Row: {
          author_id: string
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          mentioned_user_ids: string[] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentioned_user_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentioned_user_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_comments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "internal_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_tasks: {
        Row: {
          assigned_to_sector: string | null
          assigned_to_user: string | null
          completed_at: string | null
          conversation_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_sector?: string | null
          assigned_to_user?: string | null
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_sector?: string | null
          assigned_to_user?: string | null
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_tasks_assigned_to_sector_fkey"
            columns: ["assigned_to_sector"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_tasks_assigned_to_user_fkey"
            columns: ["assigned_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_tasks_created_by_fkey"
            columns: ["created_by"]
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
      off_hours_queue: {
        Row: {
          client_name: string | null
          client_phone: string
          contacted_at: string | null
          contacted_by: string | null
          conversation_id: string | null
          created_at: string
          id: string
          notes: string | null
          priority: number
          received_at: string
          sector_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_phone: string
          contacted_at?: string | null
          contacted_by?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          received_at?: string
          sector_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_phone?: string
          contacted_at?: string | null
          contacted_by?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          received_at?: string
          sector_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "off_hours_queue_contacted_by_fkey"
            columns: ["contacted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "off_hours_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "off_hours_queue_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
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
          nickname: string | null
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
          nickname?: string | null
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
          nickname?: string | null
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
      working_hours: {
        Row: {
          auto_response_enabled: boolean
          auto_response_message: string
          created_at: string
          end_time: string
          id: string
          is_enabled: boolean
          queue_enabled: boolean
          queue_message: string
          sector_id: string | null
          start_time: string
          timezone: string
          updated_at: string
          working_days: number[]
        }
        Insert: {
          auto_response_enabled?: boolean
          auto_response_message?: string
          created_at?: string
          end_time?: string
          id?: string
          is_enabled?: boolean
          queue_enabled?: boolean
          queue_message?: string
          sector_id?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
          working_days?: number[]
        }
        Update: {
          auto_response_enabled?: boolean
          auto_response_message?: string
          created_at?: string
          end_time?: string
          id?: string
          is_enabled?: boolean
          queue_enabled?: boolean
          queue_message?: string
          sector_id?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
          working_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: true
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
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
      find_chatbot_response: {
        Args: { p_user_input: string; p_sector_id: string }
        Returns: {
          knowledge_id: string
          answer: string
          intent: string
          confidence: number
        }[]
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
      is_chatbot_active: {
        Args: { p_sector_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_queue_timeouts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      conversation_status:
        | "new"
        | "in_progress"
        | "finished"
        | "completed"
        | "closed"
        | "archived"
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
      conversation_status: [
        "new",
        "in_progress",
        "finished",
        "completed",
        "closed",
        "archived",
      ],
      message_direction: ["incoming", "outgoing"],
      message_type: ["text", "image", "audio", "document"],
      sector_type: ["support", "financial", "sales"],
      user_role: ["admin", "attendant"],
    },
  },
} as const
