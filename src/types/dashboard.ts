
import type { Database } from '@/integrations/supabase/types';

export type SectorType = Database['public']['Enums']['sector_type'] | 'all';
export type StatusType = Database['public']['Enums']['conversation_status'] | 'all';

export interface ConversationCounts {
  new: number;
  in_progress: number;
  finished: number;
}

export interface Conversation {
  id: string;
  client_name: string | null;
  client_phone: string;
  sector: string;
  status: string;
  last_message_at: string;
  assigned_to: string | null;
  sector_id: string | null; // ⭐ Added sector_id field
  instance_id: string;
  created_at: string;
  updated_at: string;
  // ⭐ NOVOS CAMPOS ADICIONADOS
  last_message_content?: string;
  unread_messages?: number;
  // Optional nested objects from joins
  instances?: {
    instance_name: string;
    phone: string;
  };
  sectors?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Message {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  from_phone: string;
  to_phone: string;
  conversation_id: string;
  // ⭐ NOVOS CAMPOS para identificar o remetente das mensagens enviadas
  sender_name?: string;
  sender_sector?: string;
}
