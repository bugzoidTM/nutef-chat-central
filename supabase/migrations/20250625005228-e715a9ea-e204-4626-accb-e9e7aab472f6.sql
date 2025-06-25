
-- FASE 3: CORRIGIR ERRO DE SYNTAX - APLICAR POLÍTICAS RLS REFINADAS
-- Correção: usar alias diferente para evitar conflito com palavra reservada

-- =====================================================
-- 1. REMOVER POLÍTICAS EXISTENTES
-- =====================================================

-- Remover políticas antigas de conversas
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Attendants can view their sector conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they can view" ON public.conversations;
DROP POLICY IF EXISTS "Allow webhook to insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Insert conversations via webhook or admin" ON public.conversations;

-- Remover políticas antigas de mensagens
DROP POLICY IF EXISTS "Users can view messages from accessible conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in accessible conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow webhook to insert messages" ON public.messages;

-- =====================================================
-- 2. FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE PERMISSÕES
-- =====================================================

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- Função para verificar se o usuário pode acessar uma conversa
CREATE OR REPLACE FUNCTION public.can_access_conversation(conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    -- Admin pode acessar tudo
    public.is_admin() OR
    -- Atendente pode acessar conversas do seu setor ou atribuídas a ele
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = conversation_id
      AND p.role = 'attendant' 
      AND p.is_active = true
      AND (
        -- Conversa do mesmo setor
        p.sector_id = c.sector_id OR 
        -- Conversa atribuída ao atendente
        p.id = c.assigned_to
      )
    );
$$;

-- Função para verificar se o usuário pode editar uma conversa
CREATE OR REPLACE FUNCTION public.can_edit_conversation(conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    -- Admin pode editar tudo
    public.is_admin() OR
    -- Atendente pode editar conversas acessíveis que não estão finalizadas
    (
      public.can_access_conversation(conversation_id) AND
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id 
        AND c.status != 'finished'
      )
    );
$$;

-- Função para verificar se o usuário pode transferir conversas
CREATE OR REPLACE FUNCTION public.can_transfer_conversations()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND (role = 'admin' OR (role = 'attendant' AND can_transfer = true))
  );
$$;

-- =====================================================
-- 3. POLÍTICAS REFINADAS PARA CONVERSAS
-- =====================================================

-- Visualização de conversas - refinada
CREATE POLICY "View conversations refined" ON public.conversations
  FOR SELECT USING (
    -- Admin vê todas as conversas
    public.is_admin() OR
    -- Atendente vê conversas do seu setor ou atribuídas a ele
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'attendant' 
      AND p.is_active = true
      AND (
        p.sector_id = conversations.sector_id OR 
        p.id = conversations.assigned_to
      )
    )
  );

-- Atualização de conversas - refinada
CREATE POLICY "Update conversations refined" ON public.conversations
  FOR UPDATE USING (
    public.can_edit_conversation(id)
  );

-- Inserção de conversas - webhook e admins
CREATE POLICY "Insert conversations refined" ON public.conversations
  FOR INSERT WITH CHECK (
    -- Permitir inserção via webhook (sem autenticação)
    auth.uid() IS NULL OR
    -- Ou admin autenticado
    public.is_admin()
  );

-- =====================================================
-- 4. POLÍTICAS REFINADAS PARA MENSAGENS
-- =====================================================

-- Visualização de mensagens - baseada no acesso à conversa
CREATE POLICY "View messages refined" ON public.messages
  FOR SELECT USING (
    public.can_access_conversation(conversation_id)
  );

-- Inserção de mensagens - webhook e usuários autorizados
CREATE POLICY "Insert messages refined" ON public.messages
  FOR INSERT WITH CHECK (
    -- Permitir inserção via webhook (sem autenticação)
    auth.uid() IS NULL OR
    -- Ou usuário com acesso à conversa
    public.can_access_conversation(conversation_id)
  );

-- Atualização de mensagens - marcar como lida
CREATE POLICY "Update messages refined" ON public.messages
  FOR UPDATE USING (
    public.can_access_conversation(conversation_id)
  );

-- =====================================================
-- 5. POLÍTICAS PARA PROFILES - REFINADAS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage attendant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "View profiles with permissions" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile or admin manages all" ON public.profiles;
DROP POLICY IF EXISTS "Admin can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "View profiles refined" ON public.profiles;
DROP POLICY IF EXISTS "Update profiles refined" ON public.profiles;
DROP POLICY IF EXISTS "Insert profiles refined" ON public.profiles;

-- Visualizar perfis (CORRIGIDO - sem usar palavra reservada current_user)
CREATE POLICY "View profiles refined" ON public.profiles
  FOR SELECT USING (
    -- Usuário pode ver seu próprio perfil
    user_id = auth.uid() OR
    -- Admin pode ver todos os perfis
    public.is_admin() OR
    -- Atendentes podem ver outros atendentes do mesmo setor (para transferências)
    EXISTS (
      SELECT 1 FROM public.profiles user_profile
      WHERE user_profile.user_id = auth.uid()
      AND user_profile.role = 'attendant'
      AND user_profile.is_active = true
      AND user_profile.sector_id = profiles.sector_id
      AND profiles.role = 'attendant'
    )
  );

-- Atualizar perfis
CREATE POLICY "Update profiles refined" ON public.profiles
  FOR UPDATE USING (
    -- Usuário pode atualizar seu próprio perfil
    user_id = auth.uid() OR
    -- Admin pode atualizar qualquer perfil
    public.is_admin()
  );

-- Inserir perfis - apenas admins
CREATE POLICY "Insert profiles refined" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

-- =====================================================
-- 6. POLÍTICAS PARA TRANSFERÊNCIAS DE CONVERSAS
-- =====================================================

-- Visualizar transferências
DROP POLICY IF EXISTS "View conversation transfers" ON public.conversation_transfers;
DROP POLICY IF EXISTS "View transfers refined" ON public.conversation_transfers;
CREATE POLICY "View transfers refined" ON public.conversation_transfers
  FOR SELECT USING (
    -- Admin vê todas as transferências
    public.is_admin() OR
    -- Usuário vê transferências que envolvem ele
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Criar transferências
DROP POLICY IF EXISTS "Create transfers with permission" ON public.conversation_transfers;
DROP POLICY IF EXISTS "Create transfers refined" ON public.conversation_transfers;
CREATE POLICY "Create transfers refined" ON public.conversation_transfers
  FOR INSERT WITH CHECK (
    -- Apenas usuários com permissão de transferência
    public.can_transfer_conversations() AND
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Atualizar transferências
DROP POLICY IF EXISTS "Update transfers with permission" ON public.conversation_transfers;
DROP POLICY IF EXISTS "Update transfers refined" ON public.conversation_transfers;
CREATE POLICY "Update transfers refined" ON public.conversation_transfers
  FOR UPDATE USING (
    -- Admin pode atualizar qualquer transferência
    public.is_admin() OR
    -- Atendente de destino pode aceitar/rejeitar
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    -- Quem transferiu pode cancelar (se ainda pendente)
    (transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND status = 'pending')
  );

-- =====================================================
-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para as funções de permissão
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role_active ON public.profiles(user_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_sector_role_active ON public.profiles(sector_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_sector_assigned ON public.conversations(sector_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_status_sector ON public.conversations(status, sector_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_direction ON public.messages(conversation_id, direction);
CREATE INDEX IF NOT EXISTS idx_transfers_attendant_status ON public.conversation_transfers(to_attendant_id, status);

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é admin ativo';
COMMENT ON FUNCTION public.can_access_conversation(UUID) IS 'Verifica se o usuário pode acessar uma conversa específica';
COMMENT ON FUNCTION public.can_edit_conversation(UUID) IS 'Verifica se o usuário pode editar uma conversa específica';
COMMENT ON FUNCTION public.can_transfer_conversations() IS 'Verifica se o usuário tem permissão para transferir conversas';

COMMENT ON POLICY "View conversations refined" ON public.conversations IS 'Permite visualizar conversas com base no setor e atribuições (Fase 3)';
COMMENT ON POLICY "View messages refined" ON public.messages IS 'Mensagens visíveis baseadas no acesso refinado à conversa (Fase 3)';
COMMENT ON POLICY "View profiles refined" ON public.profiles IS 'Perfis visíveis com permissões granulares entre atendentes do mesmo setor (Fase 3)';

SELECT 'Fase 3: Políticas RLS refinadas implementadas com sucesso!' as status;
