
export interface ChatbotKnowledge {
  id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  intent: string | null;
  sector_id: string | null;
  is_active: boolean;
  confidence_threshold: number;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotConfig {
  id: string;
  sector_id: string | null;
  is_enabled: boolean;
  welcome_message: string | null;
  escalation_message: string | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  working_days: number[] | null;
  max_interaction_attempts: number | null;
  auto_escalation_keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotInteraction {
  id: string;
  conversation_id: string | null;
  message_id: string | null;
  intent_detected: string | null;
  confidence_score: number | null;
  knowledge_used_id: string | null;
  user_input: string;
  bot_response: string;
  escalated_to_human: boolean | null;
  escalation_reason: string | null;
  created_at: string;
}

export interface ConversationContext {
  id: string;
  conversation_id: string | null;
  client_name: string | null;
  client_email: string | null;
  client_issue_category: string | null;
  issue_description: string | null;
  bot_interaction_summary: string | null;
  collected_data: any | null;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeData {
  question: string;
  answer: string;
  keywords?: string[];
  intent?: string;
  sector_id?: string;
  confidence_threshold?: number;
}

export interface UpdateKnowledgeData {
  question?: string;
  answer?: string;
  keywords?: string[];
  intent?: string;
  confidence_threshold?: number;
  is_active?: boolean;
}

export interface UpdateConfigData {
  is_enabled?: boolean;
  welcome_message?: string;
  escalation_message?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: number[];
  max_interaction_attempts?: number;
  auto_escalation_keywords?: string[];
}

export interface ChatbotResponse {
  knowledge_id: string;
  answer: string;
  intent: string;
  confidence: number;
}
