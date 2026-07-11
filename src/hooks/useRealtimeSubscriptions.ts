import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Setting up realtime subscriptions...');

    // Subscribe to conversations changes only (messages handled in useMessages hook)
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'watende',
          table: 'conversations',
        },
        (payload) => {
          console.log('📨 Conversation realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['last-messages'] });
          queryClient.invalidateQueries({ queryKey: ['message-counts'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversations channel status:', status);
      });

    // Log successful setup
    console.log('✅ Realtime subscriptions configured');

    return () => {
      console.log('🔄 Cleaning up realtime subscriptions...');
      console.log('📡 Conversations channel status:', conversationsChannel.state);
      supabase.removeChannel(conversationsChannel);
      console.log('✅ Realtime subscriptions cleaned up');
    };
  }, [queryClient]);
};
