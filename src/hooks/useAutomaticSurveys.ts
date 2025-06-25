
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAutomaticSurveys = () => {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    // Escutar mudanças nas conversas para detectar finalizações
    const channel = supabase
      .channel('conversation-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: 'status=eq.finished'
        },
        async (payload) => {
          console.log('Conversa finalizada detectada:', payload);
          
          // O trigger da database já cuidará de criar a solicitação de pesquisa
          // Aqui poderíamos adicionar lógica adicional se necessário
          
          try {
            // Chamar a edge function para enviar a pesquisa
            await supabase.functions.invoke('send-satisfaction-survey', {
              body: { conversationId: payload.new.id }
            });
            
            console.log('Pesquisa de satisfação enviada automaticamente');
          } catch (error) {
            console.error('Erro ao enviar pesquisa automática:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);
};
