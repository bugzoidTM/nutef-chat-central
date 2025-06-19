-- Corrigir políticas RLS para permitir acesso adequado aos dados

-- Remover políticas conflitantes da tabela instances
DROP POLICY IF EXISTS "Users can view their own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can create their own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.instances;

-- Recriar políticas corretas para instances usando profiles
CREATE POLICY "Users can manage instances via profiles" ON public.instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.id = instances.admin_id
    )
  );

-- Simplificar política de conversas para admins
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;

CREATE POLICY "Admins can view all conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Attendants can view their sector conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND p.role = 'attendant' 
      AND as_table.sector = conversations.sector
    )
  );

CREATE POLICY "Users can update conversations they can view" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND (p.role = 'admin' OR as_table.sector = conversations.sector)
    )
  );

-- Permitir inserção de conversas via webhook (sistema)
CREATE POLICY "Allow webhook to insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- Permitir inserção de mensagens via webhook (sistema)  
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

CREATE POLICY "Users can insert messages in accessible conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector)
    )
  );

-- Permitir inserção de mensagens via webhook (sistema)
CREATE POLICY "Allow webhook to insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- Permitir visualização de mensagens para usuários autorizados
CREATE POLICY "Users can view messages from accessible conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector)
    )
  ); 