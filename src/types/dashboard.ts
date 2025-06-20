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
  // ⭐ NOVOS CAMPOS ADICIONADOS
  last_message_content?: string;
  total_messages?: number;
}

export interface Message {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  from_phone: string;
  to_phone: string;
  conversation_id: string;
}
