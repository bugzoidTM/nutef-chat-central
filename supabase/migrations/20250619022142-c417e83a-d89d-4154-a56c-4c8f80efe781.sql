
-- Adicionar campos necessários para o fluxo de setup da instância Evolution
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instance_name TEXT;

-- Atualizar perfis existentes de admin para que passem pelo fluxo de setup
UPDATE public.profiles 
SET setup_completed = FALSE, whatsapp_connected = FALSE 
WHERE role = 'admin';
