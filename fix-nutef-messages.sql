-- Script para investigar e corrigir mensagens da conversa Nutef
-- Execute no SQL Editor do Supabase

-- 1. Primeiro, vamos identificar a conversa do Nutef
SELECT 
  id, 
  client_name, 
  client_phone, 
  status, 
  created_at
FROM conversations 
WHERE client_phone LIKE '%5511932473951%';

-- 2. Verificar todas as mensagens desta conversa
SELECT 
  id,
  conversation_id,
  content,
  direction,
  is_read,
  timestamp,
  created_at
FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE client_phone LIKE '%5511932473951%'
)
ORDER BY timestamp ASC;

-- 3. Contar mensagens por status
SELECT 
  direction,
  is_read,
  COUNT(*) as total
FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE client_phone LIKE '%5511932473951%'
)
GROUP BY direction, is_read
ORDER BY direction, is_read;

-- 4. CORRIGIR: Marcar todas as mensagens incoming desta conversa como lidas
UPDATE messages 
SET is_read = true 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE client_phone LIKE '%5511932473951%'
)
AND direction = 'incoming'
AND is_read = false;

-- 5. Verificar após a correção
SELECT 
  'APÓS CORREÇÃO' as status,
  direction,
  is_read,
  COUNT(*) as total
FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE client_phone LIKE '%5511932473951%'
)
GROUP BY direction, is_read
ORDER BY direction, is_read; 