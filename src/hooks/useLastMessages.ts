
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLastMessages = (conversations: any[]) => {
  return useQuery({
    queryKey: ['last-messages', conversations.map(c => c.id)],
    queryFn: async () => {
      if (conversations.length === 0) return [];
      
      console.log('📝 Fetching last messages for conversations...');
      const conversationIds = conversations.map(c => c.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id, content, timestamp, direction')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error fetching last messages:', error);
        return [];
      }

      // Group by conversation_id and get only the first (most recent) of each
      const lastMessagesMap = new Map();
      data?.forEach(msg => {
        if (!lastMessagesMap.has(msg.conversation_id)) {
          lastMessagesMap.set(msg.conversation_id, msg);
        }
      });

      return Array.from(lastMessagesMap.values());
    },
    enabled: conversations.length > 0,
    refetchInterval: 3000,
  });
};
