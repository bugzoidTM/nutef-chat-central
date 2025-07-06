
-- Adicionar campo nickname na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN nickname VARCHAR(50);

-- Criar índice para melhor performance
CREATE INDEX idx_profiles_nickname ON public.profiles(nickname);
