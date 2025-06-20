-- Correção das políticas RLS para o dashboard
-- Execute este SQL no Supabase SQL Editor

-- 1. Política mais permissiva para admins verem todas as conversas
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
CREATE POLICY "Users can view conversations from their sectors" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'attendant' 
      AND as_table.sector = conversations.sector
    )
  );

-- 2. Política mais permissiva para mensagens
DROP POLICY IF EXISTS "Users can view messages from accessible conversations" ON public.messages;
CREATE POLICY "Users can view messages from accessible conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND p.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = messages.conversation_id 
      AND p.role = 'attendant' 
      AND as_table.sector = c.sector
    )
  );

-- 3. Garantir que as políticas de webhook ainda funcionem (inserção sem autenticação)
DROP POLICY IF EXISTS "Allow webhook to insert conversations" ON public.conversations;
CREATE POLICY "Allow webhook to insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow webhook to insert messages" ON public.messages;
CREATE POLICY "Allow webhook to insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- 4. Política para atualização de conversas
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;
CREATE POLICY "Users can update conversations from their sectors" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'attendant' 
      AND as_table.sector = conversations.sector
    )
  );

-- 5. Política para inserção de mensagens pelos usuários autenticados
DROP POLICY IF EXISTS "Users can insert messages in accessible conversations" ON public.messages;
CREATE POLICY "Users can insert messages in accessible conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND p.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = messages.conversation_id 
      AND p.role = 'attendant' 
      AND as_table.sector = c.sector
    )
  );

-- 6. Verificar se RLS está habilitado (garantia)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Garantir que usuários vejam seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 8. Política para instâncias (caso não exista)
DROP POLICY IF EXISTS "Users can manage instances via profiles" ON public.instances;
CREATE POLICY "Users can manage instances via profiles" ON public.instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.id = instances.admin_id
    )
  );

-- 9. Verificar políticas criadas
SELECT 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'profiles', 'instances')
ORDER BY tablename, policyname; 