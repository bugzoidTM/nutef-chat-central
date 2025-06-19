
-- Habilitar RLS na tabela instances
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que usuários vejam suas próprias instâncias
CREATE POLICY "Users can view their own instances" 
  ON public.instances 
  FOR SELECT 
  USING (auth.uid() = admin_id);

-- Criar política para permitir que usuários criem suas próprias instâncias
CREATE POLICY "Users can create their own instances" 
  ON public.instances 
  FOR INSERT 
  WITH CHECK (auth.uid() = admin_id);

-- Criar política para permitir que usuários atualizem suas próprias instâncias
CREATE POLICY "Users can update their own instances" 
  ON public.instances 
  FOR UPDATE 
  USING (auth.uid() = admin_id);

-- Criar política para permitir que usuários deletem suas próprias instâncias
CREATE POLICY "Users can delete their own instances" 
  ON public.instances 
  FOR DELETE 
  USING (auth.uid() = admin_id);
