
import { useAuth } from '@/hooks/useAuth';
import type { SectorType, StatusType } from '@/types/dashboard';
import { useConversationsQuery } from './useConversationsQuery';
import { useLastMessages } from './useLastMessages';
import { useMessageCounts } from './useMessageCounts';
import { useSendMessage } from './useSendMessage';

export const useConversations = (selectedSector: SectorType, selectedStatus: StatusType) => {
  const { profile } = useAuth();

  console.log('🔍 useConversations - Initialized with:', { 
    selectedSector, 
    selectedStatus, 
    profile: profile ? { id: profile.id, role: profile.role } : null 
  });

  // Fetch raw conversations with better error handling
  const { 
    data: rawConversations = [], 
    isLoading: conversationsLoading, 
    error: conversationsError,
    refetch: refetchConversations
  } = useConversationsQuery(selectedSector, selectedStatus);

  // Fetch last messages for these conversations
  const { data: lastMessages = [] } = useLastMessages(rawConversations);

  // Fetch unread message counts for these conversations
  const { data: messageCounts = [] } = useMessageCounts(rawConversations);

  // Combine conversations with last message and unread count data
  const conversations = rawConversations.map(conversation => {
    const lastMessage = lastMessages.find(msg => msg.conversation_id === conversation.id);
    const messageCount = messageCounts.find(count => count.conversation_id === conversation.id);
    
    return {
      ...conversation,
      last_message_content: lastMessage?.content || null,
      unread_messages: messageCount?.count || 0,
    };
  });

  // Send message mutation
  const sendMessageMutation = useSendMessage(conversations);

  if (conversationsError) {
    console.error('❌ useConversations - Conversations error:', conversationsError);
  }

  // Get conversation counts
  const conversationCounts = {
    new: conversations.filter(c => c.status === 'new').length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    finished: conversations.filter(c => c.status === 'finished').length,
  };

  console.log('📈 useConversations - Conversation counts:', conversationCounts);

  return {
    conversations,
    conversationsLoading,
    conversationCounts,
    sendMessageMutation,
    refetchConversations,
  };
};
