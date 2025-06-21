-- Fase 1: Melhorar Estrutura do Banco de Dados
-- Migração para criar setores dinâmicos e sistema de transferências

-- 1. Criar tabela de setores dinâmicos
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- Cor hex padrão (cinza)
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela para rastrear transferências de conversas
CREATE TABLE public.conversation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  from_attendant_id UUID REFERENCES public.profiles(id),
  to_attendant_id UUID REFERENCES public.profiles(id),
  from_sector_id UUID REFERENCES public.sectors(id),
  to_sector_id UUID REFERENCES public.sectors(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, completed
  transferred_by UUID REFERENCES public.profiles(id), -- quem fez a transferência 
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar campos à tabela profiles para melhor controle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id),
ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES public.profiles(id), -- Admin que criou este atendente
ADD COLUMN IF NOT EXISTS can_transfer BOOLEAN DEFAULT true, -- Se pode transferir conversas
ADD COLUMN IF NOT EXISTS max_concurrent_chats INTEGER DEFAULT 10; -- Limite de chats simultâneos

-- 4. Modificar tabela conversations para usar sector_id em vez de enum
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- 5. Modificar attendant_sectors para usar sector_id
ALTER TABLE public.attendant_sectors 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- 6. Inserir setores padrão baseados no enum existente
INSERT INTO public.sectors (name, description, color, created_at) VALUES 
  ('Suporte', 'Atendimento técnico e suporte ao cliente', '#3B82F6', NOW()),
  ('Financeiro', 'Questões financeiras, pagamentos e cobranças', '#10B981', NOW()),
  ('Vendas', 'Vendas, negociações e novos clientes', '#F59E0B', NOW())
ON CONFLICT (name) DO NOTHING;

-- 7. Atualizar conversas existentes com sector_id baseado no enum
UPDATE public.conversations SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE conversations.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro' 
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL;

-- 8. Atualizar attendant_sectors com sector_id baseado no enum
UPDATE public.attendant_sectors SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE attendant_sectors.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro'
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL;

-- 9. Atualizar profiles com sector_id baseado no enum
UPDATE public.profiles SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE profiles.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro'
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL AND sector IS NOT NULL;

-- 10. Habilitar RLS nas novas tabelas
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_transfers ENABLE ROW LEVEL SECURITY;

-- 11. Criar políticas RLS para sectors
CREATE POLICY "Everyone can view active sectors" ON public.sectors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sectors" ON public.sectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 12. Criar políticas RLS para conversation_transfers
CREATE POLICY "Users can view transfers related to them" ON public.conversation_transfers
  FOR SELECT USING (
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Attendants can create transfers" ON public.conversation_transfers
  FOR INSERT WITH CHECK (
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Attendants can update their transfers" ON public.conversation_transfers
  FOR UPDATE USING (
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 13. Criar índices para performance
CREATE INDEX idx_sectors_active ON public.sectors(is_active);
CREATE INDEX idx_sectors_name ON public.sectors(name);
CREATE INDEX idx_conversation_transfers_conversation ON public.conversation_transfers(conversation_id);
CREATE INDEX idx_conversation_transfers_status ON public.conversation_transfers(status);
CREATE INDEX idx_profiles_sector_id ON public.profiles(sector_id);
CREATE INDEX idx_conversations_sector_id ON public.conversations(sector_id);
CREATE INDEX idx_attendant_sectors_sector_id ON public.attendant_sectors(sector_id);

-- 14. Adicionar as tabelas ao realtime
ALTER TABLE public.sectors REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_transfers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sectors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_transfers;

-- 15. Comentários para documentação
COMMENT ON TABLE public.sectors IS 'Setores dinâmicos do sistema de atendimento';
COMMENT ON TABLE public.conversation_transfers IS 'Histórico de transferências entre atendentes/setores';
COMMENT ON COLUMN public.profiles.managed_by IS 'ID do admin que criou/gerencia este atendente';
COMMENT ON COLUMN public.profiles.can_transfer IS 'Se o atendente pode transferir conversas';
COMMENT ON COLUMN public.profiles.max_concurrent_chats IS 'Limite máximo de chats simultâneos'; 