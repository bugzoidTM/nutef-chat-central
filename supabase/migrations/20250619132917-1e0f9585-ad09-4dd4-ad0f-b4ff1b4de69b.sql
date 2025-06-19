
-- Create webhook_configs table
CREATE TABLE public.webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instance_name)
);

-- Enable Row Level Security
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - only admins can manage webhook configs
CREATE POLICY "Admins can manage webhook configs" ON public.webhook_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX idx_webhook_configs_instance_name ON public.webhook_configs(instance_name);
CREATE INDEX idx_webhook_configs_is_active ON public.webhook_configs(is_active);
