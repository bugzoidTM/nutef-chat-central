
-- Primeiro, vamos verificar e corrigir as políticas RLS para permitir inserção via webhook

-- Para a tabela conversations: permitir inserção via webhook (sem autenticação)
DROP POLICY IF EXISTS "Allow webhook to insert conversations" ON public.conversations;
CREATE POLICY "Allow webhook to insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- Para a tabela messages: permitir inserção via webhook (sem autenticação)  
DROP POLICY IF EXISTS "Allow webhook to insert messages" ON public.messages;
CREATE POLICY "Allow webhook to insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- Permitir que usuários autenticados vejam conversas baseado em seu perfil
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
CREATE POLICY "Users can view conversations from their sectors" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND (p.role = 'admin' OR as_table.sector = conversations.sector OR p.role = 'attendant')
    )
  );

-- Permitir que usuários autenticados vejam mensagens de conversas que podem acessar
DROP POLICY IF EXISTS "Users can view messages from accessible conversations" ON public.messages;
CREATE POLICY "Users can view messages from accessible conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = messages.conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector OR p.role = 'attendant')
    )
  );

-- Permitir que usuários autenticados insiram mensagens em conversas que podem acessar
DROP POLICY IF EXISTS "Users can insert messages in accessible conversations" ON public.messages;
CREATE POLICY "Users can insert messages in accessible conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = messages.conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector OR p.role = 'attendant')
    )
  );

-- Permitir que usuários autenticados atualizem conversas que podem acessar
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;
CREATE POLICY "Users can update conversations from their sectors" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND (p.role = 'admin' OR as_table.sector = conversations.sector OR p.role = 'attendant')
    )
  );

-- Verificar se RLS está habilitado nas tabelas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários vejam suas próprias instâncias
DROP POLICY IF EXISTS "Users can manage instances via profiles" ON public.instances;
CREATE POLICY "Users can manage instances via profiles" ON public.instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.id = instances.admin_id
    )
  );

-- Permitir que usuários vejam seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir que usuários atualizem seus próprios perfis
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
