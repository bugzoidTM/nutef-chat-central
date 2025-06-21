-- FASE 1: MELHORAR ESTRUTURA DO BANCO DE DADOS
-- Script consolidado para aplicar todas as migrações necessárias
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- MIGRAÇÃO 1: Adicionar campo is_read às mensagens
-- =====================================================

-- Adicionar a coluna is_read
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Marcar mensagens existentes: outgoing como lidas, incoming como não lidas
UPDATE public.messages 
SET is_read = CASE 
  WHEN direction = 'outgoing' THEN TRUE 
  ELSE FALSE 
END
WHERE is_read IS NULL;

-- Criar índice para otimizar consultas de mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages(conversation_id, direction, is_read) 
WHERE direction = 'incoming' AND is_read = FALSE;

-- =====================================================
-- MIGRAÇÃO 2: Criar setores dinâmicos e transferências
-- =====================================================

-- 1. Criar tabela de setores dinâmicos
CREATE TABLE IF NOT EXISTS public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela para rastrear transferências
CREATE TABLE IF NOT EXISTS public.conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  from_attendant_id UUID REFERENCES public.profiles(id),
  to_attendant_id UUID REFERENCES public.profiles(id),
  from_sector_id UUID REFERENCES public.sectors(id),
  to_sector_id UUID REFERENCES public.sectors(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  transferred_by UUID REFERENCES public.profiles(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar campos à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id),
ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS can_transfer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_concurrent_chats INTEGER DEFAULT 10;

-- 4. Adicionar sector_id às outras tabelas
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

ALTER TABLE public.attendant_sectors 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- 5. Inserir setores padrão
INSERT INTO public.sectors (name, description, color, created_at) VALUES 
  ('Suporte', 'Atendimento técnico e suporte ao cliente', '#3B82F6', NOW()),
  ('Financeiro', 'Questões financeiras, pagamentos e cobranças', '#10B981', NOW()),
  ('Vendas', 'Vendas, negociações e novos clientes', '#F59E0B', NOW())
ON CONFLICT (name) DO NOTHING;

-- 6. Migrar dados existentes para usar sector_id
UPDATE public.conversations SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE conversations.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro' 
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL;

UPDATE public.attendant_sectors SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE attendant_sectors.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro'
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL;

UPDATE public.profiles SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE profiles.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro'
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL AND sector IS NOT NULL;

-- =====================================================
-- MIGRAÇÃO 3: Configurar RLS e Políticas
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_transfers ENABLE ROW LEVEL SECURITY;

-- Políticas para sectors
DROP POLICY IF EXISTS "Everyone can view active sectors" ON public.sectors;
CREATE POLICY "Everyone can view active sectors" ON public.sectors
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sectors;
CREATE POLICY "Admins can manage sectors" ON public.sectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para conversation_transfers
DROP POLICY IF EXISTS "Users can view transfers related to them" ON public.conversation_transfers;
CREATE POLICY "Users can view transfers related to them" ON public.conversation_transfers
  FOR SELECT USING (
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Attendants can create transfers" ON public.conversation_transfers;
CREATE POLICY "Attendants can create transfers" ON public.conversation_transfers
  FOR INSERT WITH CHECK (
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Attendants can update their transfers" ON public.conversation_transfers;
CREATE POLICY "Attendants can update their transfers" ON public.conversation_transfers
  FOR UPDATE USING (
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- MIGRAÇÃO 4: Atualizar políticas RLS existentes
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations from their sectors" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- Criar políticas atualizadas usando sector_id
CREATE POLICY "Users can view conversations from their sectors" ON public.conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'attendant' AND p.sector_id = conversations.sector_id) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.id = conversations.assigned_to)
  );

CREATE POLICY "Users can update conversations from their sectors" ON public.conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'attendant' AND p.sector_id = conversations.sector_id) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.id = conversations.assigned_to)
  );

CREATE POLICY "Users can view messages from accessible conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND (p.role = 'admin' OR (p.role = 'attendant' AND p.sector_id = c.sector_id) OR p.id = c.assigned_to)
    )
  );

CREATE POLICY "Users can insert messages in accessible conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND (p.role = 'admin' OR (p.role = 'attendant' AND p.sector_id = c.sector_id) OR p.id = c.assigned_to)
    )
  );

CREATE POLICY "Users can update messages in accessible conversations" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = messages.conversation_id 
      AND (p.role = 'admin' OR (p.role = 'attendant' AND p.sector_id = c.sector_id) OR p.id = c.assigned_to)
    )
  );

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sectors_active ON public.sectors(is_active);
CREATE INDEX IF NOT EXISTS idx_sectors_name ON public.sectors(name);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_conversation ON public.conversation_transfers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_status ON public.conversation_transfers(status);
CREATE INDEX IF NOT EXISTS idx_profiles_sector_id ON public.profiles(sector_id);
CREATE INDEX IF NOT EXISTS idx_conversations_sector_id ON public.conversations(sector_id);
CREATE INDEX IF NOT EXISTS idx_attendant_sectors_sector_id ON public.attendant_sectors(sector_id);

-- =====================================================
-- CONFIGURAR REALTIME
-- =====================================================

ALTER TABLE public.sectors REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_transfers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sectors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_transfers;

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA
-- =====================================================

SELECT 'Fase 1: Migração básica concluída!' as status; 