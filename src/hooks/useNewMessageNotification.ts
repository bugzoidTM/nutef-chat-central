import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationSound } from './useNotificationSound';

export const useNewMessageNotification = () => {
  const { playNotificationSound } = useNotificationSound();
  const queryClient = useQueryClient();
  const lastMessageCountRef = useRef<Record<string, number>>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔔 Configurando sistema de notificação de mensagens...');

    // Cleanup previous channel if exists
    if (channelRef.current) {
      console.log('🔄 Limpando canal anterior de notificações');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to all new messages
    const channel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'watende',
          table: 'messages',
          filter: 'direction=eq.incoming', // Só mensagens recebidas
        },
        (payload) => {
          console.log('🔔 Nova mensagem detectada:', payload);
          
          const newMessage = payload.new as any;
          console.log('📨 Detalhes da mensagem:', {
            id: newMessage.id,
            content: newMessage.content?.substring(0, 50),
            conversation_id: newMessage.conversation_id,
            from_phone: newMessage.from_phone,
            timestamp: newMessage.timestamp
          });

          // Tocar som de notificação
          playNotificationSound();

          // Invalidar queries para atualizar contadores
          queryClient.invalidateQueries({ queryKey: ['message-counts'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['last-messages'] });
          
          // Se for a conversa selecionada, atualizar mensagens também
          queryClient.invalidateQueries({ 
            queryKey: ['messages', newMessage.conversation_id] 
          });

          console.log('🔄 Queries invalidadas após nova mensagem');
        }
      )
      .subscribe((status) => {
        console.log('🔔 Status do canal de notificações:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔄 Limpando sistema de notificação...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [playNotificationSound, queryClient]);

  // Monitorar mudanças nos contadores de mensagens para detectar novos incrementos
  useEffect(() => {
    const messageCountsQuery = queryClient.getQueryData(['message-counts']);
    if (messageCountsQuery && Array.isArray(messageCountsQuery)) {
      messageCountsQuery.forEach((count: any) => {
        const conversationId = count.conversation_id;
        const currentCount = count.count;
        const previousCount = lastMessageCountRef.current[conversationId] || 0;

        // Se o contador aumentou, significa nova mensagem
        if (currentCount > previousCount && previousCount > 0) {
          console.log('🔔 Incremento detectado no contador:', {
            conversation_id: conversationId,
            previous: previousCount,
            current: currentCount
          });
        }

        lastMessageCountRef.current[conversationId] = currentCount;
      });
    }
  });

  return {
    // Pode retornar funções de controle se necessário
  };
}; 