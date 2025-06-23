
-- Primeiro, adicionar constraint única na tabela sectors para o campo name
ALTER TABLE public.sectors ADD CONSTRAINT sectors_name_unique UNIQUE (name);

-- Adicionar campos faltantes à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS can_transfer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_concurrent_chats INTEGER DEFAULT 10;

-- Adicionar campos faltantes à tabela conversation_transfers
ALTER TABLE public.conversation_transfers 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS transferred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo faltante à tabela sectors
ALTER TABLE public.sectors 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Adicionar campo sector_id à tabela conversations se não existir
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- Adicionar campo sector_id à tabela attendant_sectors se não existir
ALTER TABLE public.attendant_sectors 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- Inserir setores padrão se não existirem (agora funcionará com a constraint única)
INSERT INTO public.sectors (name, description, color, is_active, created_at, updated_at) VALUES 
  ('Suporte', 'Atendimento técnico e suporte ao cliente', '#3B82F6', true, NOW(), NOW()),
  ('Financeiro', 'Questões financeiras, pagamentos e cobranças', '#10B981', true, NOW(), NOW()),
  ('Vendas', 'Vendas, negociações e novos clientes', '#F59E0B', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Migrar dados existentes para usar sector_id baseado no enum
UPDATE public.conversations SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE conversations.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro' 
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL;

-- Migrar attendant_sectors para usar sector_id
UPDATE public.attendant_sectors SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE attendant_sectors.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro'
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL;

-- Migrar profiles para usar sector_id
UPDATE public.profiles SET sector_id = (
  SELECT id FROM public.sectors WHERE 
    CASE profiles.sector
      WHEN 'support' THEN name = 'Suporte'
      WHEN 'financial' THEN name = 'Financeiro'
      WHEN 'sales' THEN name = 'Vendas'
    END
) WHERE sector_id IS NULL AND sector IS NOT NULL;

-- Configurar Realtime para as novas tabelas
ALTER TABLE public.sectors REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_transfers REPLICA IDENTITY FULL;

-- Adicionar as tabelas ao realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sectors;
  EXCEPTION WHEN duplicate_object THEN
    -- Tabela já está na publicação, ignorar erro
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_transfers;
  EXCEPTION WHEN duplicate_object THEN
    -- Tabela já está na publicação, ignorar erro
  END;
END$$;

-- Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_transferred_by ON public.conversation_transfers(transferred_by);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_accepted_at ON public.conversation_transfers(accepted_at);
CREATE INDEX IF NOT EXISTS idx_conversation_transfers_completed_at ON public.conversation_transfers(completed_at);
CREATE INDEX IF NOT EXISTS idx_sectors_created_by ON public.sectors(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_can_transfer ON public.profiles(can_transfer);
CREATE INDEX IF NOT EXISTS idx_profiles_max_concurrent_chats ON public.profiles(max_concurrent_chats);

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.can_transfer IS 'Se o atendente pode transferir conversas para outros setores/atendentes';
COMMENT ON COLUMN public.profiles.max_concurrent_chats IS 'Limite máximo de conversas simultâneas que o atendente pode gerenciar';
COMMENT ON COLUMN public.conversation_transfers.status IS 'Status da transferência: pending, accepted, completed';
COMMENT ON COLUMN public.conversation_transfers.transferred_by IS 'Quem iniciou a transferência';
COMMENT ON COLUMN public.conversation_transfers.accepted_at IS 'Quando a transferência foi aceita';
COMMENT ON COLUMN public.conversation_transfers.completed_at IS 'Quando a transferência foi finalizada';
COMMENT ON COLUMN public.sectors.created_by IS 'Admin que criou o setor';
