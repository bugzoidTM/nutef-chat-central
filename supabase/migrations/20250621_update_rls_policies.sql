-- Atualizar políticas RLS para usar sector_id em vez de enum sector
-- Migração para corrigir as políticas após adição dos setores dinâmicos

-- 1. Remover políticas antigas que usam enum sector
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- 2. Criar políticas atualizadas usando sector_id
CREATE POLICY "Users can view conversations from their sectors" ON public.conversations
  FOR SELECT USING (
    -- Admins podem ver todas as conversas
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    ) OR
    -- Atendentes podem ver conversas do seu setor
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role = 'attendant' 
      AND p.sector_id = conversations.sector_id
    ) OR
    -- Atendentes podem ver conversas atribuídas a eles
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.id = conversations.assigned_to
    )
  );

CREATE POLICY "Users can update conversations from their sectors" ON public.conversations
  FOR UPDATE USING (
    -- Admins podem atualizar todas as conversas
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    ) OR
    -- Atendentes podem atualizar conversas do seu setor
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role = 'attendant' 
      AND p.sector_id = conversations.sector_id
    ) OR
    -- Atendentes podem atualizar conversas atribuídas a eles
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.id = conversations.assigned_to
    )
  );

CREATE POLICY "Users can view messages from accessible conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND (
        -- Admins podem ver todas as mensagens
        p.role = 'admin' OR
        -- Atendentes podem ver mensagens do seu setor
        (p.role = 'attendant' AND p.sector_id = c.sector_id) OR
        -- Atendentes podem ver mensagens de conversas atribuídas a eles
        p.id = c.assigned_to
      )
    )
  );

CREATE POLICY "Users can insert messages in accessible conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND (
        -- Admins podem inserir mensagens em qualquer conversa
        p.role = 'admin' OR
        -- Atendentes podem inserir mensagens em conversas do seu setor
        (p.role = 'attendant' AND p.sector_id = c.sector_id) OR
        -- Atendentes podem inserir mensagens em conversas atribuídas a eles
        p.id = c.assigned_to
      )
    )
  );

-- 3. Política para atualizar mensagens (marcar como lida)
CREATE POLICY "Users can update messages in accessible conversations" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND (
        -- Admins podem atualizar mensagens em qualquer conversa
        p.role = 'admin' OR
        -- Atendentes podem atualizar mensagens em conversas do seu setor
        (p.role = 'attendant' AND p.sector_id = c.sector_id) OR
        -- Atendentes podem atualizar mensagens em conversas atribuídas a eles
        p.id = c.assigned_to
      )
    )
  );

-- 4. Política para inserção de conversas via webhook (manter a política existente)
-- Esta política já existe e permite inserção sem autenticação para webhooks

-- 5. Política para permitir que admins gerenciem perfis de atendentes
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can manage attendant profiles" ON public.profiles
  FOR ALL USING (
    -- Admins podem gerenciar todos os perfis
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    ) OR
    -- Usuários podem ver/editar apenas seu próprio perfil
    auth.uid() = user_id
  );

-- 6. Política para attendant_sectors usando sector_id
DROP POLICY IF EXISTS "Admins can manage attendant sectors" ON public.attendant_sectors;
DROP POLICY IF EXISTS "Attendants can view their own sectors" ON public.attendant_sectors;

CREATE POLICY "Admins can manage attendant sectors" ON public.attendant_sectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Attendants can view their assigned sectors" ON public.attendant_sectors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND id = attendant_sectors.attendant_id
    )
  );

-- 7. Comentários para documentação
COMMENT ON POLICY "Users can view conversations from their sectors" ON public.conversations IS 'Permite visualizar conversas baseado no setor do usuário ou atribuição';
COMMENT ON POLICY "Users can view messages from accessible conversations" ON public.messages IS 'Permite visualizar mensagens de conversas acessíveis ao usuário';
COMMENT ON POLICY "Users can update messages in accessible conversations" ON public.messages IS 'Permite atualizar mensagens (ex: marcar como lida) em conversas acessíveis'; 