import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useNewMessageNotification } from '@/hooks/useNewMessageNotification';
import Sidebar from './Sidebar';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import SectorManagement from './admin/SectorManagement';
import AttendantManagement from './admin/AttendantManagement';
import Reports from './admin/Reports';
import type { SectorType, StatusType } from '@/types/dashboard';
import type { AdminViewType } from '@/hooks/useDashboardState';

interface DashboardContentProps {
  selectedSector: SectorType;
  selectedStatus: StatusType;
  onSectorChange: (sector: SectorType) => void;
  onStatusChange: (status: StatusType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentView: AdminViewType;
  onViewChange: (view: AdminViewType) => void;
}

const DashboardContent = ({
  selectedSector,
  selectedStatus,
  onSectorChange,
  onStatusChange,
  searchTerm,
  onSearchChange,
  currentView,
  onViewChange,
}: DashboardContentProps) => {
  const { profile } = useAuth();
  
  // Custom hooks para funcionalidades de chat
  const { conversations, conversationCounts, sendMessageMutation } = useConversations(selectedSector, selectedStatus);
  const { selectedConversation, handleSelectConversation } = useConversationSelection(
    conversations,
    selectedSector,
    selectedStatus
  );
  const { messages } = useMessages(selectedConversation);
  useRealtimeSubscriptions();
  useNewMessageNotification();

  const handleSendMessage = (content: string) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        content,
      });
    }
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  // Renderizar conteúdo baseado na view atual
  const renderMainContent = () => {
    if (profile?.role === 'admin') {
      switch (currentView) {
        case 'sectors':
          return <SectorManagement />;
        case 'attendants':
          return <AttendantManagement />;
        case 'reports':
          return <Reports />;
        case 'chat':
        default:
          // Layout de chat padrão para admins
          return (
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
          );
      }
    }

    // Layout padrão para atendentes (sempre chat)
    return (
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
    );
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        selectedSector={selectedSector}
        selectedStatus={selectedStatus}
        onSectorChange={onSectorChange}
        onStatusChange={onStatusChange}
        conversationCounts={conversationCounts}
        currentView={currentView}
        onViewChange={onViewChange}
      />
      
      {currentView === 'chat' ? (
        // Layout tradicional com sidebar de conversas
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
      ) : (
        // Layout para páginas de administração (ocupa toda a área)
        <div className="flex-1 p-6 overflow-y-auto">
          {renderMainContent()}
        </div>
      )}
    </div>
  );
};

export default DashboardContent;
