-- Script para adicionar campo is_read à tabela messages
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Adicionar a coluna is_read
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 2. Marcar mensagens existentes:
-- - Mensagens enviadas (outgoing) como lidas
-- - Mensagens recebidas (incoming) como não lidas
UPDATE messages 
SET is_read = CASE 
  WHEN direction = 'outgoing' THEN TRUE 
  ELSE FALSE 
END
WHERE is_read IS NULL;

-- 3. Criar índice para otimizar consultas de mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages (conversation_id, direction, is_read) 
WHERE direction = 'incoming' AND is_read = FALSE;

-- Verificar o resultado
SELECT 
  direction,
  is_read,
  COUNT(*) as total
FROM messages 
GROUP BY direction, is_read 
ORDER BY direction, is_read; 