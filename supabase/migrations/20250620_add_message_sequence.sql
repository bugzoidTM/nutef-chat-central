-- Adicionar campo de sequência para garantir ordem cronológica correta das mensagens
-- Esta migração resolve o problema de mensagens enviadas aparecerem fora de ordem

-- 1. Adicionar coluna sequence_number
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sequence_number BIGSERIAL;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sequence 
ON public.messages(conversation_id, sequence_number);

-- 3. Atualizar mensagens existentes com sequence_number baseado em timestamp + created_at
WITH numbered_messages AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY conversation_id 
      ORDER BY timestamp ASC, created_at ASC, id ASC
    ) as new_sequence
  FROM public.messages
)
UPDATE public.messages 
SET sequence_number = numbered_messages.new_sequence
FROM numbered_messages 
WHERE public.messages.id = numbered_messages.id; 