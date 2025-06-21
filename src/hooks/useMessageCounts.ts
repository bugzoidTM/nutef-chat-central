
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMessageCounts = (conversations: any[]) => {
  return useQuery({
    queryKey: ['message-counts', conversations.map(c => c.id)],
    queryFn: async () => {
      if (conversations.length === 0) return [];
      
      console.log('🔢 Counting UNREAD messages for conversations...');
      const conversationIds = conversations.map(c => c.id);
      
      // ⭐ MUDANÇA CRÍTICA: Buscar TODAS as mensagens incoming para debug
      const { data: allIncoming, error: allError } = await supabase
        .from('messages')
        .select('conversation_id, id, is_read, direction, content, timestamp')
        .in('conversation_id', conversationIds)
        .eq('direction', 'incoming')
        .order('timestamp', { ascending: false });

      if (allError) {
        console.error('❌ Error fetching all incoming messages:', allError);
        return [];
      }

      console.log('📋 ALL incoming messages data:', allIncoming);

      // ⭐ Separar mensagens lidas vs não lidas
      const unreadMessages = allIncoming?.filter(msg => msg.is_read === false) || [];
      const readMessages = allIncoming?.filter(msg => msg.is_read === true) || [];

      console.log('📊 Messages breakdown:', {
        total: allIncoming?.length || 0,
        unread: unreadMessages.length,
        read: readMessages.length
      });

      // ⭐ Debug detalhado por conversa
      conversationIds.forEach(id => {
        const convUnread = unreadMessages.filter(msg => msg.conversation_id === id);
        const convRead = readMessages.filter(msg => msg.conversation_id === id);
        console.log(`🔍 Conversation ${id}:`, {
          unread: convUnread.length,
          read: convRead.length,
          total: convUnread.length + convRead.length,
          unreadMessages: convUnread.map(m => ({ id: m.id, content: m.content?.substring(0, 30), is_read: m.is_read }))
        });
      });

      // Count UNREAD messages by conversation
      const counts = conversationIds.map(id => {
        const unreadCount = unreadMessages.filter(msg => msg.conversation_id === id).length;
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
