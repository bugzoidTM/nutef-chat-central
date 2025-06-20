
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Setting up realtime subscriptions...');

    // Subscribe to conversations changes
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('📨 Conversation realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversations channel status:', status);
      });

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('📨 Message realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages channel status:', status);
      });

    // Log successful setup
    console.log('✅ Realtime subscriptions configured');

    return () => {
      console.log('🔄 Cleaning up realtime subscriptions...');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      console.log('✅ Realtime subscriptions cleaned up');
    };
  }, [queryClient]);
};
