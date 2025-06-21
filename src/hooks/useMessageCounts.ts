
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMessageCounts = (conversations: any[]) => {
  return useQuery({
    queryKey: ['message-counts', conversations.map(c => c.id)],
    queryFn: async () => {
      if (conversations.length === 0) return [];
      
      console.log('🔢 Counting UNREAD messages for conversations...');
      const conversationIds = conversations.map(c => c.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id, id, is_read, direction')
        .in('conversation_id', conversationIds)
        .eq('direction', 'incoming')
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error counting unread messages:', error);
        return [];
      }

      console.log('📋 Raw unread messages data:', data);

      // Count UNREAD messages by conversation
      const counts = conversationIds.map(id => {
        const unreadCount = data?.filter(msg => msg.conversation_id === id).length || 0;
        return {
          conversation_id: id,
          count: unreadCount
        };
      });

      console.log('🔢 Final unread message counts:', counts);
      return counts;
    },
    enabled: conversations.length > 0,
    refetchInterval: 2000,
  });
};
