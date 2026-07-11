-- Arquivamento de conversas antigas
-- Política: conversas sem atividade há ARCHIVE_AFTER_DAYS (30) são arquivadas
-- pelo bridge; mensagem nova do cliente reabre a conversa como 'new'.
-- Aplicado no Supabase self-hosted em 2026-07-11.

ALTER TYPE watende.conversation_status ADD VALUE IF NOT EXISTS 'archived';

-- Conversas arquivadas saem da fila de espera (como as finalizadas)
CREATE OR REPLACE FUNCTION watende.auto_add_to_queue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'watende'
AS $function$
BEGIN
    -- Adicionar à fila se for uma conversa nova sem atendente
    IF NEW.status = 'new' AND NEW.assigned_to IS NULL THEN
        INSERT INTO watende.conversation_queue (conversation_id, sector_id, priority)
        VALUES (NEW.id, NEW.sector_id, 1)
        ON CONFLICT (conversation_id) DO NOTHING;
    END IF;

    -- Remover da fila se conversa foi atribuída, finalizada ou arquivada
    IF NEW.assigned_to IS NOT NULL OR NEW.status IN ('finished', 'archived') THEN
        UPDATE watende.conversation_queue
        SET status = 'completed', completed_at = NOW()
        WHERE conversation_id = NEW.id AND status != 'completed';
    END IF;

    RETURN NEW;
END;
$function$;
