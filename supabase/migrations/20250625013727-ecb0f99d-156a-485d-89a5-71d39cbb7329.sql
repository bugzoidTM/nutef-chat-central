
-- Criar tabela para armazenar pesquisas de satisfação
CREATE TABLE public.satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Dados relacionados para relatórios
  attendant_id UUID REFERENCES public.profiles(id),
  sector_id UUID REFERENCES public.sectors(id),
  UNIQUE(conversation_id) -- Previne múltiplas avaliações para o mesmo atendimento
);

-- Adicionar índices para performance
CREATE INDEX idx_satisfaction_surveys_conversation_id ON public.satisfaction_surveys(conversation_id);
CREATE INDEX idx_satisfaction_surveys_attendant_id ON public.satisfaction_surveys(attendant_id);
CREATE INDEX idx_satisfaction_surveys_sector_id ON public.satisfaction_surveys(sector_id);
CREATE INDEX idx_satisfaction_surveys_submitted_at ON public.satisfaction_surveys(submitted_at);
CREATE INDEX idx_satisfaction_surveys_rating ON public.satisfaction_surveys(rating);

-- Habilitar RLS
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Política para admins (podem ver tudo)
CREATE POLICY "Admins can manage all satisfaction_surveys"
ON public.satisfaction_surveys
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para atendentes (podem ver apenas suas avaliações e do seu setor)
CREATE POLICY "Attendants can view satisfaction_surveys from their sector or assignments"
ON public.satisfaction_surveys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'attendant' 
    AND p.is_active = true
    AND (p.sector_id = satisfaction_surveys.sector_id OR p.id = satisfaction_surveys.attendant_id)
  )
);

-- Tabela para controlar quais conversas já receberam pesquisa de satisfação
CREATE TABLE public.satisfaction_survey_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_satisfaction_survey_requests_conversation_id ON public.satisfaction_survey_requests(conversation_id);
CREATE INDEX idx_satisfaction_survey_requests_token ON public.satisfaction_survey_requests(token);
CREATE INDEX idx_satisfaction_survey_requests_status ON public.satisfaction_survey_requests(status);
CREATE INDEX idx_satisfaction_survey_requests_expires_at ON public.satisfaction_survey_requests(expires_at);

-- Habilitar RLS
ALTER TABLE public.satisfaction_survey_requests ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Admins can manage all satisfaction_survey_requests"
ON public.satisfaction_survey_requests
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Função para processar conversas finalizadas e enviar pesquisas
CREATE OR REPLACE FUNCTION public.process_finished_conversations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se a conversa foi finalizada e ainda não tem pesquisa enviada
  IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
    -- Inserir solicitação de pesquisa de satisfação
    INSERT INTO public.satisfaction_survey_requests (
      conversation_id
    )
    VALUES (NEW.id)
    ON CONFLICT (conversation_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para detectar conversas finalizadas
CREATE TRIGGER trigger_process_finished_conversations
  AFTER UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.process_finished_conversations();

-- Função para obter estatísticas de satisfação
CREATE OR REPLACE FUNCTION public.get_satisfaction_stats(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_sector_id UUID DEFAULT NULL,
  p_attendant_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'totalSurveys', COUNT(*),
    'averageRating', ROUND(AVG(rating)::numeric, 2),
    'ratingDistribution', json_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ),
    'responseRate', CASE 
      WHEN COUNT(sr.*) > 0 THEN ROUND((COUNT(ss.*) * 100.0 / COUNT(sr.*))::numeric, 2)
      ELSE 0
    END
  ) INTO stats
  FROM public.satisfaction_survey_requests sr
  LEFT JOIN public.satisfaction_surveys ss ON sr.conversation_id = ss.conversation_id
  WHERE (p_start_date IS NULL OR DATE(sr.sent_at) >= p_start_date)
  AND (p_end_date IS NULL OR DATE(sr.sent_at) <= p_end_date)
  AND (p_sector_id IS NULL OR ss.sector_id = p_sector_id OR (ss.sector_id IS NULL AND EXISTS(
    SELECT 1 FROM public.conversations c WHERE c.id = sr.conversation_id AND c.sector_id = p_sector_id
  )))
  AND (p_attendant_id IS NULL OR ss.attendant_id = p_attendant_id);
  
  RETURN stats;
END;
$$;

-- Função para limpar pesquisas expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_survey_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marcar como expiradas
  UPDATE public.satisfaction_survey_requests 
  SET status = 'expired'
  WHERE expires_at < NOW() 
  AND status = 'sent';
  
  -- Limpar registros muito antigos (mais de 30 dias)
  DELETE FROM public.satisfaction_survey_requests 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;
