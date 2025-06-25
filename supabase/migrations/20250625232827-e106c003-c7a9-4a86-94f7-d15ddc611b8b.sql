
-- Create table for quick response categories/tags
CREATE TABLE public.quick_response_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- HEX color code
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Create table for quick responses
CREATE TABLE public.quick_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES public.quick_response_categories(id),
  sector_id UUID REFERENCES public.sectors(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(title, sector_id) -- Prevent duplicates within same sector
);

-- Enable RLS
ALTER TABLE public.quick_response_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_response_categories
CREATE POLICY "Authenticated users can view active categories" 
  ON public.quick_response_categories 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
  ON public.quick_response_categories 
  FOR ALL 
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for quick_responses
CREATE POLICY "Users can view responses from their sector or global" 
  ON public.quick_responses 
  FOR SELECT 
  TO authenticated
  USING (
    is_active = true AND 
    (
      sector_id IS NULL OR -- Global responses
      sector_id IN (
        SELECT sector_id FROM public.profiles 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Admins can manage all responses" 
  ON public.quick_responses 
  FOR ALL 
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Attendants can create responses for their sector" 
  ON public.quick_responses 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    sector_id IN (
      SELECT sector_id FROM public.profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_quick_response_usage(response_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.quick_responses 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = response_id;
$$;

-- Insert some default categories
INSERT INTO public.quick_response_categories (name, description, color) VALUES
('Saudações', 'Mensagens de boas-vindas e cumprimentos', '#10B981'),
('Despedidas', 'Mensagens de encerramento', '#F59E0B'),
('Informações', 'Respostas informativas gerais', '#3B82F6'),
('Suporte Técnico', 'Respostas para problemas técnicos', '#EF4444'),
('Vendas', 'Respostas relacionadas a vendas', '#8B5CF6');
