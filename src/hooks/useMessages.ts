
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useMessages = (selectedConversation: string | null) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) {
        console.log('🔍 useMessages - No conversation selected');
        return [];
      }
      
      console.log('🔍 useMessages - Fetching messages from Supabase for conversation:', selectedConversation);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ useMessages - Error fetching messages:', error);
        throw error;
      }

      console.log('📝 useMessages - Supabase returned:', data?.length || 0, 'messages');
      console.log('📝 useMessages - Raw messages data:', data);
      return data || [];
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refresh every 2 seconds
    retry: (failureCount, error: any) => {
      console.log(`🔄 useMessages - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    console.log('🔄 Setting up real-time subscription for conversation:', selectedConversation);

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          console.log('📨 Real-time message update:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
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
