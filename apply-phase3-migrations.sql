-- =======================================================
-- NUTEF CHAT CENTRAL - FASE 3
-- APLICAR MIGRAÇÕES DO SISTEMA DE PERMISSÕES REFINADO
-- =======================================================
-- Execute este arquivo no SQL Editor do Supabase
-- =======================================================

BEGIN;

-- =====================================================
-- MIGRAÇÃO 1: MELHORAR POLÍTICAS RLS
-- =====================================================

-- 1. REMOVER POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages from accessible conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in accessible conversations" ON public.messages;

-- 2. FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE PERMISSÕES
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_conversation(conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = conversation_id
      AND p.role = 'attendant' 
      AND p.is_active = true
      AND (p.sector_id = c.sector_id OR p.id = c.assigned_to)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_conversation(conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    public.is_admin() OR
    (
      public.can_access_conversation(conversation_id) AND
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id 
        AND c.status != 'finished'
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_transfer_conversations()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND (role = 'admin' OR (role = 'attendant' AND can_transfer = true))
  );
$$;

-- 3. POLÍTICAS REFINADAS PARA CONVERSAS
CREATE POLICY "View conversations refined" ON public.conversations
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'attendant' 
      AND p.is_active = true
      AND (p.sector_id = conversations.sector_id OR p.id = conversations.assigned_to)
    )
  );

CREATE POLICY "Update conversations refined" ON public.conversations
  FOR UPDATE USING (
    public.is_admin() OR
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.role = 'attendant' 
        AND p.is_active = true
        AND (p.sector_id = conversations.sector_id OR p.id = conversations.assigned_to)
      ) AND conversations.status != 'finished'
    )
  );

-- Manter política de inserção via webhook
CREATE POLICY "Insert conversations via webhook or admin" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL OR
    public.is_admin()
  );

-- 4. POLÍTICAS REFINADAS PARA MENSAGENS
CREATE POLICY "View messages refined" ON public.messages
  FOR SELECT USING (
    public.can_access_conversation(conversation_id)
  );

CREATE POLICY "Insert messages refined" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL OR
    public.can_access_conversation(conversation_id)
  );

CREATE POLICY "Update messages refined" ON public.messages
  FOR UPDATE USING (
    public.can_access_conversation(conversation_id)
  );

-- 5. POLÍTICAS PARA PROFILES - REFINADAS
DROP POLICY IF EXISTS "Admins can manage attendant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "View profiles with permissions" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles current_user
      WHERE current_user.user_id = auth.uid()
      AND current_user.role = 'attendant'
      AND current_user.is_active = true
      AND current_user.sector_id = profiles.sector_id
      AND profiles.role = 'attendant'
    )
  );

CREATE POLICY "Update own profile or admin manages all" ON public.profiles
  FOR UPDATE USING (
    user_id = auth.uid() OR
    public.is_admin()
  );

CREATE POLICY "Admin can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

-- 6. POLÍTICAS PARA SETORES
DROP POLICY IF EXISTS "Everyone can view active sectors" ON public.sectors;
CREATE POLICY "View active sectors refined" ON public.sectors
  FOR SELECT USING (
    is_active = true
  );

DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sectors;
CREATE POLICY "Admin manages sectors refined" ON public.sectors
  FOR ALL USING (
    public.is_admin()
  );

-- 7. POLÍTICAS PARA TRANSFERÊNCIAS DE CONVERSAS
DROP POLICY IF EXISTS "Users can view transfers related to them" ON public.conversation_transfers;
CREATE POLICY "View conversation transfers refined" ON public.conversation_transfers
  FOR SELECT USING (
    public.is_admin() OR
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Attendants can create transfers" ON public.conversation_transfers;
CREATE POLICY "Create transfers with permission refined" ON public.conversation_transfers
  FOR INSERT WITH CHECK (
    public.can_transfer_conversations() AND
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Attendants can update their transfers" ON public.conversation_transfers;
CREATE POLICY "Update transfers with permission refined" ON public.conversation_transfers
  FOR UPDATE USING (
    public.is_admin() OR
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    (transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND status = 'pending')
  );

-- 8. POLÍTICAS PARA ATTENDANT_SECTORS
DROP POLICY IF EXISTS "Attendants can view their assigned sectors" ON public.attendant_sectors;
CREATE POLICY "View assigned sectors refined" ON public.attendant_sectors
  FOR SELECT USING (
    public.is_admin() OR
    attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage attendant sectors" ON public.attendant_sectors;
CREATE POLICY "Admin manages attendant sectors refined" ON public.attendant_sectors
  FOR ALL USING (
    public.is_admin()
  );

-- =====================================================
-- MIGRAÇÃO 2: CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para otimizar as funções de permissão
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role_active ON public.profiles(user_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_sector_role_active ON public.profiles(sector_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_sector_assigned ON public.conversations(sector_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_status_sector ON public.conversations(status, sector_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_direction ON public.messages(conversation_id, direction);

-- Índice composto para transferências
CREATE INDEX IF NOT EXISTS idx_transfers_attendant_status ON public.conversation_transfers(to_attendant_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_from_to ON public.conversation_transfers(from_attendant_id, to_attendant_id);

-- =====================================================
-- MIGRAÇÃO 3: MELHORAR ESTRUTURA DE PERMISSÕES
-- =====================================================

-- Adicionar campos para controle de sessão (se não existirem)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 480; -- 8 horas

-- Função para verificar se a sessão está ativa
CREATE OR REPLACE FUNCTION public.is_session_active()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND (
      last_activity IS NULL OR 
      last_activity > NOW() - INTERVAL '1 minute' * COALESCE(session_timeout_minutes, 480)
    )
  );
$$;

-- Trigger para atualizar last_activity automaticamente
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_activity = NOW()
  WHERE user_id = auth.uid();
  RETURN NULL;
END;
$$;

-- Aplicar trigger em tabelas relevantes para atividade
DROP TRIGGER IF EXISTS trigger_update_activity_on_message ON public.messages;
CREATE TRIGGER trigger_update_activity_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();

DROP TRIGGER IF EXISTS trigger_update_activity_on_conversation ON public.conversations;
CREATE TRIGGER trigger_update_activity_on_conversation
  AFTER UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_last_activity();

-- =====================================================
-- MIGRAÇÃO 4: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

-- Comentários nas funções
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é admin ativo';
COMMENT ON FUNCTION public.can_access_conversation(UUID) IS 'Verifica se o usuário pode acessar uma conversa específica';
COMMENT ON FUNCTION public.can_edit_conversation(UUID) IS 'Verifica se o usuário pode editar uma conversa específica';
COMMENT ON FUNCTION public.can_transfer_conversations() IS 'Verifica se o usuário tem permissão para transferir conversas';
COMMENT ON FUNCTION public.is_session_active() IS 'Verifica se a sessão do usuário ainda está ativa';
COMMENT ON FUNCTION public.update_last_activity() IS 'Atualiza timestamp da última atividade do usuário';

-- Comentários nas políticas principais
COMMENT ON POLICY "View conversations refined" ON public.conversations IS 'Permite visualizar conversas com base no setor e atribuições (Fase 3)';
COMMENT ON POLICY "View messages refined" ON public.messages IS 'Mensagens visíveis baseadas no acesso refinado à conversa (Fase 3)';
COMMENT ON POLICY "View profiles with permissions" ON public.profiles IS 'Perfis visíveis com permissões granulares entre atendentes do mesmo setor (Fase 3)';

-- =====================================================
-- VERIFICAÇÕES E LIMPEZA
-- =====================================================

-- Verificar se todas as políticas foram criadas
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('conversations', 'messages', 'profiles', 'sectors', 'conversation_transfers', 'attendant_sectors')
    AND policyname LIKE '%refined%';
    
    IF policy_count < 10 THEN
        RAISE NOTICE 'ATENÇÃO: Algumas políticas podem não ter sido criadas corretamente. Total: %', policy_count;
    ELSE
        RAISE NOTICE 'Sucesso: % políticas refinadas criadas', policy_count;
    END IF;
END $$;

-- Verificar se as funções foram criadas
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('is_admin', 'can_access_conversation', 'can_edit_conversation', 'can_transfer_conversations', 'is_session_active');
    
    IF function_count < 5 THEN
        RAISE NOTICE 'ATENÇÃO: Algumas funções podem não ter sido criadas. Total: %', function_count;
    ELSE
        RAISE NOTICE 'Sucesso: % funções de permissão criadas', function_count;
    END IF;
END $$;

COMMIT;

-- =====================================================
-- MIGRAÇÃO FASE 3 CONCLUÍDA
-- =====================================================

SELECT 'FASE 3 CONCLUÍDA: Sistema de Permissões Refinado implementado com sucesso!' as status,
       'Políticas RLS otimizadas, funções de permissão criadas e índices adicionados' as detalhes,
       NOW() as timestamp_conclusao; 