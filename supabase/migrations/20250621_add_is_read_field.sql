-- Adicionar campo is_read à tabela messages
-- Migração para controlar status de leitura das mensagens

-- 1. Adicionar a coluna is_read
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 2. Marcar mensagens existentes:
-- - Mensagens enviadas (outgoing) como lidas
-- - Mensagens recebidas (incoming) como não lidas
UPDATE public.messages 
SET is_read = CASE 
  WHEN direction = 'outgoing' THEN TRUE 
  ELSE FALSE 
END
WHERE is_read IS NULL;

-- 3. Criar índice para otimizar consultas de mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages(conversation_id, direction, is_read) 
WHERE direction = 'incoming' AND is_read = FALSE;

-- 4. Comentário para documentação
COMMENT ON COLUMN public.messages.is_read IS 'Status de leitura da mensagem (apenas para incoming messages)'; 