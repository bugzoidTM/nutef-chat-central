
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
      
      console.log('🔍 useMessages - Fetching messages from Supabase for conversation:', selectedConversation);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.error('❌ useMessages - Error fetching messages:', error);
        throw error;
      }

      console.log('📝 useMessages - Supabase returned:', data?.length || 0, 'messages');
      return data || [];
    },
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Reduced from 2s to 5s for better performance
    retry: (failureCount, error: any) => {
      console.log(`🔄 useMessages - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
    staleTime: 2000, // Consider data fresh for 2 seconds
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
      .channel(channelName)
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
          // Invalidate queries specifically for this conversation
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
          queryClient.invalidateQueries({ queryKey: ['last-messages'] });
          queryClient.invalidateQueries({ queryKey: ['message-counts'] });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Messages channel (${channelName}) status:`, status);
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
