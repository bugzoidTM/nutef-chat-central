
-- Create table for chatbot knowledge base/training data
CREATE TABLE public.chatbot_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[], -- Array of keywords for matching
  intent VARCHAR(100), -- Intent category (greeting, faq, complaint, etc.)
  sector_id UUID REFERENCES public.sectors(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.7, -- Minimum confidence to trigger
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chatbot configurations per sector
CREATE TABLE public.chatbot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES public.sectors(id) UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT DEFAULT 'Olá! Sou o assistente virtual. Como posso ajudá-lo?',
  escalation_message TEXT DEFAULT 'Vou transferir você para um atendente humano que poderá ajudá-lo melhor.',
  working_hours_start TIME DEFAULT '08:00:00',
  working_hours_end TIME DEFAULT '18:00:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Mon-Fri (1=Monday)
  max_interaction_attempts INTEGER DEFAULT 3, -- Max bot attempts before escalation
  auto_escalation_keywords TEXT[] DEFAULT ARRAY['atendente', 'humano', 'pessoa', 'falar com alguém'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chatbot conversations and context
CREATE TABLE public.chatbot_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id),
  message_id UUID REFERENCES public.messages(id),
  intent_detected VARCHAR(100),
  confidence_score DECIMAL(3,2),
  knowledge_used_id UUID REFERENCES public.chatbot_knowledge(id),
  user_input TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  escalated_to_human BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for conversation context/summary for human handoff
CREATE TABLE public.conversation_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) UNIQUE,
  client_name TEXT,
  client_email TEXT,
  client_issue_category VARCHAR(100),
  issue_description TEXT,
  bot_interaction_summary TEXT,
  collected_data JSONB, -- Structured data collected by bot
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_knowledge
CREATE POLICY "Users can view knowledge from their sector or global" 
  ON public.chatbot_knowledge 
  FOR SELECT 
  TO authenticated
  USING (
    is_active = true AND 
    (
      sector_id IS NULL OR -- Global knowledge
      sector_id IN (
        SELECT sector_id FROM public.profiles 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can manage all knowledge" 
  ON public.chatbot_knowledge 
  FOR ALL 
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for chatbot_configs
CREATE POLICY "Users can view configs from their sector" 
  ON public.chatbot_configs 
  FOR SELECT 
  TO authenticated
  USING (
    sector_id IN (
      SELECT sector_id FROM public.profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all configs" 
  ON public.chatbot_configs 
  FOR ALL 
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for chatbot_interactions
CREATE POLICY "Users can view interactions from their accessible conversations" 
  ON public.chatbot_interactions 
  FOR SELECT 
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE public.can_access_conversation(id)
    )
  );

CREATE POLICY "System can insert interactions" 
  ON public.chatbot_interactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true); -- Chatbot system needs to insert

-- RLS Policies for conversation_context
CREATE POLICY "Users can view context from their accessible conversations" 
  ON public.conversation_context 
  FOR SELECT 
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE public.can_access_conversation(id)
    )
  );

CREATE POLICY "System can manage context" 
  ON public.conversation_context 
  FOR ALL 
  TO authenticated
  WITH CHECK (true); -- Chatbot system needs full access

-- Function to check if chatbot should be active for a sector
CREATE OR REPLACE FUNCTION public.is_chatbot_active(p_sector_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_record RECORD;
  current_day INTEGER;
  check_time TIME;
BEGIN
  -- Get current day of week (1=Monday, 7=Sunday)
  current_day := EXTRACT(DOW FROM NOW());
  IF current_day = 0 THEN current_day := 7; END IF; -- Convert Sunday from 0 to 7
  
  -- Get current time
  check_time := CURRENT_TIME;
  
  -- Get chatbot config for sector
  SELECT * INTO config_record
  FROM public.chatbot_configs
  WHERE sector_id = p_sector_id AND is_enabled = true;
  
  -- If no config found, chatbot is inactive
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if current day is in working days
  IF NOT (current_day = ANY(config_record.working_days)) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if current time is within working hours
  IF check_time < config_record.working_hours_start OR 
     check_time > config_record.working_hours_end THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to find best matching knowledge entry
CREATE OR REPLACE FUNCTION public.find_chatbot_response(
  p_user_input TEXT,
  p_sector_id UUID
)
RETURNS TABLE(
  knowledge_id UUID,
  answer TEXT,
  intent VARCHAR(100),
  confidence DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  input_words TEXT[];
  knowledge_record RECORD;
  best_match RECORD;
  word_count INTEGER;
  matching_words INTEGER;
  calculated_confidence DECIMAL(3,2);
BEGIN
  -- Convert input to lowercase and split into words
  input_words := string_to_array(lower(p_user_input), ' ');
  
  -- Initialize best match
  best_match := NULL;
  
  -- Search through knowledge base
  FOR knowledge_record IN
    SELECT id, question, answer, keywords, intent, confidence_threshold
    FROM public.chatbot_knowledge
    WHERE is_active = true
    AND (sector_id = p_sector_id OR sector_id IS NULL)
    ORDER BY usage_count DESC -- Prioritize frequently used responses
  LOOP
    matching_words := 0;
    word_count := array_length(input_words, 1);
    
    -- Check for keyword matches
    IF knowledge_record.keywords IS NOT NULL THEN
      FOR i IN 1..array_length(input_words, 1) LOOP
        IF input_words[i] = ANY(knowledge_record.keywords) THEN
          matching_words := matching_words + 1;
        END IF;
      END LOOP;
    END IF;
    
    -- Also check question similarity (simple word matching)
    FOR i IN 1..array_length(input_words, 1) LOOP
      IF position(input_words[i] IN lower(knowledge_record.question)) > 0 THEN
        matching_words := matching_words + 1;
      END IF;
    END LOOP;
    
    -- Calculate confidence (simple ratio)
    IF word_count > 0 THEN
      calculated_confidence := LEAST(1.0, matching_words::DECIMAL / word_count::DECIMAL);
    ELSE
      calculated_confidence := 0.0;
    END IF;
    
    -- Check if this is better than current best and meets threshold
    IF calculated_confidence >= knowledge_record.confidence_threshold AND
       (best_match IS NULL OR calculated_confidence > best_match.confidence) THEN
      best_match := ROW(
        knowledge_record.id,
        knowledge_record.answer,
        knowledge_record.intent,
        calculated_confidence
      );
    END IF;
  END LOOP;
  
  -- Return best match if found
  IF best_match IS NOT NULL THEN
    -- Increment usage count
    UPDATE public.chatbot_knowledge 
    SET usage_count = usage_count + 1, updated_at = now()
    WHERE id = best_match.knowledge_id;
    
    RETURN QUERY SELECT 
      best_match.knowledge_id,
      best_match.answer,
      best_match.intent,
      best_match.confidence;
  END IF;
  
  RETURN;
END;
$$;

-- Insert default chatbot configurations for existing sectors
INSERT INTO public.chatbot_configs (sector_id, welcome_message)
SELECT 
  id,
  'Olá! Sou o assistente virtual do ' || name || '. Como posso ajudá-lo hoje?'
FROM public.sectors
WHERE is_active = true;

-- Insert some default knowledge base entries
INSERT INTO public.chatbot_knowledge (question, answer, keywords, intent) VALUES
('Olá', 'Olá! Como posso ajudá-lo hoje?', ARRAY['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'], 'greeting'),
('Horário de funcionamento', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.', ARRAY['horário', 'funcionamento', 'atendimento', 'aberto'], 'hours'),
('Como entrar em contato', 'Você pode entrar em contato conosco através deste chat ou pelo telefone (11) 1234-5678.', ARRAY['contato', 'telefone', 'falar'], 'contact'),
('Problemas técnicos', 'Para problemas técnicos, vou transferir você para nossa equipe especializada. Um momento, por favor.', ARRAY['problema', 'técnico', 'não funciona', 'erro', 'bug'], 'technical'),
('Obrigado', 'De nada! Fico feliz em ajudar. Há mais alguma coisa que posso fazer por você?', ARRAY['obrigado', 'obrigada', 'valeu', 'thanks'], 'thanks');
