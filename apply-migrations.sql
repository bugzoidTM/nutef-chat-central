-- Script para aplicar as migrações relacionadas ao sistema de mensagens
-- Execute este SQL no Supabase SQL Editor

-- MIGRAÇÃO 1: Adicionar campo de sequência (da migração anterior)
-- ============================================================

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

-- MIGRAÇÃO 2: Adicionar informações do remetente
-- ============================================== 

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

-- VERIFICAÇÃO FINAL
-- =================

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position; 