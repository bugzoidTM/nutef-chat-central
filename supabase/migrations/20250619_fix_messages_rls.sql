-- Adicionar política para visualização de mensagens
CREATE POLICY "Users can view messages from accessible conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector)
    )
  ); 