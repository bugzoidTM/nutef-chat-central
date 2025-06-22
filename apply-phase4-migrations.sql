-- ==========================================
-- FASE 4: SISTEMA DE ENCAMINHAMENTO
-- SCRIPT CONSOLIDADO DE MIGRAÇÃO
-- ==========================================

-- Tabela para gerenciar a fila de atendimento
CREATE TABLE IF NOT EXISTS public.conversation_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority INTEGER NOT NULL DEFAULT 1, -- 1=Normal, 2=Média, 3=Alta
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'assigned', 'timeout', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    timeout_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(conversation_id), -- Uma conversa só pode estar na fila uma vez
    
    -- Checks
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 3),
    CONSTRAINT timeout_after_assigned CHECK (timeout_at IS NULL OR assigned_at IS NOT NULL),
    CONSTRAINT completed_after_created CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversation_queue_sector_status ON public.conversation_queue(sector_id, status);
CREATE INDEX IF NOT EXISTS idx_conversation_queue_assigned_to ON public.conversation_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversation_queue_priority_created ON public.conversation_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conversation_queue_timeout ON public.conversation_queue(timeout_at) WHERE status = 'assigned';

-- Função para obter estatísticas da fila
CREATE OR REPLACE FUNCTION public.get_queue_stats(p_sector_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'waiting', COUNT(*) FILTER (WHERE status = 'waiting'),
        'assigned', COUNT(*) FILTER (WHERE status = 'assigned'),
        'timeout', COUNT(*) FILTER (WHERE status = 'timeout'),
        'averageWaitTime', COALESCE(
            AVG(EXTRACT(EPOCH FROM (COALESCE(assigned_at, NOW()) - created_at)) / 60) 
            FILTER (WHERE status IN ('assigned', 'completed')), 0
        ),
        'totalProcessed', COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE)
    ) INTO stats
    FROM public.conversation_queue
    WHERE (p_sector_id IS NULL OR sector_id = p_sector_id);
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar itens antigos da fila
CREATE OR REPLACE FUNCTION public.cleanup_queue_items()
RETURNS void AS $$
BEGIN
    -- Remover itens completados há mais de 7 dias
    DELETE FROM public.conversation_queue 
    WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '7 days';
    
    -- Remover itens timeout há mais de 24 horas
    DELETE FROM public.conversation_queue 
    WHERE status = 'timeout' 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-adicionar conversas novas à fila
CREATE OR REPLACE FUNCTION public.auto_add_to_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Adicionar à fila se for uma conversa nova sem atendente
    IF NEW.status = 'new' AND NEW.assigned_to IS NULL THEN
        INSERT INTO public.conversation_queue (conversation_id, sector_id, priority)
        VALUES (NEW.id, NEW.sector_id, 1)
        ON CONFLICT (conversation_id) DO NOTHING;
    END IF;
    
    -- Remover da fila se conversa foi atribuída ou finalizada
    IF NEW.assigned_to IS NOT NULL OR NEW.status IN ('completed', 'closed') THEN
        UPDATE public.conversation_queue 
        SET status = 'completed', completed_at = NOW()
        WHERE conversation_id = NEW.id AND status != 'completed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela de conversas
DROP TRIGGER IF EXISTS trigger_auto_queue ON public.conversations;
CREATE TRIGGER trigger_auto_queue
    AFTER INSERT OR UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_add_to_queue();

-- Trigger para marcar timeout automático
CREATE OR REPLACE FUNCTION public.mark_queue_timeout()
RETURNS TRIGGER AS $$
BEGIN
    -- Se foi atribuída, definir timeout para 5 minutos
    IF NEW.status = 'assigned' AND OLD.status = 'waiting' THEN
        NEW.timeout_at := NOW() + INTERVAL '5 minutes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela de fila
DROP TRIGGER IF EXISTS trigger_queue_timeout ON public.conversation_queue;
CREATE TRIGGER trigger_queue_timeout
    BEFORE UPDATE ON public.conversation_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_queue_timeout();

-- Políticas RLS para conversation_queue
ALTER TABLE public.conversation_queue ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admins can view all queue items" ON public.conversation_queue;
DROP POLICY IF EXISTS "Attendants can view sector queue items" ON public.conversation_queue;
DROP POLICY IF EXISTS "Admins can manage all queue items" ON public.conversation_queue;
DROP POLICY IF EXISTS "Attendants can update assigned items" ON public.conversation_queue;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all queue items"
    ON public.conversation_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Atendentes podem ver itens do seu setor
CREATE POLICY "Attendants can view sector queue items"
    ON public.conversation_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'attendant' 
            AND is_active = true
            AND sector_id = conversation_queue.sector_id
        )
    );

-- Admins podem gerenciar todos os itens
CREATE POLICY "Admins can manage all queue items"
    ON public.conversation_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Atendentes podem atualizar itens atribuídos a eles
CREATE POLICY "Attendants can update assigned items"
    ON public.conversation_queue FOR UPDATE
    USING (
        assigned_to = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'attendant' 
            AND is_active = true
        )
    );

-- Inserir dados iniciais na fila para conversas não atribuídas existentes
INSERT INTO public.conversation_queue (conversation_id, sector_id, priority, status)
SELECT 
    id,
    sector_id,
    1,
    'waiting'
FROM public.conversations 
WHERE status = 'new' 
AND assigned_to IS NULL
AND NOT EXISTS (
    SELECT 1 FROM public.conversation_queue 
    WHERE conversation_id = conversations.id
)
ON CONFLICT (conversation_id) DO NOTHING;

-- Melhorias na tabela conversation_transfers para suportar transferências automáticas
ALTER TABLE public.conversation_transfers 
ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS timeout_reason TEXT;

-- Atualizar comentários
COMMENT ON COLUMN public.conversation_transfers.is_automatic IS 'True se a transferência foi feita automaticamente pelo sistema';
COMMENT ON COLUMN public.conversation_transfers.timeout_reason IS 'Motivo específico para transferências automáticas por timeout';

-- Função para processar transferências automáticas por timeout
CREATE OR REPLACE FUNCTION public.process_queue_timeouts()
RETURNS void AS $$
DECLARE
    timeout_item RECORD;
    next_attendant RECORD;
    current_load INTEGER;
    min_load INTEGER := 999999;
    best_attendant_id UUID;
BEGIN
    -- Buscar itens que passaram do timeout
    FOR timeout_item IN
        SELECT *
        FROM public.conversation_queue
        WHERE status = 'assigned'
        AND timeout_at IS NOT NULL
        AND timeout_at < NOW()
    LOOP
        -- Marcar como timeout
        UPDATE public.conversation_queue
        SET status = 'timeout'
        WHERE id = timeout_item.id;
        
        -- Buscar próximo atendente disponível do mesmo setor
        FOR next_attendant IN
            SELECT p.id, p.max_concurrent_chats
            FROM public.profiles p
            WHERE p.sector_id = timeout_item.sector_id
            AND p.role = 'attendant'
            AND p.is_active = true
            AND p.id != timeout_item.assigned_to -- Não o mesmo atendente
        LOOP
            -- Calcular carga atual do atendente
            SELECT COUNT(*) INTO current_load
            FROM public.conversations
            WHERE assigned_to = next_attendant.id
            AND status IN ('new', 'in_progress');
            
            -- Se tem capacidade e menor carga, é candidato
            IF current_load < next_attendant.max_concurrent_chats AND current_load < min_load THEN
                min_load := current_load;
                best_attendant_id := next_attendant.id;
            END IF;
        END LOOP;
        
        -- Se encontrou atendente disponível, reatribuir
        IF best_attendant_id IS NOT NULL THEN
            -- Atualizar conversa
            UPDATE public.conversations
            SET assigned_to = best_attendant_id
            WHERE id = timeout_item.conversation_id;
            
            -- Criar novo item na fila
            INSERT INTO public.conversation_queue (conversation_id, sector_id, assigned_to, status, assigned_at, timeout_at)
            VALUES (
                timeout_item.conversation_id,
                timeout_item.sector_id,
                best_attendant_id,
                'assigned',
                NOW(),
                NOW() + INTERVAL '5 minutes'
            )
            ON CONFLICT (conversation_id) DO UPDATE SET
                assigned_to = EXCLUDED.assigned_to,
                status = EXCLUDED.status,
                assigned_at = EXCLUDED.assigned_at,
                timeout_at = EXCLUDED.timeout_at;
            
            -- Criar registro de transferência automática
            INSERT INTO public.conversation_transfers (
                conversation_id,
                from_attendant_id,
                to_attendant_id,
                from_sector_id,
                to_sector_id,
                reason,
                status,
                is_automatic,
                timeout_reason,
                accepted_at,
                completed_at
            ) VALUES (
                timeout_item.conversation_id,
                timeout_item.assigned_to,
                best_attendant_id,
                timeout_item.sector_id,
                timeout_item.sector_id,
                'Reatribuição automática por timeout',
                'completed',
                true,
                'Atendente não respondeu em 5 minutos',
                NOW(),
                NOW()
            );
        END IF;
        
        -- Reset variáveis para próxima iteração
        min_load := 999999;
        best_attendant_id := NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários finais
COMMENT ON TABLE public.conversation_queue IS 'Sistema de filas para atendimento de conversas - Fase 4';
COMMENT ON FUNCTION public.get_queue_stats(UUID) IS 'Retorna estatísticas da fila de atendimento';
COMMENT ON FUNCTION public.cleanup_queue_items() IS 'Remove itens antigos da fila para manter performance';
COMMENT ON FUNCTION public.process_queue_timeouts() IS 'Processa timeouts e reatribui conversas automaticamente';

COMMIT; 