
import React from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import Sidebar from './Sidebar';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import type { SectorType, StatusType } from '@/types/dashboard';

interface DashboardContentProps {
  selectedSector: SectorType;
  selectedStatus: StatusType;
  onSectorChange: (sector: SectorType) => void;
  onStatusChange: (status: StatusType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const DashboardContent = ({
  selectedSector,
  selectedStatus,
  onSectorChange,
  onStatusChange,
  searchTerm,
  onSearchChange,
}: DashboardContentProps) => {
  // Custom hooks
  const { conversations, conversationCounts, sendMessageMutation } = useConversations(selectedSector, selectedStatus);
  const { selectedConversation, handleSelectConversation } = useConversationSelection(
    conversations,
    selectedSector,
    selectedStatus
  );
  const { messages } = useMessages(selectedConversation);
  useRealtimeSubscriptions();

  const handleSendMessage = (content: string) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        content,
      });
    }
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        selectedSector={selectedSector}
        selectedStatus={selectedStatus}
        onSectorChange={onSectorChange}
        onStatusChange={onStatusChange}
        conversationCounts={conversationCounts}
      />
      
      <div className="flex-1 flex">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        
        <ChatArea
          conversation={selectedConversationData || null}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
