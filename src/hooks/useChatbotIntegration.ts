
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// O processamento do chatbot (horário de funcionamento, resposta automática,
// fila fora de horário e base de conhecimento) agora roda no servidor bridge,
// dentro do webhook do whatsai — funciona 24/7, sem depender do dashboard
// aberto, e envia as respostas de verdade pelo WhatsApp.
// Este hook só mantém a UI atualizada quando chegam mensagens novas.
export const useChatbotIntegration = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('chatbot-integration')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'watende',
          table: 'messages',
          filter: 'direction=eq.incoming'
        },
        (payload) => {
          const message = payload.new as { conversation_id?: string };
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          if (message.conversation_id) {
            queryClient.invalidateQueries({ queryKey: ['messages', message.conversation_id] });
          }
          queryClient.invalidateQueries({ queryKey: ['off-hours-queue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
