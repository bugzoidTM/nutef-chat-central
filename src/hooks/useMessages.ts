
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';

export const useMessages = (selectedConversation: string | null) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) {
        console.log('🔍 useMessages - No conversation selected');
        return [];
      }
      
      console.log('🔍 useMessages - Fetching messages for conversation:', selectedConversation);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.error('❌ useMessages - Error fetching messages:', error);
        throw error;
      }

      console.log('📝 useMessages - Messages loaded:', data?.length || 0);
      return data || [];
    },
    enabled: !!selectedConversation,
    refetchInterval: false, // Disable automatic refetching, rely on realtime
    retry: (failureCount, error: any) => {
      console.log(`🔄 useMessages - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 3;
    },
    staleTime: 0, // Always consider data stale to refetch when needed
  });

  // Set up real-time subscription for messages
  useEffect(() => {
    // Cleanup previous channel if exists
    if (channelRef.current) {
      console.log('🔄 Cleaning up previous message subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!selectedConversation) return;

    console.log('🔄 Setting up real-time subscription for conversation:', selectedConversation);

    // Create unique channel name for this conversation
    const channelName = `messages-${selectedConversation}`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: selectedConversation }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'watende',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          console.log('📨 Real-time message update:', payload);
          // Invalidate and refetch messages for this conversation
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
          // Also invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['last-messages'] });
          queryClient.invalidateQueries({ queryKey: ['message-counts'] });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Messages channel (${channelName}) status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to messages channel');
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('⚠️ Messages channel connection issue:', status);
          // Try to reconnect after a delay
          setTimeout(() => {
            if (selectedConversation) {
              console.log('🔄 Attempting to reconnect messages channel...');
              queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
            }
          }, 2000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔄 Cleaning up message subscription for:', selectedConversation);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedConversation, queryClient]);

  if (messagesError) {
    console.error('❌ useMessages - Messages error:', messagesError);
  }

  console.log('📊 useMessages - Current state:', {
    selectedConversation,
    messagesCount: messages.length,
    messagesLoading,
    hasError: !!messagesError
  });

  return {
    messages,
    messagesLoading,
  };
};
