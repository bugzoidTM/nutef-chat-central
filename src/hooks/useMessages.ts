
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMessages = (selectedConversation: string | null) => {
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      console.log('🔍 useMessages - Fetching messages for conversation:', selectedConversation);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('timestamp', { ascending: true });

      console.log('📝 useMessages - Query result:', { 
        data: data ? `${data.length} messages` : 'null', 
        error: error?.message || 'none' 
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedConversation,
  });

  // Log messages error if exists
  if (messagesError) {
    console.error('❌ useMessages - Messages error:', messagesError);
  }

  return {
    messages,
    messagesLoading,
  };
};
