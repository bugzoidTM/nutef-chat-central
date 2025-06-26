
-- Habilitar RLS nas tabelas que estão faltando
ALTER TABLE public.conversation_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Verificar se existem políticas antigas e recriá-las se necessário
-- Para conversation_transfers
DROP POLICY IF EXISTS "Create transfers refined" ON public.conversation_transfers;
DROP POLICY IF EXISTS "Update transfers refined" ON public.conversation_transfers;
DROP POLICY IF EXISTS "View transfers refined" ON public.conversation_transfers;

-- Recriar políticas para conversation_transfers
CREATE POLICY "Users can view transfers related to them" ON public.conversation_transfers
  FOR SELECT USING (
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Attendants can create transfers" ON public.conversation_transfers
  FOR INSERT WITH CHECK (
    transferred_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Attendants can update their transfers" ON public.conversation_transfers
  FOR UPDATE USING (
    to_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    from_attendant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Para sectors
DROP POLICY IF EXISTS "Everyone can view active sectors" ON public.sectors;
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.sectors;

-- Recriar políticas para sectors
CREATE POLICY "Everyone can view active sectors" ON public.sectors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sectors" ON public.sectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
