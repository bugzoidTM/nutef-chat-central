-- Adicionar campos para identificar quem enviou as mensagens outgoing
-- Esta migração permite mostrar o nome e setor do atendente nas mensagens enviadas

-- 1. Adicionar colunas sender_name e sender_sector
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_sector TEXT;

-- 2. Criar índice para consultas por sender
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON public.messages(sender_name, sender_sector) 
WHERE direction = 'outgoing';

-- 3. Comentários para documentação
COMMENT ON COLUMN public.messages.sender_name IS 'Nome do atendente que enviou a mensagem (apenas para direction=outgoing)';
COMMENT ON COLUMN public.messages.sender_sector IS 'Setor do atendente que enviou a mensagem (apenas para direction=outgoing)'; 