
-- Create working_hours table
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '08:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- Monday to Friday
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  auto_response_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_response_message TEXT NOT NULL DEFAULT 'Olá! Nosso horário de atendimento é de {start_time} às {end_time}, de segunda a sexta-feira. Sua mensagem foi registrada e responderemos assim que possível.',
  queue_enabled BOOLEAN NOT NULL DEFAULT true,
  queue_message TEXT NOT NULL DEFAULT 'Você foi adicionado à nossa fila de atendimento. Entraremos em contato no próximo horário útil.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sector_id)
);

-- Create off_hours_queue table
CREATE TABLE public.off_hours_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'resolved')),
  priority INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id)
);

-- Enable RLS on both tables
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.off_hours_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for working_hours
CREATE POLICY "Admin can manage working hours"
  ON public.working_hours
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Attendants can view working hours for their sector"
  ON public.working_hours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'attendant' 
      AND is_active = true 
      AND sector_id = working_hours.sector_id
    )
  );

-- RLS policies for off_hours_queue
CREATE POLICY "Admin can manage off hours queue"
  ON public.off_hours_queue
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Attendants can view off hours queue for their sector"
  ON public.off_hours_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'attendant' 
      AND is_active = true 
      AND sector_id = off_hours_queue.sector_id
    )
  );

CREATE POLICY "Attendants can update off hours queue for their sector"
  ON public.off_hours_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'attendant' 
      AND is_active = true 
      AND sector_id = off_hours_queue.sector_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_working_hours_sector_id ON public.working_hours(sector_id);
CREATE INDEX idx_off_hours_queue_sector_id ON public.off_hours_queue(sector_id);
CREATE INDEX idx_off_hours_queue_status ON public.off_hours_queue(status);
CREATE INDEX idx_off_hours_queue_received_at ON public.off_hours_queue(received_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_working_hours_updated_at
    BEFORE UPDATE ON public.working_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_off_hours_queue_updated_at
    BEFORE UPDATE ON public.off_hours_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
