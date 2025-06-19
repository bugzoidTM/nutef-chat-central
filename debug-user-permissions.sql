-- Execute este SQL no Supabase SQL Editor para debugar permissões do usuário
-- Substitua 'SEU_USER_ID_AQUI' pelo user_id do auth.users

-- 1. Verificar o perfil do usuário
SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.role,
    p.created_at
FROM public.profiles p 
WHERE p.user_id = auth.uid(); -- ou substitua por 'UUID_DO_USUARIO'

-- 2. Verificar setores do atendente
SELECT 
    a.sector,
    p.full_name,
    p.role
FROM public.attendant_sectors a
JOIN public.profiles p ON p.id = a.attendant_id
WHERE p.user_id = auth.uid(); -- ou substitua por 'UUID_DO_USUARIO'

-- 3. Verificar conversas que o usuário deveria ver
SELECT 
    c.id,
    c.client_name,
    c.client_phone,
    c.sector,
    c.status,
    c.last_message_at
FROM public.conversations c
WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
    WHERE p.user_id = auth.uid() -- ou substitua por 'UUID_DO_USUARIO'
    AND (p.role = 'admin' OR as_table.sector = c.sector)
)
ORDER BY c.last_message_at DESC
LIMIT 10;

-- 4. Verificar mensagens que o usuário deveria ver
SELECT 
    m.id,
    m.content,
    m.direction,
    m.timestamp,
    c.client_name,
    c.sector
FROM public.messages m
JOIN public.conversations c ON c.id = m.conversation_id
WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
    WHERE p.user_id = auth.uid() -- ou substitua por 'UUID_DO_USUARIO'
    AND (p.role = 'admin' OR as_table.sector = c.sector)
)
ORDER BY m.timestamp DESC
LIMIT 10;

-- 5. Verificar todas as políticas RLS para messages
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- 6. Verificar todas as políticas RLS para conversations
SELECT * FROM pg_policies WHERE tablename = 'conversations'; 